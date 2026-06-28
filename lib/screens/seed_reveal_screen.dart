import 'package:bip39/bip39.dart' as bip39;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../app_config.dart';
import '../sdk_service.dart';
import 'home_screen.dart';

class SeedRevealScreen extends StatefulWidget {
  const SeedRevealScreen({super.key});

  @override
  State<SeedRevealScreen> createState() => _SeedRevealScreenState();
}

class _SeedRevealScreenState extends State<SeedRevealScreen> {
  late final String _mnemonic;
  bool _saved = false;

  @override
  void initState() {
    super.initState();
    _mnemonic = bip39.generateMnemonic();
  }

  Future<void> _copyAndContinue() async {
    await Clipboard.setData(ClipboardData(text: _mnemonic));
    if (!mounted) return;
    setState(() => _saved = true);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Frase copiada al portapapeles')),
    );
  }

  Future<void> _confirmAndGo() async {
    setState(() => _saved = true);
    try {
      await SdkService.instance.saveMnemonic(_mnemonic);
      await SdkService.instance.init(
        mnemonic: _mnemonic,
        apiKey: AppConfig.breezApiKey,
      );
      if (!mounted) return;
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (_) => const HomeScreen()),
        (route) => false,
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final words = _mnemonic.split(' ');

    return Scaffold(
      appBar: AppBar(title: const Text('Frase de recuperación')),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          Icon(Icons.warning_amber_rounded,
              size: 48, color: theme.colorScheme.error),
          const SizedBox(height: 16),
          Text(
            'Guarda esta frase en un lugar seguro',
            style: theme.textTheme.titleLarge
                ?.copyWith(fontWeight: FontWeight.bold),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Text(
            'Estas 12 palabras son la única forma de recuperar tus fondos. '
            'Nunca las compartas con nadie. Si las pierdes, perderás acceso '
            'a tu wallet para siempre.',
            textAlign: TextAlign.center,
            style: TextStyle(color: theme.colorScheme.onSurfaceVariant),
          ),
          const SizedBox(height: 24),
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: theme.colorScheme.surfaceContainerHighest,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: theme.colorScheme.outlineVariant,
              ),
            ),
            child: Column(
              children: [
                ...List.generate(12, (i) {
                  return Padding(
                    padding: const EdgeInsets.symmetric(vertical: 4),
                    child: Row(
                      children: [
                        SizedBox(
                          width: 28,
                          child: Text(
                            '${i + 1}.',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              color: theme.colorScheme.primary,
                            ),
                          ),
                        ),
                        Text(
                          words[i],
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  );
                }),
              ],
            ),
          ),
          const SizedBox(height: 16),
          OutlinedButton.icon(
            onPressed: _copyAndContinue,
            icon: const Icon(Icons.copy),
            label: const Text('Copiar frase'),
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            height: 52,
            child: FilledButton(
              onPressed: _saved ? _confirmAndGo : null,
              child: const Text('He copiado mis palabras',
                  style: TextStyle(fontSize: 16)),
            ),
          ),
          if (!_saved)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Text(
                'Copia la frase primero para continuar',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: theme.colorScheme.onSurfaceVariant,
                  fontSize: 13,
                ),
              ),
            ),
        ],
      ),
    );
  }
}
