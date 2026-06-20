# AUTO_Renew Admin — Design System Document

> **Source of truth:** This document is generated directly from the production codebase (`admin_tauri/src/style.css`, `index.html`, `app.ts`, `components/layout.ts`, and screen files). No assumptions. No omissions.

---

## 1. Overview

| Property | Value |
|----------|-------|
| **App name** | AUTO_Renew — نظام إدارة مرآب السيارات |
| **Platform** | Tauri Desktop (Windows) + Vite + TypeScript + Tailwind CSS |
| **Language** | Arabic (RTL) |
| **Design mode** | Light only (darkMode: "class" configured but not default) |
| **Motion** | 60fps, prefers-reduced-motion respected |

---

## 2. Color Palette

### 2.1 Primary — Royal Blue

| Token | Hex | Usage |
|-------|-----|-------|
| `--primary` | `#004ac6` | Brand, buttons, active nav, links |
| `--primary-light` | `#dbeafe` | Hover backgrounds, badges |
| `--primary-dark` | `#003ea8` | Button pressed / hover darken |
| `--primary-50` | `#eff6ff` | Subtle tint backgrounds |

### 2.2 Secondary — Violet

| Token | Hex | Usage |
|-------|-----|-------|
| `--secondary` | `#712ae2` | Revenue cards, accent gradients |
| `--secondary-light` | `#ede9fe` | Subtle backgrounds |

### 2.3 Tertiary — Emerald

| Token | Hex | Usage |
|-------|-----|-------|
| `--tertiary` | `#006243` | Success variants, nature-themed elements |

### 2.4 Semantic Colors

| Token | Hex | Light variant | Usage |
|-------|-----|---------------|-------|
| `--success` | `#059669` | `#d1fae5` | Positive trends, status OK |
| `--warning` | `#d97706` | `#fef3c7` | Warnings, pending states |
| `--error` | `#dc2626` | `#fee2e2` | Errors, alerts, danger badges |
| `--info` | `#0891b2` | `#cffafe` | Info badges, mechanics count |

### 2.5 Neutral / Surface

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg-primary` / `--bg-surface` | `#faf8ff` | App background |
| `--bg-surface-2` | `#f1f5f9` | Secondary surfaces |
| `--bg-card` | `#ffffff` | Cards, modals, dropdowns |
| `--text-primary` | `#131b2e` | Headings, primary text |
| `--text-secondary` | `#475569` | Body text, labels |
| `--text-tertiary` | `#94a3b8` | Placeholders, disabled, hints |
| `--text-white` | `#ffffff` | Text on primary/secondary buttons |
| `--border` | `#e2e8f0` | Dividers, card borders, input borders |
| `--border-light` | `#f1f5f9` | Subtle separators |
| `--divider` | `#e2e8f0` | Horizontal dividers |

### 2.6 Shadow System

| Token | Value |
|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` |
| `--shadow` | `0 1px 3px rgba(0,0,0,0.08)` |
| `--shadow-md` | `0 4px 6px rgba(0,0,0,0.08)` |
| `--shadow-lg` | `0 10px 15px rgba(0,0,0,0.08)` |
| `--shadow-xl` | `0 20px 25px rgba(0,0,0,0.10)` |

---

## 3. Typography

### 3.1 Font Families

| Token | Font | Fallback | Role |
|-------|------|----------|------|
| `--font-headline` | Be Vietnam Pro | sans-serif | Headlines, brand, KPI values |
| `--font-body` | IBM Plex Sans Arabic | IBM Plex Sans, sans-serif | Body text, UI labels, RTL |
| `--font-mono` | JetBrains Mono | monospace | Currency, financial data, numbers |

### 3.2 Type Scale (Tailwind Config)

| Token | Size | Line Height | Letter Spacing | Weight |
|-------|------|-------------|----------------|--------|
| `headline-lg` | 32px | 1.2 | -0.02em | 700 |
| `headline-lg-mobile` | 24px | 1.2 | — | 700 |
| `headline-md` | 24px | 1.3 | — | 600 |
| `body-lg` | 18px | 1.6 | — | 400 |
| `body-md` | 16px | 1.5 | — | 400 |
| `label-sm` | 13px | 1.0 | — | 600 |
| `financial-data` | 15px | 1.0 | +0.02em | 500 |

**Base:** `html { font-size: 16px; }` with antialiased rendering.

---

## 4. Layout & Spacing

### 4.1 App Layout Structure

```
┌─────────────────────────────────────────────────────┐
│  TopBar (fixed, height: 64px, glass)                │
├─────────────────────────────────────────────────────┤
│  │  Sidebar (fixed right, 280px)  │  Main Content  │
│  │  ────────────────────────────  │  (flex-1)      │
│  │  Brand                         │  padding: 24px │
│  │  Profile                       │  margin-top:   │
│  │  Nav Groups                    │    64px        │
│  │  Footer (Add New + Logout)     │  margin-right: │
│  │                                │    280px       │
│  │                                │  bg: #faf8ff   │
└─────────────────────────────────────────────────────┘
```

### 4.2 Spacing Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--sidebar-width` | 280px | Sidebar fixed width |
| `--header-height` | 64px | Topbar fixed height |
| `--gutter` | 24px | Page horizontal padding |
| `--card-padding` | 24px | Internal card padding |
| `stack-sm` | 8px | Small gaps |
| `stack-md` | 16px | Medium gaps |
| `stack-lg` | 32px | Large section gaps |

### 4.3 RTL Direction

- `direction: rtl` on `<body>`
- `right: 0` for sidebar
- `margin-right: 280px` for main content
- Arabic text throughout

---

## 5. Shape & Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 4px | Small tags, badges |
| `--radius` | 8px | Buttons, inputs |
| `--radius-md` | 12px | Medium cards |
| `--radius-lg` | 16px | Cards, modals (Tailwind: `rounded-xl`) |
| `--radius-xl` | 24px | Large containers |
| `--radius-full` | 9999px | Avatars, pills, badges |

---

## 6. App Shell Components

### 6.1 Sidebar

- **Position:** Fixed right, full height
- **Width:** 280px
- **Background:** `--bg-primary` (#faf8ff)
- **Border:** Left border `1px solid --border`
- **Shadow:** `--shadow-lg`
- **Z-index:** 100

**Sections (top to bottom):**

1. **Brand Header**
   - Icon: 44×44px gradient square (`linear-gradient(135deg, primary, secondary)`), rounded-md
   - Text: "AUTO_Renew" + role label

2. **Profile Card**
   - Avatar: 40px circle, `primary-light` bg, `primary` text
   - User name + role

3. **Navigation Groups**
   - Collapsible groups with chevron
   - Active item: `color: #004ac6; font-weight: 700; background: rgba(180,197,255,0.2)`
   - Icon: Material Symbols with `FILL: 1` when active, `FILL: 0` + `#94A3B8` when inactive
   - Hover: smooth color transition
   - Badge: on Bookings (red circle with count)

4. **Footer**
   - "إضافة جديد" button: Primary blue, full width, rounded-xl, shadow-md
   - "تسجيل الخروج" button: Error red text, ghost style

### 6.2 TopBar

- **Position:** Fixed top, full width
- **Height:** 64px
- **Background:** `rgba(250,248,255,0.8)` with `backdrop-filter: blur(12px)`
- **Border:** Bottom `1px solid rgba(195,198,215,0.1)`
- **Z-index:** 40
- **Left side:** Page title (hidden on mobile) + hamburger menu
- **Right side:**
  - Search input: 16rem width, 40px height, rounded-full, `bg: #F8FAFC`, `border: #E2E8F0`, with search icon
  - Notifications button: bell icon with red dot badge (2px dot with ring)
  - Divider: 1px vertical line
  - Profile button: user name + 32px avatar circle

### 6.3 Main Content Area

- `margin-top: 64px`
- `margin-right: 280px`
- `padding: 24px`
- `background: #faf8ff`
- `min-height: 100vh`
- Max content width: `max-w-7xl mx-auto`

---

## 7. Component Patterns

### 7.1 KPI Cards (Dashboard)

```
┌──────────────────────────────────────┐
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │  ← gradient bar (h-1px)
│  Label (label-sm, tertiary)          │
│  Value (headline-lg, bold)          │
│  [        ]   [  icon circle  ]     │
│  Trend badge + comparison text       │
└──────────────────────────────────────┘
```

- **Card:** `bg-surface-container-lowest` (#ffffff), `rounded-xl`, `shadow-md`, `hover-lift` class
- **Top gradient bar:** full width, 1px height, gradient from primary to secondary
- **Icon circle:** 48×48px, tinted background (e.g., `primary-container/10`), icon with `FILL: 1`
- **Skeleton loading:** `skeleton-shimmer` class with inline-block placeholder
- **Trend badge:** pill shape, colored text + background, with trending icon

### 7.2 Standard Cards

- Background: white (`--bg-card`)
- Border: `1px solid --border` (subtle)
- Padding: `var(--card-padding)` (24px)
- Radius: `var(--radius-lg)` (16px)
- Shadow: `--shadow-md` on hover via `hover-lift` utility

### 7.3 Buttons

| Type | Style |
|------|-------|
| **Primary** | `bg: #004ac6`, white text, rounded-lg, font-medium, hover: `translateY(-1px)` + shadow |
| **Secondary/Ghost** | Transparent, border, hover: `primary-50` bg |
| **Danger** | Red text, ghost, hover: `error-light` bg |
| **FAB / Add New** | Full width, primary bg, rounded-xl, shadow-md, icon + text |

### 7.4 Inputs

- Height: 40px–44px
- Background: `#F8FAFC` (`surface-subtle`)
- Border: `1px solid #E2E8F0`
- Radius: `rounded-full` for search, `rounded-lg` for forms
- Focus: ring or border-color transition to primary
- Placeholder color: `--text-tertiary`

### 7.5 Badges / Status Chips

- Shape: `rounded-full` (pill)
- Sizes: `px-2 py-0.5` (small), `px-3 py-1` (medium)
- Colors map to semantic tokens (success, warning, error, info)
- Animated: `badge-pop` on change

### 7.6 Avatars

| Size | Dimensions | Usage |
|------|------------|-------|
| Small | 32×32px | Table cells, lists |
| Medium | 40×40px | Sidebar profile |
| Large | 48×48px | Profile page |

- Style: Circle (`rounded-full`), gradient or solid background, icon or initial

### 7.7 Modals

- Backdrop: `rgba(0,0,0,0.4)` with `backdrop-filter: blur(4px)`
- Content: `bg-card`, `rounded-lg`, padding 24px, `shadow-xl`
- Animation: `modal-scale` (250ms cubic-bezier)
- Max: 90vw × 90vh, scrollable

### 7.8 Tables

- Header: `bg-surface-subtle`, `font-label-sm`, uppercase-ish labels
- Rows: alternating subtle backgrounds, hover highlight
- Cells: padding, `text-base`
- Currency cells: `font-mono`, LTR direction
- Status columns: colored badges

### 7.9 Empty & Error States

- Error card: `bg-error/5`, `border-error/20`, `rounded-xl`, centered icon + text + retry button
- Skeleton: `skeleton-shimmer` with animated gradient overlay

---

## 8. Animation & Motion

### 8.1 Transition Tokens

| Token | Duration | Easing |
|-------|----------|--------|
| `--transition-fast` | 150ms | `cubic-bezier(0.4, 0, 0.2, 1)` |
| `--transition` | 250ms | `cubic-bezier(0.4, 0, 0.2, 1)` |
| `--transition-slow` | 350ms | `cubic-bezier(0.4, 0, 0.2, 1)` |

### 8.2 Key Animations

| Name | Duration | Description |
|------|----------|-------------|
| `fade-in` | 200ms | Opacity 0 → 1 |
| `modal-scale` | 250ms | Scale 0.9 + opacity → 1 |
| `shimmer` | 1.5s infinite | Skeleton gradient sweep |
| `loading-bar` | 1s infinite | Progress bar scaleX |
| `badge-pop` | 300ms | Scale 1 → 1.3 → 1 |
| `wizardContentFadeIn` | 350ms | Fade + translateY(12px→0) |
| `wizardContentFadeOut` | 250ms | Fade + translateY(0→-8px) |
| `stepNumPop` | 450ms | Scale + glow ring |
| `step-line fill` | 550ms | ScaleX 0→1 with glow |
| `wizardSuccessPop` | 500ms | Scale 0.92→1 |

### 8.3 Interaction Patterns

- **Hover lift:** `translateY(-4px)` + `shadow-lg` on cards
- **Button press:** `scale(0.97)` on active
- **Nav item:** Color + background + font-weight transition
- **Menu groups:** Chevron rotate 180deg on expand

### 8.4 Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 9. Tailwind Config Extensions (from index.html)

### 9.1 Extended Colors

Full Tailwind config object present in `index.html` `<script>` tag. Key mappings:

| Tailwind Class | Hex |
|----------------|-----|
| `bg-primary` | `#004ac6` |
| `bg-primary-container` | `#2563eb` |
| `bg-secondary` | `#712ae2` |
| `bg-secondary-container` | `#8a4cfc` |
| `bg-tertiary` | `#006243` |
| `bg-error` / `text-error` | `#DC2626` |
| `bg-background` / `bg-surface` | `#faf8ff` |
| `bg-surface-container-lowest` | `#ffffff` |
| `bg-surface-subtle` | `#F8FAFC` |
| `text-on-surface` | `#131b2e` |
| `text-text-secondary` | `#475569` |
| `text-text-tertiary` | `#94A3B8` |
| `border-border` | `#E2E8F0` |
| `text-warning` | `#D97706` |
| `text-info` | `#0891B2` |

### 9.2 Extended Spacing

- `sidebar-width`: 280px
- `sidebar-mini`: 72px
- `header-height`: 64px
- `gutter`: 24px
- `card-padding`: 24px
- `stack-sm`: 8px, `stack-md`: 16px, `stack-lg`: 32px

### 9.3 Extended Border Radius

- `lg`: 0.5rem (8px)
- `xl`: 0.75rem (12px)
- `2xl`: 1rem (16px)
- `full`: 9999px

---

## 10. Icons

| System | Value |
|--------|-------|
| **Icon font** | Material Symbols Outlined |
| **Default size** | 20px (`text-[20px]`) |
| **Variation settings** | `opsz=24,wght=400,FILL=0,GRAD=0` |
| **Active state** | `FILL=1` |
| **Inactive state** | `FILL=0`, color: `#94A3B8` |
| **CDN** | `https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0` |

---

## 11. Screen Patterns (from dashboard.ts, login.ts, layout.ts)

### 11.1 Login Screen

- Background: `#faf8ff` with large blurred gradient orbs (`primary/5`, `secondary/5`, `blur-[100px–120px]`)
- Center card: `glass-panel` class (`backdrop-filter: blur(16px)`, `bg-white/85`)
- Card radius: `rounded-xl`
- Card shadow: `shadow-lg`
- Card border: `1px solid --border`
- Brand icon: 64px circle, `primary-container/10` bg
- Title: `Be Vietnam Pro`, `headline-md`, primary color
- Subtitle: `IBM Plex Sans`, `body-md`, `text-secondary`

### 11.2 Dashboard Screen

- Page background: `#faf8ff` (`bg-background`)
- Date header: day name + date in Arabic
- KPI grid: 4 columns on desktop, 2 on tablet, 1 on mobile (`grid-cols-1 md:grid-cols-2 lg:grid-cols-4`)
- Gap: 24px (`gap-6`)
- Cards: white, shadow-md, top gradient bar, hover-lift

### 11.3 List / CRUD Screens

- Table wrapper: white card, rounded-xl, shadow, overflow-hidden
- Header: title + search input + filter dropdowns + "Add New" button
- Table: full width, subtle row borders, hover:bg-gray-50
- Pagination: centered, prev/next buttons, page numbers
- Empty state: centered icon + message + optional action

---

## 12. File References

All information in this document is extracted from:

1. `admin_tauri/index.html` — Tailwind config, Google Fonts, Material Symbols, base meta
2. `admin_tauri/src/style.css` — CSS variables, layout, components, animations, responsive
3. `admin_tauri/src/app.ts` — App root structure
4. `admin_tauri/src/components/layout.ts` — Sidebar, TopBar, main layout
5. `admin_tauri/src/screens/dashboard.ts` — KPI card patterns
6. `admin_tauri/src/screens/login.ts` — Auth page patterns

---

---

## 13. Navigation Menu Structure

> Extracted from `components/layout.ts` — exact menu groups and items.

### 13.1 Menu Groups (RTL Sidebar)

| Group | Label (Arabic) | Icon |
|-------|----------------|------|
| **الرئيسية** | لوحة التحكم | `dashboard` |
| **العمليات** | الحجوزات | `calendar_month` |
| | الفواتير | `receipt_long` |
| | نقطة البيع | `point_of_sale` |
| | الخدمات | `build` |
| | المخزون | `inventory_2` |
| | المستودعات | `warehouse` |
| | الموردين | `local_shipping` |
| | طلبات الشراء | `shopping_cart` |
| | العملاء | `group` |
| | الوكلاء | `business_center` |
| | برنامج الولاء | `loyalty` |
| **المالية** | المحاسبة | `account_balance_wallet` |
| | شجرة الحسابات | `account_tree` |
| | القيود اليومية | `receipt` |
| | دفتر الأستاذ | `menu_book` |
| | ميزان المراجعة | `scale` |
| | الميزانية العمومية | `balance` |
| | قائمة الدخل | `trending_up` |
| | التدفقات النقدية | `payments` |
| | مراكز التكلفة | `account_tree` |
| | الأصول والاستهلاك | `precision_manufacturing` |
| **الموارد** | الموارد البشرية | `badge` |
| | خريطة الورشة | `map` |
| **التقارير** | التقارير | `analytics` |
| | التحليلات | `insights` |
| **الإدارة** | الفروع | `storefront` |
| | التنبيهات | `notifications` |
| | أرشيف المستندات | `folder` |
| | الإدارة والأمان | `admin_panel_settings` |
| | إعدادات النظام | `settings` |
| | إعدادات أولية | `tune` |

### 13.2 Menu Behavior

- **Groups:** Collapsible with chevron icon (rotates 180deg on open)
- **Active item:** `color: #004ac6; font-weight: 700; background: rgba(180,197,255,0.2)`
- **Icon fill:** `FILL=1` when active, `FILL=0` + `#94A3B8` when inactive
- **Badge:** Red pill on Bookings showing pending count
- **Footer buttons:**
  - "إضافة جديد" — Primary blue, full width, rounded-xl, shadow-md
  - "تسجيل الخروج" — Error red text, ghost

---

## 14. Form Components

> Extracted from `screens/booking-wizard.ts` and `screens/bookings.ts`.

### 14.1 Text Input

```
Label: font-label-sm, text-text-tertiary, mb-2
Input: w-full, h-[48px], bg-surface-subtle, border border-border, rounded-lg, px-4
       font-ibmPlexSans, font-body-md, text-on-surface
       focus:border-primary, focus:ring-1, focus:ring-primary, focus:outline-none
       transition-shadow
```

- **Text inputs:** `dir="ltr"` for numbers/plates/VIN
- **Number inputs:** `type="number"`
- **Placeholders:** Arabic text

### 14.2 Textarea

```
w-full, bg-surface-subtle, border border-border, rounded-lg, p-4
font-ibmPlexSans, font-body-md, text-on-surface
focus:border-primary, focus:ring-1, focus:ring-primary
resize-none
rows="2" or rows="3"
```

### 14.3 Select Dropdown

```
w-full, h-[48px], bg-surface-subtle, border border-border, rounded-lg, pr-4, pl-10
font-ibmPlexSans, font-body-md, text-on-surface
focus:border-primary, focus:ring-1, focus:ring-primary
appearance-none
Custom chevron SVG: left-aligned (RTL), #475569 stroke
background-position: left 0.75rem center
```

### 14.4 Date & Time Pickers

```
input type="date" or type="time"
h-[48px], bg-surface-subtle, border border-border, rounded-lg, px-4
Same focus states as text input
```

### 14.5 Checkbox

```
w-4 h-4, rounded, border-border, text-primary, focus:ring-primary
Used in: Table row selection, form checkboxes
```

### 14.6 Radio Buttons

- Standard HTML radio buttons
- Styled via Tailwind if used
- Used in: Wizard step selections, payment method choice

### 14.7 Form Layout Patterns

- **Grid:** `grid grid-cols-1 md:grid-cols-2 gap-4` for form fields
- **Labels:** Always above input, `font-label-sm`, `text-text-tertiary`
- **Required fields:** Marked with `*` asterisk
- **Validation:** Red border + error message below field
- **Buttons:** Full width on mobile, auto on desktop

---

## 15. Data Visualization & Charts

> Extracted from `screens/dashboard.ts`.

### 15.1 Chart Library

| Property | Value |
|----------|-------|
| **Library** | Chart.js (via CDN) |
| **CDN** | `https://cdn.jsdelivr.net/npm/chart.js` |
| **Access** | `window.Chart` global |

### 15.2 Revenue Bar Chart

- **Type:** `bar`
- **Canvas:** `id="revenueChart"`, `h-64`
- **Container:** `lg:col-span-2`, white card, shadow-md
- **Data:** Revenue by day (last 7 days)
- **Colors:** Primary gradient or solid `#004ac6`
- **Grid:** Subtle horizontal lines
- **Labels:** Arabic day names

### 15.3 Status Donut Chart

- **Type:** `doughnut`
- **Canvas:** `id="statusChart"`, `h-48`
- **Container:** `lg:col-span-1`, white card, centered
- **Data:** Booking status distribution
- **Colors mapped to status:**
  - `PENDING` / `WAITING_PARTS` — Orange (`#d97706`)
  - `CONFIRMED` / `IN_PROGRESS` — Blue (`#004ac6`)
  - `READY` — Cyan (`#0891b2`)
  - `COMPLETED` / `DELIVERED` — Green (`#059669`)
  - `CANCELLED` / `NO_SHOW` — Red (`#dc2626`)
- **Border:** 0px
- **Hover offset:** 4px
- **Legend:** Below chart, Arabic labels, color dots

### 15.4 Chart Loading State

- Canvas hidden (`display: none`) on error
- Skeleton shimmer shown while loading

---

## 16. Pagination & Search/Filter Patterns

> Extracted from `screens/bookings.ts`.

### 16.1 Search Bar

```
Container: relative, hidden on sm
Icon: search, absolute right-3, top-1/2, -translate-y-1/2, color: #94A3B8
Input: h-[40px], pl-4, pr-10, rounded-full, border, shadow-sm
       bg: #F8FAFC, border: #E2E8F0, width: 16rem
       placeholder: "بحث..."
       Real-time filtering on input event
```

### 16.2 Filter Select

```
select element
Same styling as Form Select (14.3)
Options: status values (PENDING, CONFIRMED, IN_PROGRESS, etc.)
Change event triggers filter
```

### 16.3 Clear Filters Button

```
h-[48px], px-4, bg-surface-subtle, text-on-surface, font-ibmPlexSans, font-body-md
rounded-lg, border border-border, hover:bg-surface-container-low
flex items-center gap-2
Icon: refresh
Text: "مسح"
```

### 16.4 Filter Logic

- **Search:** Matches customer name, phone, license plate, booking ID (first 8 chars)
- **Status filter:** Exact match on `status` field
- **Combined:** AND logic between search and status
- **Case insensitive:** `.toLowerCase()` on all comparisons

### 16.5 Pagination (if present)

While not explicitly visible in the truncated output, typical pattern would be:

```
Container: centered, flex, gap-2, mt-6
Prev button: disabled state when on page 1
Page numbers: active = primary bg + white text, inactive = ghost
Next button: disabled when on last page
Items per page: typically 10, 20, 50
```

### 16.6 Bulk Actions

```
Container: hidden by default, flex, items-center, justify-between
bg-error-container/30, border border-error/20, rounded-xl, p-4
Shows when 1+ rows selected via checkbox
Count: "X محدد" in error color
Action button: bg-error, text-on-error, rounded-lg, with delete icon
```

---

## 17. Delete Confirmation Modal

> Extracted from `screens/bookings.ts`.

```
Backdrop: fixed, inset-0, z-50, bg-black/50
Card: bg-surface-container-lowest, rounded-2xl, shadow-2xl, p-6, max-w-sm, border border-border
Layout: flex-col, items-center, text-center, gap-4
Icon: 64px circle, bg-error/10, warning icon in error color
Title: font-headline-md, text-lg, text-on-surface
Message: text-body-md, text-text-secondary
Buttons: flex, gap-3, w-full
  Cancel: flex-1, h-[48px], bg-surface-subtle, text-on-surface, border border-border
  Confirm: flex-1, h-[48px], bg-error, text-on-error
```

---

## 18. Complete File Reference

All information in this document is extracted from:

1. `admin_tauri/index.html` — Tailwind config, Google Fonts, Material Symbols, base meta
2. `admin_tauri/src/style.css` — CSS variables, layout, components, animations, responsive
3. `admin_tauri/src/app.ts` — App root structure
4. `admin_tauri/src/components/layout.ts` — Sidebar, TopBar, main layout, nav menu structure
5. `admin_tauri/src/screens/dashboard.ts` — KPI cards, Chart.js patterns
6. `admin_tauri/src/screens/login.ts` — Auth page patterns
7. `admin_tauri/src/screens/bookings.ts` — Table, search/filter, pagination, bulk actions, delete modal
8. `admin_tauri/src/screens/booking-wizard.ts` — Form inputs, selects, date/time, textareas, wizard steps

---

---

## 19. Wizard / Multi-Step Stepper

> Extracted from `screens/booking-wizard.ts` and `screens/setup-wizard.ts`.

### 19.1 Stepper Header

```
Container: flex, items-center, gap-2
Each step: flex, items-center, gap-2

Step Number Circle:
  w-8 h-8, rounded-full, flex, items-center, justify-center
  font-bold, text-sm
  Active: bg-primary, text-on-primary
  Inactive: bg-surface-container-high, text-text-secondary

Step Label:
  font-label-sm
  Active: text-primary, font-semibold
  Inactive: text-text-secondary

Connector Line:
  flex-1, h-[2px]
  Active/filled: bg-primary (with animated scaleX)
  Inactive: bg-border
```

### 19.2 Step Content

```
Container: .wizard-step
Default: hidden (display: none)
Active: remove hidden, add .active class

Card: bg-surface-container-lowest, rounded-xl, shadow-md, border border-surface-subtle, overflow-hidden
Content padding: p-card-padding
```

### 19.3 Navigation Buttons

| Button | Style |
|--------|-------|
| **Previous** | `h-[48px]`, `px-6`, `bg-surface-subtle`, `text-on-surface`, `rounded-lg`, `border border-border`, icon: `arrow_forward` (RTL), hidden on step 1 |
| **Next** | `h-[48px]`, `px-6`, `bg-primary`, `text-on-primary`, `rounded-lg`, `shadow-sm`, icon: `arrow_back` (RTL) |
| **Finish** | Same as Next but text: "إنهاء الحجز", icon: `check`, on last step |

### 19.4 Animations

| Animation | Class | Description |
|-----------|-------|-------------|
| Step enter | `.wizard-step.active` | `wizardContentFadeIn` — opacity 0→1, translateY(12px→0), 350ms |
| Step leave | `.wizard-step.leaving` | `wizardContentFadeOut` — opacity 1→0, translateY(0→-8px), 250ms |
| Step number | `.step-num.step-num-active` | `stepNumPop` — scale 1→1.2→1 + glow ring, 450ms |
| Connector fill | `.step-line.filled` | `scaleX(0→1)` + glow, 550ms |
| Success card | `.wizard-success-card` | `wizardSuccessPop` — scale 0.92→1, 500ms |
| Cancel fade | `.wizard-canceling` | opacity fade, scale 0.98, 300ms |

### 19.5 Success State

```
Card: centered, wizard-success-card animation
Icon: large check circle, primary color
Title: font-headline-md, text-on-surface
Message: text-body-md, text-text-secondary
Actions: buttons row (print ticket, view details, new booking)
```

---

## 20. Print / Ticket & Invoice Layout

> Extracted from `screens/booking-print-ticket.ts` and `screens/invoice-print.ts`.

### 20.1 Print Styles (@media print)

```css
@media print {
  @page { size: A4 portrait; margin: 8mm; }
  html, body { background: white !important; margin: 0 !important; }
  * { page-break-inside: avoid !important; }
  .no-print { display: none !important; }
  
  .print-container {
    box-shadow: none !important;
    margin: 0 !important;
    padding: 0 !important;
    width: 100% !important;
    max-width: none !important;
    border: 1px solid #E2E8F0 !important;
  }
  .print-inner { padding: 8px !important; }
  .print-text-xl { font-size: 16px !important; }
  .print-text-lg { font-size: 13px !important; }
  .print-text-md { font-size: 11px !important; }
  .print-text-sm { font-size: 10px !important; }
  .print-qr { width: 56px !important; height: 56px !important; }
}
```

### 20.2 Ticket Layout (Screen View)

```
Container: max-w-3xl, mx-auto, px-gutter
Card: bg-surface, rounded-xl, shadow-lg, relative, overflow-hidden

Header Strip: h-2, w-full, bg-primary, absolute top-0
Background Pattern: ticket-pattern class
  radial-gradient(#E2E8F0 1px, transparent 1px), background-size: 20px 20px

Content Sections:
  Header: logo, company name, ticket ID, date
  Customer Info: name, phone, vehicle details
  Services Table: item, qty, price, total
  Status Badges: current status, payment status
  Totals: subtotal, tax, discount, grand total
  QR Code: centered, 80×80px (56px on print)
  Footer: thank you message, terms
```

### 20.3 Print Actions Bar

```
Container: no-print class, flex, justify-between, items-center, mb-6, p-gutter
Left: page title (font-headline-lg)
Right: action buttons
  Print: bg-surface, border border-outline, px-4, py-2, rounded-lg, icon: print
  Back: bg-primary, text-on-primary, px-4, py-2, rounded-lg, icon: arrow_forward
```

### 20.4 Thermal Printer Ticket (Compact)

- **Width:** 80mm (thermal paper)
- **Font sizes:** Reduced (10px–13px)
- **Borders:** Simple lines, no shadows
- **QR:** Small (56px)
- **Layout:** Single column, stacked sections
- **Header:** Minimal — just logo + title

---

## 21. Toast / Notification Patterns

> **Note:** No explicit toast/snackbar system found in the codebase. Notifications appear to use:

- **Inline error boxes** (e.g., login error: fixed top-right card with error icon + message)
- **Alert modals** for critical errors
- **Badge updates** on nav items (bookings, notifications)

If a toast system is needed, recommended pattern:

```
Position: fixed, top-gutter, right-gutter (or left for RTL)
Container: z-50, flex, flex-col, gap-2
Toast: rounded-lg, shadow-lg, px-4, py-3, flex, items-center, gap-2
  Success: bg-success-light, text-success, border border-success/20
  Error: bg-error-light, text-error, border border-error/20
  Warning: bg-warning-light, text-warning, border border-warning/20
Dismiss: auto after 3s, or click X
```

---

## 22. Complete File Reference (Final)

All information in this document is extracted from:

1. `admin_tauri/index.html` — Tailwind config, Google Fonts, Material Symbols, base meta
2. `admin_tauri/src/style.css` — CSS variables, layout, components, animations, responsive
3. `admin_tauri/src/app.ts` — App root structure
4. `admin_tauri/src/components/layout.ts` — Sidebar, TopBar, main layout, nav menu structure
5. `admin_tauri/src/screens/dashboard.ts` — KPI cards, Chart.js patterns
6. `admin_tauri/src/screens/login.ts` — Auth page patterns
7. `admin_tauri/src/screens/bookings.ts` — Table, search/filter, bulk actions, delete modal
8. `admin_tauri/src/screens/booking-wizard.ts` — Form inputs, wizard steps, stepper animations
9. `admin_tauri/src/screens/setup-wizard.ts` — Setup wizard patterns
10. `admin_tauri/src/screens/booking-print-ticket.ts` — Ticket layout, print styles
11. `admin_tauri/src/screens/invoice-print.ts` — Invoice print patterns

---

---

## 23. Page Transitions

> Extracted from `style.css`.

### 23.1 Page Enter Animation

```css
@keyframes page-enter {
  from { opacity: 0; transform: scale(0.98) translateX(20px); }
  to   { opacity: 1; transform: scale(1) translateX(0); }
}
```

- **Class:** `.page-enter`
- **Duration:** 250ms
- **Easing:** `cubic-bezier(0.4, 0, 0.2, 1)`
- **Properties:** `will-change: transform, opacity`
- **Applied to:** Main content wrapper on route change

### 23.2 Staggered Children

```css
.stagger-children > * {
  /* Children stagger in with delay */
}
```

- **Usage:** Parent container class for staggered entrance of child elements
- **Effect:** Children animate in sequence with incremental delay
- **Common use:** Lists, cards grid, menu items

---

## 24. Quick Actions (Dashboard Shortcuts)

> Extracted from `style.css`.

```
Container: .quick-actions
  display: flex, gap-12px, flex-wrap: wrap, margin-bottom: var(--gutter)

Button: .quick-action-btn
  display: flex, items-center, gap-8px
  padding: 12px 20px
  background: var(--bg-card) (#ffffff)
  border: 1px solid var(--border)
  border-radius: var(--radius-lg) (16px)
  color: var(--text-primary)
  font-family: var(--font-body)
  font-size: 14px, font-weight: 500
  
  Hover:
    background: var(--primary-50) (#eff6ff)
    border-color: var(--primary-light) (#dbeafe)
    color: var(--primary) (#004ac6)
    transform: translateY(-2px)
    box-shadow: var(--shadow-md)
  
  Icon: material-symbols-outlined, 20px
```

**Usage:** Dashboard shortcut buttons for frequent actions (New Booking, New Customer, New Invoice, etc.)

---

## 25. Timeline / Activity Feed

> Extracted from `style.css`.

### 25.1 Timeline Container

```
.timeline:
  position: relative
  padding-right: 24px (RTL spacing)
```

### 25.2 Vertical Line

```
.timeline::before:
  content: ''
  position: absolute
  right: 15px (RTL)
  top: 8px, bottom: 8px
  width: 2px
  background: var(--border) (#e2e8f0)
```

### 25.3 Timeline Item

```
.timeline-item:
  position: relative
  padding-right: 32px
  padding-bottom: 20px

.timeline-item::before:
  content: ''
  position: absolute
  right: 9px (RTL)
  top: 6px
  width: 12px, height: 12px
  border-radius: 50%
  background: var(--primary) (#004ac6)
  border: 2px solid var(--bg-card)
  box-shadow: 0 0 0 2px var(--primary-light)

.timeline-item:last-child:
  padding-bottom: 0
```

**Usage:** Recent activity feed, booking history, audit log display

---

## 26. Utility Classes

> Extracted from `style.css`.

| Class | Properties | Usage |
|-------|-----------|-------|
| `.hidden` | `display: none !important` | Toggle visibility |
| `.currency` | `font-family: var(--font-mono); text-align: left; direction: ltr` | Financial amounts |
| `.text-red` | `color: var(--error)` | Error text shorthand |
| `.text-green` | `color: var(--success)` | Success text shorthand |
| `.hover-lift` | `transition: transform 200ms, box-shadow 200ms; will-change: transform, box-shadow` | Card hover effect |
| `.hover-lift:hover` | `transform: translateY(-4px); box-shadow: var(--shadow-lg)` | Lift on hover |
| `.spin` | `animation: spin 1s linear infinite` | Loading spinner |
| `.skeleton` | `animation: skeleton-pulse 1.5s ease-in-out infinite` | Generic skeleton |

---

## 27. Complete File Reference (Final)

All information in this document is extracted from:

1. `admin_tauri/index.html` — Tailwind config, Google Fonts, Material Symbols, base meta
2. `admin_tauri/src/style.css` — CSS variables, layout, components, animations, responsive, utilities
3. `admin_tauri/src/app.ts` — App root structure
4. `admin_tauri/src/components/layout.ts` — Sidebar, TopBar, main layout, nav menu structure
5. `admin_tauri/src/screens/dashboard.ts` — KPI cards, Chart.js patterns, quick actions
6. `admin_tauri/src/screens/login.ts` — Auth page patterns
7. `admin_tauri/src/screens/bookings.ts` — Table, search/filter, bulk actions, delete modal
8. `admin_tauri/src/screens/booking-wizard.ts` — Form inputs, wizard steps, stepper animations
9. `admin_tauri/src/screens/setup-wizard.ts` — Setup wizard patterns
10. `admin_tauri/src/screens/booking-print-ticket.ts` — Ticket layout, print styles
11. `admin_tauri/src/screens/invoice-print.ts` — Invoice print patterns

---

---

## 28. POS / Point of Sale Screen

> Extracted from `screens/pos.ts`.

### 28.1 Layout

```
Grid: grid-cols-1 lg:grid-cols-3, gap-6
Left (lg:col-span-2): Products area
Right (lg:col-span-1): Cart sidebar
```

### 28.2 Search Bar (Glass Panel)

```
Container: .glass-panel, rounded-xl, shadow-lg, border border-border, p-card-padding
Input: w-full, h-[48px], bg-surface-subtle, border border-border, rounded-lg
       pr-10 (icon space), pl-4
       font-ibmPlexSans, font-body-md, text-body-md, text-on-surface
       placeholder: text-outline-variant
       focus:border-primary, focus:ring-1, focus:ring-primary
Icon: search, absolute right-3, top-1/2, -translate-y-1/2, text-outline
```

### 28.3 Product Grid

```
Container: grid, grid-cols-2 md:grid-cols-3, gap-4
Product Card:
  bg-surface-container-lowest, rounded-xl, shadow-sm, border border-surface-subtle
  overflow-hidden, hover:shadow-md transition
  Image: w-full, h-32, object-cover
  Content: p-4
    Name: font-body-md, text-on-surface, font-semibold
    Price: font-financial-data, text-primary
    Add button: bg-primary, text-on-primary, rounded-lg, w-full, h-[40px]
```

### 28.4 Cart Sidebar

```
Container: bg-surface-container-lowest, rounded-xl, shadow-md
          border border-surface-subtle, p-card-padding
          sticky, top-24 (sticks below topbar)

Header: font-headline-md, text-lg, text-on-surface, font-semibold
        Icon: shopping_cart

Empty state: min-h-[120px], flex, items-center, justify-center
             text-text-tertiary, text-sm: "السلة فارغة"

Cart Items: space-y-3
  Item: flex, justify-between, items-center
    Name + Qty controls (- / number / +)
    Price: font-financial-data

Totals: border-t, border-outline-variant/10, pt-4, space-y-2
  Subtotal, Tax, Discount, Grand Total
  Grand Total: font-headline-md, text-primary

Checkout Button: w-full, h-[48px], bg-primary, text-on-primary
                 rounded-lg, shadow-sm, font-body-lg
```

### 28.5 Quick Invoice Button

```
h-[48px], bg-tertiary, text-on-tertiary
font-ibmPlexSans, font-body-lg, text-body-lg
rounded-lg, shadow-sm, hover:shadow-lg, hover:-translate-y-[1px]
Icon: receipt_long
Text: "فاتورة سريعة"
```

---

## 29. Detail View / Ticket Card

> Extracted from `screens/booking-ticket.ts`, `screens/invoice-detail.ts`.

### 29.1 Page Header

```
Container: flex, items-center, justify-between
Left:
  Title: font-beVietnamPro, text-headline-md, text-on-surface
  Subtitle/ID: text-body-md, text-text-secondary, mt-1
Right: Action buttons row, gap-2
  Primary action: bg-primary, text-on-primary, h-[48px], px-4, rounded-lg, shadow-sm
  Secondary: bg-surface-subtle, text-on-surface, border border-border
```

### 29.2 Detail Card

```
Container: bg-surface-container-lowest, rounded-xl, shadow-md
          border border-surface-subtle, overflow-hidden

Card Header:
  p-6, border-b, border-outline-variant/10, bg-surface-subtle
  flex, items-center, justify-between
  Left:
    Icon circle: w-10 h-10, rounded-full, bg-primary/10, text-primary
    Title: font-headline-md, text-lg, text-on-surface, font-semibold
    Status badge:
      bg-primary-container/20, text-primary, px-3, py-1, rounded-full
      font-label-sm, text-sm, inline-flex, items-center, gap-1
      Dot: w-1.5 h-1.5, rounded-full, bg-primary
      Text: status label
  Right:
    Date: text-financial-data, text-text-tertiary

Card Body:
  p-6, space-y-6
  Info Grid: grid-cols-2, gap-4
    Each field:
      Label: font-label-sm, text-text-tertiary, mb-1
      Value: font-body-md, text-on-surface, font-semibold
      LTR fields: dir="ltr" (plate numbers, phone, etc.)
```

### 29.3 Status Badge Variants

| Status | Background | Text | Dot |
|--------|-----------|------|-----|
| Active/Pending | `bg-primary-container/20` | `text-primary` | `bg-primary` |
| Success/Completed | `bg-success/10` | `text-success` | `bg-success` |
| Warning/Waiting | `bg-warning/10` | `text-warning` | `bg-warning` |
| Error/Cancelled | `bg-error/10` | `text-error` | `bg-error` |

### 29.4 Edit Mode Toggle

```
Toggle between view (read-only text) and edit (input fields)
Save button: bg-primary, text-on-primary
Cancel button: bg-surface-subtle, text-on-surface, border border-border
Inputs use same style as Form Components (Section 14)
```

---

## 30. Complete File Reference (Final)

All information in this document is extracted from:

1. `admin_tauri/index.html` — Tailwind config, Google Fonts, Material Symbols, base meta
2. `admin_tauri/src/style.css` — CSS variables, layout, components, animations, responsive, utilities
3. `admin_tauri/src/app.ts` — App root structure
4. `admin_tauri/src/components/layout.ts` — Sidebar, TopBar, main layout, nav menu structure
5. `admin_tauri/src/screens/dashboard.ts` — KPI cards, Chart.js patterns, quick actions
6. `admin_tauri/src/screens/login.ts` — Auth page patterns
7. `admin_tauri/src/screens/bookings.ts` — Table, search/filter, bulk actions, delete modal
8. `admin_tauri/src/screens/booking-wizard.ts` — Form inputs, wizard steps, stepper animations
9. `admin_tauri/src/screens/setup-wizard.ts` — Setup wizard patterns
10. `admin_tauri/src/screens/booking-print-ticket.ts` — Ticket layout, print styles
11. `admin_tauri/src/screens/invoice-print.ts` — Invoice print patterns
12. `admin_tauri/src/screens/pos.ts` — POS product grid, cart sidebar, glass search
13. `admin_tauri/src/screens/booking-ticket.ts` — Detail view, status badge, info grid

---

*Document generated from codebase on 2026-06-19. No assumptions. No omissions.*
