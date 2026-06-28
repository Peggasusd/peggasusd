import 'package:flutter/material.dart';
import 'package:logging/logging.dart';
import 'screens/home_screen.dart';
import 'screens/onboard_screen.dart';
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
          seedColor: Colors.indigo,
          brightness: Brightness.light,
        ),
        useMaterial3: true,
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
    final hasWallet = await SdkService.instance.hasStoredMnemonic();
    if (!mounted) return;
    if (hasWallet) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const HomeScreen()),
      );
    } else {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const OnboardScreen()),
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
