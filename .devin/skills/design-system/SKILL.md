---
name: design-system
description: Design token architecture and component specifications for Garage Go 2.0. Three-layer tokens (primitive→semantic→component), CSS variables, spacing/typography scales, component specs. Use for design tokens, systematic design, and Flutter theme configuration.
metadata:
  trigger: Creating design tokens, defining component styles, configuring Flutter theme, CSS variable systems
  author: Adapted from ckm:design-system for Garage Go
---

# Design System for Garage Go 2.0

⚠️ **IMPORTANT: NO EMAIL FIELDS ALLOWED** - Use phone numbers instead.

Token architecture, component specifications, and systematic design for Flutter (Web/Desktop/Mobile) and HTML/CSS/JS.

## When to Use

- Design token creation
- Component state definitions
- CSS variable systems
- Spacing/typography scales
- Flutter theme configuration
- Component specifications

## Token Architecture

### Three-Layer Structure

```
Primitive (raw values)
       ↓
Semantic (purpose aliases)
       ↓
Component (component-specific)
```

**Example:**
```css
/* Primitive */
--color-blue-600: #2563EB;

/* Semantic */
--color-primary: var(--color-blue-600);

/* Component */
--button-bg: var(--color-primary);
```

## Primitive Tokens

### Colors

```css
/* Blue Palette */
--color-blue-50: #EFF6FF;
--color-blue-100: #DBEAFE;
--color-blue-200: #BFDBFE;
--color-blue-300: #93C5FD;
--color-blue-400: #60A5FA;
--color-blue-500: #3B82F6;
--color-blue-600: #2563EB;
--color-blue-700: #1D4ED8;
--color-blue-800: #1E40AF;
--color-blue-900: #1E3A8A;

/* Green Palette */
--color-green-50: #ECFDF5;
--color-green-100: #D1FAE5;
--color-green-200: #A7F3D0;
--color-green-300: #6EE7B7;
--color-green-400: #34D399;
--color-green-500: #10B981;
--color-green-600: #059669;
--color-green-700: #047857;
--color-green-800: #065F46;
--color-green-900: #064E3B;

/* Amber Palette */
--color-amber-50: #FFFBEB;
--color-amber-100: #FEF3C7;
--color-amber-200: #FDE68A;
--color-amber-300: #FCD34D;
--color-amber-400: #FBBF24;
--color-amber-500: #F59E0B;
--color-amber-600: #D97706;
--color-amber-700: #B45309;
--color-amber-800: #92400E;
--color-amber-900: #78350F;

/* Red Palette */
--color-red-50: #FEF2F2;
--color-red-100: #FEE2E2;
--color-red-200: #FECACA;
--color-red-300: #FCA5A5;
--color-red-400: #F87171;
--color-red-500: #EF4444;
--color-red-600: #DC2626;
--color-red-700: #B91C1C;
--color-red-800: #991B1B;
--color-red-900: #7F1D1D;

/* Gray Palette */
--color-gray-50: #F9FAFB;
--color-gray-100: #F3F4F6;
--color-gray-200: #E5E7EB;
--color-gray-300: #D1D5DB;
--color-gray-400: #9CA3AF;
--color-gray-500: #6B7280;
--color-gray-600: #4B5563;
--color-gray-700: #374151;
--color-gray-800: #1F2937;
--color-gray-900: #111827;
```

### Spacing

```css
--spacing-0: 0;
--spacing-1: 4px;
--spacing-2: 8px;
--spacing-3: 12px;
--spacing-4: 16px;
--spacing-5: 20px;
--spacing-6: 24px;
--spacing-8: 32px;
--spacing-10: 40px;
--spacing-12: 48px;
--spacing-16: 64px;
--spacing-20: 80px;
--spacing-24: 96px;
```

### Typography

```css
--font-size-xs: 12px;
--font-size-sm: 14px;
--font-size-base: 16px;
--font-size-lg: 18px;
--font-size-xl: 20px;
--font-size-2xl: 24px;
--font-size-3xl: 30px;
--font-size-4xl: 36px;
--font-size-5xl: 48px;
--font-size-6xl: 60px;

--line-height-tight: 1.25;
--line-height-normal: 1.5;
--line-height-relaxed: 1.75;

--font-weight-normal: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;
```

### Border Radius

```css
--radius-none: 0;
--radius-sm: 4px;
--radius-md: 8px;
--radius-lg: 12px;
--radius-xl: 16px;
--radius-2xl: 24px;
--radius-full: 9999px;
```

### Shadows

```css
--shadow-xs: 0 1px 2px rgba(0,0,0,0.05);
--shadow-sm: 0 1px 3px rgba(0,0,0,0.1);
--shadow-md: 0 4px 6px rgba(0,0,0,0.1);
--shadow-lg: 0 10px 15px rgba(0,0,0,0.1);
--shadow-xl: 0 20px 25px rgba(0,0,0,0.15);
--shadow-2xl: 0 25px 50px rgba(0,0,0,0.25);
```

## Semantic Tokens

```css
/* Semantic Colors */
--color-primary: var(--color-blue-600);
--color-primary-hover: var(--color-blue-700);
--color-primary-active: var(--color-blue-800);
--color-primary-bg: var(--color-blue-50);

--color-success: var(--color-green-600);
--color-success-hover: var(--color-green-700);
--color-success-bg: var(--color-green-50);

--color-warning: var(--color-amber-600);
--color-warning-hover: var(--color-amber-700);
--color-warning-bg: var(--color-amber-50);

--color-error: var(--color-red-600);
--color-error-hover: var(--color-red-700);
--color-error-bg: var(--color-red-50);

--color-background: var(--color-gray-50);
--color-surface: #FFFFFF;
--color-surface-elevated: #FFFFFF;

--color-text-primary: var(--color-gray-900);
--color-text-secondary: var(--color-gray-600);
--color-text-tertiary: var(--color-gray-500);
--color-text-disabled: var(--color-gray-400);

--color-border: var(--color-gray-200);
--color-border-hover: var(--color-gray-300);
--color-border-focus: var(--color-blue-500);

/* Semantic Spacing */
--space-xs: var(--spacing-1);
--space-sm: var(--spacing-2);
--space-md: var(--spacing-4);
--space-lg: var(--spacing-6);
--space-xl: var(--spacing-8);
--space-2xl: var(--spacing-12);

/* Semantic Typography */
--text-xs: var(--font-size-xs);
--text-sm: var(--font-size-sm);
--text-base: var(--font-size-base);
--text-lg: var(--font-size-lg);
--text-xl: var(--font-size-xl);
--text-2xl: var(--font-size-2xl);
--text-3xl: var(--font-size-3xl);

--text-heading: var(--font-size-2xl);
--text-subheading: var(--font-size-xl);
--text-body: var(--font-size-base);
--text-caption: var(--font-size-sm);
--text-label: var(--font-size-sm);

--line-height-heading: var(--line-height-tight);
--line-height-body: var(--line-height-normal);
--line-height-loose: var(--line-height-relaxed);
```

## Component Tokens

### Button

```css
/* Primary Button */
--button-primary-bg: var(--color-primary);
--button-primary-bg-hover: var(--color-primary-hover);
--button-primary-bg-active: var(--color-primary-active);
--button-primary-text: #FFFFFF;
--button-primary-text-hover: #FFFFFF;
--button-primary-border: transparent;
--button-primary-border-radius: var(--radius-md);
--button-primary-padding-x: var(--space-lg);
--button-primary-padding-y: var(--space-sm);
--button-primary-height: 48px;
--button-primary-shadow: var(--shadow-sm);
--button-primary-shadow-hover: var(--shadow-md);

/* Secondary Button */
--button-secondary-bg: var(--color-surface);
--button-secondary-bg-hover: var(--color-gray-100);
--button-secondary-bg-active: var(--color-gray-200);
--button-secondary-text: var(--color-text-primary);
--button-secondary-text-hover: var(--color-text-primary);
--button-secondary-border: var(--color-border);
--button-secondary-border-hover: var(--color-border-hover);
--button-secondary-border-radius: var(--radius-md);
--button-secondary-padding-x: var(--space-lg);
--button-secondary-padding-y: var(--space-sm);
--button-secondary-height: 48px;
--button-secondary-shadow: var(--shadow-sm);
--button-secondary-shadow-hover: var(--shadow-md);

/* Danger Button */
--button-danger-bg: var(--color-error);
--button-danger-bg-hover: var(--color-error-hover);
--button-danger-bg-active: var(--color-error-active);
--button-danger-text: #FFFFFF;
--button-danger-text-hover: #FFFFFF;
--button-danger-border: transparent;
--button-danger-border-radius: var(--radius-md);
--button-danger-padding-x: var(--space-lg);
--button-danger-padding-y: var(--space-sm);
--button-danger-height: 48px;
--button-danger-shadow: var(--shadow-sm);
--button-danger-shadow-hover: var(--shadow-md);
```

### Card

```css
--card-bg: var(--color-surface);
--card-bg-hover: var(--color-surface);
--card-border: var(--color-border);
--card-border-hover: var(--color-border-hover);
--card-border-radius: var(--radius-lg);
--card-padding: var(--space-lg);
--card-shadow: var(--shadow-md);
--card-shadow-hover: var(--shadow-lg);
```

### Input

```css
--input-bg: var(--color-surface);
--input-bg-hover: var(--color-surface);
--input-bg-focus: var(--color-surface);
--input-bg-disabled: var(--color-gray-100);
--input-text: var(--color-text-primary);
--input-text-placeholder: var(--color-text-tertiary);
--input-text-disabled: var(--color-text-disabled);
--input-border: var(--color-border);
--input-border-hover: var(--color-border-hover);
--input-border-focus: var(--color-border-focus);
--input-border-error: var(--color-error);
--input-border-radius: var(--radius-md);
--input-padding-x: var(--space-md);
--input-padding-y: var(--space-sm);
--input-height: 48px;
--input-shadow: var(--shadow-sm);
--input-shadow-focus: var(--shadow-md);
```

### Modal

```css
--modal-bg: var(--color-surface);
--modal-backdrop: rgba(0, 0, 0, 0.5);
--modal-border-radius: var(--radius-xl);
--modal-padding: var(--space-xl);
--modal-shadow: var(--shadow-2xl);
--modal-max-width: 600px;
```

### Status Badge

```css
/* Success */
--badge-success-bg: var(--color-success-bg);
--badge-success-text: var(--color-success);
--badge-success-border: var(--color-success);

/* Warning */
--badge-warning-bg: var(--color-warning-bg);
--badge-warning-text: var(--color-warning);
--badge-warning-border: var(--color-warning);

/* Error */
--badge-error-bg: var(--color-error-bg);
--badge-error-text: var(--color-error);
--badge-error-border: var(--color-error);

/* Info */
--badge-info-bg: var(--color-primary-bg);
--badge-info-text: var(--color-primary);
--badge-info-border: var(--color-primary);
```

## Flutter Theme Configuration

```dart
// lib/core/theme/app_theme.dart

import 'package:flutter/material.dart';

class AppTheme {
  static const Color primaryColor = Color(0xFF2563EB);
  static const Color primaryDark = Color(0xFF1D4ED8);
  static const Color primaryLight = Color(0xFF3B82F6);

  static const Color successColor = Color(0xFF10B981);
  static const Color warningColor = Color(0xFFF59E0B);
  static const Color errorColor = Color(0xFFEF4444);

  static const Color backgroundColor = Color(0xFFF3F4F6);
  static const Color surfaceColor = Color(0xFFFFFFFF);
  static const Color textPrimary = Color(0xFF1F2937);
  static const Color textSecondary = Color(0xFF6B7280);

  static const double spacingXS = 4.0;
  static const double spacingSM = 8.0;
  static const double spacingMD = 16.0;
  static const double spacingLG = 24.0;
  static const double spacingXL = 32.0;

  static const double radiusSM = 4.0;
  static const double radiusMD = 8.0;
  static const double radiusLG = 12.0;
  static const double radiusXL = 16.0;

  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      colorScheme: const ColorScheme.light(
        primary: primaryColor,
        secondary: successColor,
        error: errorColor,
        surface: surfaceColor,
        background: backgroundColor,
      ),
      scaffoldBackgroundColor: backgroundColor,
      cardColor: surfaceColor,

      // Typography
      fontFamily: 'Cairo',
      textTheme: const TextTheme(
        displayLarge: TextStyle(
          fontSize: 36,
          fontWeight: FontWeight.bold,
          color: textPrimary,
        ),
        displayMedium: TextStyle(
          fontSize: 30,
          fontWeight: FontWeight.bold,
          color: textPrimary,
        ),
        displaySmall: TextStyle(
          fontSize: 24,
          fontWeight: FontWeight.bold,
          color: textPrimary,
        ),
        headlineLarge: TextStyle(
          fontSize: 20,
          fontWeight: FontWeight.bold,
          color: textPrimary,
        ),
        headlineMedium: TextStyle(
          fontSize: 18,
          fontWeight: FontWeight.w600,
          color: textPrimary,
        ),
        bodyLarge: TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.normal,
          color: textPrimary,
        ),
        bodyMedium: TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.normal,
          color: textSecondary,
        ),
        bodySmall: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.normal,
          color: textSecondary,
        ),
      ),

      // Button Theme
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          minimumSize: const Size(double.infinity, 48),
          padding: const EdgeInsets.symmetric(
            horizontal: spacingLG,
            vertical: spacingSM,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(radiusMD),
          ),
          elevation: 2,
        ),
      ),

      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          minimumSize: const Size(double.infinity, 48),
          padding: const EdgeInsets.symmetric(
            horizontal: spacingLG,
            vertical: spacingSM,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(radiusMD),
          ),
          side: const BorderSide(color: Color(0xFFE5E7EB)),
        ),
      ),

      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          padding: const EdgeInsets.symmetric(
            horizontal: spacingMD,
            vertical: spacingSM,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(radiusMD),
          ),
        ),
      ),

      // Card Theme
      cardTheme: CardTheme(
        elevation: 2,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radiusLG),
        ),
        margin: const EdgeInsets.all(spacingMD),
      ),

      // Input Decoration Theme
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: surfaceColor,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: spacingMD,
          vertical: spacingSM,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radiusMD),
          borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radiusMD),
          borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radiusMD),
          borderSide: const BorderSide(color: primaryColor, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radiusMD),
          borderSide: const BorderSide(color: errorColor),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radiusMD),
          borderSide: const BorderSide(color: errorColor, width: 2),
        ),
      ),

      // Divider Theme
      dividerTheme: const DividerThemeData(
        color: Color(0xFFE5E7EB),
        thickness: 1,
        space: spacingMD,
      ),
    );
  }

  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      colorScheme: const ColorScheme.dark(
        primary: primaryLight,
        secondary: successColor,
        error: errorColor,
        surface: Color(0xFF1F2937),
        background: Color(0xFF111827),
      ),
      scaffoldBackgroundColor: const Color(0xFF111827),
      cardColor: const Color(0xFF1F2937),
    );
  }
}
```

## CSS Variables for Customer Frontend

```css
/* customer_frontend/css/variables.css */

:root {
  /* Primitive Colors */
  --color-blue-600: #2563EB;
  --color-green-600: #10B981;
  --color-amber-600: #F59E0B;
  --color-red-600: #EF4444;
  --color-gray-50: #F9FAFB;
  --color-gray-100: #F3F4F6;
  --color-gray-200: #E5E7EB;
  --color-gray-300: #D1D5DB;
  --color-gray-400: #9CA3AF;
  --color-gray-500: #6B7280;
  --color-gray-600: #4B5563;
  --color-gray-700: #374151;
  --color-gray-800: #1F2937;
  --color-gray-900: #111827;

  /* Semantic Colors */
  --color-primary: var(--color-blue-600);
  --color-primary-hover: #1D4ED8;
  --color-success: var(--color-green-600);
  --color-warning: var(--color-amber-600);
  --color-error: var(--color-red-600);
  --color-background: var(--color-gray-50);
  --color-surface: #FFFFFF;
  --color-text-primary: var(--color-gray-900);
  --color-text-secondary: var(--color-gray-600);
  --color-border: var(--color-gray-200);

  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;

  /* Typography */
  --font-size-xs: 12px;
  --font-size-sm: 14px;
  --font-size-base: 16px;
  --font-size-lg: 18px;
  --font-size-xl: 20px;
  --font-size-2xl: 24px;
  --font-size-3xl: 30px;

  --line-height-tight: 1.25;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.75;

  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;

  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.1);
  --shadow-lg: 0 10px 15px rgba(0,0,0,0.1);
  --shadow-xl: 0 20px 25px rgba(0,0,0,0.15);
}
```

## Component Specifications

### Button States

| State | Background | Text | Border | Shadow |
|-------|-----------|------|--------|--------|
| Default | primary | white | transparent | sm |
| Hover | primary-dark | white | transparent | md |
| Active | primary-darker | white | transparent | none |
| Disabled | gray-100 | gray-400 | gray-200 | none |

### Input States

| State | Background | Text | Border | Shadow |
|-------|-----------|------|--------|--------|
| Default | white | primary | gray-200 | sm |
| Hover | white | primary | gray-300 | sm |
| Focus | white | primary | primary | md |
| Error | white | error | error | md |
| Disabled | gray-100 | gray-400 | gray-200 | none |

### Card States

| State | Background | Border | Shadow |
|-------|-----------|--------|--------|
| Default | white | gray-200 | md |
| Hover | white | gray-300 | lg |

## Best Practices

1. **Never use raw hex values** - always reference tokens
2. **Semantic layer enables theme switching** (light/dark)
3. **Component tokens enable per-component customization**
4. **Use HSL format for opacity control** when needed
5. **Document every token's purpose**
6. **Validate token usage** - no hardcoded values in components
7. **Keep tokens in a single source of truth**
8. **Version control token changes**

## Token Validation

```bash
# Check for hardcoded values in Flutter
grep -r "Color(0x" lib/ --exclude-dir=.dart_tool

# Check for hardcoded values in CSS
grep -r "#[0-9A-Fa-f]\{6\}" customer_frontend/css/ --exclude=variables.css
```

## Integration

**With Flutter:** Use `AppTheme` class in `MaterialApp`
**With HTML/CSS:** Import `variables.css` in all stylesheets
**With Tailwind:** Configure theme in `tailwind.config.js`
