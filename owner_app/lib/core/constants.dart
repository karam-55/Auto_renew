import 'package:flutter/material.dart';

class ApiConfig {
  static const String baseUrl = 'http://178.105.209.59:8080';

  // Auth
  static const String login = '/api/auth/login';
  static const String refresh = '/api/auth/refresh';

  // Customers
  static const String customers = '/api/customers';

  // Vehicles
  static const String vehicles = '/api/vehicles';

  // Bookings
  static const String bookings = '/api/bookings';

  // Dealers
  static const String dealers = '/api/dealers';

  // Services (for booking form)
  static const String services = '/api/services';

  // Users (for profile)
  static const String users = '/api/users';
}

class AppColors {
  static const Color primary = Color(0xFF5B6BC0);
  static const Color primaryDark = Color(0xFF3F4DA0);
  static const Color primaryLight = Color(0xFF8E99F3);
  static const Color accent = Color(0xFFFFA726);
  static const Color success = Color(0xFF43A047);
  static const Color error = Color(0xFFE53935);
  static const Color warning = Color(0xFFFDD835);
  static const Color info = Color(0xFF1E88E5);

  static const Color background = Color(0xFFF8F9FC);
  static const Color surface = Color(0xFFFFFFFF);
  static const Color card = Color(0xFFFFFFFF);

  static const Color textPrimary = Color(0xFF1E293B);
  static const Color textSecondary = Color(0xFF64748B);
  static const Color textTertiary = Color(0xFF94A3B8);

  static const Color border = Color(0xFFE2E8F0);
  static const Color divider = Color(0xFFE2E8F0);

  static const Color shimmerBase = Color(0xFFE0E0E0);
  static const Color shimmerHighlight = Color(0xFFF5F5F5);
}

class AppSpacing {
  static const double xs = 4;
  static const double sm = 8;
  static const double md = 16;
  static const double lg = 24;
  static const double xl = 32;
  static const double xxl = 48;
}

class AppRadius {
  static const double sm = 8;
  static const double md = 12;
  static const double lg = 16;
  static const double xl = 24;
}
