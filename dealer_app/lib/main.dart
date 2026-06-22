import 'package:flutter/material.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'core/constants.dart';
import 'services/api_service.dart';
import 'screens/welcome_screen.dart';
import 'screens/home_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Auto Renew - Dealer',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        fontFamily: 'Segoe UI',
        colorScheme: ColorScheme.fromSeed(seedColor: AppColors.primary),
        scaffoldBackgroundColor: AppColors.background,
      ),
      home: const SplashScreen(),
    );
  }
}

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _checkNetworkAndAuth();
  }

  Future<void> _checkNetworkAndAuth() async {
    await Future.delayed(const Duration(seconds: 1));
    final result = await Connectivity().checkConnectivity();
    final hasNetwork = result != ConnectivityResult.none;

    if (!hasNetwork && mounted) {
      _showNetworkDialog();
      return;
    }

    await Future.delayed(const Duration(seconds: 1));
    final loggedIn = await ApiService.isLoggedIn();
    if (mounted) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (_) => loggedIn ? const HomeScreen() : const WelcomeScreen(),
        ),
      );
    }
  }

  void _showNetworkDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.signal_wifi_off, color: AppColors.error),
            SizedBox(width: 8),
            Text('لا يوجد اتصال بالإنترنت'),
          ],
        ),
        content: const Text(
          'التطبيق يحتاج إلى اتصال بالإنترنت.\nيرجى تفعيل WiFi أو بيانات الهاتف، ثم اضغط إعادة المحاولة.',
          textAlign: TextAlign.center,
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.of(context).pop();
              _checkNetworkAndAuth();
            },
            child: const Text('إعادة المحاولة'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [AppColors.primary, AppColors.primaryDark],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
          ),
        ),
        child: const Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.shield_moon_rounded, size: 120, color: Colors.white),
              SizedBox(height: 24),
              Text('Auto Renew', style: TextStyle(fontSize: 32, color: Colors.white, fontWeight: FontWeight.bold)),
              SizedBox(height: 8),
              Text('نظام الوكلاء', style: TextStyle(fontSize: 18, color: Colors.white70)),
              SizedBox(height: 40),
              CircularProgressIndicator(color: Colors.white),
            ],
          ),
        ),
      ),
    );
  }
}
