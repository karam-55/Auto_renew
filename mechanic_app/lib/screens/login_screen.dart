import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:animate_do/animate_do.dart';
import '../providers/auth_provider.dart';
import '../services/socket_service.dart';
import '../core/theme/luxury_theme.dart';
import '../widgets/loading_overlay.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();
  final _tenantIdController = TextEditingController();
  bool _obscurePassword = true;

  @override
  void dispose() {
    _usernameController.dispose();
    _passwordController.dispose();
    _tenantIdController.dispose();
    super.dispose();
  }

  void _handleLogin() {
    if (_formKey.currentState!.validate()) {
      ref.read(authStateProvider.notifier).login(
            _usernameController.text,
            _passwordController.text,
            _tenantIdController.text,
          );
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authStateProvider);

    if (authState.isAuthenticated) {
      WidgetsBinding.instance.addPostFrameCallback((_) async {
        // Connect to Socket.io before navigating
        await SocketService.instance.connect(context);
        Navigator.of(context).pushReplacementNamed('/home');
      });
    }

    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              LuxuryTheme.blackLuxury,
              LuxuryTheme.royalBlue,
              LuxuryTheme.blackLuxury,
            ],
          ),
        ),
        child: Center(
          child: SingleChildScrollView(
            padding: EdgeInsets.symmetric(horizontal: 32.w),
            child: Form(
              key: _formKey,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Logo with Hollywood animation
                  FadeInDown(
                    duration: const Duration(milliseconds: 1200),
                    child: Container(
                      padding: EdgeInsets.all(32.r),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: [
                            LuxuryTheme.gold,
                            LuxuryTheme.goldLight,
                            LuxuryTheme.goldDark,
                          ],
                        ),
                        borderRadius: BorderRadius.circular(LuxuryTheme.radius2xl),
                        boxShadow: LuxuryTheme.luxuryShadowLarge,
                      ),
                      child: Icon(
                        Icons.build,
                        size: 100.sp,
                        color: LuxuryTheme.blackLuxury,
                      ),
                    ),
                  ),
                  SizedBox(height: 48.h),
                  
                  // Title with animation
                  FadeInUp(
                    duration: const Duration(milliseconds: 1200),
                    delay: const Duration(milliseconds: 300),
                    child: Text(
                      'Garage Go 2.0',
                      style: Theme.of(context).textTheme.displayLarge?.copyWith(
                        fontSize: 42.sp,
                        color: LuxuryTheme.platinum,
                        shadows: [
                          Shadow(
                            color: LuxuryTheme.gold.withOpacity(0.5),
                            blurRadius: 20,
                            offset: const Offset(0, 0),
                          ),
                        ],
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                  SizedBox(height: 16.h),
                  
                  FadeInUp(
                    duration: const Duration(milliseconds: 1200),
                    delay: const Duration(milliseconds: 450),
                    child: Text(
                      'تطبيق الميكانيكي',
                      style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                        color: LuxuryTheme.platinumLight,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                  SizedBox(height: 64.h),
                  
                  // Login Card with Glassmorphism
                  FadeInUp(
                    duration: const Duration(milliseconds: 1200),
                    delay: const Duration(milliseconds: 600),
                    child: Container(
                      padding: EdgeInsets.all(32.r),
                      decoration: BoxDecoration(
                        color: LuxuryTheme.blackLight.withOpacity(0.6),
                        borderRadius: BorderRadius.circular(LuxuryTheme.radius2xl),
                        border: Border.all(
                          color: LuxuryTheme.gold.withOpacity(0.3),
                          width: 2,
                        ),
                        boxShadow: LuxuryTheme.luxuryShadowLarge,
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          // Tenant ID Field
                          TextFormField(
                            controller: _tenantIdController,
                            style: Theme.of(context).textTheme.bodyLarge,
                            decoration: InputDecoration(
                              labelText: 'رقم المستأجر (Tenant ID)',
                              prefixIcon: const Icon(Icons.business, color: LuxuryTheme.gold),
                              filled: true,
                              fillColor: LuxuryTheme.blackDark.withOpacity(0.5),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(LuxuryTheme.radiusLg),
                                borderSide: BorderSide(
                                  color: LuxuryTheme.platinumDark,
                                  width: 1,
                                ),
                              ),
                              enabledBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(LuxuryTheme.radiusLg),
                                borderSide: BorderSide(
                                  color: LuxuryTheme.platinumDark,
                                  width: 1,
                                ),
                              ),
                              focusedBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(LuxuryTheme.radiusLg),
                                borderSide: const BorderSide(
                                  color: LuxuryTheme.gold,
                                  width: 2,
                                ),
                              ),
                              labelStyle: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                color: LuxuryTheme.platinumLight,
                              ),
                            ),
                            validator: (value) {
                              if (value == null || value.isEmpty) {
                                return 'يرجى إدخال رقم المستأجر';
                              }
                              return null;
                            },
                          ),
                          SizedBox(height: 24.h),
                          
                          // Username Field
                          TextFormField(
                            controller: _usernameController,
                            style: Theme.of(context).textTheme.bodyLarge,
                            decoration: InputDecoration(
                              labelText: 'اسم المستخدم',
                              prefixIcon: const Icon(Icons.person, color: LuxuryTheme.gold),
                              filled: true,
                              fillColor: LuxuryTheme.blackDark.withOpacity(0.5),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(LuxuryTheme.radiusLg),
                                borderSide: BorderSide(
                                  color: LuxuryTheme.platinumDark,
                                  width: 1,
                                ),
                              ),
                              enabledBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(LuxuryTheme.radiusLg),
                                borderSide: BorderSide(
                                  color: LuxuryTheme.platinumDark,
                                  width: 1,
                                ),
                              ),
                              focusedBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(LuxuryTheme.radiusLg),
                                borderSide: const BorderSide(
                                  color: LuxuryTheme.gold,
                                  width: 2,
                                ),
                              ),
                              labelStyle: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                color: LuxuryTheme.platinumLight,
                              ),
                            ),
                            validator: (value) {
                              if (value == null || value.isEmpty) {
                                return 'يرجى إدخال اسم المستخدم';
                              }
                              return null;
                            },
                          ),
                          SizedBox(height: 24.h),
                          
                          // Password Field
                          TextFormField(
                            controller: _passwordController,
                            obscureText: _obscurePassword,
                            style: Theme.of(context).textTheme.bodyLarge,
                            decoration: InputDecoration(
                              labelText: 'كلمة المرور',
                              prefixIcon: const Icon(Icons.lock, color: LuxuryTheme.gold),
                              suffixIcon: IconButton(
                                icon: Icon(
                                  _obscurePassword ? Icons.visibility : Icons.visibility_off,
                                  color: LuxuryTheme.gold,
                                ),
                                onPressed: () {
                                  setState(() {
                                    _obscurePassword = !_obscurePassword;
                                  });
                                },
                              ),
                              filled: true,
                              fillColor: LuxuryTheme.blackDark.withOpacity(0.5),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(LuxuryTheme.radiusLg),
                                borderSide: BorderSide(
                                  color: LuxuryTheme.platinumDark,
                                  width: 1,
                                ),
                              ),
                              enabledBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(LuxuryTheme.radiusLg),
                                borderSide: BorderSide(
                                  color: LuxuryTheme.platinumDark,
                                  width: 1,
                                ),
                              ),
                              focusedBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(LuxuryTheme.radiusLg),
                                borderSide: const BorderSide(
                                  color: LuxuryTheme.gold,
                                  width: 2,
                                ),
                              ),
                              labelStyle: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                color: LuxuryTheme.platinumLight,
                              ),
                            ),
                            validator: (value) {
                              if (value == null || value.isEmpty) {
                                return 'يرجى إدخال كلمة المرور';
                              }
                              return null;
                            },
                          ),
                          SizedBox(height: 32.h),
                          
                          // Error Message
                          if (authState.error != null)
                            Container(
                              padding: EdgeInsets.all(16.r),
                              decoration: BoxDecoration(
                                color: const Color(0xFFDC2626).withOpacity(0.2),
                                borderRadius: BorderRadius.circular(LuxuryTheme.radiusLg),
                                border: Border.all(
                                  color: const Color(0xFFDC2626),
                                  width: 1,
                                ),
                              ),
                              child: Row(
                                children: [
                                  const Icon(
                                    Icons.error_outline,
                                    color: Color(0xFFDC2626),
                                    size: 24,
                                  ),
                                  SizedBox(width: 12.w),
                                  Expanded(
                                    child: Text(
                                      authState.error!,
                                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                        color: const Color(0xFFDC2626),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          if (authState.error != null) SizedBox(height: 24.h),
                          
                          // Login Button with Gradient
                          AnimatedContainer(
                            duration: const Duration(milliseconds: 300),
                            child: Container(
                              decoration: BoxDecoration(
                                gradient: LinearGradient(
                                  begin: Alignment.topLeft,
                                  end: Alignment.bottomRight,
                                  colors: [
                                    LuxuryTheme.gold,
                                    LuxuryTheme.goldLight,
                                    LuxuryTheme.goldDark,
                                  ],
                                ),
                                borderRadius: BorderRadius.circular(LuxuryTheme.radiusLg),
                                boxShadow: LuxuryTheme.luxuryShadowMedium,
                              ),
                              child: ElevatedButton(
                                onPressed: authState.isLoading ? null : _handleLogin,
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Colors.transparent,
                                  shadowColor: Colors.transparent,
                                  padding: EdgeInsets.symmetric(vertical: 20.h),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(LuxuryTheme.radiusLg),
                                  ),
                                ),
                                child: authState.isLoading
                                    ? const SizedBox(
                                        height: 24,
                                        width: 24,
                                        child: CircularProgressIndicator(
                                          strokeWidth: 2,
                                          valueColor: AlwaysStoppedAnimation<Color>(LuxuryTheme.blackLuxury),
                                        ),
                                      )
                                    : Text(
                                        'تسجيل الدخول',
                                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                          color: LuxuryTheme.blackLuxury,
                                          fontSize: 18.sp,
                                        ),
                                      ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
