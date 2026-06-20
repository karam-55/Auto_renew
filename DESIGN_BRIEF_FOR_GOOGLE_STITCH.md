# Design Brief — AUTO_Renew Garage Management System
# تفاصيل التصميم الكاملة لنظام إدارة مرآب السيارات

**Project**: AUTO_Renew / Garage Go (مرآب جو)
**Designer**: Google Stitch / UI Designer
**Language**: Arabic (RTL Right-to-Left)
**Theme**: Light Mode (White background) with coordinated accent colors
**Platforms**: Web Desktop (Admin App only)
**Scope**: Admin Dashboard Interface ONLY

---

## 1. Overview

AUTO_Renew is a comprehensive auto repair garage management system handling:
- Bookings & appointments
- Customers, vehicles & CRM
- Inventory (parts, warehouses, suppliers)
- Invoicing, payments, installments
- Full accounting (journal entries, general ledger, financial statements)
- HR (employees, attendance, payroll)
- Mechanic assignments & work orders
- Analytics, reports & AI insights
- Notifications (SMS, WhatsApp, Push)
- Memberships & loyalty points
- RBAC security & audit logs

### Brand Colors (Light Mode — White Background)
```css
/* Backgrounds */
Background:    #FFFFFF (Pure White)
Surface:       #F8FAFC (Cool White)
Surface-2:     #F1F5F9 (Light Gray)
Card:          #FFFFFF (White with subtle shadow)

/* Text */
Text Primary:   #0F172A (Dark Slate)
Text Secondary: #475569 (Slate 600)
Text Tertiary:  #94A3B8 (Slate 400)

/* Primary & Accents */
Primary:        #2563EB (Royal Blue)
Primary-Light:  #DBEAFE (Blue 100)
Primary-Dark:   #1E40AF (Blue 800)

Secondary:      #7C3AED (Violet)
Secondary-Light:#EDE9FE (Violet 100)

Success:        #059669 (Emerald 600)
Success-Light:  #D1FAE5 (Emerald 100)

Warning:        #D97706 (Amber 600)
Warning-Light:  #FEF3C7 (Amber 100)

Error:          #DC2626 (Red 600)
Error-Light:    #FEE2E2 (Red 100)

Info:           #0891B2 (Cyan 600)
Info-Light:     #CFFAFE (Cyan 100)

/* Borders & Dividers */
Border:         #E2E8F0 (Slate 200)
Border-Light:   #F1F5F9 (Slate 100)
Divider:        #E2E8F0 (Slate 200)

/* Shadows (for depth on white) */
Shadow-SM:      0 1px 2px rgba(0,0,0,0.05)
Shadow:         0 1px 3px rgba(0,0,0,0.08)
Shadow-MD:      0 4px 6px rgba(0,0,0,0.08)
Shadow-LG:      0 10px 15px rgba(0,0,0,0.08)
Shadow-XL:      0 20px 25px rgba(0,0,0,0.10)
```

**Design Principle**: Clean white canvas with vibrant, coordinated accent colors. Each module can have a subtle tint (e.g., Accounting screens have a light blue tint, HR has a light purple tint) to create visual rhythm without overwhelming the white background.

---

## 🎬 Animations & Micro-interactions (CRITICAL REQUIREMENT)

The admin interface MUST have premium, smooth animations. NO static pages.

### Page Transitions
- **Fade + slight scale**: Pages fade in with `opacity 0→1` and `scale 0.98→1.00` (duration: 250ms, ease: `cubic-bezier(0.4, 0, 0.2, 1)`)
- **Slide from right**: New pages slide in from right (RTL-aware)
- **Staggered content**: Content elements appear sequentially with 50ms stagger delay

### Component Animations
- **Cards**: On hover → subtle lift (`translateY(-4px)`) + shadow increase (duration: 200ms)
- **Buttons**: On hover → scale `1.02`, active → scale `0.98` + ripple effect
- **Tables**: Rows fade in with stagger (30ms per row)
- **Modals**: Scale up from center (`scale 0.9→1`, `opacity 0→1`) + backdrop blur fade
- **Sidebar**: Collapse/expand with smooth width animation (300ms, ease-out)
- **Menu items**: Hover → indicator slides in from right, text color transitions

### Loading States (Animated, NOT static)
- **Skeleton screens**: Shimmer/wave animation moving left-to-right
- **Button loading**: Circular spinner inside button, text fades out
- **Page loading**: Progress bar at top of page (like YouTube)
- **Data loading**: Pulsing dots or spinning circle (NOT static text)

### Chart Animations
- **Bar charts**: Bars grow from bottom with stagger (100ms per bar)
- **Line charts**: Line draws itself (stroke-dashoffset animation)
- **Pie charts**: Segments expand from center with rotation
- **Numbers**: Count-up animation (e.g., revenue number scrolls from 0 to value)

### Scroll Animations
- **Infinite scroll**: Content slides up as user scrolls down
- **Scroll-to-top**: Smooth scroll with easing (not instant jump)
- **Sticky headers**: Fade-in shadow when sticky activates

### Notification Animations
- **Toast**: Slides in from top-right, bounces slightly, auto-dismiss slides out
- **Badge counters**: Pop animation (scale 1→1.3→1) when number changes
- **Success states**: Checkmark draws itself (SVG stroke animation)

### Performance Requirements (NO LAG ON DESKTOP)
- **60fps target**: All animations must run at 60fps
- **GPU-accelerated**: Use `transform` and `opacity` only (avoid `width`, `height`, `top`, `left`)
- **will-change**: Apply to animated elements
- **Reduced motion**: Respect `prefers-reduced-motion` media query
- **Debounce/throttle**: Scroll and resize events debounced
- **Virtual lists**: Tables with 1000+ rows must virtualize (render only visible rows)
- **Lazy loading**: Images and heavy components load on demand
- **Animation cleanup**: Remove event listeners and cancel animations on dispose

---

## 2. User Roles (with badge colors)

| Role | Arabic | Badge Color |
|------|--------|-------------|
| OWNER | صاحب المرآب | Gold |
| MANAGER | مدير | Purple |
| ACCOUNTANT | محاسب | Blue |
| RECEPTIONIST | موظف استقبال | Teal |
| MECHANIC | ميكانيكي | Orange |
| HR_MANAGER | مدير موارد بشرية | Pink |
| SALES | مبيعات | Green |
| CASHIER | أمين صندوق | Cyan |

---

## 3. Design System Requirements

### RTL (Right-to-Left)
- ALL screens RTL. Sidebar on **RIGHT** side.
- Table columns read right-to-left.
- Currency: `1,250.00 ل.س` or `$ 45.00`
- Dates: `2026-06-17` or `17/06/2026`
- Numbers: Western Arabic numerals (1,2,3)

### Standard Page Layout
```
┌────────────────────────────────────────────┐
│ [Sidebar Right] │ [Header: Title + Actions] │
│ (280px, collapsible) │                      │
│  - Logo              ├─────────────────────┤
│  - User profile card │ [Filters/Search bar]  │
│  - Menu groups       ├─────────────────────┤
│  - Logout            │                       │
│                      │   [Main Content]      │
│                      │   (Tables/Cards/Forms)│
│                      │                       │
│                      ├─────────────────────┤
│                      │ [Pagination]          │
└────────────────────────────────────────────┘
```

### Header (64px)
- Page title (large Arabic text, bold)
- Breadcrumb
- Action buttons (**aligned LEFT**): Add, Export, Refresh
- Notification bell

### Sidebar (Right side)
- Logo at top
- User profile (avatar, name, role badge)
- Collapsible menu groups with icons
- Active item: primary color highlight
- Logout at bottom

### Spacing
- Card padding: 16-24px
- Gap between cards: 16px
- Section gap: 24px
- Button padding: 12px 24px
- Input height: 48px
- Table row height: 56px

---

## 4. Complete Screen Inventory

### 4.1 Dashboard (اللوحة الرئيسية)
**Layout**: KPI cards row → Charts row → Recent activities

**KPI Cards** (6 cards):
- إجمالي الحجوزات / Total Bookings
- الإيرادات / Revenue
- الميكانيكيون النشطون / Active Mechanics
- المدفوعات المعلقة / Pending Payments
- عملاء جدد / New Customers
- الفواتير المتأخرة / Overdue Invoices

Each card: Large number, label, trend arrow (↑↓%), icon, popup menu (3 dots)

**Charts**:
- Revenue bar chart (last 7 days)
- Bookings line chart (last 7 days)
- Booking status pie/donut chart

**Quick Actions** (icon buttons row):
- حجز جديد / New Booking
- فاتورة جديدة / New Invoice
- دفعة جديدة / New Payment
- عميل جديد / New Customer
- قطعة جديدة / New Part
- مصروف جديد / New Expense

**Recent Activity**: Timeline with Arabic descriptions, time ago

---

### 4.2 Bookings (الحجوزات)

**Bookings List**:
- Search bar (multi-field: name, phone, plate, booking ID)
- Filter chips: Status dropdown, Priority dropdown, Date range picker
- Clear filters button
- **Table columns** (RTL):
  - ID | اسم العميل | الموبايل | لوحة المركبة | الخدمة | الحالة | التاريخ | الميكانيكي | المجموع | إجراءات

**Status Badges** (CRITICAL — exact colors):
| Status | Arabic | Color |
|--------|--------|-------|
| PENDING | قيد الانتظار | Gray |
| CONFIRMED | مؤكد | Blue |
| IN_PROGRESS | قيد العمل | Amber |
| WAITING_PARTS | بانتظار القطع | Purple |
| READY | جاهز | Cyan |
| INVOICED | مفوتر | Indigo |
| PAID | مدفوع | Green |
| DELIVERED | تم التسليم | Teal |
| COMPLETED | مكتمل | Emerald |
| CANCELLED | ملغي | Red |
| NO_SHOW | لم يحضر | Orange |
| NO_INVOICE_REQUIRED | لا يحتاج فاتورة | Slate |

**New Booking Wizard** (4 steps with step indicator):
1. اختيار العميل والمركبة / Select Customer & Vehicle
2. اختيار الخدمات والقطع / Select Services & Parts
3. تعيين الميكانيكي والتاريخ / Assign Mechanic & Date
4. المراجعة والتأكيد / Review & Confirm

---

### 4.3 Invoices (الفواتير)

**Invoice List**:
- Filters: Status, Customer, Date Range, Payment Status
- Table columns: رقم الفاتورة | العميل | التاريخ | المجموع الفرعي | الضريبة | الخصم | **المجموع** | الحالة | إجراءات
- Invoice number format: `INV-2026-00001`

**Invoice Detail View**:
- Header: Invoice number, Date, Status badge
- Customer info card (name, phone, vehicle)
- Services table (name, qty, unit price, total)
- Parts table (name, qty, unit price, total)
- **Financial summary box** (right-aligned):
  - المجموع الفرعي / Subtotal
  - الضريبة / Tax (%)
  - الخصم / Discount
  - **المجموع الكلي / TOTAL** (bold, larger)
- Payment history section
- Buttons: دفع / Pay, طباعة / Print, واتساب / WhatsApp, إلغاء / Cancel

**Invoice Form (Create/Edit)**:
- Customer dropdown (searchable, with phone info)
- Vehicle auto-filled
- Services selector (multi-select, prices shown)
- Parts selector (multi-select, stock shown)
- Tax rate dropdown
- Discount input (toggle: amount vs percentage)
- **Live auto-calculated totals**
- Notes textarea
- Due date picker

---

### 4.4 Accounting (المحاسبة) ⭐ CRITICAL MODULE

#### Chart of Accounts / شجرة الحسابات
- **Tree view** (hierarchical, collapsible accordion)
- Columns: الكود | الاسم العربي | الاسم الإنجليزي | النوع | الرصيد | إجراءات
- **Color by type**: ASSET=Blue, LIABILITY=Red, EQUITY=Purple, REVENUE=Green, EXPENSE=Orange
- Actions per row: إضافة فرعي / Add Child, تعديل / Edit, حذف / Delete

#### Journal Entries / القيود اليومية
- Filters: Date range, Status (POSTED/DRAFT/CANCELLED), Source type
- Table: التاريخ | المرجع | البيان | إجمالي المدين | إجمالي الدائن | الحالة
- Detail view: Table of lines per entry:
  - الحساب (code + name) | المدين | الدائن | البيان
- **Balance warning**: Red alert if Debit ≠ Credit
- Actions: ترحيل / Post, تعديل / Edit, عكس / Reverse, حذف / Delete

#### General Ledger / دفتر الأستاذ العام ⭐ (NEW)
- Date range picker (from/to)
- Account selector (optional filter)
- **Summary cards**: إجمالي المدين | إجمالي الدائن | عدد الحسابات
- **Per-account expandable section**:
  - Header: الكود | الاسم | الرصيد الافتتاحي | الرصيد الختامي
  - Table: التاريخ | المرجع | البيان | **المدين** | **الدائن** | **الرصيد الجاري** | المصدر
  - Totals row at bottom

#### Trial Balance / ميزان المراجعة
- Date range picker
- Table: الكود | اسم الحساب | النوع | الرصيد الافتتاحي | إجمالي المدين | إجمالي الدائن | صافي الرصيد | نوع الرصيد
- **Summary row**: المجاميع + الفرق
- **Balanced indicator**: ✅ Green check if balanced, ⚠️ Red warning if not

#### Balance Sheet / الميزانية العمومية
- As-of date picker
- **Two-column layout** (Assets right, Liabilities+Equity left — RTL)
- Sections: الأصول (Current + Fixed) | الالتزامات (Current + Long-term) | حقوق الملكية
- Each section has sub-items + total
- **Must balance validation**: Total Assets = Total Liabilities + Equity (with indicator)

#### Income Statement / قائمة الدخل
- Date range picker
- Sections: الإيرادات | تكلفة البضاعة المباعة | **الربح الإجمالي** (highlighted) | المصاريف التشغيلية | **صافي الربح** (large, bold)
- Percentage of revenue shown

#### Cash Flow / التدفقات النقدية
- Date range picker
- Three sections: الأنشطة التشغيلية | الاستثمارية | التمويلية
- **Net change** highlighted

---

### 4.5 Inventory (المخزون)

**Parts List**:
- Search: Name, Code, Category, Supplier
- Filters: Low stock warning, Warehouse
- Table: رمز القطعة | الاسم | الفئة | الكمية (🔴 red if below min) | سعر الوحدة | القيمة | المستودع | إجراءات

**Part Detail**:
- Image gallery
- Stock history (IN/OUT/ADJUSTMENT)
- Suppliers
- Related services
- Barcode display

---

### 4.6 Customers (العملاء)

**Customer List**:
- Search: Name, Phone, Email, Company
- Table: الاسم | الموبايل | العنوان | الشركة | عدد المركبات | إجمالي الإنفاق | العضوية | الحالة | إجراءات

**Customer Detail**:
- Profile card
- Vehicles list
- Bookings history
- Invoices history
- Payments history
- Loyalty points card
- Buttons: حجز جديد | فاتورة جديدة | إرسال رسالة

---

### 4.7 Mechanics (الميكانيكيون)

**Mechanic Dashboard** (Mobile-first design):
- Today's assignments cards
- Each card: Vehicle (plate, model), Services list, Status toggle, Timer, Notes, Parts used
- Swipe actions: إكمال / Complete, إبلاغ مشكلة / Report Issue

---

### 4.8 HR (الموارد البشرية)

**Employees List**:
- Table: الاسم | الدور (colored badge) | القسم | الموبايل | تاريخ الانضمام | الحالة | الراتب | إجراءات

**Attendance**:
- Calendar view (month grid)
- Day cells: Check-in, Check-out, Status (Present=🟢, Absent=🔴, Late=🟡)
- Bulk actions: Mark all present

**Payroll**:
- Month/year selector
- Table: الموظف | الراتب الأساسي | الإضافي | الاستقطاعات | المكافآت | **صافي الراتب** | الحالة
- Actions: Generate, Approve, Pay

---

### 4.9 Reports (التقارير)

**Reports Hub**:
- Grid of report cards (icon + Arabic title + description)
- Categories: Financial, Operational, Inventory, Customer, Employee
- Each card → Report view with filters + export

**Report View**:
- Collapsible filter panel
- Sortable data table
- **Export buttons**: PDF, Excel, CSV
- Print button
- Chart visualization (when applicable)

---

### 4.10 Admin & Security

**Users Screen**:
- Table: اسم المستخدم | الاسم الكامل | الدور (badge) | الموبايل | الحالة | إجراءات

**RBAC Screen**:
- Roles table: الدور | الوصف | عدد الصلاحيات
- Permission chips (color-coded by category)
- Toggle switches for each permission

**Audit Logs**:
- Table: التاريخ/الوقت | المستخدم | الإجراء (color-coded) | الكيان | IP
- Pagination + filters

**Queue Monitoring**:
- Cards per queue (Notifications, PDF, Reports, Accounting, Inventory)
- Each card shows: Waiting, Active, Completed, Failed counts + progress bar

---

## 5. Shared Components

### Forms
- Input: 48px height, 8px radius, icon prefix optional
- Dropdown: Searchable for long lists
- Date picker: Arabic calendar, range support
- Currency input: Dual SYP + USD with exchange rate
- Account selector: Tree dropdown
- Customer selector: Searchable with phone/vehicle info
- Toggle switch, Radio group, Checkbox group
- File upload: Drag & drop zone

### Tables
- Sortable headers
- Pagination (10, 25, 50, 100)
- Column visibility toggle
- Row actions (3-dot menu or icons)
- Bulk selection checkboxes
- Empty state (icon + message + "Add New" button)
- Skeleton loading rows

### Cards
- KPI Card: Number + label + trend + icon
- Info Card: Title + subtitle + action
- List Card: Avatar + title + subtitle + trailing
- Stat Card: Sparkline + number + comparison

### Modals
- Confirmation: Title + message + Confirm + Cancel
- Form modal: Full form for quick edits
- Detail modal: Read-only with tabs
- Print preview modal

### Feedback
- Toast: Success (green), Error (red), Warning (amber), Info (blue)
- Loading: Circular (buttons), Linear (pages), Skeleton (tables)
- Empty state: Illustrated + message + CTA
- Error state: Illustrated + retry button

---

## 6. Data Visualization

### Dashboard
- Revenue: 7-day bar chart (dual axis SYP+USD)
- Bookings: 7-day line + area chart
- Status: Donut pie chart
- Top Services: Horizontal bar, top 5

### Accounting
- Account balance trend: Line chart
- Expense breakdown: Pie chart
- Revenue vs Expense: Combined bar + line
- Cash flow: Waterfall chart

### Inventory
- Stock levels: Bar chart (red if below min)
- Inventory value: Trend line
- Top moving parts: Horizontal bar

### HR
- Attendance: Calendar heatmap
- Payroll: Pie chart (base, overtime, deductions, bonuses)

---

## 7. Special Screens

### Login
- Centered card
- Logo
- Username, Password (with visibility toggle)
- "تذكرني" checkbox
- "تسجيل الدخول" button (primary, full width)
- Tenant selector

### POS / Cash Register
- Split view: Catalog (right), Cart (left — RTL)
- Cart: Item list, qty adjust, delete, total
- Payment: Cash amount, change, payment method buttons
- Quick actions: خصم / Discount, تعليق / Hold, إلغاء / Cancel, دفع وطباعة / Pay & Print

### Customer Portal (Public) — OUT OF SCOPE
**Note**: This design brief focuses on the **Admin Interface ONLY**. The customer portal is a separate simple static page (not part of this design scope).

---

## 8. Responsive

### Desktop (1200px+)
- Full sidebar 280px
- Multi-column grids
- Full tables

### Tablet (768-1199px)
- Collapsed sidebar (icons only, 72px)
- 1-column grids
- Horizontal scroll tables

### Mobile (<768px)
- Bottom nav bar (5 items max)
- Vertical card lists (tables become cards)
- Full-screen modals → bottom sheets
- FAB for primary action

---

## 9. Known Constraints

### Light Mode ONLY (White Background)
- **NO dark mode**. All screens on pure white (`#FFFFFF`) or cool white (`#F8FAFC`) background
- Cards are white with subtle shadows (NOT dark surfaces)
- Text is dark (`#0F172A`, `#475569`) on light backgrounds
- Shadows create depth instead of glow/border effects
- Module color tints: subtle colored backgrounds for module identity (e.g., Accounting cards have `#EFF6FF` tint, HR has `#F5F3FF` tint)

### Arabic Text
- ALL text Arabic
- Currency after number: `1,250.00 ل.س`
- Percentage after number: `15%`
- Negative: `(1,250.00)` or `-1,250.00`
- Currency alignment: Right-aligned

### Financial Precision
- All amounts: 2 decimal places
- Tabular figures (monospace) in tables
- Dual currency display everywhere

### Performance (ZERO LAG ON DESKTOP)
- **60fps animations**: Every transition, hover, and micro-interaction must be buttery smooth
- **GPU-accelerated**: Only `transform` and `opacity` for animations
- **Virtual scrolling**: Tables with 1000+ rows render only visible rows
- **Lazy loading**: Heavy components (charts, maps, images) load on demand
- **Debounce/throttle**: Scroll, resize, and input events optimized
- **Cleanup**: Animations and listeners cleaned up on dispose
- **Code splitting**: Each module loaded on demand, not all at startup
- **Memory management**: No memory leaks from animations or event listeners
- **Desktop target**: Designed for Windows/Mac desktop app, not mobile web

### Accessibility
- Contrast 4.5:1 minimum
- Keyboard focus indicators
- Screen reader labels for icons
- `prefers-reduced-motion` support for animations

---

## 📎 Deliverables Expected (Admin Interface ONLY)

1. **Design System**:
   - Light mode color tokens (white background + coordinated accents)
   - Typography scale (Arabic-compatible)
   - Spacing scale
   - Shadow system for depth on white
   - Component library with hover/active/loading states
   - Animation specs (durations, easings, stagger delays)

2. **Admin Screens** (all with RTL + animations):
   - Login
   - Dashboard (KPI cards, charts, quick actions, recent activity)
   - Bookings (list, filters, wizard)
   - Invoices (list, detail, form)
   - Accounting (chart of accounts, journal entries, **general ledger**, trial balance, balance sheet, income statement, cash flow)
   - Inventory (parts, warehouses, transactions)
   - Customers (list, detail)
   - HR (employees, attendance, payroll)
   - Reports (hub + individual reports)
   - Admin (users, roles, audit logs, queue monitoring)

3. **Animation System**:
   - Page transition definitions
   - Component interaction specs
   - Loading state animations
   - Chart entrance animations
   - Toast/notification animations

4. **Performance Guidelines**:
   - Animation best practices for 60fps
   - Virtual scrolling patterns
   - Lazy loading recommendations
   - GPU-accelerated motion specs
