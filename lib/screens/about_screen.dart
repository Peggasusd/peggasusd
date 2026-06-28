import 'package:flutter/material.dart';

class AboutScreen extends StatelessWidget {
  const AboutScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(title: const Text('Acerca de')),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          const SizedBox(height: 32),
          Center(
            child: Icon(Icons.bolt, size: 64, color: theme.colorScheme.primary),
          ),
          const SizedBox(height: 16),
          Center(
            child: Text(
              'PEGGASUSD',
              style: theme.textTheme.headlineMedium
                  ?.copyWith(fontWeight: FontWeight.bold),
            ),
          ),
          const SizedBox(height: 8),
          Center(
            child: Text(
              'v1.0.0',
              style: TextStyle(color: theme.colorScheme.onSurfaceVariant),
            ),
          ),
          const SizedBox(height: 32),
          _AboutCard(
            icon: Icons.wallet,
            title: 'Lightning Wallet para Cuba',
            description:
                'PEGGASUSD es una billetera Lightning Network '
                'no-custodial construida con Breez Spark SDK. '
                'Soporta pagos en SAT (Bitcoin) y USD (Spark Token).',
          ),
          const SizedBox(height: 16),
          _AboutCard(
            icon: Icons.security,
            title: 'Autocustodia',
            description:
                'Tus llaves privadas nunca salen de tu dispositivo. '
                'Eres el único dueño de tus fondos.',
          ),
          const SizedBox(height: 16),
          _AboutCard(
            icon: Icons.open_in_new,
            title: 'Construido con',
            description:
                'Breez Spark SDK\n'
                'Flutter\n'
                'Lightning Network',
          ),
        ],
      ),
    );
  }
}

class _AboutCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String description;

  const _AboutCard({
    required this.icon,
    required this.title,
    required this.description,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      elevation: 0,
      color: theme.colorScheme.surfaceContainerHighest,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: theme.colorScheme.primary, size: 28),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title,
                      style:
                          const TextStyle(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 4),
                  Text(description,
                      style: TextStyle(
                        color: theme.colorScheme.onSurfaceVariant,
                        fontSize: 14,
                      )),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
