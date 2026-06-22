import 'package:flutter/material.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import '../core/constants.dart';
import 'welcome_screen.dart';
import 'home_screen.dart';
import '../services/api_service.dart';

class PermissionScreen extends StatefulWidget {
  const PermissionScreen({super.key});

  @override
  State<PermissionScreen> createState() => _PermissionScreenState();
}

class _PermissionScreenState extends State<PermissionScreen> {
  bool _checking = false;

  Future<void> _allowAndProceed() async {
    setState(() => _checking = true);
    await Future.delayed(const Duration(milliseconds: 500));

    final result = await Connectivity().checkConnectivity();
    final hasNetwork = result != ConnectivityResult.none;

    if (!hasNetwork && mounted) {
      setState(() => _checking = false);
      _showNoNetworkDialog();
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

  void _showNoNetworkDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.signal_wifi_off, color: AppColors.error),
            SizedBox(width: 8),
            Text('لا يوجد اتصال'),
          ],
        ),
        content: const Text(
          'يرجى تفعيل WiFi أو بيانات الهاتف للمتابعة.',
          textAlign: TextAlign.center,
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.of(context).pop();
              _allowAndProceed();
            },
            child: const Text('إعادة المحاولة'),
          ),
        ],
      ),
    );
  }

  void _denyAndClose() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => AlertDialog(
        title: const Text('⚠️ تنبيه'),
        content: const Text(
          'لا يمكن استخدام التطبيق بدون اتصال بالإنترنت.\n'
          'يرجى السماح بالوصول للمتابعة.',
          textAlign: TextAlign.center,
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.of(context).pop();
              _allowAndProceed();
            },
            child: const Text('السماح'),
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
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.wifi_tethering, size: 80, color: Colors.white),
                const SizedBox(height: 24),
                const Text(
                  'صلاحية الوصول للإنترنت',
                  style: TextStyle(fontSize: 24, color: Colors.white, fontWeight: FontWeight.bold),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 16),
                const Text(
                  'يحتاج التطبيق إلى الوصول للإنترنت (WiFi أو بيانات الهاتف) للاتصال بالسيرفر وقاعدة البيانات.',
                  style: TextStyle(fontSize: 16, color: Colors.white70),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                const Text(
                  'الصلاحيات المطلوبة:\n'
                  '• الوصول للإنترنت\n'
                  '• معرفة حالة الشبكة (WiFi / بيانات)\n'
                  '• الوصول لحالة WiFi',
                  style: TextStyle(fontSize: 14, color: Colors.white54),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 40),
                if (_checking)
                  const CircularProgressIndicator(color: Colors.white)
                else
                  Column(
                    children: [
                      SizedBox(
                        width: double.infinity,
                        height: 56,
                        child: ElevatedButton(
                          onPressed: _allowAndProceed,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.white,
                            foregroundColor: AppColors.primary,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                          ),
                          child: const Text(
                            'السماح بالوصول',
                            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),
                      SizedBox(
                        width: double.infinity,
                        height: 48,
                        child: TextButton(
                          onPressed: _denyAndClose,
                          child: const Text(
                            'رفض',
                            style: TextStyle(fontSize: 16, color: Colors.white70),
                          ),
                        ),
                      ),
                    ],
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
