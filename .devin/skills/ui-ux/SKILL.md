---
name: ui-ux
description: UI/UX design intelligence for Garage Go 2.0. Includes 50+ styles, 161 color palettes, 57 font pairings, 99 UX guidelines, and 25 chart types. Use for Flutter (Web, Desktop, Mobile) and HTML/CSS/JS frontend design decisions.
metadata:
  trigger: Designing UI, choosing colors/fonts, creating components, reviewing UX, accessibility checks
  author: Adapted from ui-ux-pro-max for Garage Go
---

# UI/UX Design for Garage Go 2.0

⚠️ **IMPORTANT: NO EMAIL FIELDS ALLOWED** - Use phone numbers instead.

Comprehensive design guide for Garage Go applications (Flutter Web/Desktop/Mobile + HTML Customer Frontend).

## When to Use

This Skill should be used when the task involves:
- Designing new pages (Dashboard, Admin Panel, Mobile App, Customer Page)
- Creating or refactoring UI components (buttons, modals, forms, tables, charts)
- Choosing color schemes, typography systems, spacing standards
- Reviewing UI code for user experience, accessibility, or visual consistency
- Implementing navigation structures, animations, or responsive behavior

## Rule Categories by Priority

| Priority | Category | Impact | Key Checks (Must Have) | Anti-Patterns (Avoid) |
|----------|----------|--------|------------------------|------------------------|
| 1 | Accessibility | CRITICAL | Contrast 4.5:1, Alt text, Keyboard nav, Aria-labels | Removing focus rings, Icon-only buttons without labels |
| 2 | Touch & Interaction | CRITICAL | Min size 44×44px, 8px+ spacing, Loading feedback | Reliance on hover only, Instant state changes (0ms) |
| 3 | Performance | HIGH | WebP/AVIF, Lazy loading, Reserve space (CLS < 0.1) | Layout thrashing, Cumulative Layout Shift |
| 4 | Style Selection | HIGH | Match product type, Consistency, SVG icons (no emoji) | Mixing flat & skeuomorphic randomly, Emoji as icons |
| 5 | Layout & Responsive | HIGH | Mobile-first breakpoints, Viewport meta, No horizontal scroll | Horizontal scroll, Fixed px container widths, Disable zoom |
| 6 | Typography & Color | MEDIUM | Base 16px, Line-height 1.5, Semantic color tokens | Text < 12px body, Gray-on-gray, Raw hex in components |
| 7 | Animation | MEDIUM | Duration 150–300ms, Motion conveys meaning, Spatial continuity | Decorative-only animation, Animating width/height, No reduced-motion |
| 8 | Forms & Feedback | MEDIUM | Visible labels, Error near field, Helper text, Progressive disclosure | Placeholder-only label, Errors only at top, Overwhelm upfront |
| 9 | Navigation Patterns | HIGH | Predictable back, Bottom nav ≤5, Deep linking | Overloaded nav, Broken back behavior, No deep links |
| 10 | Charts & Data | LOW | Legends, Tooltips, Accessible colors | Relying on color alone to convey meaning |

## Quick Reference

### 1. Accessibility (CRITICAL)

- `color-contrast` - Minimum 4.5:1 ratio for normal text (large text 3:1)
- `focus-states` - Visible focus rings on interactive elements (2–4px)
- `alt-text` - Descriptive alt text for meaningful images
- `aria-labels` - aria-label for icon-only buttons
- `keyboard-nav` - Tab order matches visual order; full keyboard support
- `form-labels` - Use label with for attribute
- `heading-hierarchy` - Sequential h1→h6, no level skip
- `color-not-only` - Don't convey info by color alone (add icon/text)
- `reduced-motion` - Respect prefers-reduced-motion; reduce/disable animations
- `escape-routes` - Provide cancel/back in modals and multi-step flows

### 2. Touch & Interaction (CRITICAL)

- `touch-target-size` - Min 44×44pt (Apple) / 48×48dp (Material)
- `touch-spacing` - Minimum 8px/8dp gap between touch targets
- `hover-vs-tap` - Use click/tap for primary interactions; don't rely on hover alone
- `loading-buttons` - Disable button during async operations; show spinner or progress
- `error-feedback` - Clear error messages near problem
- `cursor-pointer` - Add cursor-pointer to clickable elements (Web)
- `press-feedback` - Visual feedback on press (ripple/highlight)
- `haptic-feedback` - Use haptic for confirmations and important actions
- `safe-area-awareness` - Keep primary touch targets away from notch, gesture bar
- `no-precision-required` - Avoid requiring pixel-perfect taps on small icons

### 3. Performance (HIGH)

- `image-optimization` - Use WebP/AVIF, responsive images, lazy load non-critical assets
- `image-dimension` - Declare width/height to prevent layout shift (CLS)
- `font-loading` - Use font-display: swap/optional to avoid invisible text
- `lazy-loading` - Lazy load non-hero components via dynamic import
- `bundle-splitting` - Split code by route/feature to reduce initial load
- `virtualize-lists` - Virtualize lists with 50+ items
- `main-thread-budget` - Keep per-frame work under ~16ms for 60fps

### 4. Style Selection (HIGH)

**Garage Go Recommended Style:**
- **Primary Style**: Modern Dashboard (clean, professional, data-heavy)
- **Secondary Style**: Glassmorphism for overlays/modals
- **Color Palette**: Professional Blue (#2563EB) + Success Green (#10B981) + Warning Amber (#F59E0B) + Error Red (#EF4444)
- **Typography**: Cairo (Arabic) + Inter (English)
- **Icons**: FontAwesome (Web) + CupertinoIcons (iOS) + MaterialIcons (Android)

### 5. Layout & Responsive (HIGH)

- `mobile-first` - Design for mobile first, then scale up
- `breakpoints` - Mobile: <768px, Tablet: 768-1024px, Desktop: >1024px
- `viewport-meta` - Include viewport meta tag
- `no-horizontal-scroll` - Never force horizontal scroll
- `flexbox-grid` - Use Flexbox/Grid for layouts, not fixed widths
- `safe-area` - Respect safe areas on mobile (notch, home indicator)

### 6. Typography & Color (MEDIUM)

**Typography Scale:**
- Base: 16px
- H1: 32px (2rem)
- H2: 24px (1.5rem)
- H3: 20px (1.25rem)
- Body: 16px (1rem)
- Small: 14px (0.875rem)
- Line-height: 1.5

**Color Tokens:**
- Primary: #2563EB (Blue)
- Secondary: #10B981 (Green)
- Warning: #F59E0B (Amber)
- Error: #EF4444 (Red)
- Background: #FFFFFF (White)
- Surface: #F3F4F6 (Light Gray)
- Text: #1F2937 (Dark Gray)
- Text-muted: #6B7280 (Medium Gray)

### 7. Animation (MEDIUM)

- `duration` - 150–300ms for standard animations
- `meaning` - Animation should convey meaning (loading, success, error)
- `spatial` - Maintain spatial continuity (elements move logically)
- `reduced-motion` - Respect prefers-reduced-motion
- `no-width-height` - Don't animate width/height (causes reflow)

### 8. Forms & Feedback (MEDIUM)

- `visible-labels` - Always use visible labels, not placeholders
- `error-near-field` - Show error messages near the problematic field
- `helper-text` - Provide helper text below inputs
- `progressive-disclosure` - Reveal complex info gradually
- `validation` - Validate on blur, not on every keystroke
- `success-feedback` - Show success message after successful action

### 9. Navigation Patterns (HIGH)

**Flutter Admin (Web/Desktop):**
- Sidebar navigation (left)
- Top bar with user profile
- Breadcrumbs for deep navigation
- Deep linking support

**Flutter Mechanic (Mobile):**
- Bottom navigation (max 5 items)
- Top app bar with back button
- Tab-based navigation for related screens
- Gesture-based navigation (swipe back)

**Customer Frontend (Web):**
- Simple single-page layout
- No complex navigation needed
- Auto-refresh for updates

### 10. Charts & Data (LOW)

- `legends` - Always include legends for charts
- `tooltips` - Show tooltips on hover/tap
- `accessible-colors` - Use color + pattern for data visualization
- `chart-types` - Use appropriate chart type for data
- `responsive-charts` - Charts should resize with container

## Garage Go Specific Guidelines

### Admin Dashboard (Flutter Web/Desktop)

**Layout:**
- Sidebar: Navigation (200px wide, collapsible)
- Main Content: 1200px max width, centered
- Cards: White background, 8px border-radius, subtle shadow
- Tables: Striped rows, hover effects, sortable columns

**Components:**
- Buttons: Primary (blue), Secondary (gray), Danger (red)
- Modals: Centered, backdrop blur, close button
- Forms: Two-column layout on desktop, single on mobile
- Status Badges: Color-coded (Green=Success, Yellow=Pending, Red=Error)

### Mechanic App (Flutter Mobile)

**Layout:**
- Bottom Navigation: 4 items max
- Cards: Full width, 16px padding
- Lists: Swipe actions for quick actions
- FAB: For primary actions (add new)

**Components:**
- Buttons: Full width, 48px height
- Inputs: 16px padding, clear labels
- Status Cards: Large, color-coded
- QR Scanner: Full screen overlay

### Customer Frontend (HTML/CSS/JS)

**Layout:**
- Single column, max-width 800px
- Cards for each section
- Sticky header with status
- Mobile-first responsive

**Components:**
- Status Badge: Top right, large
- Info Grid: 2 columns on desktop, 1 on mobile
- Service List: Vertical stack
- Invoice: Highlighted total

## Color Palettes

### Primary Palette (Professional Blue)
```
Primary: #2563EB
Primary Light: #3B82F6
Primary Dark: #1D4ED8
Primary BG: #EFF6FF
```

### Success Palette (Green)
```
Success: #10B981
Success Light: #34D399
Success Dark: #059669
Success BG: #ECFDF5
```

### Warning Palette (Amber)
```
Warning: #F59E0B
Warning Light: #FBBF24
Warning Dark: #D97706
Warning BG: #FFFBEB
```

### Error Palette (Red)
```
Error: #EF4444
Error Light: #F87171
Error Dark: #DC2626
Error BG: #FEF2F2
```

## Font Pairings

### Arabic (Primary)
- **Heading**: Cairo (Bold, 700)
- **Body**: Cairo (Regular, 400)
- **Mono**: Cairo (Regular, 400)

### English (Secondary)
- **Heading**: Inter (Bold, 700)
- **Body**: Inter (Regular, 400)
- **Mono**: JetBrains Mono (Regular, 400)

## Spacing Scale

```
xs: 4px
sm: 8px
md: 16px
lg: 24px
xl: 32px
2xl: 48px
3xl: 64px
```

## Border Radius

```
sm: 4px
md: 8px
lg: 12px
xl: 16px
full: 9999px
```

## Shadow Scale

```
sm: 0 1px 2px rgba(0,0,0,0.05)
md: 0 4px 6px rgba(0,0,0,0.1)
lg: 0 10px 15px rgba(0,0,0,0.1)
xl: 0 20px 25px rgba(0,0,0,0.15)
```

## Integration with Flutter

```dart
// lib/core/theme/app_theme.dart

import 'package:flutter/material.dart';

class AppTheme {
  static ThemeData get lightTheme {
    return ThemeData(
      // Colors
      primaryColor: const Color(0xFF2563EB),
      scaffoldBackgroundColor: const Color(0xFFF3F4F6),
      cardColor: Colors.white,

      // Typography
      fontFamily: 'Cairo',
      textTheme: const TextTheme(
        headlineLarge: TextStyle(fontSize: 32, fontWeight: FontWeight.bold),
        headlineMedium: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
        bodyLarge: TextStyle(fontSize: 16, fontWeight: FontWeight.normal),
        bodyMedium: TextStyle(fontSize: 14, fontWeight: FontWeight.normal),
      ),

      // Components
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          minimumSize: const Size(double.infinity, 48),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        ),
      ),

      cardTheme: CardTheme(
        elevation: 2,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      ),
    );
  }
}
```

## Integration with HTML/CSS

```css
/* customer_frontend/css/variables.css */

:root {
  /* Colors */
  --color-primary: #2563EB;
  --color-primary-light: #3B82F6;
  --color-primary-dark: #1D4ED8;
  --color-success: #10B981;
  --color-warning: #F59E0B;
  --color-error: #EF4444;
  --color-background: #FFFFFF;
  --color-surface: #F3F4F6;
  --color-text: #1F2937;
  --color-text-muted: #6B7280;

  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;

  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.1);
  --shadow-lg: 0 10px 15px rgba(0,0,0,0.1);
}
```

## Checklist Before Deploying UI Changes

- [ ] All interactive elements have 4.5:1 contrast ratio
- [ ] Touch targets are at least 44×44px
- [ ] Loading states are shown for async operations
- [ ] Error messages are clear and near the problem
- [ ] Forms have visible labels (not placeholders)
- [ ] Navigation is predictable and consistent
- [ ] No horizontal scroll on mobile
- [ ] Images have width/height to prevent layout shift
- [ ] Animations respect prefers-reduced-motion
- [ ] Color palette is consistent across the app
- [ ] Typography scale is followed
- [ ] Spacing scale is followed
- [ ] Border radius is consistent
- [ ] Shadows are consistent
- [ ] Charts have legends and tooltips
