---
name: AUTO_Renew
colors:
  surface: '#faf8ff'
  surface-dim: '#d9d9e4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3fd'
  surface-container: '#ededf8'
  surface-container-high: '#e7e7f2'
  surface-container-highest: '#e2e2ec'
  on-surface: '#191b23'
  on-surface-variant: '#434654'
  inverse-surface: '#2e3038'
  inverse-on-surface: '#f0f0fb'
  outline: '#737685'
  outline-variant: '#c3c6d6'
  surface-tint: '#1b55d0'
  primary: '#003594'
  on-primary: '#ffffff'
  primary-container: '#004ac6'
  on-primary-container: '#b8c8ff'
  inverse-primary: '#b4c5ff'
  secondary: '#712ae2'
  on-secondary: '#ffffff'
  secondary-container: '#8b4bfc'
  on-secondary-container: '#fffbff'
  tertiary: '#751f00'
  on-tertiary: '#ffffff'
  tertiary-container: '#9c2e02'
  on-tertiary-container: '#ffb9a4'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#eaddff'
  secondary-fixed-dim: '#d2bbff'
  on-secondary-fixed: '#25005a'
  on-secondary-fixed-variant: '#5a00c6'
  tertiary-fixed: '#ffdbd0'
  tertiary-fixed-dim: '#ffb59e'
  on-tertiary-fixed: '#3a0b00'
  on-tertiary-fixed-variant: '#842500'
  background: '#faf8ff'
  on-background: '#191b23'
  surface-variant: '#e2e2ec'
  primary-glow: rgba(0, 74, 198, 0.5)
  secondary-light: '#ede9fe'
  bg-main: '#fcfcff'
  glass-bg: rgba(255, 255, 255, 0.7)
  glass-border: rgba(255, 255, 255, 0.4)
typography:
  headline-lg:
    fontFamily: Be Vietnam Pro
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Be Vietnam Pro
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.3'
    letterSpacing: -0.02em
  body-lg:
    fontFamily: IBM Plex Sans Arabic
    fontSize: 18px
    fontWeight: '500'
    lineHeight: '1.6'
  body-md:
    fontFamily: IBM Plex Sans Arabic
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-mono:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.4'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  container-margin: 24px
  sidebar-offset: 16px
  gutter: 20px
  card-padding: 24px
---

# AUTO_Renew "Exceptional" UI — Design System Document

> **Source of truth:** This is an evolution of the AUTO_Renew system, aiming for an "exceptional" (exceptional/extraordinary) UI/UX. It incorporates Glassmorphism, floating elements, and refined micro-interactions.

---

## 1. Overview

| Property | Value |
|----------|-------|
| **App name** | AUTO_Renew — نظام إدارة مرآب السيارات المتطور |
| **Platform** | Tauri Desktop (Windows) |
| **Language** | Arabic (RTL) |
| **Visual Style** | Modern Glassmorphism + Luxury Glow |
| **Motion** | Staggered animations, hover-lift, smooth transitions |

---

## 2. Color Palette (Enhanced)

### 2.1 Primary — Deep Royal Glow

| Token | Hex | Usage |
|-------|-----|-------|
| `--primary` | `#004ac6` | Brand, buttons, active nav |
| `--primary-glow` | `rgba(0, 74, 198, 0.5)` | Box shadows for active elements |
| `--primary-gradient` | `linear-gradient(135deg, #004ac6 0%, #712ae2 100%)` | Main buttons, KPI headers |

### 2.2 Secondary — Electric Violet

| Token | Hex | Usage |
|-------|-----|-------|
| `--secondary` | `#712ae2` | Accents, financial growth indicators |
| `--secondary-light` | `#ede9fe` | Background glows |

### 2.3 Surface & Glass

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-main` | `#fcfcff` | App background |
| `--glass-bg` | `rgba(255, 255, 255, 0.7)` | Cards, panels (with backdrop-blur) |
| `--glass-border` | `rgba(255, 255, 255, 0.4)` | Borders for glass elements |
| `--card-shadow` | `0 8px 32px 0 rgba(31, 38, 135, 0.07)` | Depth effect |

---

## 3. Typography (Refined)

- **Headlines:** `Be Vietnam Pro`, 700 weight, slightly tighter tracking (-0.02em).
- **Body:** `IBM Plex Sans Arabic`, 400-500 weight.
- **Numbers:** `JetBrains Mono`, LTR direction for currency and IDs.

---

## 4. Key Components (Exceptional Style)

### 4.1 Glass KPI Cards
- **Background:** White with 70% opacity and 12px blur.
- **Header:** 3px top border with `primary-gradient`.
- **Icon:** 56px circle, soft color tint, Material Symbols with `FILL: 1`.
- **Hover:** `translateY(-8px)` with expanded shadow.

### 4.2 Floating Sidebar
- **Style:** Detached from the screen edge with a small margin.
- **Border:** All sides rounded (24px).
- **Active Item:** Neon glow indicator (small vertical pill on the right).

### 4.3 Smart Action Button (FAB Evolution)
- **Position:** Bottom left (RTL) or context-aware.
- **Visual:** Circular, `primary-gradient`, large shadow, pulse animation.

### 4.4 Tables & Lists
- **Row:** Alternating translucent backgrounds.
- **Hover:** Slight scale and primary border on the right.

---

## 5. Exclusions
- **Strict Constraint:** NO email-related components, icons, or fields.

---
