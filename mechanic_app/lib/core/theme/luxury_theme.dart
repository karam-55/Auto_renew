import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class LuxuryTheme {
  // Luxury Color Palette - Platinum & Gold
  static const Color platinum = Color(0xFFE5E4E2);
  static const Color platinumLight = Color(0xFFF5F5F4);
  static const Color platinumDark = Color(0xFFD6D3D1);
  
  static const Color gold = Color(0xFFD4AF37);
  static const Color goldLight = Color(0xFFE5C856);
  static const Color goldDark = Color(0xFFB8962C);
  static const Color goldShimmer = Color(0xFFFFD700);
  
  static const Color blackLuxury = Color(0xFF0A0A0A);
  static const Color blackDark = Color(0xFF050505);
  static const Color blackLight = Color(0xFF1A1A1A);
  
  static const Color royalBlue = Color(0xFF0A2463);
  static const Color royalBlueLight = Color(0xFF1E3A8A);
  static const Color royalBlueDark = Color(0xFF051842);
  
  static const Color silver = Color(0xFFC0C0C0);
  static const Color silverLight = Color(0xFFE0E0E0);
  static const Color silverDark = Color(0xFFA0A0A0);
  
  // Spacing Scale
  static const double spacingXs = 4.0;
  static const double spacingSm = 8.0;
  static const double spacingMd = 16.0;
  static const double spacingLg = 24.0;
  static const double spacingXl = 32.0;
  static const double spacing2xl = 48.0;
  static const double spacing3xl = 64.0;
  static const double spacing4xl = 96.0;

  // Border Radius - Luxury Large Curves
  static const double radiusSm = 8.0;
  static const double radiusMd = 16.0;
  static const double radiusLg = 24.0;
  static const double radiusXl = 32.0;
  static const double radius2xl = 48.0;
  static const double radiusFull = 9999.0;

  // Luxury Shadows - Layered Depth
  static List<BoxShadow> get luxuryShadowSmall => [
    BoxShadow(
      color: Colors.black.withOpacity(0.1),
      blurRadius: 8,
      offset: const Offset(0, 2),
    ),
    BoxShadow(
      color: gold.withOpacity(0.1),
      blurRadius: 8,
      offset: const Offset(0, 1),
    ),
  ];

  static List<BoxShadow> get luxuryShadowMedium => [
    BoxShadow(
      color: Colors.black.withOpacity(0.15),
      blurRadius: 20,
      offset: const Offset(0, 4),
    ),
    BoxShadow(
      color: gold.withOpacity(0.15),
      blurRadius: 20,
      offset: const Offset(0, 2),
    ),
    BoxShadow(
      color: platinum.withOpacity(0.2),
      blurRadius: 20,
      offset: const Offset(0, 1),
    ),
  ];

  static List<BoxShadow> get luxuryShadowLarge => [
    BoxShadow(
      color: Colors.black.withOpacity(0.2),
      blurRadius: 40,
      offset: const Offset(0, 8),
    ),
    BoxShadow(
      color: gold.withOpacity(0.2),
      blurRadius: 40,
      offset: const Offset(0, 4),
    ),
    BoxShadow(
      color: platinum.withOpacity(0.3),
      blurRadius: 40,
      offset: const Offset(0, 2),
    ),
  ];

  // Luxury Theme (Dark Mode Default for Premium Feel)
  static ThemeData get luxuryTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      
      // Colors
      primaryColor: gold,
      scaffoldBackgroundColor: blackLuxury,
      cardColor: blackLight,
      dividerColor: platinumDark,
      
      // Color Scheme
      colorScheme: const ColorScheme.dark(
        primary: gold,
        secondary: royalBlue,
        tertiary: platinum,
        error: Color(0xFFDC2626),
        surface: blackLight,
        onPrimary: blackLuxury,
        onSecondary: Colors.white,
        onTertiary: blackLuxury,
        onError: Colors.white,
        onSurface: platinum,
      ),

      // Typography - Luxury Fonts
      textTheme: TextTheme(
        displayLarge: GoogleFonts.poppins(
          fontSize: 36,
          fontWeight: FontWeight.w700,
          color: platinum,
          letterSpacing: 0.5,
        ),
        displayMedium: GoogleFonts.poppins(
          fontSize: 32,
          fontWeight: FontWeight.w600,
          color: platinum,
          letterSpacing: 0.3,
        ),
        displaySmall: GoogleFonts.poppins(
          fontSize: 28,
          fontWeight: FontWeight.w600,
          color: platinum,
          letterSpacing: 0.2,
        ),
        headlineLarge: GoogleFonts.poppins(
          fontSize: 24,
          fontWeight: FontWeight.w600,
          color: platinum,
          letterSpacing: 0.2,
        ),
        headlineMedium: GoogleFonts.poppins(
          fontSize: 20,
          fontWeight: FontWeight.w500,
          color: platinum,
          letterSpacing: 0.1,
        ),
        headlineSmall: GoogleFonts.poppins(
          fontSize: 18,
          fontWeight: FontWeight.w500,
          color: platinum,
          letterSpacing: 0.1,
        ),
        titleLarge: GoogleFonts.cairo(
          fontSize: 18,
          fontWeight: FontWeight.w600,
          color: platinum,
        ),
        titleMedium: GoogleFonts.cairo(
          fontSize: 16,
          fontWeight: FontWeight.w500,
          color: platinum,
        ),
        titleSmall: GoogleFonts.cairo(
          fontSize: 14,
          fontWeight: FontWeight.w500,
          color: platinum,
        ),
        bodyLarge: GoogleFonts.cairo(
          fontSize: 16,
          fontWeight: FontWeight.w400,
          color: platinumLight,
        ),
        bodyMedium: GoogleFonts.cairo(
          fontSize: 14,
          fontWeight: FontWeight.w400,
          color: platinumLight,
        ),
        bodySmall: GoogleFonts.cairo(
          fontSize: 12,
          fontWeight: FontWeight.w400,
          color: silver,
        ),
        labelLarge: GoogleFonts.poppins(
          fontSize: 14,
          fontWeight: FontWeight.w600,
          color: gold,
          letterSpacing: 0.5,
        ),
        labelMedium: GoogleFonts.poppins(
          fontSize: 12,
          fontWeight: FontWeight.w500,
          color: goldLight,
          letterSpacing: 0.3,
        ),
        labelSmall: GoogleFonts.poppins(
          fontSize: 10,
          fontWeight: FontWeight.w500,
          color: goldDark,
          letterSpacing: 0.2,
        ),
      ),

      // App Bar Theme - Luxury Dark
      appBarTheme: AppBarTheme(
        backgroundColor: Colors.transparent,
        foregroundColor: platinum,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: GoogleFonts.poppins(
          fontSize: 20,
          fontWeight: FontWeight.w600,
          color: platinum,
          letterSpacing: 0.5,
        ),
        iconTheme: const IconThemeData(color: gold, size: 28),
      ),

      // Card Theme - Glassmorphism
      cardTheme: CardThemeData(
        color: blackLight.withOpacity(0.8),
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radiusLg),
          side: BorderSide(
            color: gold.withOpacity(0.3),
            width: 1,
          ),
        ),
        margin: const EdgeInsets.all(spacingMd),
      ),

      // Elevated Button Theme - Gold Gradient
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: gold,
          foregroundColor: blackLuxury,
          elevation: 8,
          padding: const EdgeInsets.symmetric(
            horizontal: spacingXl,
            vertical: spacingLg,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(radiusMd),
          ),
          textStyle: GoogleFonts.poppins(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            letterSpacing: 0.5,
          ),
          shadowColor: gold.withOpacity(0.5),
        ),
      ),

      // Outlined Button Theme - Gold Border
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: gold,
          side: const BorderSide(color: gold, width: 2),
          padding: const EdgeInsets.symmetric(
            horizontal: spacingXl,
            vertical: spacingLg,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(radiusMd),
          ),
          textStyle: GoogleFonts.poppins(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            letterSpacing: 0.5,
          ),
        ),
      ),

      // Text Button Theme
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: gold,
          padding: const EdgeInsets.symmetric(
            horizontal: spacingXl,
            vertical: spacingLg,
          ),
          textStyle: GoogleFonts.poppins(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            letterSpacing: 0.5,
          ),
        ),
      ),

      // Input Decoration Theme - Luxury Fields
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: blackDark.withOpacity(0.5),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: spacingLg,
          vertical: spacingLg,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radiusMd),
          borderSide: BorderSide(
            color: platinumDark,
            width: 1,
          ),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radiusMd),
          borderSide: BorderSide(
            color: platinumDark,
            width: 1,
          ),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radiusMd),
          borderSide: const BorderSide(
            color: gold,
            width: 2,
          ),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radiusMd),
          borderSide: const BorderSide(
            color: Color(0xFFDC2626),
            width: 2,
          ),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radiusMd),
          borderSide: const BorderSide(
            color: Color(0xFFDC2626),
            width: 2,
          ),
        ),
        labelStyle: GoogleFonts.poppins(
          fontSize: 14,
          color: platinumLight,
          letterSpacing: 0.3,
        ),
        hintStyle: GoogleFonts.poppins(
          fontSize: 14,
          color: silver,
          letterSpacing: 0.2,
        ),
        errorStyle: GoogleFonts.poppins(
          fontSize: 12,
          color: const Color(0xFFDC2626),
        ),
      ),

      // Floating Action Button Theme
      floatingActionButtonTheme: FloatingActionButtonThemeData(
        backgroundColor: gold,
        foregroundColor: blackLuxury,
        elevation: 12,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radiusXl),
        ),
        iconSize: 28,
      ),

      // Icon Theme
      iconTheme: const IconThemeData(
        color: gold,
        size: 24,
      ),

      // Divider Theme
      dividerTheme: const DividerThemeData(
        color: platinumDark,
        thickness: 1,
        space: spacingSm,
      ),

      // Bottom Navigation Bar Theme
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: blackLight,
        selectedItemColor: gold,
        unselectedItemColor: silver,
        type: BottomNavigationBarType.fixed,
        elevation: 16,
        selectedLabelStyle: TextStyle(
          fontWeight: FontWeight.w600,
          fontSize: 12,
        ),
      ),
    );
  }

  // Light Luxury Theme (for contrast)
  static ThemeData get luxuryLightTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      
      // Colors
      primaryColor: royalBlue,
      scaffoldBackgroundColor: platinumLight,
      cardColor: Colors.white,
      dividerColor: platinumDark,
      
      // Color Scheme
      colorScheme: const ColorScheme.light(
        primary: royalBlue,
        secondary: gold,
        tertiary: blackLuxury,
        error: Color(0xFFDC2626),
        surface: Colors.white,
        onPrimary: Colors.white,
        onSecondary: Colors.white,
        onTertiary: Colors.white,
        onError: Colors.white,
        onSurface: blackLuxury,
      ),

      // Typography
      textTheme: TextTheme(
        displayLarge: GoogleFonts.poppins(
          fontSize: 36,
          fontWeight: FontWeight.w700,
          color: blackLuxury,
          letterSpacing: 0.5,
        ),
        displayMedium: GoogleFonts.poppins(
          fontSize: 32,
          fontWeight: FontWeight.w600,
          color: blackLuxury,
          letterSpacing: 0.3,
        ),
        displaySmall: GoogleFonts.poppins(
          fontSize: 28,
          fontWeight: FontWeight.w600,
          color: blackLuxury,
          letterSpacing: 0.2,
        ),
        headlineLarge: GoogleFonts.poppins(
          fontSize: 24,
          fontWeight: FontWeight.w600,
          color: blackLuxury,
          letterSpacing: 0.2,
        ),
        headlineMedium: GoogleFonts.poppins(
          fontSize: 20,
          fontWeight: FontWeight.w500,
          color: blackLuxury,
          letterSpacing: 0.1,
        ),
        headlineSmall: GoogleFonts.poppins(
          fontSize: 18,
          fontWeight: FontWeight.w500,
          color: blackLuxury,
          letterSpacing: 0.1,
        ),
        titleLarge: GoogleFonts.cairo(
          fontSize: 18,
          fontWeight: FontWeight.w600,
          color: blackLuxury,
        ),
        titleMedium: GoogleFonts.cairo(
          fontSize: 16,
          fontWeight: FontWeight.w500,
          color: blackLuxury,
        ),
        titleSmall: GoogleFonts.cairo(
          fontSize: 14,
          fontWeight: FontWeight.w500,
          color: blackLuxury,
        ),
        bodyLarge: GoogleFonts.cairo(
          fontSize: 16,
          fontWeight: FontWeight.w400,
          color: const Color(0xFF1A1A1A),
        ),
        bodyMedium: GoogleFonts.cairo(
          fontSize: 14,
          fontWeight: FontWeight.w400,
          color: const Color(0xFF1A1A1A),
        ),
        bodySmall: GoogleFonts.cairo(
          fontSize: 12,
          fontWeight: FontWeight.w400,
          color: const Color(0xFF6B7280),
        ),
        labelLarge: GoogleFonts.poppins(
          fontSize: 14,
          fontWeight: FontWeight.w600,
          color: royalBlue,
          letterSpacing: 0.5,
        ),
        labelMedium: GoogleFonts.poppins(
          fontSize: 12,
          fontWeight: FontWeight.w500,
          color: royalBlueLight,
          letterSpacing: 0.3,
        ),
        labelSmall: GoogleFonts.poppins(
          fontSize: 10,
          fontWeight: FontWeight.w500,
          color: royalBlueDark,
          letterSpacing: 0.2,
        ),
      ),

      // App Bar Theme
      appBarTheme: AppBarTheme(
        backgroundColor: Colors.transparent,
        foregroundColor: blackLuxury,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: GoogleFonts.poppins(
          fontSize: 20,
          fontWeight: FontWeight.w600,
          color: blackLuxury,
          letterSpacing: 0.5,
        ),
        iconTheme: const IconThemeData(color: royalBlue, size: 28),
      ),

      // Card Theme
      cardTheme: CardThemeData(
        color: Colors.white,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radiusLg),
          side: BorderSide(
            color: gold.withOpacity(0.3),
            width: 1,
          ),
        ),
        margin: const EdgeInsets.all(spacingMd),
      ),

      // Elevated Button Theme
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: royalBlue,
          foregroundColor: Colors.white,
          elevation: 8,
          padding: const EdgeInsets.symmetric(
            horizontal: spacingXl,
            vertical: spacingLg,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(radiusMd),
          ),
          textStyle: GoogleFonts.poppins(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            letterSpacing: 0.5,
          ),
          shadowColor: royalBlue.withOpacity(0.5),
        ),
      ),

      // Input Decoration Theme
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: platinumLight,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: spacingLg,
          vertical: spacingLg,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radiusMd),
          borderSide: BorderSide(
            color: platinumDark,
            width: 1,
          ),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radiusMd),
          borderSide: BorderSide(
            color: platinumDark,
            width: 1,
          ),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radiusMd),
          borderSide: const BorderSide(
            color: royalBlue,
            width: 2,
          ),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radiusMd),
          borderSide: const BorderSide(
            color: Color(0xFFDC2626),
            width: 2,
          ),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radiusMd),
          borderSide: const BorderSide(
            color: Color(0xFFDC2626),
            width: 2,
          ),
        ),
        labelStyle: GoogleFonts.poppins(
          fontSize: 14,
          color: const Color(0xFF1A1A1A),
          letterSpacing: 0.3,
        ),
        hintStyle: GoogleFonts.poppins(
          fontSize: 14,
          color: const Color(0xFF6B7280),
          letterSpacing: 0.2,
        ),
        errorStyle: GoogleFonts.poppins(
          fontSize: 12,
          color: const Color(0xFFDC2626),
        ),
      ),

      // Floating Action Button Theme
      floatingActionButtonTheme: FloatingActionButtonThemeData(
        backgroundColor: royalBlue,
        foregroundColor: Colors.white,
        elevation: 12,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radiusXl),
        ),
        iconSize: 28,
      ),

      // Icon Theme
      iconTheme: const IconThemeData(
        color: royalBlue,
        size: 24,
      ),

      // Divider Theme
      dividerTheme: const DividerThemeData(
        color: platinumDark,
        thickness: 1,
        space: spacingSm,
      ),
    );
  }
}