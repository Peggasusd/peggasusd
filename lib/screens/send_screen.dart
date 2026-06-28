import 'package:breez_sdk_spark_flutter/breez_sdk_spark.dart';
import 'package:flutter/material.dart';
import '../sdk_service.dart';
import 'home_screen.dart';

class SendScreen extends StatefulWidget {
  const SendScreen({super.key});

  @override
  State<SendScreen> createState() => _SendScreenState();
}

class _SendScreenState extends State<SendScreen> {
  final SdkService _sdk = SdkService.instance;
  final _inputController = TextEditingController();
  bool _loading = false;
  InputType? _parsed;
  PrepareSendPaymentResponse? _prepareResponse;

  @override
  void dispose() {
    _inputController.dispose();
    super.dispose();
  }

  Future<void> _parseInput() async {
    final input = _inputController.text.trim();
    if (input.isEmpty) return;

    setState(() => _loading = true);
    try {
      _parsed = await _sdk.parseInput(input: input);
      _prepareResponse = null;
      if (mounted) setState(() {});
    } catch (e) {
      _showError('Invalid input: $e');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _preparePayment() async {
    final input = _inputController.text.trim();
    setState(() => _loading = true);
    try {
      _prepareResponse = await _sdk.prepareSendPayment(input: input);
      if (mounted) setState(() {});
    } catch (e) {
      _showError('Prepare failed: $e');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _sendPayment() async {
    if (_prepareResponse == null) return;
    setState(() => _loading = true);
    try {
      await _sdk.sendPayment(prepareResponse: _prepareResponse!);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Payment sent!')),
        );
        Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute(builder: (_) => const HomeScreen()),
          (route) => false,
        );
      }
    } catch (e) {
      _showError('Send failed: $e');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _showError(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
  }

  String _describeInput(InputType type) {
    if (type is InputType_Bolt11Invoice) {
      final amt = type.field0.amountMsat;
      return 'Bolt11 Invoice${amt != null ? ' - ${amt ~/ 1000} SAT' : ''}';
    }
    if (type is InputType_LnurlPay) return 'LNURL-Pay';
    if (type is InputType_LnurlWithdraw) return 'LNURL-Withdraw';
    if (type is InputType_SparkAddress) return 'Spark Address';
    if (type is InputType_SparkInvoice) {
      final amt = type.field0.amount;
      return 'Spark Invoice${amt != null ? ' - $amt' : ''}';
    }
    if (type is InputType_BitcoinAddress) return 'Bitcoin Address';
    return 'Unknown input';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Send')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          TextField(
            controller: _inputController,
            maxLines: 3,
            decoration: const InputDecoration(
              labelText: 'Invoice, Address or LNURL',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 12),
          ElevatedButton(
            onPressed: _loading ? null : _parseInput,
            child: _loading
                ? const SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(strokeWidth: 2))
                : const Text('Parse Input'),
          ),
          if (_parsed != null) ...[
            const SizedBox(height: 16),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Input type: ${_describeInput(_parsed!)}',
                        style: const TextStyle(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    Text('${_parsed?.runtimeType}'),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 12),
            ElevatedButton(
              onPressed: _loading ? null : _preparePayment,
              child: const Text('Prepare Payment'),
            ),
          ],
          if (_prepareResponse != null) ...[
            const SizedBox(height: 16),
            Card(
              color: Colors.green.shade50,
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Amount: ${_prepareResponse!.amount} SAT',
                        style: const TextStyle(fontWeight: FontWeight.bold)),
                    if (_prepareResponse!.conversionEstimate != null)
                      Text(
                          'Conversion: ${_prepareResponse!.conversionEstimate!.amountIn} → ${_prepareResponse!.conversionEstimate!.amountOut}'),
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: _loading ? null : _sendPayment,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.green,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                        ),
                        child: const Text('Confirm Send',
                            style: TextStyle(fontSize: 16)),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
