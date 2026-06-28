import 'package:bip39/bip39.dart' as bip39;
import 'package:flutter/material.dart';
import '../app_config.dart';
import '../sdk_service.dart';
import 'home_screen.dart';

class SeedRestoreScreen extends StatefulWidget {
  const SeedRestoreScreen({super.key});

  @override
  State<SeedRestoreScreen> createState() => _SeedRestoreScreenState();
}

class _SeedRestoreScreenState extends State<SeedRestoreScreen> {
  final _controller = TextEditingController();
  bool _loading = false;
  bool _valid = false;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _validate() {
    final words = _controller.text.trim().toLowerCase();
    setState(() {
      final wordList = words.split(RegExp(r'\s+'));
      _valid = (wordList.length == 12 || wordList.length == 24) &&
          bip39.validateMnemonic(words);
    });
  }

  Future<void> _restore() async {
    final mnemonic = _controller.text.trim().toLowerCase();
    setState(() => _loading = true);

    try {
      await SdkService.instance.saveMnemonic(mnemonic);
      await SdkService.instance.init(
        mnemonic: mnemonic,
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
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final wordCount = _controller.text.trim().isEmpty
        ? 0
        : _controller.text.trim().split(RegExp(r'\s+')).length;

    return Scaffold(
      appBar: AppBar(title: const Text('Restaurar wallet')),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          Icon(Icons.restore_page_outlined,
              size: 48, color: theme.colorScheme.primary),
          const SizedBox(height: 16),
          Text(
            'Introduce tu frase de recuperación',
            style: theme.textTheme.titleLarge
                ?.copyWith(fontWeight: FontWeight.bold),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Text(
            'Escribe las 12 o 24 palabras de tu frase semilla '
            'en el orden correcto.',
            textAlign: TextAlign.center,
            style: TextStyle(color: theme.colorScheme.onSurfaceVariant),
          ),
          const SizedBox(height: 24),
          TextField(
            controller: _controller,
            maxLines: 5,
            textInputAction: TextInputAction.done,
            autocorrect: false,
            enableSuggestions: false,
            onChanged: (_) => _validate(),
            decoration: InputDecoration(
              hintText: 'Ingresa las palabras separadas por espacios',
              border: const OutlineInputBorder(),
              suffixText: wordCount > 0 ? '$wordCount palabras' : null,
            ),
          ),
          if (_valid)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Row(
                children: [
                  Icon(Icons.check_circle,
                      color: Colors.green.shade600, size: 18),
                  const SizedBox(width: 4),
                  Text('Frase válida',
                      style: TextStyle(color: Colors.green.shade600)),
                ],
              ),
            ),
          const SizedBox(height: 32),
          SizedBox(
            width: double.infinity,
            height: 52,
            child: FilledButton(
              onPressed: (_valid && !_loading) ? _restore : null,
              child: _loading
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Text('Siguiente', style: TextStyle(fontSize: 16)),
            ),
          ),
        ],
      ),
    );
  }
}
