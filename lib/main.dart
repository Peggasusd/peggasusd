import 'package:flutter/material.dart';
import 'package:logging/logging.dart';
import 'app_config.dart';
import 'screens/welcome_screen.dart';
import 'screens/home_screen.dart';
import 'sdk_service.dart';

void main() {
  Logger.root.level = Level.INFO;
  Logger.root.onRecord.listen((r) => debugPrint('${r.level}: ${r.message}'));
  runApp(const PeggasusdApp());
}

class PeggasusdApp extends StatelessWidget {
  const PeggasusdApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'PEGGASUSD',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFFD4A574),
          brightness: Brightness.dark,
        ),
        useMaterial3: true,
        // fontFamily: 'Plus Jakarta Sans',
      ),
      home: const StartupScreen(),
    );
  }
}

class StartupScreen extends StatefulWidget {
  const StartupScreen({super.key});

  @override
  State<StartupScreen> createState() => _StartupScreenState();
}

class _StartupScreenState extends State<StartupScreen> {
  @override
  void initState() {
    super.initState();
    _checkWallet();
  }

  Future<void> _checkWallet() async {
    final sdk = SdkService.instance;
    final hasWallet = await sdk.hasStoredMnemonic();
    if (!mounted) return;

    if (hasWallet) {
      final mnemonic = await sdk.loadMnemonic();
      if (mnemonic != null && AppConfig.hasApiKey) {
        try {
          await sdk.init(mnemonic: mnemonic, apiKey: AppConfig.breezApiKey);
        } catch (_) {}
      }

      if (!mounted) return;
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const HomeScreen()),
      );
    } else {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const WelcomeScreen()),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(child: CircularProgressIndicator()),
    );
  }
}
