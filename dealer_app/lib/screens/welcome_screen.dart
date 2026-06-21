import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../core/constants.dart';
import 'login_screen.dart';
import 'register_screen.dart';

class WelcomeScreen extends StatelessWidget {
  const WelcomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [AppColors.primary, AppColors.primaryDark],
          ),
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 32),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                const SizedBox(height: 60),
                Icon(
                  Icons.shield_moon_rounded,
                  size: 100,
                  color: Colors.white.withOpacity(0.9),
                )
                    .animate()
                    .fadeIn(duration: 600.ms)
                    .scale(delay: 200.ms, duration: 500.ms),
                const SizedBox(height: 24),
                Text(
                  'Auto Renew',
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 2,
                      ),
                ).animate().fadeIn(delay: 300.ms).slideY(begin: 0.3, end: 0),
                const SizedBox(height: 8),
                Text(
                  'نظام الوكلاء والكفالات',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        color: Colors.white70,
                      ),
                ).animate().fadeIn(delay: 500.ms),
                const Spacer(),
                _buildButton(
                  context,
                  'تسجيل دخول',
                  Icons.login,
                  () => Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const LoginScreen()),
                  ),
                )
                    .animate()
                    .fadeIn(delay: 700.ms)
                    .slideY(begin: 0.5, end: 0),
                const SizedBox(height: 16),
                _buildButton(
                  context,
                  'تسجيل وكيل جديد',
                  Icons.person_add,
                  () => Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const RegisterScreen()),
                  ),
                  isOutlined: true,
                )
                    .animate()
                    .fadeIn(delay: 900.ms)
                    .slideY(begin: 0.5, end: 0),
                const SizedBox(height: 40),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildButton(
    BuildContext context,
    String text,
    IconData icon,
    VoidCallback onTap, {
    bool isOutlined = false,
  }) {
    return SizedBox(
      width: double.infinity,
      height: 56,
      child: ElevatedButton.icon(
        onPressed: onTap,
        icon: Icon(icon, color: isOutlined ? Colors.white : Colors.white),
        label: Text(
          text,
          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
        ),
        style: ElevatedButton.styleFrom(
          backgroundColor:
              isOutlined ? Colors.transparent : AppColors.accent,
          foregroundColor: Colors.white,
          side: isOutlined
              ? const BorderSide(color: Colors.white54, width: 1.5)
              : null,
          elevation: isOutlined ? 0 : 4,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
        ),
      ),
    );
  }
}
