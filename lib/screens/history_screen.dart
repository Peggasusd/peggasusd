import 'package:breez_sdk_spark_flutter/breez_sdk_spark.dart';
import 'package:flutter/material.dart';
import '../sdk_service.dart';

class HistoryScreen extends StatefulWidget {
  const HistoryScreen({super.key});

  @override
  State<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen> {
  final SdkService _sdk = SdkService.instance;
  List<Payment> _payments = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      _payments = await _sdk.listPayments(limit: 100);
    } catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Payment History'),
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _load),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _payments.isEmpty
              ? const Center(child: Text('No payments yet'))
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView.separated(
                    padding: const EdgeInsets.all(8),
                    itemCount: _payments.length,
                    separatorBuilder: (_, _) => const Divider(height: 1),
                    itemBuilder: (context, i) {
                      final p = _payments[i];
                      final isSend = p.paymentType == PaymentType.send;
                      final icon =
                          isSend ? Icons.arrow_upward : Icons.arrow_downward;
                      final color = isSend ? Colors.red : Colors.green;
                      return ListTile(
                        leading: CircleAvatar(
                          backgroundColor: color.withValues(alpha: 0.15),
                          child: Icon(icon, color: color, size: 20),
                        ),
                        title: Text(isSend ? 'Sent' : 'Received',
                            style: const TextStyle(
                                fontWeight: FontWeight.w500)),
                        subtitle: Text(
                          p.status == PaymentStatus.completed
                              ? 'Completed'
                              : p.status == PaymentStatus.pending
                                  ? 'Pending'
                                  : 'Failed',
                          style: TextStyle(
                            color: p.status == PaymentStatus.completed
                                ? Colors.green
                                : p.status == PaymentStatus.pending
                                    ? Colors.orange
                                    : Colors.red,
                          ),
                        ),
                        trailing: Text('${p.amount} SAT',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              color: color,
                            )),
                      );
                    },
                  ),
                ),
    );
  }
}
