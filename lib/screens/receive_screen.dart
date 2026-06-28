import 'package:flutter/material.dart';
import '../sdk_service.dart';

class ReceiveScreen extends StatefulWidget {
  const ReceiveScreen({super.key});

  @override
  State<ReceiveScreen> createState() => _ReceiveScreenState();
}

class _ReceiveScreenState extends State<ReceiveScreen> {
  final SdkService _sdk = SdkService.instance;
  String? _paymentRequest;
  bool _loading = false;
  String _method = 'lightning'; // lightning, spark, token

  Future<void> _generate() async {
    setState(() => _loading = true);
    try {
      String result;
      switch (_method) {
        case 'spark':
          result = await _sdk.receiveSparkAddress();
          break;
        case 'token':
          final tokenId = _sdk.lastInfo?.tokenBalances.keys.firstOrNull;
          if (tokenId == null) {
            _showError('No token available');
            return;
          }
          result = await _sdk.receiveTokenInvoice(tokenIdentifier: tokenId);
          break;
        default:
          result = await _sdk.receiveLightningInvoice();
      }
      if (mounted) setState(() => _paymentRequest = result);
    } catch (e) {
      _showError('Error: $e');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _showError(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
  }

  @override
  Widget build(BuildContext context) {
    final hasTokens =
        (_sdk.lastInfo?.tokenBalances.length ?? 0) > 0;

    return Scaffold(
      appBar: AppBar(title: const Text('Receive')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          SegmentedButton<String>(
            segments: [
              ButtonSegment(value: 'lightning', label: const Text('Lightning')),
              ButtonSegment(value: 'spark', label: const Text('Spark Address')),
              if (hasTokens)
                ButtonSegment(value: 'token', label: const Text('USD Token')),
            ],
            selected: {_method},
            onSelectionChanged: (v) => setState(() => _method = v.first),
          ),
          const SizedBox(height: 24),
          if (_paymentRequest != null) ...[
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: SelectableText(
                  _paymentRequest!,
                  style: const TextStyle(fontSize: 13),
                ),
              ),
            ),
            const SizedBox(height: 8),
            ElevatedButton.icon(
              onPressed: () {
                // Copy to clipboard
              },
              icon: const Icon(Icons.copy),
              label: const Text('Copy'),
            ),
          ],
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: _loading ? null : _generate,
            style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 16),
            ),
            child: _loading
                ? const SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Text('Generate', style: TextStyle(fontSize: 16)),
          ),
        ],
      ),
    );
  }
}
