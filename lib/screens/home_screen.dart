import 'package:breez_sdk_spark_flutter/breez_sdk_spark.dart';
import 'package:flutter/material.dart';
import '../sdk_service.dart';
import 'history_screen.dart';
import 'receive_screen.dart';
import 'send_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final SdkService _sdk = SdkService.instance;
  GetInfoResponse? _info;
  List<Payment> _recentPayments = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
    _sdk.infoStream.listen((info) {
      if (mounted) setState(() => _info = info);
    });
    _sdk.eventStream.listen((event) {
      if (event is SdkEvent_Synced) _loadPayments();
      if (event is SdkEvent_PaymentSucceeded) _loadPayments();
    });
  }

  Future<void> _loadData() async {
    _info = _sdk.lastInfo;
    await _loadPayments();
    if (mounted) setState(() => _loading = false);
  }

  Future<void> _loadPayments() async {
    try {
      final payments = await _sdk.listPayments(limit: 5);
      if (mounted) setState(() => _recentPayments = payments);
    } catch (_) {}
  }

  String _formatSats(BigInt sats) {
    final n = sats.toInt();
    if (n >= 1000000) return '${(n / 1000000).toStringAsFixed(2)}M';
    if (n >= 1000) return '${(n / 1000).toStringAsFixed(1)}K';
    return n.toString();
  }

  String _formatToken(BigInt? balance, int decimals) {
    if (balance == null) return '0';
    final val = balance.toInt();
    final divisor = BigInt.from(10).pow(decimals).toInt();
    if (val >= divisor) {
      return '${(val / divisor).toStringAsFixed(2)}';
    }
    return '0.${val.toString().padLeft(decimals, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final sats = _info?.balanceSats ?? BigInt.zero;
    final tokenBalances = _info?.tokenBalances ?? {};

    return Scaffold(
      appBar: AppBar(
        title: const Text('PEGGASUSD'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadData,
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadData,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // SAT Balance Card
            Card(
              color: theme.colorScheme.primaryContainer,
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  children: [
                    const Text('Bitcoin Balance',
                        style: TextStyle(fontSize: 14)),
                    const SizedBox(height: 8),
                    Text('${_formatSats(sats)} SAT',
                        style: theme.textTheme.headlineMedium
                            ?.copyWith(fontWeight: FontWeight.bold)),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 12),

            // Token Balances
            ...tokenBalances.entries.map((entry) {
              final meta = entry.value.tokenMetadata;
              final ticker = meta?.ticker ?? entry.key;
              final decimals = meta?.decimals ?? 0;
              return Card(
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    children: [
                      Text('$ticker Balance',
                          style: const TextStyle(fontSize: 14)),
                      const SizedBox(height: 8),
                      Text(
                        _formatToken(entry.value.balance, decimals),
                        style: theme.textTheme.headlineMedium
                            ?.copyWith(fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                ),
              );
            }),
            const SizedBox(height: 16),

            // Send / Receive Buttons
            Row(
              children: [
                Expanded(
                  child: SizedBox(
                    height: 56,
                    child: ElevatedButton.icon(
                      onPressed: () => Navigator.of(context).push(
                        MaterialPageRoute(
                            builder: (_) => const ReceiveScreen()),
                      ),
                      icon: const Icon(Icons.qr_code),
                      label: const Text('Receive'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: theme.colorScheme.primary,
                        foregroundColor: theme.colorScheme.onPrimary,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: SizedBox(
                    height: 56,
                    child: ElevatedButton.icon(
                      onPressed: () => Navigator.of(context).push(
                        MaterialPageRoute(builder: (_) => const SendScreen()),
                      ),
                      icon: const Icon(Icons.send_rounded),
                      label: const Text('Send'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: theme.colorScheme.secondary,
                        foregroundColor: theme.colorScheme.onSecondary,
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),

            // Recent Payments
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Recent Payments',
                    style: theme.textTheme.titleMedium),
                TextButton(
                  onPressed: () => Navigator.of(context).push(
                    MaterialPageRoute(
                        builder: (_) => const HistoryScreen()),
                  ),
                  child: const Text('View all'),
                ),
              ],
            ),
            ..._recentPayments.map((p) => _PaymentTile(payment: p)),
          ],
        ),
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: 1,
        destinations: const [
          NavigationDestination(
              icon: Icon(Icons.swap_horiz), label: 'Swap'),
          NavigationDestination(
              icon: Icon(Icons.home), label: 'Home'),
          NavigationDestination(
              icon: Icon(Icons.history), label: 'History'),
        ],
        onDestinationSelected: (i) {
          if (i == 0) {
            Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const SwapScreen()),
            );
          } else if (i == 2) {
            Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const HistoryScreen()),
            );
          }
        },
      ),
    );
  }
}

class _PaymentTile extends StatelessWidget {
  final Payment payment;
  const _PaymentTile({required this.payment});

  @override
  Widget build(BuildContext context) {
    final isSend = payment.paymentType == PaymentType.send;
    final icon = isSend ? Icons.arrow_upward : Icons.arrow_downward;
    final color = isSend ? Colors.red : Colors.green;
    final amount = payment.amount;
    final status = payment.status;

    return ListTile(
      leading: CircleAvatar(
        backgroundColor: color.withValues(alpha: 0.15),
        child: Icon(icon, color: color, size: 20),
      ),
      title: Text(isSend ? 'Sent' : 'Received',
          style: const TextStyle(fontWeight: FontWeight.w500)),
      subtitle: Text(
        status == PaymentStatus.completed
            ? 'Completed'
            : status == PaymentStatus.pending
                ? 'Pending'
                : 'Failed',
        style: TextStyle(
          color: status == PaymentStatus.completed
              ? Colors.green
              : status == PaymentStatus.pending
                  ? Colors.orange
                  : Colors.red,
        ),
      ),
      trailing: Text('$amount SAT',
          style: TextStyle(
            fontWeight: FontWeight.bold,
            color: color,
          )),
    );
  }
}

class SwapScreen extends StatelessWidget {
  const SwapScreen({super.key});
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Swap SAT ↔ USD')),
      body: const Center(child: Text('Coming soon')),
    );
  }
}
