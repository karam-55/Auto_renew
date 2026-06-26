import { AuthService } from '../services/auth'
import { Router } from '../router'
import { ApiClient } from '../api/client'

interface MenuGroup {
  label: string
  items: { route: string; label: string; icon: string; badge?: number }[]
}

interface BreadcrumbItem {
  label: string
  route: string
  isRoot?: boolean
}

const BREADCRUMBS: Record<string, BreadcrumbItem[]> = {
  '/dashboard': [{ label: 'الرئيسية', route: '/dashboard', isRoot: true }],
  '/bookings': [{ label: 'الرئيسية', route: '/dashboard' }, { label: 'الحجوزات', route: '/bookings', isRoot: true }],
  '/bookings/new': [{ label: 'الرئيسية', route: '/dashboard' }, { label: 'الحجوزات', route: '/bookings' }, { label: 'حجز جديد', route: '/bookings/new', isRoot: true }],
  '/bookings/existing': [{ label: 'الرئيسية', route: '/dashboard' }, { label: 'الحجوزات', route: '/bookings' }, { label: 'حجز لعميل مسبق', route: '/bookings/existing', isRoot: true }],
  '/invoices': [{ label: 'الرئيسية', route: '/dashboard' }, { label: 'الفواتير', route: '/invoices', isRoot: true }],
  '/invoices/new': [{ label: 'الرئيسية', route: '/dashboard' }, { label: 'الفواتير', route: '/invoices' }, { label: 'فاتورة جديدة', route: '/invoices/new', isRoot: true }],
  '/pos': [{ label: 'الرئيسية', route: '/dashboard' }, { label: 'نقطة البيع', route: '/pos', isRoot: true }],
  '/services': [{ label: 'الرئيسية', route: '/dashboard' }, { label: 'الخدمات', route: '/services', isRoot: true }],
  '/inventory': [{ label: 'الرئيسية', route: '/dashboard' }, { label: 'المخزون', route: '/inventory', isRoot: true }],
  '/inventory/warehouses': [{ label: 'الرئيسية', route: '/dashboard' }, { label: 'المخزون', route: '/inventory' }, { label: 'المستودعات', route: '/inventory/warehouses', isRoot: true }],
  '/inventory/suppliers': [{ label: 'الرئيسية', route: '/dashboard' }, { label: 'المخزون', route: '/inventory' }, { label: 'الموردين', route: '/inventory/suppliers', isRoot: true }],
  '/inventory/purchase-orders': [{ label: 'الرئيسية', route: '/dashboard' }, { label: 'المخزون', route: '/inventory' }, { label: 'طلبات الشراء', route: '/inventory/purchase-orders', isRoot: true }],
  '/customers': [{ label: 'الرئيسية', route: '/dashboard' }, { label: 'العملاء', route: '/customers', isRoot: true }],
  '/dealers': [{ label: 'الرئيسية', route: '/dashboard' }, { label: 'الوكلاء', route: '/dealers', isRoot: true }],
  '/loyalty': [{ label: 'الرئيسية', route: '/dashboard' }, { label: 'برنامج الولاء', route: '/loyalty', isRoot: true }],
  '/accounting': [{ label: 'الرئيسية', route: '/dashboard' }, { label: 'المحاسبة', route: '/accounting', isRoot: true }],
  '/accounting/chart-of-accounts': [{ label: 'الرئيسية', route: '/dashboard' }, { label: 'المحاسبة', route: '/accounting' }, { label: 'شجرة الحسابات', route: '/accounting/chart-of-accounts', isRoot: true }],
  '/accounting/journal-entries': [{ label: 'الرئيسية', route: '/dashboard' }, { label: 'المحاسبة', route: '/accounting' }, { label: 'القيود اليومية', route: '/accounting/journal-entries', isRoot: true }],
  '/accounting/general-ledger': [{ label: 'الرئيسية', route: '/dashboard' }, { label: 'المحاسبة', route: '/accounting' }, { label: 'دفتر الأستاذ', route: '/accounting/general-ledger', isRoot: true }],
  '/accounting/trial-balance': [{ label: 'الرئيسية', route: '/dashboard' }, { label: 'المحاسبة', route: '/accounting' }, { label: 'ميزان المراجعة', route: '/accounting/trial-balance', isRoot: true }],
  '/accounting/balance-sheet': [{ label: 'الرئيسية', route: '/dashboard' }, { label: 'المحاسبة', route: '/accounting' }, { label: 'الميزانية العمومية', route: '/accounting/balance-sheet', isRoot: true }],
  '/accounting/income-statement': [{ label: 'الرئيسية', route: '/dashboard' }, { label: 'المحاسبة', route: '/accounting' }, { label: 'قائمة الدخل', route: '/accounting/income-statement', isRoot: true }],
  '/accounting/cash-flow': [{ label: 'الرئيسية', route: '/dashboard' }, { label: 'المحاسبة', route: '/accounting' }, { label: 'التدفقات النقدية', route: '/accounting/cash-flow', isRoot: true }],
  '/cost-centers': [{ label: 'الرئيسية', route: '/dashboard' }, { label: 'مراكز التكلفة', route: '/cost-centers', isRoot: true }],
  '/assets': [{ label: 'الرئيسية', route: '/dashboard' }, { label: 'الأصول والاستهلاك', route: '/assets', isRoot: true }],
  '/hr': [{ label: 'الرئيسية', route: '/dashboard' }, { label: 'الموارد البشرية', route: '/hr', isRoot: true }],
  '/workshop-map': [{ label: 'الرئيسية', route: '/dashboard' }, { label: 'خريطة الورشة', route: '/workshop-map', isRoot: true }],
  '/reports': [{ label: 'الرئيسية', route: '/dashboard' }, { label: 'التقارير', route: '/reports', isRoot: true }],
  '/analytics': [{ label: 'الرئيسية', route: '/dashboard' }, { label: 'التحليلات', route: '/analytics', isRoot: true }],
  '/branches': [{ label: 'الرئيسية', route: '/dashboard' }, { label: 'الفروع', route: '/branches', isRoot: true }],
  '/notifications': [{ label: 'الرئيسية', route: '/dashboard' }, { label: 'التنبيهات', route: '/notifications', isRoot: true }],
  '/documents': [{ label: 'الرئيسية', route: '/dashboard' }, { label: 'أرشيف المستندات', route: '/documents', isRoot: true }],
  '/admin': [{ label: 'الرئيسية', route: '/dashboard' }, { label: 'الإدارة والأمان', route: '/admin', isRoot: true }],
  '/admin/settings': [{ label: 'الرئيسية', route: '/dashboard' }, { label: 'الإدارة والأمان', route: '/admin' }, { label: 'إعدادات النظام', route: '/admin/settings', isRoot: true }],
  '/admin/setup': [{ label: 'الرئيسية', route: '/dashboard' }, { label: 'الإدارة والأمان', route: '/admin' }, { label: 'إعدادات أولية', route: '/admin/setup', isRoot: true }],
  '/users': [{ label: 'الرئيسية', route: '/dashboard' }, { label: 'المستخدمون', route: '/users', isRoot: true }],
  '/roles': [{ label: 'الرئيسية', route: '/dashboard' }, { label: 'الأدوار', route: '/roles', isRoot: true }],
  '/audit': [{ label: 'الرئيسية', route: '/dashboard' }, { label: 'سجل التدقيق', route: '/audit', isRoot: true }],
}

const MENU_GROUPS: MenuGroup[] = [
  {
    label: 'الرئيسية',
    items: [
      { route: '/dashboard', label: 'لوحة التحكم', icon: 'dashboard' },
    ]
  },
  {
    label: 'العمليات',
    items: [
      { route: '/bookings', label: 'الحجوزات', icon: 'calendar_month' },
      { route: '/invoices', label: 'الفواتير', icon: 'receipt_long' },
      { route: '/pos', label: 'نقطة البيع', icon: 'point_of_sale' },
      { route: '/services', label: 'الخدمات', icon: 'build' },
      { route: '/inventory', label: 'المخزون', icon: 'inventory_2' },
      { route: '/inventory/warehouses', label: 'المستودعات', icon: 'warehouse' },
      { route: '/inventory/suppliers', label: 'الموردين', icon: 'local_shipping' },
      { route: '/inventory/purchase-orders', label: 'طلبات الشراء', icon: 'shopping_cart' },
      { route: '/customers', label: 'العملاء', icon: 'group' },
      { route: '/dealers', label: 'الوكلاء', icon: 'business_center' },
      { route: '/loyalty', label: 'برنامج الولاء', icon: 'loyalty' },
    ]
  },
  {
    label: 'المالية',
    items: [
      { route: '/accounting', label: 'المحاسبة', icon: 'account_balance_wallet' },
      { route: '/accounting/chart-of-accounts', label: 'شجرة الحسابات', icon: 'account_tree' },
      { route: '/accounting/journal-entries', label: 'القيود اليومية', icon: 'receipt' },
      { route: '/accounting/general-ledger', label: 'دفتر الأستاذ', icon: 'menu_book' },
      { route: '/accounting/trial-balance', label: 'ميزان المراجعة', icon: 'scale' },
      { route: '/accounting/balance-sheet', label: 'الميزانية العمومية', icon: 'balance' },
      { route: '/accounting/income-statement', label: 'قائمة الدخل', icon: 'trending_up' },
      { route: '/accounting/cash-flow', label: 'التدفقات النقدية', icon: 'payments' },
      { route: '/cost-centers', label: 'مراكز التكلفة', icon: 'account_tree' },
      { route: '/assets', label: 'الأصول والاستهلاك', icon: 'precision_manufacturing' },
    ]
  },
  {
    label: 'الموارد',
    items: [
      { route: '/hr', label: 'الموارد البشرية', icon: 'badge' },
      { route: '/workshop-map', label: 'خريطة الورشة', icon: 'map' },
    ]
  },
  {
    label: 'التقارير',
    items: [
      { route: '/reports', label: 'التقارير', icon: 'analytics' },
      { route: '/analytics', label: 'التحليلات', icon: 'insights' },
    ]
  },
  {
    label: 'الإدارة',
    items: [
      { route: '/branches', label: 'الفروع', icon: 'storefront' },
      { route: '/notifications', label: 'التنبيهات', icon: 'notifications' },
      { route: '/documents', label: 'أرشيف المستندات', icon: 'folder' },
      { route: '/admin', label: 'الإدارة والأمان', icon: 'admin_panel_settings' },
      { route: '/admin/settings', label: 'إعدادات النظام', icon: 'settings' },
      { route: '/admin/setup', label: 'إعدادات أولية', icon: 'tune' },
    ]
  },
]

export class AppLayout {
  private auth: AuthService
  private router: Router
  private api: ApiClient | null
  private title: string
  private activeRoute: string
  private resizeHandler: (() => void) | null = null
  private escHandler: ((e: KeyboardEvent) => void) | null = null
  private keyboardShortcutsHandler: ((e: KeyboardEvent) => void) | null = null
  private goKeyPending = false

  constructor(auth: AuthService, router: Router, title: string, activeRoute: string, api: ApiClient | null = null) {
    this.auth = auth
    this.router = router
    this.api = api
    this.title = title
    this.activeRoute = activeRoute
  }

  destroy() {
    if (this.resizeHandler) window.removeEventListener('resize', this.resizeHandler)
    if (this.escHandler)    document.removeEventListener('keydown', this.escHandler)
    if (this.keyboardShortcutsHandler) document.removeEventListener('keydown', this.keyboardShortcutsHandler)
    this.resizeHandler = null
    this.escHandler    = null
    this.keyboardShortcutsHandler = null
    this.goKeyPending = false
  }

  private renderBreadcrumbs(): string {
    const currentRoute = '/' + (this.activeRoute || 'dashboard')
    const crumbs = BREADCRUMBS[currentRoute] || BREADCRUMBS[this.activeRoute] || [{ label: 'الرئيسية', route: '/dashboard' }, { label: this.title, route: currentRoute, isRoot: true }]

    if (crumbs.length <= 1) return ''

    return `
      <nav class="breadcrumb mb-4" aria-label="مسار التنقل">
        ${crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1
          return `
            ${index > 0 ? '<span class="breadcrumb-separator" aria-hidden="true">/</span>' : ''}
            ${isLast
              ? `<span class="breadcrumb-item active" aria-current="page">${crumb.label}</span>`
              : `<a href="${crumb.route}" class="breadcrumb-item hover:text-primary hover:underline transition-colors" data-route="${crumb.route}">${crumb.label}</a>`
            }
          `
        }).join('')}
      </nav>
    `
  }

  render(content: HTMLElement): HTMLElement {
    const wrapper = document.createElement('div')
    wrapper.className = 'min-h-screen bg-background font-ibmPlexSans text-on-surface'
    wrapper.innerHTML = `
      <!-- Skip to main content link for keyboard users -->
      <a href="#main-content" class="sr-only sr-only-focusable" id="skip-link">
        انتقل إلى المحتوى الرئيسي
      </a>

      <!-- Mobile Sidebar Overlay -->
      <div class="sidebar-overlay" id="sidebar-overlay" aria-hidden="true"></div>

      <!-- Sidebar -->
      <aside id="app-sidebar" class="sidebar fixed right-[24px] top-[16px] h-[calc(100vh-32px)] flex flex-col z-50 rounded-2xl glass-panel border-l border-glass-border shadow-[0_8px_32px_0_rgba(227,30,36,0.08)] overflow-hidden" style="width:280px" role="navigation" aria-label="القائمة الجانبية">
        <!-- Sidebar Header -->
        <div class="p-6 flex flex-col items-center relative" style="border-bottom:1px solid rgba(255,255,255,0.4)">
          <!-- Close button (mobile only) -->
          <button class="hamburger-btn touch-safe absolute left-4 top-4" id="sidebar-close-btn" aria-label="إغلاق القائمة" style="display:none">
            <span class="material-symbols-outlined" aria-hidden="true">close</span>
          </button>
          <div class="w-14 h-14 rounded-xl flex items-center justify-center mb-3 shadow-lg shadow-primary/20 relative overflow-hidden group cursor-pointer" data-route="/dashboard">
            <img src="/logo.png" alt="Auto Renew logo" class="w-12 h-12 object-contain" />
          </div>
          <h2 class="font-bold text-xl text-primary font-beVietnamPro">Auto Renew</h2>
          <p class="text-xs mt-1 text-on-surface-variant">الإدارة المتقدمة</p>
        </div>
        <!-- Sidebar Search -->
        <div class="px-4 py-3" style="border-bottom:1px solid rgba(255,255,255,0.4)">
          <div class="relative">
            <span class="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]" aria-hidden="true">search</span>
            <input id="sidebar-search" type="text" class="w-full h-10 bg-white/40 border border-glass-border rounded-lg pr-10 pl-4 text-sm text-on-surface placeholder:text-on-surface-variant input-glow transition-all focus:bg-white/60" placeholder="البحث في القائمة..." aria-label="البحث في القائمة الجانبية" autocomplete="off" />
          </div>
        </div>
        <!-- Navigation -->
        <nav id="sidebar-nav" class="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-2 custom-scrollbar">
          ${MENU_GROUPS.map((group, gi) => `
            <div class="menu-group" data-group-index="${gi}">
              <button class="menu-group-header w-full flex items-center justify-between px-4 py-2 rounded-lg transition-colors hover:bg-white/40 text-on-surface-variant" style="font-size:12px" aria-expanded="true" aria-controls="menu-group-${gi}">
                <span class="text-xs font-semibold">${group.label}</span>
                <span class="material-symbols-outlined text-[18px] transition-transform" aria-hidden="true">expand_more</span>
              </button>
              <div class="menu-group-items flex flex-col gap-1 mt-1" id="menu-group-${gi}">
                ${group.items.map((item, ii) => {
                  const isActive = this.activeRoute === item.icon || this.activeRoute === item.route.replace('/', '')
                  return `
                    <a href="${item.route}" class="sidebar-nav-item flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative ${isActive ? 'text-primary font-bold bg-primary-container/10 border-r-4 border-primary rounded-l-full nav-active-glow' : 'text-on-surface-variant hover:bg-white/40 hover:text-primary hover:translate-x-[-8px]'}" data-route="${item.route}" data-label="${item.label}" data-group="${group.label}" style="animation-delay: ${(gi + 1) * 100 + ii * 50}ms">
                      <span class="material-symbols-outlined transition-all duration-300 group-hover:scale-110" style="font-variation-settings:'FILL' ${isActive ? '1' : '0'};${isActive ? '' : 'color:#737685'}">${item.icon}</span>
                      <span class="text-sm">${item.label}</span>
                      ${item.route === '/bookings' ? `<span id="bookings-badge" class="mr-auto text-xs font-bold px-2 py-0.5 rounded-full hidden bg-error text-white">0</span>` : ''}
                    </a>
                  `
                }).join('')}
              </div>
            </div>
          `).join('')}
        </nav>
        <!-- Footer -->
        <div class="p-4" style="border-top:1px solid rgba(255,255,255,0.4)">
          <button class="w-full py-3 rounded-xl font-semibold text-sm shadow-lg hover:shadow-primary-glow/40 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 mb-4 text-white btn-primary-gradient touch-safe" id="add-new-btn">
            <span class="material-symbols-outlined text-[20px]" aria-hidden="true">add</span>
            إضافة جديد
          </button>
          <button class="w-full flex items-center justify-center gap-2 py-3 rounded-xl transition-all text-sm hover:bg-error-container/20 text-error touch-safe" id="logout-btn">
            <span class="material-symbols-outlined text-[20px]" aria-hidden="true">logout</span>
            تسجيل الخروج
          </button>
        </div>
      </aside>

      <!-- TopBar -->
      <nav id="app-topbar" class="topbar-responsive fixed top-[16px] left-[24px] right-[324px] z-40 glass-panel rounded-xl border border-glass-border shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] h-16 flex flex-row-reverse justify-between items-center px-4 gap-3">
        <!-- Right: title + hamburger -->
        <div class="flex items-center gap-3 min-w-0">
          <button class="hamburger-btn touch-safe" id="hamburger-btn" aria-label="فتح القائمة" aria-expanded="false" aria-controls="app-sidebar">
            <span class="material-symbols-outlined" aria-hidden="true">menu</span>
          </button>
          <h1 class="font-bold text-lg text-on-surface font-beVietnamPro truncate">${this.title}</h1>
        </div>
        <!-- Left: search + actions -->
        <div class="flex items-center gap-2 flex-shrink-0">
          <div class="relative search-hide-mobile">
            <span class="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant" style="font-size:18px">search</span>
            <input class="h-9 pl-4 pr-9 rounded-full border border-glass-border bg-white/50 outline-none text-sm input-glow transition-all text-on-surface placeholder-on-surface-variant" style="width:14rem" placeholder="بحث..." type="text" aria-label="بحث"/>
          </div>
          <button id="theme-toggle" class="touch-safe p-2 transition-all relative rounded-full hover:bg-primary-container/10 text-on-surface-variant" aria-label="تبديل الوضع الداكن">
            <span class="material-symbols-outlined transition-transform hover:scale-110" style="font-size:22px;font-variation-settings:'FILL' 0" aria-hidden="true" id="theme-icon">dark_mode</span>
          </button>
          <button class="touch-safe p-2 transition-all relative rounded-full hover:bg-primary-container/10 text-on-surface-variant" data-route="/notifications" aria-label="التنبيهات">
            <span class="material-symbols-outlined transition-transform hover:scale-110" style="font-size:22px;font-variation-settings:'FILL' 0" aria-hidden="true">notifications</span>
            <span id="notif-badge" class="absolute top-1.5 right-1.5 w-2 h-2 rounded-full ring-2 hidden bg-error ring-white/70" aria-hidden="true"></span>
          </button>
          <button id="profile-btn" class="touch-safe flex items-center gap-2 hover:bg-white/50 p-1 pr-2 rounded-full transition-all" aria-label="الملف الشخصي">
            <span class="text-sm hidden sm:block text-on-surface font-semibold max-w-[100px] truncate">${this.auth.getUser()?.fullName || 'المسؤول'}</span>
            <div class="w-8 h-8 rounded-full flex items-center justify-center font-bold overflow-hidden border-2 border-primary/20 bg-primary-fixed text-primary flex-shrink-0 touch-safe" aria-hidden="true">
              <span class="material-symbols-outlined text-[16px]" style="font-variation-settings:'FILL' 1" aria-hidden="true">person</span>
            </div>
          </button>
        </div>
      </nav>

      <!-- Main Content -->
      <main id="main-content" class="main-content-responsive flex-1 min-h-screen bg-orbs pt-[96px] pr-[320px] pl-[24px] pb-[24px] transition-all duration-300">
        <div class="page-content max-w-full mx-auto">
          ${this.renderBreadcrumbs()}
        </div>
      </main>

      <!-- Global Command Palette -->
      <div id="command-palette" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] hidden items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="command-palette-title">
        <div class="bg-surface-container-lowest rounded-2xl shadow-2xl border border-border w-full max-w-lg overflow-hidden">
          <div class="p-4 border-b border-border flex items-center gap-3">
            <span class="material-symbols-outlined text-on-surface-variant" aria-hidden="true">search</span>
            <input id="command-palette-input" type="text" class="flex-1 bg-transparent outline-none text-on-surface placeholder-on-surface-variant text-base" placeholder="البحث السريع... (Ctrl+K)" aria-label="البحث السريع" autocomplete="off" />
            <kbd class="hidden sm:inline-block px-2 py-1 text-xs bg-surface-container-high rounded text-on-surface-variant">ESC</kbd>
          </div>
          <div id="command-palette-results" class="max-h-[60vh] overflow-y-auto p-2"></div>
          <div class="p-3 border-t border-border text-xs text-on-surface-variant flex items-center justify-between">
            <span>↑↓ للتنقل، Enter للاختيار</span>
            <span>Ctrl+K للفتح</span>
          </div>
        </div>
      </div>

      <!-- Keyboard Shortcuts Help -->
      <div id="shortcuts-help" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] hidden items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="shortcuts-help-title">
        <div class="bg-surface-container-lowest rounded-2xl shadow-2xl border border-border w-full max-w-md p-6 space-y-4">
          <div class="flex items-center justify-between">
            <h2 id="shortcuts-help-title" class="font-headline-md text-on-surface font-bold">اختصارات لوحة المفاتيح</h2>
            <button id="close-shortcuts-help" class="touch-safe w-8 h-8 rounded-full flex items-center justify-center text-text-tertiary hover:text-error transition-colors" aria-label="إغلاق نافذة الاختصارات"><span class="material-symbols-outlined" aria-hidden="true">close</span></button>
          </div>
          <div class="space-y-3 text-sm">
            <div class="flex items-center justify-between py-2 border-b border-border">
              <span class="text-on-surface">فتح البحث السريع</span>
              <div class="flex gap-1"><kbd class="px-2 py-1 bg-surface-container-high rounded text-on-surface-variant">Ctrl</kbd><kbd class="px-2 py-1 bg-surface-container-high rounded text-on-surface-variant">K</kbd></div>
            </div>
            <div class="flex items-center justify-between py-2 border-b border-border">
              <span class="text-on-surface">إظهار الاختصارات</span>
              <div class="flex gap-1"><kbd class="px-2 py-1 bg-surface-container-high rounded text-on-surface-variant">?</kbd></div>
            </div>
            <div class="flex items-center justify-between py-2 border-b border-border">
              <span class="text-on-surface">الصفحة الرئيسية</span>
              <div class="flex gap-1"><kbd class="px-2 py-1 bg-surface-container-high rounded text-on-surface-variant">G</kbd><kbd class="px-2 py-1 bg-surface-container-high rounded text-on-surface-variant">H</kbd></div>
            </div>
            <div class="flex items-center justify-between py-2 border-b border-border">
              <span class="text-on-surface">الحجوزات</span>
              <div class="flex gap-1"><kbd class="px-2 py-1 bg-surface-container-high rounded text-on-surface-variant">G</kbd><kbd class="px-2 py-1 bg-surface-container-high rounded text-on-surface-variant">B</kbd></div>
            </div>
            <div class="flex items-center justify-between py-2 border-b border-border">
              <span class="text-on-surface">الفواتير</span>
              <div class="flex gap-1"><kbd class="px-2 py-1 bg-surface-container-high rounded text-on-surface-variant">G</kbd><kbd class="px-2 py-1 bg-surface-container-high rounded text-on-surface-variant">I</kbd></div>
            </div>
            <div class="flex items-center justify-between py-2 border-b border-border">
              <span class="text-on-surface">العملاء</span>
              <div class="flex gap-1"><kbd class="px-2 py-1 bg-surface-container-high rounded text-on-surface-variant">G</kbd><kbd class="px-2 py-1 bg-surface-container-high rounded text-on-surface-variant">C</kbd></div>
            </div>
            <div class="flex items-center justify-between py-2">
              <span class="text-on-surface">إغلاق النافذة/القائمة</span>
              <div class="flex gap-1"><kbd class="px-2 py-1 bg-surface-container-high rounded text-on-surface-variant">Esc</kbd></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Onboarding Overlay -->
      <div id="onboarding-overlay" class="fixed inset-0 z-[70] hidden flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
        <div id="onboarding-backdrop" class="absolute inset-0 bg-black/70 transition-all duration-300"></div>
        <div id="onboarding-spotlight" class="absolute rounded-xl ring-[3px] ring-primary shadow-[0_0_0_9999px_rgba(0,0,0,0.7)] transition-all duration-300 pointer-events-none"></div>
        <div id="onboarding-card" class="relative bg-surface-container-lowest rounded-2xl shadow-2xl border border-border p-6 w-full max-w-[420px] transition-all duration-300 z-[71]">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <span class="material-symbols-outlined text-2xl" aria-hidden="true">school</span>
            </div>
            <div>
              <h3 id="onboarding-title" class="font-headline-md text-lg font-bold text-on-surface">مرحباً بك</h3>
              <p id="onboarding-step" class="text-xs text-on-surface-variant mt-0.5">الخطوة 1 من 4</p>
            </div>
          </div>
          <p id="onboarding-text" class="text-base text-on-surface-variant mb-6 leading-relaxed">تعرف على أهم ميزات النظام.</p>
          <div id="onboarding-target-label" class="hidden mb-6 p-3 rounded-xl bg-primary/5 border border-primary/10 text-sm text-on-surface flex items-center gap-2">
            <span class="material-symbols-outlined text-primary text-base" aria-hidden="true">location_on</span>
            <span id="onboarding-target-text"></span>
          </div>
          <div class="flex items-center justify-center gap-2 mb-6">
            ${[0, 1, 2, 3].map((i) => `<span class="onboarding-dot w-2 h-2 rounded-full bg-on-surface-variant/30 transition-colors" data-index="${i}"></span>`).join('')}
          </div>
          <div class="flex items-center justify-between gap-3">
            <button id="onboarding-skip" class="text-sm text-on-surface-variant hover:text-error transition-colors px-3 py-2 rounded-lg hover:bg-error/5">تخطي</button>
            <div class="flex items-center gap-2">
              <button id="onboarding-prev" class="hidden px-4 py-2 rounded-xl text-sm font-semibold text-on-surface bg-surface-container-high hover:bg-surface-container-highest transition-colors border border-border">السابق</button>
              <button id="onboarding-next" class="btn-primary-gradient text-white px-6 py-2 rounded-xl text-sm font-semibold hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/25">التالي</button>
            </div>
          </div>
        </div>
      </div>
    `

    const pageContent = wrapper.querySelector('.page-content')!
    pageContent.appendChild(content)

    // Register self with router so it can call destroy() on navigation
    if (typeof (this.router as any).setCurrentLayout === 'function') {
      (this.router as any).setCurrentLayout(this)
    }

    // ── Nav links (event delegation to handle dynamically added links) ──
    wrapper.addEventListener('click', (e) => {
      const item = (e.target as HTMLElement).closest('a[data-route]') as HTMLElement | null
      if (!item) return
      e.preventDefault()
      const route = item.getAttribute('data-route')
      if (route) {
        this.router.navigate(route)
      }
    })

    // ── Sidebar search filter ──
    const sidebarSearch = wrapper.querySelector('#sidebar-search') as HTMLInputElement | null
    if (sidebarSearch) {
      sidebarSearch.addEventListener('input', () => {
        const query = sidebarSearch.value.trim().toLowerCase()
        const nav = wrapper.querySelector('#sidebar-nav') as HTMLElement
        if (!nav) return
        const groups = nav.querySelectorAll('.menu-group')
        groups.forEach(group => {
          const items = group.querySelectorAll('.sidebar-nav-item')
          let hasMatch = false
          items.forEach(item => {
            const label = item.getAttribute('data-label') || ''
            const groupName = item.getAttribute('data-group') || ''
            const match = !query || label.toLowerCase().includes(query) || groupName.toLowerCase().includes(query)
            ;(item as HTMLElement).style.display = match ? 'flex' : 'none'
            if (match) hasMatch = true
          })
          ;(group as HTMLElement).style.display = hasMatch ? 'flex' : 'none'
        })
      })
    }

    // ── Menu group toggles ──
    wrapper.querySelectorAll('.menu-group-header').forEach(header => {
      header.addEventListener('click', () => {
        const group = header.closest('.menu-group')!
        group.classList.toggle('open')
        const chevron = header.querySelector('.material-symbols-outlined') as HTMLElement
        if (chevron) chevron.style.transform = group.classList.contains('open') ? 'rotate(180deg)' : ''
      })
    })

    // ── Theme toggle ──
    const themeToggle = wrapper.querySelector('#theme-toggle') as HTMLButtonElement | null
    const themeIcon = wrapper.querySelector('#theme-icon') as HTMLElement | null
    const updateThemeIcon = (isDark: boolean) => {
      if (themeIcon) themeIcon.textContent = isDark ? 'light_mode' : 'dark_mode'
      if (themeToggle) themeToggle.setAttribute('aria-label', isDark ? 'تبديل إلى الوضع الفاتح' : 'تبديل إلى الوضع الداكن')
    }
    if (themeToggle) {
      const applyTheme = (dark: boolean) => {
        if (dark) {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
        localStorage.setItem('admin-theme', dark ? 'dark' : 'light')
        updateThemeIcon(dark)
      }
      const saved = localStorage.getItem('admin-theme')
      const prefersDark = saved ? saved === 'dark' : false
      applyTheme(prefersDark)

      themeToggle.addEventListener('click', () => {
        const isDark = document.documentElement.classList.contains('dark')
        applyTheme(!isDark)
      })
    }

    // ── Hamburger (open) ──
    wrapper.querySelector('#hamburger-btn')?.addEventListener('click', () => {
      this.openSidebar(wrapper)
    })

    // ── Sidebar close button (mobile) ──
    wrapper.querySelector('#sidebar-close-btn')?.addEventListener('click', () => {
      this.closeSidebar(wrapper)
    })

    // ── Overlay click (close sidebar) ──
    wrapper.querySelector('#sidebar-overlay')?.addEventListener('click', () => {
      this.closeSidebar(wrapper)
    })

    // ── ESC key closes sidebar (unless a modal overlay is open) ──
    this.escHandler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      const openModal = document.querySelector('.fixed.inset-0:not(.hidden)')
      if (openModal) return
      this.closeSidebar(wrapper)
    }
    document.addEventListener('keydown', this.escHandler)

    // ── Keyboard shortcuts ──
    this.keyboardShortcutsHandler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const isTyping = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable)

      // Close command palette / shortcuts help on Escape
      if (e.key === 'Escape') {
        const palette = wrapper.querySelector('#command-palette') as HTMLElement
        const help = wrapper.querySelector('#shortcuts-help') as HTMLElement
        if (palette && !palette.classList.contains('hidden')) {
          this.hideCommandPalette(wrapper)
          e.stopPropagation()
          return
        }
        if (help && !help.classList.contains('hidden')) {
          this.hideShortcutsHelp(wrapper)
          e.stopPropagation()
          return
        }
      }

      // Ctrl+K / Cmd+K opens command palette
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        this.showCommandPalette(wrapper)
        return
      }

      // ? shows shortcuts help (unless typing)
      if (!isTyping && e.key === '?') {
        e.preventDefault()
        this.showShortcutsHelp(wrapper)
        return
      }

      // Go to routes: G then H/B/I/C
      if (!isTyping && e.key.toLowerCase() === 'g') {
        this.goKeyPending = true
        setTimeout(() => { this.goKeyPending = false }, 1000)
        return
      }
      if (this.goKeyPending && !isTyping) {
        const key = e.key.toLowerCase()
        const routes: Record<string, string> = { h: '/dashboard', b: '/bookings', i: '/invoices', c: '/customers' }
        if (routes[key]) {
          e.preventDefault()
          this.goKeyPending = false
          this.router.navigate(routes[key])
        }
      }
    }
    document.addEventListener('keydown', this.keyboardShortcutsHandler)

    // ── Command palette input ──
    const paletteInput = wrapper.querySelector('#command-palette-input') as HTMLInputElement | null
    const paletteResults = wrapper.querySelector('#command-palette-results') as HTMLElement | null
    if (paletteInput && paletteResults) {
      paletteInput.addEventListener('input', () => this.renderCommandPaletteResults(wrapper, paletteInput.value))
      paletteInput.addEventListener('keydown', (e) => this.handleCommandPaletteKeydown(e, wrapper))
    }

    // ── Command palette item click ──
    paletteResults?.addEventListener('click', (e) => {
      const item = (e.target as HTMLElement).closest('[data-route]') as HTMLElement | null
      if (!item) return
      const route = item.getAttribute('data-route')
      if (route) {
        this.hideCommandPalette(wrapper)
        this.router.navigate(route)
      }
    })

    // ── Click outside to close command palette / shortcuts help ──
    const palette = wrapper.querySelector('#command-palette') as HTMLElement
    if (palette) {
      palette.addEventListener('click', (e) => {
        if (e.target === palette) this.hideCommandPalette(wrapper)
      })
    }
    const help = wrapper.querySelector('#shortcuts-help') as HTMLElement
    if (help) {
      help.addEventListener('click', (e) => {
        if (e.target === help) this.hideShortcutsHelp(wrapper)
      })
    }

    // ── Close shortcuts help ──
    wrapper.querySelector('#close-shortcuts-help')?.addEventListener('click', () => {
      this.hideShortcutsHelp(wrapper)
    })

    // ── Responsive: update layout on resize ──
    const updateLayout = () => {
      const isMobile = window.innerWidth <= 1024
      const sidebar  = wrapper.querySelector('#app-sidebar') as HTMLElement
      const topbar   = wrapper.querySelector('#app-topbar') as HTMLElement
      const main     = wrapper.querySelector('#app-main') as HTMLElement
      const closeBtn = wrapper.querySelector('#sidebar-close-btn') as HTMLElement

      if (isMobile) {
        if (topbar) { topbar.style.right = '24px'; topbar.style.left = '24px' }
        if (main)   { main.style.paddingRight = '16px'; main.style.paddingLeft = '16px' }
        if (closeBtn) closeBtn.style.display = 'flex'
        // Hide sidebar by default on mobile (CSS handles transform)
      } else {
        if (topbar) { topbar.style.right = '324px'; topbar.style.left = '24px' }
        if (main)   { main.style.paddingRight = '320px'; main.style.paddingLeft = '24px' }
        if (closeBtn) closeBtn.style.display = 'none'
        // Ensure sidebar is always visible on desktop
        if (sidebar) sidebar.classList.remove('sidebar-open')
        const overlay = wrapper.querySelector('#sidebar-overlay') as HTMLElement
        if (overlay) overlay.classList.remove('visible')
      }
    }

    this.resizeHandler = updateLayout
    window.addEventListener('resize', this.resizeHandler)
    updateLayout() // run on init

    // ── Brand icon click ──
    wrapper.querySelector('[data-route="/dashboard"]')?.addEventListener('click', (e) => {
      e.preventDefault()
      this.router.navigate('/dashboard')
    })

    // ── Add new button ──
    wrapper.querySelector('#add-new-btn')?.addEventListener('click', () => {
      this.closeSidebar(wrapper)
      this.router.navigate('/bookings/new')
    })

    // ── Notifications ──
    const notifBtn = wrapper.querySelector('nav [data-route="/notifications"]')
    if (notifBtn) {
      notifBtn.addEventListener('click', (e) => {
        e.preventDefault()
        this.router.navigate('/notifications')
      })
    }

    // ── Profile ──
    wrapper.querySelector('#profile-btn')?.addEventListener('click', () => {
      this.router.navigate('/admin/settings')
    })

    // ── Logout ──
    wrapper.querySelector('#logout-btn')?.addEventListener('click', () => {
      this.auth.logout()
      this.router.navigate('/login')
    })

    // ── Badge counts ──
    this.fetchBookingsBadge()
    this.fetchNotificationsBadge()

    // ── Onboarding (first-time users only) ──
    const onboardingSeen = localStorage.getItem('admin-onboarding-seen')
    if (!onboardingSeen) {
      setTimeout(() => this.startOnboarding(wrapper), 800)
    }

    return wrapper
  }

  private openSidebar(wrapper: HTMLElement) {
    const sidebar  = wrapper.querySelector('#app-sidebar') as HTMLElement
    const overlay  = wrapper.querySelector('#sidebar-overlay') as HTMLElement
    const hamburger = wrapper.querySelector('#hamburger-btn') as HTMLElement
    if (sidebar)  sidebar.classList.add('sidebar-open')
    if (overlay)  overlay.classList.add('visible')
    if (hamburger) hamburger.setAttribute('aria-expanded', 'true')
    document.body.style.overflow = 'hidden'
  }

  private closeSidebar(wrapper: HTMLElement) {
    const sidebar  = wrapper.querySelector('#app-sidebar') as HTMLElement
    const overlay  = wrapper.querySelector('#sidebar-overlay') as HTMLElement
    const hamburger = wrapper.querySelector('#hamburger-btn') as HTMLElement
    if (sidebar)  sidebar.classList.remove('sidebar-open')
    if (overlay)  overlay.classList.remove('visible')
    if (hamburger) hamburger.setAttribute('aria-expanded', 'false')
    document.body.style.overflow = ''
  }

  private showCommandPalette(wrapper: HTMLElement) {
    const palette = wrapper.querySelector('#command-palette') as HTMLElement
    const input = wrapper.querySelector('#command-palette-input') as HTMLInputElement
    if (!palette || !input) return
    palette.classList.remove('hidden')
    palette.classList.add('flex')
    input.value = ''
    input.focus()
    this.renderCommandPaletteResults(wrapper, '')
  }

  private hideCommandPalette(wrapper: HTMLElement) {
    const palette = wrapper.querySelector('#command-palette') as HTMLElement
    if (!palette) return
    palette.classList.add('hidden')
    palette.classList.remove('flex')
  }

  private showShortcutsHelp(wrapper: HTMLElement) {
    const help = wrapper.querySelector('#shortcuts-help') as HTMLElement
    if (!help) return
    help.classList.remove('hidden')
    help.classList.add('flex')
    ;(help.querySelector('#close-shortcuts-help') as HTMLElement)?.focus()
  }

  private hideShortcutsHelp(wrapper: HTMLElement) {
    const help = wrapper.querySelector('#shortcuts-help') as HTMLElement
    if (!help) return
    help.classList.add('hidden')
    help.classList.remove('flex')
  }

  private getCommandPaletteItems(): Array<{ label: string; route: string; icon: string; keywords: string }> {
    const items: Array<{ label: string; route: string; icon: string; keywords: string }> = []
    for (const group of MENU_GROUPS) {
      for (const item of group.items) {
        items.push({ label: item.label, route: item.route, icon: item.icon, keywords: `${item.label} ${group.label}` })
      }
    }
    return items
  }

  private renderCommandPaletteResults(wrapper: HTMLElement, query: string) {
    const results = wrapper.querySelector('#command-palette-results') as HTMLElement
    if (!results) return
    const q = query.trim().toLowerCase()
    const items = this.getCommandPaletteItems().filter(item => item.keywords.toLowerCase().includes(q))
    if (items.length === 0) {
      results.innerHTML = `<div class="p-4 text-center text-on-surface-variant text-sm">لا توجد نتائج</div>`
      return
    }
    results.innerHTML = items.map((item, idx) => `
      <button class="command-palette-item w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-surface-container-high transition-colors text-right ${idx === 0 ? 'bg-surface-container-high/50' : ''}" data-route="${item.route}" data-index="${idx}">
        <span class="material-symbols-outlined text-on-surface-variant" aria-hidden="true">${item.icon}</span>
        <span class="text-on-surface text-sm">${item.label}</span>
      </button>
    `).join('')
  }

  private handleCommandPaletteKeydown(e: KeyboardEvent, wrapper: HTMLElement) {
    const results = wrapper.querySelector('#command-palette-results') as HTMLElement
    if (!results) return
    const items = results.querySelectorAll('.command-palette-item') as NodeListOf<HTMLElement>
    if (!items.length) return

    let activeIndex = Array.from(items).findIndex(item => item.classList.contains('bg-surface-container-high'))
    if (activeIndex < 0) activeIndex = 0

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      items[activeIndex].classList.remove('bg-surface-container-high', 'bg-surface-container-high/50')
      activeIndex = (activeIndex + 1) % items.length
      items[activeIndex].classList.add('bg-surface-container-high')
      items[activeIndex].scrollIntoView({ block: 'nearest' })
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      items[activeIndex].classList.remove('bg-surface-container-high', 'bg-surface-container-high/50')
      activeIndex = (activeIndex - 1 + items.length) % items.length
      items[activeIndex].classList.add('bg-surface-container-high')
      items[activeIndex].scrollIntoView({ block: 'nearest' })
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const route = items[activeIndex].getAttribute('data-route')
      if (route) {
        this.hideCommandPalette(wrapper)
        this.router.navigate(route)
      }
    }
  }

  private async fetchBookingsBadge() {
    if (!this.api) return
    try {
      const res = await this.api.get<any>('/api/bookings?status=PENDING&limit=1')
      if (res.success) {
        const count = res.meta?.total ?? 0
        const badge = document.getElementById('bookings-badge')
        if (badge && count > 0) {
          badge.textContent = count.toString()
          badge.classList.remove('hidden')
        }
      }
    } catch (e) {
      // Silently fail if API is unavailable
    }
  }

  private async fetchNotificationsBadge() {
    if (!this.api) return
    try {
      const res = await this.api.get<any>('/api/notifications/unread-count')
      if (res.success) {
        const count = (res.data?.count as number) ?? 0
        const badge = document.getElementById('notif-badge')
        if (badge && count > 0) {
          badge.classList.remove('hidden')
        }
      }
    } catch (e) {
      // Silently fail if API is unavailable
    }
  }

  private onboardingStep = 0
  private onboardingSteps: Array<{ target: string; title: string; text: string; position: 'left' | 'right' | 'bottom' | 'top' }> = [
    { target: '#sidebar-search', title: 'البحث في القائمة', text: 'ابحث بسرعة في كل أقسام النظام بدلاً من التنقل اليدوي.', position: 'right' },
    { target: '#theme-toggle', title: 'الوضع الداكن', text: 'بدّل بين الوضع الفاتح والداكن حسب راحتك.', position: 'bottom' },
    { target: '#hamburger-btn', title: 'القائمة الجانبية', text: 'اضغط هنا أو اسحب من اليمين على الجوال لفتح القائمة.', position: 'bottom' },
    { target: '#add-new-btn', title: 'إضافة جديدة', text: 'ابدأ بحجز جديد، فاتورة، أو عميل من هنا.', position: 'right' },
  ]

  private startOnboarding(wrapper: HTMLElement) {
    const overlay = wrapper.querySelector('#onboarding-overlay') as HTMLElement
    if (!overlay) return
    overlay.classList.remove('hidden')
    this.onboardingStep = 0
    this._showOnboardingStep(wrapper)

    const nextBtn = wrapper.querySelector('#onboarding-next') as HTMLButtonElement
    const prevBtn = wrapper.querySelector('#onboarding-prev') as HTMLButtonElement
    const skipBtn = wrapper.querySelector('#onboarding-skip') as HTMLButtonElement
    const backdrop = wrapper.querySelector('#onboarding-backdrop') as HTMLElement

    const nextHandler = () => {
      if (this.onboardingStep >= this.onboardingSteps.length - 1) {
        this._finishOnboarding(wrapper)
        return
      }
      this.onboardingStep++
      this._showOnboardingStep(wrapper)
    }
    const prevHandler = () => {
      if (this.onboardingStep > 0) {
        this.onboardingStep--
        this._showOnboardingStep(wrapper)
      }
    }
    const skipHandler = () => this._finishOnboarding(wrapper)

    nextBtn?.addEventListener('click', nextHandler)
    prevBtn?.addEventListener('click', prevHandler)
    skipBtn?.addEventListener('click', skipHandler)
    backdrop?.addEventListener('click', skipHandler)

    // Reposition on resize
    const resizeHandler = () => this._showOnboardingStep(wrapper)
    window.addEventListener('resize', resizeHandler)
    ;(this as any)._onboardingResizeHandler = resizeHandler
  }

  private _showOnboardingStep(wrapper: HTMLElement) {
    const step = this.onboardingSteps[this.onboardingStep]
    if (!step) return
    const overlay = wrapper.querySelector('#onboarding-overlay') as HTMLElement
    const spotlight = wrapper.querySelector('#onboarding-spotlight') as HTMLElement
    const title = wrapper.querySelector('#onboarding-title') as HTMLElement
    const text = wrapper.querySelector('#onboarding-text') as HTMLElement
    const stepEl = wrapper.querySelector('#onboarding-step') as HTMLElement
    const nextBtn = wrapper.querySelector('#onboarding-next') as HTMLButtonElement
    const prevBtn = wrapper.querySelector('#onboarding-prev') as HTMLButtonElement
    const targetLabel = wrapper.querySelector('#onboarding-target-label') as HTMLElement
    const targetText = wrapper.querySelector('#onboarding-target-text') as HTMLElement
    if (!overlay || !spotlight || !title || !text || !stepEl || !nextBtn || !prevBtn) return

    title.textContent = step.title
    text.textContent = step.text
    stepEl.textContent = `الخطوة ${this.onboardingStep + 1} من ${this.onboardingSteps.length}`
    nextBtn.textContent = this.onboardingStep === this.onboardingSteps.length - 1 ? 'ابدأ' : 'التالي'
    prevBtn.classList.toggle('hidden', this.onboardingStep === 0)

    // Update dots
    wrapper.querySelectorAll('.onboarding-dot').forEach((dot) => {
      const idx = Number((dot as HTMLElement).getAttribute('data-index'))
      if (idx === this.onboardingStep) {
        dot.classList.add('bg-primary', 'w-5')
        dot.classList.remove('bg-on-surface-variant/30')
      } else {
        dot.classList.remove('bg-primary', 'w-5')
        dot.classList.add('bg-on-surface-variant/30')
      }
    })

    const target = wrapper.querySelector(step.target) as HTMLElement
    if (target) {
      const rect = target.getBoundingClientRect()
      const padding = 10
      spotlight.style.width = `${rect.width + padding * 2}px`
      spotlight.style.height = `${rect.height + padding * 2}px`
      spotlight.style.left = `${rect.left - padding}px`
      spotlight.style.top = `${rect.top - padding}px`
      spotlight.style.borderRadius = '12px'
      spotlight.style.opacity = '1'
      if (targetLabel && targetText) {
        targetLabel.classList.remove('hidden')
        targetText.textContent = `العنصر المُضيء: ${step.title}`
      }
    } else {
      spotlight.style.opacity = '0'
      if (targetLabel) targetLabel.classList.add('hidden')
    }
  }

  private _finishOnboarding(wrapper: HTMLElement) {
    const overlay = wrapper.querySelector('#onboarding-overlay') as HTMLElement
    if (overlay) overlay.classList.add('hidden')
    localStorage.setItem('admin-onboarding-seen', 'true')
    const resizeHandler = (this as any)._onboardingResizeHandler
    if (resizeHandler) window.removeEventListener('resize', resizeHandler)
  }
}
