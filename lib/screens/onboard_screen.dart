import 'package:flutter/material.dart';
import 'seed_reveal_screen.dart';
import 'seed_restore_screen.dart';

class OnboardScreen extends StatelessWidget {
  const OnboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(title: const Text('PEGGASUSD')),
      body: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 32),
        child: Column(
          children: [
            const Spacer(flex: 2),
            Text(
              'Bienvenido',
              style: theme.textTheme.headlineMedium
                  ?.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              'Crea una nueva wallet o restaura una existente',
              textAlign: TextAlign.center,
              style: TextStyle(color: theme.colorScheme.onSurfaceVariant),
            ),
            const Spacer(),
            SizedBox(
              width: double.infinity,
              height: 56,
              child: FilledButton.icon(
                onPressed: () => Navigator.of(context).push(
                  MaterialPageRoute(
                      builder: (_) => const SeedRevealScreen()),
                ),
                icon: const Icon(Icons.add_circle_outline),
                label: const Text('Crear Wallet',
                    style: TextStyle(fontSize: 18)),
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              height: 56,
              child: OutlinedButton.icon(
                onPressed: () => Navigator.of(context).push(
                  MaterialPageRoute(
                      builder: (_) => const SeedRestoreScreen()),
                ),
                icon: const Icon(Icons.restore_page_outlined),
                label: const Text('Restaurar Wallet',
                    style: TextStyle(fontSize: 18)),
              ),
            ),
            const Spacer(flex: 2),
          ],
        ),
      ),
    );
  }
}
