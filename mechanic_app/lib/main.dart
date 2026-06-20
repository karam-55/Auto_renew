import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'core/theme/luxury_theme.dart';
import 'screens/login_screen.dart';
import 'screens/home_screen.dart';
import 'screens/bookings_list_screen.dart';

void main() {
  runApp(
    const ProviderScope(
      child: MyApp(),
    ),
  );
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ScreenUtilInit(
      designSize: const Size(375, 812), // iPhone X dimensions
      minTextAdapt: true,
      splitScreenMode: true,
      builder: (context, child) {
        return MaterialApp(
          title: 'Garage Go 2.0 Mechanic',
          debugShowCheckedModeBanner: false,
          theme: LuxuryTheme.luxuryTheme,
          initialRoute: '/',
          routes: {
            '/': (context) => const LoginScreen(),
            '/home': (context) => const HomeScreen(),
            '/bookings': (context) => const BookingsListScreen(),
          },
        );
      },
    );
  }
}
