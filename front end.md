# تقرير فحص شامل - الواجهات الأمامية (Front End)

**المشروع:** AUTO_Renew - نظام إدارة مرآب السيارات  
**التاريخ:** 20 يونيو 2026  
**المسار:** `C:\Users\FIX 11\projects\AUTO_Renew`

---

## 📋 ملخص الواجهات الأمامية المتاحة

| # | الواجهة | التقنية | الغرض | المسار |
|---|---------|---------|-------|--------|
| 1 | **Admin Tauri** | HTML5 + TypeScript + TailwindCSS + Tauri | واجهة الإدارة الرئيسية (Web/Desktop) | `admin_tauri/` |
| 2 | **Mechanic App** | Flutter Mobile | تطبيق الميكانيكي | `mechanic_app/` |
| 3 | **Customer Frontend** | HTML5 + CSS3 + Vanilla JS | تتبع الحجز للعملاء | `customer_frontend/` |

---

## 1️⃣ Admin Tauri - الواجهة الرئيسية

**المسار:** `admin_tauri/`  
**التقنيات:**
- Vite (Bundler)
- TypeScript (strict mode)
- TailwindCSS (CDN inline config)
- Tauri (Desktop wrapper)
- Chart.js (via CDN)
- Material Symbols Outlined
- Google Fonts: Be Vietnam Pro, IBM Plex Sans Arabic, JetBrains Mono

---

### 1.1 هيكل الملفات الكامل

```
admin_tauri/
├── package.json              # Dependencies: @tauri-apps/api, typescript, vite
├── tsconfig.json             # ES2020, strict mode
├── vite.config.ts            # Port 1420, proxy /api → localhost:8080
├── index.html                # Entry point, RTL, Tailwind config, Google Fonts
├── DESIGN.md                 # 1212 lines - Design System Document
├── src/
│   ├── main.ts               # 22 lines - App bootstrap, DOMContentLoaded, error boundary
│   ├── app.ts                # 44 lines - App class (ApiClient, AuthService, Router)
│   ├── router.ts             # 194 lines - Hash-based routing, 50+ routes, auth redirects
│   ├── style.css             # 2105 lines - CSS tokens, animations, glassmorphism
│   ├── vite-env.d.ts         # 1 line - Vite client types reference
│   ├── api/
│   │   └── client.ts         # 158 lines - ApiClient (GET/POST/PUT/PATCH/DELETE)
│   ├── services/
│   │   ├── auth.ts           # 87 lines - AuthService (JWT, localStorage, listeners)
│   │   └── setup-wizard.service.ts  # 81 lines - SetupWizardService, 6 step interfaces
│   ├── components/
│   │   └── layout.ts         # 267 lines - AppLayout (Sidebar + Topbar + Main)
│   └── screens/              # 52 screen files
│       ├── login.ts
│       ├── dashboard.ts
│       ├── bookings.ts
│       ├── booking-wizard.ts
│       ├── booking-ticket.ts
│       ├── booking-print-ticket.ts
│       ├── invoices.ts
│       ├── invoice-detail.ts
│       ├── manual-invoice.ts
│       ├── payment.ts
│       ├── invoice-print.ts
│       ├── pos.ts
│       ├── inventory.ts
│       ├── warehouses.ts
│       ├── suppliers.ts
│       ├── purchase-orders.ts
│       ├── branches.ts
│       ├── accounting.ts
│       ├── chart-of-accounts.ts
│       ├── journal-entries.ts
│       ├── general-ledger.ts
│       ├── trial-balance.ts
│       ├── balance-sheet.ts
│       ├── income-statement.ts
│       ├── cash-flow.ts
│       ├── customers.ts
│       ├── customer-detail.ts
│       ├── dealers.ts
│       ├── loyalty.ts
│       ├── hr.ts
│       ├── employee-form.ts
│       ├── departments.ts
│       ├── reports.ts
│       ├── revenue-report.ts
│       ├── inventory-report.ts
│       ├── customer-report.ts
│       ├── booking-report.ts
│       ├── analytics.ts
│       ├── notifications.ts
│       ├── documents.ts
│       ├── admin.ts
│       ├── users.ts
│       ├── roles.ts
│       ├── audit.ts
│       ├── settings.ts
│       ├── setup-wizard.ts
│       ├── setup-wizard-steps.ts
│       ├── system-setup.ts
│       ├── workshop-map.ts
│       ├── services.ts
│       ├── cost-centers.ts
│       └── assets.ts
├── src-tauri/
│   ├── Cargo.toml            # 22 lines - Rust package manifest (tauri v2.0.0)
│   ├── build.rs              # 4 lines - tauri_build::build()
│   ├── tauri.conf.json       # 55 lines - Window config, security, bundle
│   └── src/
│       ├── main.rs           # 7 lines - Entry point, hides console on Windows
│       └── lib.rs            # 18 lines - Tauri Builder, shell plugin, DevTools
```

---

### 1.2 Core Architecture

#### `main.ts` - 22 lines (Entry Point)
- **Line 1:** Imports `style.css` (global styles)
- **Line 2:** Imports `App` class from `./app.ts`
- **Lines 4-21:** `DOMContentLoaded` event listener:
  - Debug `console.log` on every step
  - Gets `#app` element, checks existence
  - Creates `new App()` instance
  - Calls `app.mount(appRoot)`
  - **Error boundary (line 17-19):** Catches fatal errors, renders RTL Arabic error page with red heading "خطأ في تحميل التطبيق" + `<pre>` with error message

#### `app.ts` - 44 lines (App Root Class)
- **Lines 5-9:** `App` class with 4 private fields: `router`, `auth`, `api`, `container`
- **Line 13-18:** Constructor:
  - `baseUrl` hardcoded to `'http://178.105.209.59'`
  - Creates `ApiClient(baseUrl)` → `AuthService(api)` → `Router(auth, api)`
  - Debug logs at start and end of constructor
- **Lines 21-42:** `mount(container)` method:
  - Sets `this.container`
  - Injects HTML: `<div id="app-root"><div id="router-view"></div></div>`
  - Gets `#router-view` element, checks existence
  - Calls `this.router.init(routerView)`
  - Error handling with debug logs for router init failures

#### `router.ts` - 194 lines (Hash-Based SPA Router)
- **Lines 1-53:** 53 import statements — every screen class imported individually (no barrel exports)
- **Lines 54-58:** `Router` class fields: `container`, `auth`, `api`, `currentPath`
- **Lines 60-63:** Constructor injects `AuthService` and `ApiClient`
- **Lines 65-79:** `init(container)`:
  - Gets initial hash from `window.location.hash.slice(1)` (defaults to `/`)
  - Normalizes path (adds leading `/` if missing)
  - Calls `this.navigate(hash, true)` for initial route
  - Registers `hashchange` listener with same normalization logic
  - Debug logs on every step
- **Lines 81-112:** `navigate(path, fromHashChange)`:
  - Normalizes path (adds leading `/`)
  - Prevents duplicate navigation (line 85)
  - **Auth guards (lines 88-98):**
    - Not authenticated + not `/login` → redirect to `/login`
    - Authenticated + `/login` → redirect to `/`
  - Updates `window.location.hash` if not from hashchange (lines 101-107)
  - Clears container, creates screen, appends rendered element
- **Lines 114-188:** `createScreen(path)` — massive switch statement:
  - **Exact matches (lines 116-170):** 40+ static routes
  - **Dynamic routes (lines 172-185):**
    - `/bookings/ticket/:id` → `BookingTicketScreen`
    - `/bookings/print/:id` → `BookingPrintTicketScreen`
    - `/invoices/print/:id` → `InvoicePrintScreen`
    - `/invoices/:id` → `InvoiceDetailScreen` (must be after `/invoices/print/`)
    - `/payments/new?invoiceId=` → `PaymentScreen` (parses query string from hash)
    - `/hr/employees/:id` → `EmployeeFormScreen` (edit mode)
    - `/customers/:id` → `CustomerDetailScreen`
    - `/dealers/:id` → `DealersScreen` (falls back to list)
  - **Fallback (line 187):** `DashboardScreen`
- **Lines 191-193:** `Screen` interface: single `render()` method returning `HTMLElement`

**All Routes Table:**
| Route | Screen | Type |
|-------|--------|------|
| `/login` | LoginScreen | static |
| `/dashboard` | DashboardScreen | static |
| `/bookings` | BookingsScreen | static |
| `/bookings/new` | BookingWizardScreen ('new') | static |
| `/bookings/existing` | BookingWizardScreen ('registered') | static |
| `/bookings/ticket/:id` | BookingTicketScreen | dynamic |
| `/bookings/print/:id` | BookingPrintTicketScreen | dynamic |
| `/invoices` | InvoicesScreen | static |
| `/invoices/new?type=...` | ManualInvoiceScreen | static + query |
| `/invoices/print/:id` | InvoicePrintScreen | dynamic |
| `/invoices/:id` | InvoiceDetailScreen | dynamic |
| `/pos` | PosScreen | static |
| `/inventory` | InventoryScreen | static |
| `/inventory/warehouses` | WarehousesScreen | static |
| `/inventory/suppliers` | SuppliersScreen | static |
| `/inventory/purchase-orders` | PurchaseOrdersScreen | static |
| `/branches` | BranchesScreen | static |
| `/accounting` | AccountingScreen | static |
| `/accounting/chart-of-accounts` | ChartOfAccountsScreen | static |
| `/accounting/journal-entries` | JournalEntriesScreen | static |
| `/accounting/general-ledger` | GeneralLedgerScreen | static |
| `/accounting/trial-balance` | TrialBalanceScreen | static |
| `/accounting/balance-sheet` | BalanceSheetScreen | static |
| `/accounting/income-statement` | IncomeStatementScreen | static |
| `/accounting/cash-flow` | CashFlowScreen | static |
| `/customers` | CustomersScreen | static |
| `/dealers` | DealersScreen | static |
| `/loyalty` | LoyaltyScreen | static |
| `/hr` | HrScreen | static |
| `/hr/employees/new` | EmployeeFormScreen (null) | static |
| `/departments` | DepartmentsScreen | static |
| `/reports` | ReportsScreen | static |
| `/reports/revenue` | RevenueReportScreen | static |
| `/reports/inventory` | InventoryReportScreen | static |
| `/reports/customers` | CustomerReportScreen | static |
| `/reports/bookings` | BookingReportScreen | static |
| `/analytics` | AnalyticsScreen | static |
| `/notifications` | NotificationsScreen | static |
| `/documents` | DocumentsScreen | static |
| `/admin` | AdminScreen | static |
| `/admin/users` | UsersScreen | static |
| `/admin/roles` | RolesScreen | static |
| `/admin/audit` | AuditScreen | static |
| `/admin/settings` | SettingsScreen | static |
| `/admin/setup` | SetupWizardScreen | static |
| `/workshop-map` | WorkshopMapScreen | static |
| `/services` | ServicesScreen | static |
| `/cost-centers` | CostCentersScreen | static |
| `/assets` | AssetsScreen | static |

#### `api/client.ts` - 158 lines (HTTP Client)
- **Lines 1-10:** `ApiResponse<T>` interface: `success` (boolean), `data?` (T), `message?` (string), `meta?` ({total, page, limit})
- **Lines 12-16:** `ApiClient` class fields: `baseUrl`, `token`, `tenantId`, `branchId`
- **Lines 18-32:** Setters: `setToken()`, `setTenantId()`, `setBranchId()`
- **Lines 34-49:** `getHeaders()` private method:
  - Always sets `Content-Type: application/json` and `Accept: application/json`
  - Conditionally adds `Authorization: Bearer ${token}`
  - Conditionally adds `x-tenant-id` and `x-branch-id`
- **Lines 51-70:** `get<T>(path)`:
  - `fetch()` with GET method
  - `.json().catch(() => ({}))` — parses JSON, defaults to empty object on failure
  - **Error extraction (line 59):** `data.message || data.error.message || data.error || data.msg || statusText`
  - **Format normalization (lines 63-66):** Checks if response has `success` field; if not, wraps raw data as `{success: true, data}`
  - Network error message in Arabic: "لا يمكن الاتصال بالخادم. تأكد أن الباك-اند يعمل على المنفذ 8080."
- **Lines 72-91:** `post<T>(path, body)` — identical pattern with POST + JSON body
- **Lines 94-113:** `put<T>(path, body)` — identical pattern with PUT + JSON body
- **Lines 116-134:** `patch<T>(path, body)` — identical pattern with PATCH + JSON body
- **Lines 137-155:** `delete<T>(path)` — identical pattern with DELETE (no body)
- **Code duplication note:** All 5 methods share identical error handling and format normalization logic (could be refactored to a single `request()` helper)

#### `services/auth.ts` - 87 lines (Authentication Service)
- **Lines 1-14:** Interfaces: `User` (id, username, fullName, role, phone), `LoginCredentials` (username, password)
- **Lines 16-24:** `AuthService` class: fields `api`, `user`, `listeners[]`; constructor calls `loadSession()`
- **Lines 26-37:** `loadSession()`:
  - Reads `token`, `user`, `tenantId`, `branchId` from `localStorage`
  - If token + user exist: sets token on ApiClient, parses user JSON, sets tenant/branch
- **Lines 39-54:** `login(creds)`:
  - POST to `/api/auth/login` with `tenantId: 'default'`
  - Expects `res.data.user` + `res.data.tokens.accessToken`
  - Stores token in localStorage + ApiClient
  - Stores user JSON in localStorage
  - Calls `notify()` to inform listeners
  - Error message in Arabic: "اسم المستخدم أو كلمة المرور غير صحيحة"
- **Lines 56-66:** `logout()`:
  - Clears user object
  - Sets token/tenant/branch to null on ApiClient
  - Removes all 4 localStorage keys
  - Calls `notify()`
- **Lines 68-74:** `isAuthenticated()` returns `this.user !== null`, `getUser()` returns user
- **Lines 76-81:** `onChange(cb)` — pub/sub pattern: pushes callback, returns unsubscribe function
- **Lines 83-85:** `notify()` — calls all listeners with current user (null after logout)
- **No refresh token:** Session expires when JWT expires (backend-controlled)

---

### 1.3 AppLayout (`components/layout.ts`) - 267 lines

```
┌─────────────────────────────────────────────────────┐
│  TopBar (fixed, 64px, glassmorphism)                │
├─────────────────────────────────────────────────────┤
│  │  Sidebar (280px, fixed right)  │  Main Content  │
│  │  Brand + Profile + Nav Groups   │  (flex-1)      │
│  │  Footer: Add New + Logout       │                │
└─────────────────────────────────────────────────────┘
```

- **Lines 1-3:** Imports `AuthService`, `Router`, `ApiClient`
- **Lines 5-8:** `MenuGroup` interface: label (string), items array with route/label/icon/badge
- **Lines 10-73:** `MENU_GROUPS` constant — 6 navigation groups:
  1. **الرئيسية:** `/dashboard` (1 item)
  2. **العمليات:** `/bookings`, `/invoices`, `/pos`, `/services`, `/inventory`, `/inventory/warehouses`, `/inventory/suppliers`, `/inventory/purchase-orders`, `/customers`, `/dealers`, `/loyalty` (11 items)
  3. **المالية:** `/accounting`, `/accounting/chart-of-accounts`, `/accounting/journal-entries`, `/accounting/general-ledger`, `/accounting/trial-balance`, `/accounting/balance-sheet`, `/accounting/income-statement`, `/accounting/cash-flow`, `/cost-centers`, `/assets` (10 items)
  4. **الموارد:** `/hr`, `/workshop-map` (2 items)
  5. **التقارير:** `/reports`, `/analytics` (2 items)
  6. **الإدارة:** `/branches`, `/notifications`, `/documents`, `/admin`, `/admin/settings`, `/admin/setup` (6 items)
  - **Total: 32 sidebar items across 6 groups**
- **Lines 75-88:** `AppLayout` class constructor: takes `auth`, `router`, `title`, `activeRoute`, optional `api`
- **Lines 90-231:** `render(content)` — builds full layout HTML:
  - **Sidebar (lines 95-138):**
    - Fixed right, `280px` wide, `calc(100vh-32px)` tall, `z-50`
    - Glass panel: `backdrop-filter: blur(12px)`, white/70 bg, glass border
    - **Brand section (lines 97-103):** 14×14 gradient square with `directions_car` icon (FILL=1), "أوتو برو" heading (Be Vietnam Pro bold), "الإدارة المتقدمة" subtitle
    - **Navigation (lines 105-125):** Collapsible groups via `.menu-group-header` buttons with `expand_more` chevron. Each item is `<a>` with `data-route`. Active state: `nav-active-glow`, blue border-right, bold text, FILL=1 icon. Inactive: hover `translateX(-8px)`, gray icon. Staggered animation delays per group/item.
    - **Bookings badge (line 119):** `<span id="bookings-badge">` hidden by default, red error bg, white text
    - **Footer (lines 128-137):** "إضافة جديد" gradient button + "تسجيل الخروج" error text button
  - **Topbar (lines 140-166):**
    - Fixed top, `right-[324px] left-[24px]`, `h-16`, glass panel
    - Title (hidden on mobile), hamburger menu button (md:hidden)
    - Search input: `rounded-full`, `w-64`, glass bg, `input-glow` on focus
    - Notifications button: bell icon + hidden red dot badge (`#notif-badge`)
    - Profile button: user name + circular avatar with `person` icon, `primary-fixed` bg
  - **Main Content (lines 168-170):** `bg-orbs` class, `pt-[96px] pr-[320px] pl-[24px]`
  - Appends passed `content` to `.page-content` (line 174)
- **Event Listeners (lines 176-225):**
  - Nav links: `e.preventDefault()` → `router.navigate(route)`
  - Menu group toggles: toggle `open` class, rotate chevron 180deg
  - Brand icon click → `/dashboard`
  - "Add new" button → `/bookings/new`
  - Notifications button (topbar) → `/notifications`
  - Profile button → `/admin/settings`
  - Logout button → `auth.logout()` → `/login`
- **Badge fetching (lines 228-265):**
  - `fetchBookingsBadge()`: `GET /api/bookings?status=PENDING&limit=1`, reads `res.meta.total`, shows badge if > 0
  - `fetchNotificationsBadge()`: `GET /api/notifications/unread-count`, shows red dot if count > 0
  - Both silently fail if API unavailable

---

### 1.4 Design System

**DESIGN.md**: 1212 lines - extracted from production code.  
**style.css**: 2105 lines - complete CSS system.

#### Color Tokens
| Token | Hex | Usage |
|-------|-----|-------|
| `--primary` | `#003594` | Brand, buttons, active nav |
| `--secondary` | `#712ae2` | Revenue, accent |
| `--tertiary` | `#751f00` | Brown accent |
| `--success` | `#059669` | OK, completed |
| `--warning` | `#d97706` | Pending |
| `--error` | `#ba1a1a` | Errors |
| `--info` | `#0891b2` | Info |
| `--bg-primary` | `#faf8ff` | App background |
| `--bg-card` | `rgba(255,255,255,0.7)` | Glass cards |
| `--text-primary` | `#191b23` | Headings |
| `--text-secondary` | `#475569` | Body text |
| `--text-tertiary` | `#94a3b8` | Placeholders |

#### Glassmorphism
```css
--glass-bg: rgba(255, 255, 255, 0.7);
--glass-border: rgba(255, 255, 255, 0.4);
--glass-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.07);
```
- `.glass-panel`: blur(12px), glass bg/border/shadow
- `.glass-card`: Same + rounded-2xl + hover: translateY(-8px)
- `.btn-primary-gradient`: `linear-gradient(135deg, #003594, #712ae2)`

#### Typography
| Token | Font | Role |
|-------|------|------|
| `--font-headline` | Be Vietnam Pro | Headlines, KPI |
| `--font-body` | IBM Plex Sans Arabic | Body, RTL |
| `--font-mono` | JetBrains Mono | Currency, numbers |

#### Shadows
```css
--shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
--shadow: 0 1px 3px rgba(0,0,0,0.08);
--shadow-md: 0 4px 6px rgba(0,0,0,0.08);
--shadow-lg: 0 10px 15px rgba(0,0,0,0.08);
--shadow-xl: 0 20px 25px rgba(0,0,0,0.10);
```

---

### 1.5 Animation System (60fps)

| Animation | Duration | Description |
|-----------|----------|-------------|
| `page-enter` | 250-800ms | Fade + scale + translateX |
| `stagger-fade-in` | 300ms | Fade + translateY(12px→0) |
| `row-fade-in` | 200ms | Fade + translateX(-8px→0) |
| `modal-scale` | 250ms | Scale(0.9→1) |
| `shimmer` | 1.5s infinite | Skeleton sweep |
| `badge-pop` | 300ms | Scale pulse |
| `wizardContentFadeIn` | 350ms | Step enter |
| `stepNumPop` | 450ms | Scale + glow |
| `pulse-glow` | 2s infinite | Blue glow |
| `pulse-glow-red` | 2s infinite | Red glow |
| `ambient-float` | 4s infinite | Float Y |

**Interactions:**
- Hover lift: `translateY(-4px)` + shadow-lg
- Hover lift-8: `translateY(-8px)` + `0 20px 40px -10px rgba(27,85,208,0.15)`
- Button press: `scale(0.97)`
- Button ripple: radial white overlay
- Card hover: `translateY(-4px)` + enhanced shadow

**Reduced Motion:**
```css
@media (prefers-reduced-motion: reduce) {
  animation-duration: 0.01ms !important;
  transition-duration: 0.01ms !important;
}
```

---

### 1.6 Component Patterns

**KPI Cards:** Top gradient bar (1px, primary→secondary), label, value (headline-lg), icon circle, trend badge.

**Buttons:**
- Primary: `#003594`, white text, hover: translateY(-1px)
- Primary Gradient: `linear-gradient(135deg, #003594, #712ae2)`, hover: scale(1.05)
- FAB: Fixed bottom-left, pulse-glow, rotate(90deg) on hover

**Inputs:** 40-48px height, `bg-surface-subtle` or glass, `rounded-lg`/`rounded-xl`, focus glow ring.

**Select:** Custom chevron SVG (left-aligned for RTL), `appearance-none`.

**Badges:** 12 color variants, pill shape, `badge-pop` animation.

**Modals:** Backdrop `rgba(0,0,0,0.4)` + blur(4px), content: glass card, close on backdrop/Escape.

**Tables:** Header `bg-surface-subtle`, 56px row height, hover highlight, stagger animation, bulk actions bar.

**Empty States:** Centered icon + message. **Error States:** `bg-error/5` + retry button.

---

### 1.7 Screen Analysis (52 Screens)

#### Dashboard (`dashboard.ts`) - 555 lines
- Arabic date header (day name + date)
- 4 KPI cards: Bookings, Revenue, New Customers, Completed
- Chart.js: Revenue bar (7 days), Bookings line (7 days), Status donut
- Quick actions: 4 shortcut buttons
- Recent activity timeline
- Skeleton loading for all sections

#### Login (`login.ts`) - 323 lines
- Background orbs: `primary/5` + `secondary/5`, blur 100-120px
- Glass card center (blur 16px, bg-white/85)
- Gradient title text
- Two modes: Login form OR Setup wizard
- Error box: fixed top-right
- Show/hide password toggle

#### Bookings (`bookings.ts`) - 376 lines
- Search: name, phone, plate, booking ID
- Status filter: PENDING, CONFIRMED, IN_PROGRESS, WAITING_PARTS, READY, COMPLETED, CANCELLED
- Bulk actions: select-all checkbox + delete selected
- Row hover: `translateY(-2px)` + shadow
- Delete confirmation modal
- Smart FAB

#### Booking Wizard (`booking-wizard.ts`) - 577 lines
- 2 types: 'registered' or 'new' customer
- 3 steps: Customer → Vehicle → Service
- Animated stepper: stepNumPop, step-line fill, wizardContentFadeIn
- Success state: `wizardSuccessPop`
- Cancel animation: `wizardCancelFade`

#### Booking Ticket (`booking-ticket.ts`)
- Header strip (h-2, primary)
- Ticket pattern background (radial-gradient dots)
- Sections: company, customer, vehicle, services, status, totals, QR
- Print styles: A4, remove backgrounds

#### Booking Print Ticket (`booking-print-ticket.ts`) - 300 lines
- Dedicated print page
- A4 portrait, 8mm margins
- Compact fonts (10-16px)
- QR code 56px
- `@media print` extensive styles

#### Invoices (`invoices.ts`) - 182 lines
- Status filter: UNPAID, PAID, OVERDUE
- Table: invoice number, customer, date, total, status, actions
- Invoice type selection modal
- Smart FAB

#### Manual Invoice (`manual-invoice.ts`) - 600 lines
- Type: 'manual' or 'booking'
- 3-step wizard: Customer → Services/Booking → Discount & Total
- Service/items table with add/remove
- Discount: FIXED or PERCENTAGE
- Totals: subtotal, tax, discount, grand total

#### Invoice Print (`invoice-print.ts`) - 213 lines
- Tax invoice layout (فاتورة ضريبية مبسطة)
- Header: company + invoice # + date + status badge
- Customer info grid
- Items table
- Totals section

#### POS (`pos.ts`) - 139 lines
- Split: Products (2/3) + Cart (1/3)
- Product grid with color-coded icons
- Product search
- Sticky cart sidebar
- API: `GET /api/parts`
- Alert placeholder on add-to-cart

#### Inventory (`inventory.ts`) - 181 lines
- Table: code, name, category, quantity, min quantity, unit price, actions
- Low stock: red text + `pulse-glow-red`
- Create Part Modal: name, code, qty, min qty, price
- API: `POST /api/parts`
- Smart FAB
- `Intl.NumberFormat('ar-SA')`

#### Chart of Accounts (`chart-of-accounts.ts`) - 461 lines
- Types: ASSET, LIABILITY, EQUITY, REVENUE, COGS, EXPENSE
- Arabic type labels
- Columns: code, name, type, balance (SYP), actions
- Pagination: 15 items/page
- Add account modal

#### Setup Wizard (`setup-wizard.ts`) - 304 lines
- 7 steps for first-time setup
- Left sidebar: step navigation + progress bar
- Progress bar: animated width transition
- Step templates from `setup-wizard-steps.ts`
- API: `SetupWizardService`

#### Analytics (`analytics.ts`) - 98 lines
- KPI cards: Customer Satisfaction, Avg Invoice, Retention Rate, Forecast
- AI-powered analytics label
- Gradient top bars on cards

#### Notifications (`notifications.ts`) - 584 lines
- 3 tabs: System Alerts, Scheduled Tasks, Team Chat
- Badge counts per tab
- Alert filters and grouping
- Task assignment interface
- Chat interface

#### Accounting (`accounting.ts`) - 62 lines
- Landing/Overview screen for all accounting sub-screens
- 7 navigation cards: شجرة الحسابات, القيود اليومية, دفتر الأستاذ, ميزان المراجعة, الميزانية العمومية, قائمة الدخل, التدفقات النقدية
- Each card: icon, title, description, color-coded (primary/secondary/tertiary/info)
- Cards use `data-route` for navigation
- `navCard()` helper: color map with hover effects

#### Admin (`admin.ts`) - 105 lines
- Landing for admin sub-screens: Users, Roles, Audit, Settings
- 4 cards with live stats loaded via `Promise.all`:
  - `GET /api/users` → user count
  - `GET /api/roles` → role count
  - `GET /api/audit?limit=1` → audit event count
- Stats update card subtitles dynamically
- Cards: icon circle (48px), title, description
- Fallback array extraction: `.data.data`, `.data.users`, `.data` patterns

#### Audit (`audit.ts`) - 155 lines
- Audit log table: date, user, action, entity, IP
- Filter dropdown: CREATE, UPDATE, DELETE, LOGIN
- `actionMap`: color-coded badges per action type
- Truncated entityId (first 8 chars + "...")
- Empty state: centered icon + message
- Error state: red icon + retry button
- `filterAudit()` filters in-memory

#### Balance Sheet (`balance-sheet.ts`) - 122 lines
- 3 summary cards: Assets, Liabilities, Equity
- 3 detail tables: Assets, Liabilities, Equity
- API: `GET /api/reports/balance-sheet`
- `renderSection()` helper for consistent table rendering
- `Intl.NumberFormat('ar-SA')` formatting

#### Booking Ticket (`booking-ticket.ts`) - 562 lines
- Ticket view for booking details
- Select arrow SVG as const (inline data URI pattern)
- Fields: customer, vehicle, plate, priority, payment method
- Services section with tags
- Cost breakdown: service cost, parts cost, total
- Edit mode toggle (`isEditing`)
- Status badge with dot indicator
- API: `GET /api/bookings/:id`

#### Booking Print Ticket (`booking-print-ticket.ts`) - 300 lines
- Print-optimized A4 ticket
- `@page { size: A4 portrait; margin: 8mm }`
- Compact print fonts (10-16px)
- QR code 56px on print
- Company header, customer/vehicle info, services, totals
- Print button + back button (hidden on print)

#### Bookings (`bookings.ts`) - 376 lines
- Bulk actions: select-all checkbox + delete selected
- Status filter: PENDING, CONFIRMED, IN_PROGRESS, WAITING_PARTS, READY, COMPLETED, CANCELLED
- Search: name, phone, plate, booking ID
- Row hover: translateY(-2px) + shadow
- Delete confirmation modal
- Smart FAB for new booking

#### Branches (`branches.ts`) - 271 lines
- CRUD for branches: name, address, phone, status
- Delete confirmation modal (warning icon)
- Add/Edit modal: 4 fields (name, address, phone, status ACTIVE/INACTIVE)
- Status badge: ACTIVE (green), INACTIVE (red)
- Table columns: branch, address, phone, status, actions

#### Cash Flow (`cash-flow.ts`) - 55 lines
- Placeholder/stub screen
- 3 summary cards: total debit, total credit, balance
- Empty data table

#### Chart of Accounts (`chart-of-accounts.ts`) - 461 lines
- Hierarchical account tree
- Types: ASSET, LIABILITY, EQUITY, REVENUE, COGS, EXPENSE
- Arabic labels per type
- Pagination: 15 items/page
- Add account modal with parentId selection
- Tree rendering with indentation levels
- Search by name or code

#### Cost Centers (`cost-centers.ts`) - 168 lines
- Cost center management
- Table: name, type, cost driver, quantity, monthly budget, status
- "Initialize Defaults" button: `POST /api/cost-centers/initialize`
- "Refresh Rates" button: shows overhead rates table
- `translateType()`, `translateDriver()` helpers
- Status badges: active (green), inactive (red)

#### Customer Detail (`customer-detail.ts`) - 189 lines
- Customer profile card: name, phone, address, city
- Vehicles list section
- Delete vehicle confirmation modal
- Back button navigation to `/customers`
- API: `GET /api/customers/:id`

#### Customer Report (`customer-report.ts`) - 132 lines
- 4 KPI cards: total customers, active, new (30 days), avg value
- 2 tables: customer segments, churn risk
- API: `GET /api/reports/advanced/customer-insights`
- Fallback to empty state on API failure

#### Customers (`customers.ts`) - 421 lines
- Search by name or phone
- Bulk actions bar (hidden by default)
- Summary cards: total, active, inactive
- Table columns: name, phone, address, vehicles, status, actions
- Create/Edit modal: name, phone, address, status
- Delete confirmation modal with pulse animation
- Glass-card design with gradient buttons

#### Dealers (`dealers.ts`) - 94 lines
- Dealer/partner list
- Search by name
- Table: name, phone, address, actions
- Edit button per row
- New dealer button
- API: `GET /api/dealers`

#### Departments (`departments.ts`) - 268 lines
- Department CRUD
- Bulk delete with checkbox selection
- Table: checkbox, name, description, status, createdAt, actions
- Add/Edit modal: nameAr, nameEn, description
- Form with `required` validation
- `selectedIds: Set<string>` for bulk operations

#### Employee Form (`employee-form.ts`) - 218 lines
- Create/Edit employee form
- Fields: fullNameAr, employeeCode, position, phone, departmentId (dropdown), contractType (FULL_TIME/PART_TIME/CONTRACT/TEMPORARY), salarySYP, hourlyRate (auto-calculated), hireDate, password, status (ACTIVE checkbox)
- Department dropdown loaded from `GET /api/departments`
- Auto-calculate hourly rate from salary
- `isEdit` mode for existing employees

#### General Ledger (`general-ledger.ts`) - 68 lines
- Transaction lines table
- Columns: date, account, reference, debit, credit, running balance
- Search by account name
- API: `GET /api/general-ledger?limit=50`
- Financial data with LTR direction

#### HR (`hr.ts`) - 211 lines
- Employee list with bulk delete
- Select-all checkbox + individual checkboxes
- Bulk delete button (hidden when no selection)
- Table: checkbox, name, role, department, phone, salary, status, actions
- "Departments" button → `/departments`
- "New Employee" button → `/hr/employees/new`
- API: `GET /api/employees`, `POST /api/employees/bulk-delete`

#### Income Statement (`income-statement.ts`) - 151 lines
- 5 summary cards: revenue, COGS, gross profit, expenses, net profit
- 3 detail tables: revenue, COGS, operating expenses
- API: `GET /api/reports/profit-loss`
- Color-coded amounts: revenue (default), COGS (error/red), gross (success/green)

#### Inventory (`inventory.ts`) - 181 lines
- Table: code, name, category, quantity, min quantity, unit price, actions
- Low stock: red text + `pulse-glow-red`
- Create Part Modal: name, code, qty, min qty, price
- API: `POST /api/parts`
- Smart FAB
- `Intl.NumberFormat('ar-SA')`

#### Inventory Report (`inventory-report.ts`) - 127 lines
- 4 KPI cards: total parts, value SYP, value USD, low stock count
- 2 tables: fast-moving items, low stock items
- API: `GET /api/reports/advanced/inventory`
- Low stock count highlighted in error red

#### Invoice Detail (`invoice-detail.ts`) - 202 lines
- Invoice detail view with glass-card design
- Header: invoice number (truncated to 8 chars), print/cancel/back buttons
- Status badges: PAID (green), PARTIALLY_PAID (yellow), OVERDUE (red), CANCELLED (grey)
- `statusMap` with glow colors per status
- Invoice detail card with skeleton loading state
- `applyDiscount()` method: FIXED or PERCENTAGE discount
- `cancelInvoice()` method with confirmation dialog
- API: `GET /api/invoices/:id`, `PUT /api/invoices/:id` (discount), `POST /api/invoices/:id/cancel`

#### Invoice Print (`invoice-print.ts`) - 213 lines
- Tax invoice layout (فاتورة ضريبية مبسطة)
- Header: company + invoice # + date + status badge
- Customer info grid
- Items table
- Totals section
- Print button + back button

#### Invoices (`invoices.ts`) - 182 lines
- Status filter: UNPAID, PAID, OVERDUE
- Table: invoice number, customer, date, total, status, actions
- Invoice type selection modal
- Smart FAB

#### Journal Entries (`journal-entries.ts`) - 68 lines
- Journal entries list table
- Columns: date, reference, description, debit, credit, status
- Search by reference or description
- Status badge: POSTED (green) / DRAFT (yellow)
- API: `GET /api/journal-entries?limit=50`
- 5 skeleton rows while loading

#### Loyalty (`loyalty.ts`) - 115 lines
- Loyalty program overview
- 3 KPI cards: total points distributed, participating customers, redeemed rewards
- Customer search by name
- Table: customer name, points, last activity, status
- "Add Points" button (alert placeholder: "سيتم فتح نموذج إضافة النقاط قريباً")
- API: `GET /api/loyalty`
- Summary extraction: `summary.totalPoints`, `summary.totalCustomers`, `summary.totalRedeemed`

#### Manual Invoice (`manual-invoice.ts`) - 600 lines
- Type: 'manual' or 'booking'
- 3-step wizard: Customer → Services/Booking → Discount & Total
- Service/items table with add/remove
- Discount: FIXED or PERCENTAGE
- Totals: subtotal, tax, discount, grand total

#### Notifications (`notifications.ts`) - 584 lines
- 3 tabs: System Alerts, Scheduled Tasks, Team Chat
- Badge counts per tab
- Alert filters and grouping
- Task assignment interface
- Chat interface

#### Payment (`payment.ts`) - 179 lines
- Payment recording screen for invoices
- Invoice card with skeleton loading, then populated with: invoice number, customer name, status badge (PAID/PARTIALLY_PAID/UNPAID), total amount, remaining amount
- Payment form: amount (SYP), date (defaults to today), method (CASH/CREDIT_CARD/BANK_TRANSFER/CHEQUE/ELECTRONIC), notes
- Save payment button with spinner animation on submit
- Print invoice button (shown after payment)
- Back button → `/invoices`
- API: `GET /api/invoices/:id`
- Remaining amount calculated as `totalSYP - paidSYP`

#### POS (`pos.ts`) - 139 lines
- Split: Products (2/3) + Cart (1/3)
- Product grid with color-coded icons
- Product search
- Sticky cart sidebar
- API: `GET /api/parts`
- Alert placeholder on add-to-cart

#### Purchase Orders (`purchase-orders.ts`) - 64 lines
- Purchase orders list
- Search by order number
- Table: order number (ltr), supplier, date, status
- Status mapping: DRAFT→مسودة, PENDING→معلقة, APPROVED→معتمدة, RECEIVED→مستلمة, CANCELLED→ملغاة
- Status color classes per state
- API: `GET /api/purchase-orders`

#### Reports (`reports.ts`) - 59 lines
- Landing screen for all reports
- 6 navigation cards: Revenue, P&L, Inventory, Customers, Bookings, Balance Sheet
- `reportCard()` helper with color mapping

#### Revenue Report (`revenue-report.ts`) - 156 lines
- 4 KPI cards: total SYP, total USD, invoice count, avg invoice
- 3 tables: monthly revenue, top customers, revenue by service
- API: `GET /api/reports/revenue`
- `Intl.NumberFormat('ar-SA')` formatting

#### Roles (`roles.ts`) - 270 lines
- RBAC role management
- Role cards (not table): name, description, permission chips
- Permission tags: first 5 shown, "+N more" for excess
- Color-coded role icons
- New role modal
- API: `GET /api/roles`, `GET /api/permissions`

#### Services (`services.ts`) - 789 lines
- Service management with exchange rate support
- Category management modal
- Table: service, category, price SYP, price USD, labor cost, material cost, profit, loyalty points, warranty, duration, status
- Exchange rate loaded from `GET /api/settings`
- Status filter: active/inactive
- Service search
- Add service modal with category dropdown

#### Settings (`settings.ts`) - 158 lines
- Garage info: name, address, phone
- Financial settings: default currency (SYP/USD), exchange rate, tax rate
- Load: `GET /api/settings`
- Save: `PUT /api/settings`
- Cancel button navigates to dashboard

#### Setup Wizard (`setup-wizard.ts`) - 304 lines
- 7 steps for first-time setup
- Left sidebar: step navigation + progress bar
- Progress bar: animated width transition
- Step templates from `setup-wizard-steps.ts`
- API: `SetupWizardService`

#### Setup Wizard Steps (`setup-wizard-steps.ts`) - 329 lines
- `WIZARD_STEPS` array: 7 steps with id, label, icon
- `navButtons()` helper: generates prev/next buttons, last step shows "إكمال الإعداد" (tertiary color)
- Step 1 (Company): name, nameEn, address, phone, tax number, currency (SYP/USD/EUR/AED/SAR), timezone (Damascus/Dubai/Riyadh/UTC), date format
- Step 2 (Financial): exchange rate (default 15000), tax rate, overhead %, monthly hours, service overhead %
- Steps 3-7: chart of accounts, fixed assets, cost centers, users, review

#### Suppliers (`suppliers.ts`) - 84 lines
- Supplier list
- Search by name
- Table: name, phone, address, status
- New supplier button → `/inventory/suppliers/new`
- API: `GET /api/suppliers`

#### System Setup (`system-setup.ts`) - 315 lines
- Initial system setup wizard (alternative to setup-wizard)
- 3 expandable cards: Garage Info, Currency Settings, Users
- Each card has numbered circle (1, 2, 3) + status badge ("قيد الانتظار")
- Garage: name (required), address
- Currency: 5 options (SYP, USD, EUR, AED, SAR)
- Users: inline form with fullName, phone, role (ADMIN/MANAGER/RECEPTIONIST/MECHANIC) + add button
- Added users displayed in a list below the form
- Skip and Save buttons at bottom
- `addedUsers` array tracks users
- Badge status updates dynamically as sections are filled

#### Trial Balance (`trial-balance.ts`) - 55 lines
- Placeholder/stub screen
- 3 summary cards: total debit, total credit, balance
- Empty data table

#### Users (`users.ts`) - 349 lines
- User management with KPI cards
- 3 KPIs: total, active, inactive
- Search + role filter (OWNER, MANAGER, RECEPTIONIST, MECHANIC)
- Table: user, role, status, createdAt
- New user modal
- Edit user modal
- API: `GET /api/users`
- Role badges with colors

#### Warehouses (`warehouses.ts`) - 79 lines
- Warehouse grid (cards, not table)
- Color-coded icons cycling through 5 colors
- Card: name, address, capacity
- New warehouse button → `/inventory/warehouses/new`
- API: `GET /api/warehouses`

#### Workshop Map (`workshop-map.ts`) - 68 lines
- Placeholder/stub screen
- Left: interactive map placeholder
- Right: station list with status badges
- Stations: Maintenance 1/2, Repair, Wash
- Status: available (green), busy (red)

---

### 1.8 Print System

**Ticket Print (`booking-print-ticket.ts`):**
- `@page { size: A4 portrait; margin: 8mm; }`
- `page-break-inside: avoid`
- Thermal printer support (80mm width)
- Compact font sizes
- QR code optimization

**Invoice Print (`invoice-print.ts`):**
- Standard tax invoice
- A4 optimized
- Header with company info
- Items table with totals

**CSS Print overrides:**
```css
@media print {
  .glass-panel, .glass-card {
    backdrop-filter: none !important;
    background: white !important;
    box-shadow: none !important;
  }
  .no-print { display: none !important; }
}
```

---

### 1.9 API Endpoints Used

| Endpoint | Screen | Method |
|----------|--------|--------|
| `/api/auth/login` | Login | POST |
| `/api/setup-wizard/needs-init` | Login | GET |
| `/api/bookings` | Bookings, Dashboard | GET |
| `/api/bookings/:id` | Booking Ticket | GET |
| `/api/invoices` | Invoices | GET |
| `/api/invoices/:id` | Invoice Detail, Invoice Print | GET |
| `/api/invoices` | Manual Invoice | POST |
| `/api/parts` | POS, Inventory | GET |
| `/api/parts` | Inventory | POST |
| `/api/customers` | Customers, Booking Wizard | GET |
| `/api/accounts` | Chart of Accounts | GET |
| `/api/journal-entries` | Journal Entries | GET |
| `/api/settings` | Services | GET |
| `/api/service-categories` | Services | GET |

---

### 1.10 Configuration Files

#### `package.json` - Dependencies & Scripts
- **Name:** `admin_tauri` v0.1.0
- **Type:** `module` (ES modules)
- **Scripts:** `dev` (vite), `build` (tsc + vite build), `preview`, `tauri`
- **Dependencies:** `@tauri-apps/api` ^2.11.0
- **DevDependencies:** `@tauri-apps/cli` ^2.11.2, `typescript` ^5.0.0, `vite` ^5.0.0
- TailwindCSS + Chart.js loaded via CDN in `index.html` (not npm packages)

#### `tsconfig.json` - TypeScript Configuration
- **Target:** ES2020
- **Module:** ESNext with bundler resolution
- **Strict mode:** enabled (`strict: true`)
- **Lint rules:** `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`
- **No emit:** `noEmit: true` (Vite handles compilation)
- **Includes:** only `src/` directory
- `allowImportingTsExtensions: true` (Vite-native TS imports)

#### `vite-env.d.ts` - Vite Client Types (1 line)
- `/// <reference types="vite/client" />` — enables Vite-specific type definitions (e.g., `import.meta.env`, HMR types)
- Standard Vite TypeScript declaration file

#### `vite.config.ts` - Build Tool Configuration
- **Port:** 1420 (strict, no fallback)
- **Proxy:** `/api` → `http://localhost:8080` (dev only)
- **Watch ignore:** `src-tauri/` (avoids rebuild loops during Rust changes)
- **Clear screen:** disabled (keeps terminal history)

#### `tauri.conf.json` - Desktop App Configuration
- **Product:** "AUTO_Renew Admin" v0.1.0
- **Identifier:** `com.autorenew.admin`
- **Category:** Business
- **Window:** 1400×900, min 1024×768, resizable, centered, decorations on
- **Build:** `npm run build` before Tauri build, dev server at `localhost:1420`
- **Bundle targets:** all platforms (Windows, macOS, Linux)
- **Windows-specific:** `downloadBootstrapper` webview install mode (silent)
- **Security:** CSP null, no capabilities defined, `dangerousDisableAssetCspModification: false`
- **Icons:** `icon.ico` + `icon.png`

---

### 1.10a Tauri Desktop Shell (Rust Backend)

The Tauri desktop wrapper provides the native window that hosts the web frontend.

#### `src-tauri/Cargo.toml` - Rust Package Manifest (22 lines)
- **Package:** `admin_tauri` v0.1.0, Rust edition 2021, minimum Rust 1.70
- **Build dependency:** `tauri-build` v2.0.0
- **Runtime dependencies:**
  - `tauri` v2.0.0 (core framework)
  - `tauri-plugin-shell` v2.0.0 (opens external URLs, file dialogs)
  - `serde` v1 + derive feature (serialization)
  - `serde_json` v1 (JSON handling)
- **Features:** `custom-protocol` (enables `tauri://` protocol in production)

#### `src-tauri/build.rs` - Build Script (4 lines)
- Single function: calls `tauri_build::build()`
- Generates Tauri-specific code at compile time (window icons, resources manifest)

#### `src-tauri/src/main.rs` - Rust Entry Point (7 lines)
- **Line 2:** `#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]` — hides console window on Windows in release builds
- **Lines 4-6:** `main()` function calls `admin_tauri::run()` (exported from lib.rs)

#### `src-tauri/src/lib.rs` - Tauri Application Builder (18 lines)
- **Line 1:** `use tauri::Manager;` — imports window management trait
- **Line 3:** `#[cfg_attr(mobile, tauri::mobile_entry_point)]` — mobile entry point attribute
- **Lines 4-17:** `run()` function:
  - `tauri::Builder::default()` — creates default Tauri app builder
  - `.plugin(tauri_plugin_shell::init())` — initializes shell plugin (allows opening URLs in system browser)
  - `.setup(|app| { ... })` — setup hook:
    - Gets the main window via `app.get_webview_window("main")`
    - **Lines 9-12:** In debug mode (`#[cfg(debug_assertions)]`), automatically opens DevTools (`F12` equivalent)
  - `.run(tauri::generate_context!())` — compiles with context from `tauri.conf.json`
  - `.expect("error while running tauri application")` — panics on failure

**Tauri Architecture:** The web frontend (Vite-built) runs inside a WebView2 (Windows), WKWebView (macOS), or WebKitGTK (Linux) window. The Rust layer provides native APIs (shell, filesystem, notifications) via the plugin system.

#### `index.html` - Entry Point (222 lines)
- **RTL Arabic:** `<html lang="ar" dir="rtl">`
- **Title:** "أوتو برو - نظام إدارة مرآب السيارات"
- **Fonts loaded:**
  - Be Vietnam Pro (400-800)
  - IBM Plex Sans Arabic (400-700)
  - IBM Plex Sans (400-700)
  - JetBrains Mono (400-600)
  - Material Symbols Outlined (opsz,wght,FILL,GRAD@24,400,0..1,0)
- **CDN scripts:**
  - TailwindCSS v3 with plugins: forms, container-queries
  - Chart.js (for dashboard charts)
- **Inline Tailwind config:** full color palette, border-radius, spacing, font-family, font-size tokens
- **Inline `<style>`:** glass-panel, glass-card, hover-lift, primary-gradient, active-glow, animate-glow, page-enter, stagger-entry, skeleton-shimmer, custom-scrollbar, and `prefers-reduced-motion` media query
- **Mount point:** `<div id="app"></div>` → `/src/main.ts`

#### `setup-wizard.service.ts` - Setup API Service (81 lines)
- **Step interfaces:** `Step1Data` (company info), `Step2Data` (financial), `Step3Data` (chart of accounts), `Step4Data` (asset categories), `Step5Data` (cost centers), `Step6Data` (users array)
- **Step6User interface:** fullName, username, phone, password, role
- **SetupWizardStatus interface:** setupCompleted (boolean), setupStep (number), companyName
- **Methods:**
  - `getStatus()` → `GET /api/setup-wizard/status`
  - `saveStep(step, data)` → `POST /api/setup-wizard/step/${step}`
  - `complete()` → `POST /api/setup-wizard/complete`
- All methods throw on `!res.success`

---

### 1.11 Known Issues & Observations

1. **Hardcoded API URL**: `http://178.105.209.59` in `api/client.ts` - should be configurable
2. **No refresh token**: Frontend relies on backend-only token refresh
3. **POS incomplete**: Add-to-cart shows `alert()` placeholder
4. **No toast system**: Uses inline error boxes and `alert()`
5. **Analytics placeholder**: KPI values show "..." (not wired to API)
6. **No unit tests**: No test files for screens
7. **TypeScript strict**: `noUnusedLocals` and `noUnusedParameters` enabled
8. **Vite proxy**: `/api` → `localhost:8080` for dev

---

## 2️⃣ Mechanic App - تطبيق الميكانيكي

**المسار:** `mechanic_app/`  
**التقنية:** Flutter Mobile  
**State Management:** Riverpod  

### هيكل الملفات

```
mechanic_app/
├── pubspec.yaml              # Dependencies
├── assets/
│   └── images/
├── lib/
│   ├── main.dart             # Entry point, MaterialApp, routes
│   ├── firebase_options.dart
│   ├── core/
│   │   ├── config/
│   │   │   └── app_config.dart
│   │   └── theme/
│   │       ├── app_theme.dart
│   │       └── luxury_theme.dart
│   ├── models/
│   │   └── booking.dart
│   ├── providers/
│   │   └── auth_provider.dart
│   ├── screens/
│   │   ├── login_screen.dart     # 389 lines
│   │   ├── home_screen.dart      # 516 lines
│   │   └── bookings_list_screen.dart
│   ├── services/
│   │   ├── api_service.dart      # Dio HTTP client
│   │   ├── auth_service.dart
│   │   ├── booking_service.dart
│   │   └── socket_service.dart
│   └── widgets/
│       └── loading_overlay.dart
```

### الشاشات

| الشاشة | الوصف |
|--------|-------|
| **LoginScreen** | Luxury theme, animations (animate_do), glassmorphism, username/password/tenantId |
| **HomeScreen** | Dashboard with assigned bookings, status cards, Socket.io real-time |
| **BookingsListScreen** | List with filter, sort, navigation to details |

### الميزات
- **Riverpod** state management
- **Socket.io** real-time updates
- **Firebase Messaging** push notifications
- **Dio** HTTP client with token interceptor
- **ScreenUtil** responsive sizing
- **Lottie** animations
- **Shimmer** loading effects

### Dependencies
```yaml
flutter_riverpod: ^2.5.1
dio: ^5.6.0
socket_io_client: ^2.0.3+1
firebase_messaging: ^15.1.0
firebase_core: ^3.6.0
go_router: ^14.2.0
flutter_screenutil: ^5.9.3
animate_do: ^3.3.4
lottie: ^3.1.0
shimmer: ^3.0.0
font_awesome_flutter: ^10.7.0
google_fonts: ^6.2.1
camera: ^0.11.0
image_picker: ^1.1.2
```

---

## 3️⃣ Customer Frontend - واجهة العميل

**المسار:** `customer_frontend/`  
**التقنية:** HTML5 + CSS3 + Vanilla JavaScript

### هيكل الملفات

```
customer_frontend/
├── index.html                # Single page (207 lines)
├── css/
│   └── style.css             # 9.3KB custom styles
├── js/
│   └── app.js                # 15.2KB logic (442 lines)
└── lib/                      # CDN fallback libraries
    ├── css/
    │   └── fontawesome.css
    └── js/
        ├── aos.js
        ├── gsap.min.js
        ├── ScrollTrigger.min.js
        ├── lottie.min.js
        ├── three.min.js
        └── socket.io.min.js
```

### الميزات
- **Three.js**: 150 golden particles background, slow rotation
- **GSAP + AOS**: Animations on scroll
- **Lottie**: Loading animation
- **Socket.io**: Real-time booking updates
- **Polling fallback**: Every 30 seconds

### Sections
1. معلومات المرآب (Garage info)
2. معلومات الزبون (Customer info)
3. معلومات المركبة (Vehicle info)
4. معلومات الحجز (Booking info)
5. الخدمات (Services - no prices)
6. الفاتورة (Invoice: subtotal, tax, discount, total, paid, remaining)
7. ملاحظات الميكانيكي (Mechanic notes)
8. التقييم (Rating: 5 stars + comment, shown after COMPLETED)

### Status Badges
- PENDING → قيد الانتظار
- CONFIRMED → مؤكد
- IN_PROGRESS → قيد العمل
- WAITING_PARTS → بانتظار القطع
- READY → جاهز
- COMPLETED → مكتمل
- DELIVERED → تم التسليم
- CANCELLED → ملغي

### API
- `GET /api/public/booking/:token`
- Socket.io: `booking-updated` event

---

## 🔧 مقارنة الواجهات

| الميزة | Admin Tauri | Mechanic App | Customer Frontend |
|--------|-------------|--------------|-------------------|
| **التقنية** | HTML/TS/Tailwind | Flutter | HTML/CSS/JS |
| **المنصة** | Web/Desktop | Mobile | Web |
| **State Mgmt** | Manual (classes) | Riverpod | Vanilla JS |
| **Routing** | Hash-based | MaterialApp | Single page |
| **Auth** | JWT + localStorage | JWT + SharedPreferences | Token URL |
| **RTL** | ✅ كامل | ✅ | ✅ |
| **Real-time** | ❌ | Socket.io | Socket.io |
| **Offline** | ❌ | ❌ | ❌ |
| **Charts** | Chart.js | ❌ | ❌ |
| **Camera** | ❌ | ✅ | ❌ |
| **Firebase** | ❌ | ✅ FCM | ❌ |
| **Glassmorphism** | ✅ Extensive | ✅ Luxury | ❌ |
| **Animations** | CSS + Tailwind | Flutter animations | Three.js + GSAP |
| **Screens** | 52 | 3 | 1 |

---

## 📊 إحصائيات

| | Admin Tauri | Mechanic App | Customer Frontend |
|---|:---:|:---:|:---:|
| **ملفات الكود** | 52 screens + 9 core + 5 Rust | 10+ | 3 |
| **حجم CSS** | 45KB (2105 lines) | - | 9.3KB |
| **حجم JS/TS** | ~2000+ lines | - | 15.2KB |
| **Dependencies** | 3 npm | 20+ pub | 6 CDN |
| **Routes/Screens** | 50+ | 3 | 1 |

---

## 🚀 أوامر التشغيل

```bash
# Admin Tauri
cd admin_tauri
npm install
npm run dev          # Port 1420
npm run build        # Production
npm run tauri dev    # Desktop

# Mechanic App
cd mechanic_app
flutter pub get
flutter run

# Customer Frontend
# Served via backend or nginx
```

---

## 🔍 النتائج المستفادة

1. **Admin Tauri هو الأكثر تطوراً**: 52 شاشة, 2105 سطر CSS, نظام animation متكامل
2. **Glassmorphism متكامل**: blur, transparent bg, gradient buttons, glow effects
3. **Design System موثق**: DESIGN.md 1212 سطر يوثق كل شيء
4. **Print System موجود**: A4 invoices, thermal tickets, QR codes
5. **Wizard Pattern**: Multi-step forms مع animations
6. **POS غير مكتمل**: Add-to-cart يستخدم `alert()`
7. **Analytics غير موصول**: KPI values عرضية "..."
8. **لا يوجد toast system**: يستخدم inline errors و `alert()`
9. **ApiClient baseUrl ثابت**: يجب جعله configurable
10. **Mechanic App فاخر**: Luxury theme + animations + Firebase + Socket.io
