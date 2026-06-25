import { AuthService } from '../services/auth'
import { Router } from '../router'
import { ApiClient } from '../api/client'

interface MenuGroup {
  label: string
  items: { route: string; label: string; icon: string; badge?: number }[]
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

  constructor(auth: AuthService, router: Router, title: string, activeRoute: string, api: ApiClient | null = null) {
    this.auth = auth
    this.router = router
    this.api = api
    this.title = title
    this.activeRoute = activeRoute
  }

  render(content: HTMLElement): HTMLElement {
    const wrapper = document.createElement('div')
    wrapper.className = 'min-h-screen bg-background font-ibmPlexSans text-on-surface'
    wrapper.innerHTML = `
      <!-- Mobile Sidebar Overlay -->
      <div class="sidebar-overlay" id="sidebar-overlay" aria-hidden="true"></div>

      <!-- Sidebar -->
      <aside id="app-sidebar" class="sidebar fixed right-[24px] top-[16px] h-[calc(100vh-32px)] flex flex-col z-50 rounded-2xl glass-panel border-l border-glass-border shadow-[0_8px_32px_0_rgba(227,30,36,0.08)] overflow-hidden" style="width:280px" role="navigation" aria-label="القائمة الجانبية">
        <!-- Sidebar Header -->
        <div class="p-6 flex flex-col items-center relative" style="border-bottom:1px solid rgba(255,255,255,0.4)">
          <!-- Close button (mobile only) -->
          <button class="hamburger-btn absolute left-4 top-4" id="sidebar-close-btn" aria-label="إغلاق القائمة" style="display:none">
            <span class="material-symbols-outlined" aria-hidden="true">close</span>
          </button>
          <div class="w-14 h-14 rounded-xl flex items-center justify-center mb-3 shadow-lg shadow-primary/20 relative overflow-hidden group cursor-pointer" data-route="/dashboard">
            <img src="/logo.png" alt="Logo" class="w-12 h-12 object-contain" />
          </div>
          <h2 class="font-bold text-xl text-primary font-beVietnamPro">Auto renew</h2>
          <p class="text-xs mt-1 text-on-surface-variant">الإدارة المتقدمة</p>
        </div>
        <!-- Navigation -->
        <nav class="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-2 custom-scrollbar">
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
                    <a href="${item.route}" class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative ${isActive ? 'text-primary font-bold bg-primary-container/10 border-r-4 border-primary rounded-l-full nav-active-glow' : 'text-on-surface-variant hover:bg-white/40 hover:text-primary hover:translate-x-[-8px]'}" data-route="${item.route}" style="animation-delay: ${(gi + 1) * 100 + ii * 50}ms">
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
          <button class="w-full py-3 rounded-xl font-semibold text-sm shadow-lg hover:shadow-primary-glow/40 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 mb-4 text-white btn-primary-gradient" id="add-new-btn">
            <span class="material-symbols-outlined text-[20px]">add</span>
            إضافة جديد
          </button>
          <button class="w-full flex items-center justify-center gap-2 py-3 rounded-xl transition-all text-sm hover:bg-error-container/20 text-error" id="logout-btn">
            <span class="material-symbols-outlined text-[20px]">logout</span>
            تسجيل الخروج
          </button>
        </div>
      </aside>

      <!-- TopBar -->
      <nav id="app-topbar" class="topbar-responsive fixed top-[16px] left-[24px] right-[324px] z-40 glass-panel rounded-xl border border-glass-border shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] h-16 flex flex-row-reverse justify-between items-center px-4 gap-3">
        <!-- Right: title + hamburger -->
        <div class="flex items-center gap-3 min-w-0">
          <button class="hamburger-btn" id="hamburger-btn" aria-label="فتح القائمة" aria-expanded="false" aria-controls="app-sidebar">
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
          <button class="p-2 transition-all relative rounded-full hover:bg-primary-container/10 text-on-surface-variant" data-route="/notifications" aria-label="التنبيهات">
            <span class="material-symbols-outlined transition-transform hover:scale-110" style="font-size:22px;font-variation-settings:'FILL' 0" aria-hidden="true">notifications</span>
            <span id="notif-badge" class="absolute top-1.5 right-1.5 w-2 h-2 rounded-full ring-2 hidden bg-error ring-white/70" aria-hidden="true"></span>
          </button>
          <button id="profile-btn" class="flex items-center gap-2 hover:bg-white/50 p-1 pr-2 rounded-full transition-all" aria-label="الملف الشخصي">
            <span class="text-sm hidden sm:block text-on-surface font-semibold max-w-[100px] truncate">${this.auth.getUser()?.fullName || 'المسؤول'}</span>
            <div class="w-8 h-8 rounded-full flex items-center justify-center font-bold overflow-hidden border-2 border-primary/20 bg-primary-fixed text-primary flex-shrink-0" aria-hidden="true">
              <span class="material-symbols-outlined text-[16px]" style="font-variation-settings:'FILL' 1">person</span>
            </div>
          </button>
        </div>
      </nav>

      <!-- Main Content -->
      <main id="app-main" class="main-content-responsive flex-1 min-h-screen bg-orbs pt-[96px] pr-[320px] pl-[24px] pb-[24px] transition-all duration-300">
        <div class="page-content max-w-full mx-auto"></div>
      </main>
    `

    const pageContent = wrapper.querySelector('.page-content')!
    pageContent.appendChild(content)

    // ── Nav links ──
    wrapper.querySelectorAll('a[data-route]').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault()
        const route = item.getAttribute('data-route')
        if (route) {
          this.closeSidebar(wrapper)
          this.router.navigate(route)
        }
      })
    })

    // ── Menu group toggles ──
    wrapper.querySelectorAll('.menu-group-header').forEach(header => {
      header.addEventListener('click', () => {
        const group = header.closest('.menu-group')!
        group.classList.toggle('open')
        const chevron = header.querySelector('.material-symbols-outlined') as HTMLElement
        if (chevron) chevron.style.transform = group.classList.contains('open') ? 'rotate(180deg)' : ''
      })
    })

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

    // ── ESC key closes sidebar ──
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.closeSidebar(wrapper)
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

    window.addEventListener('resize', updateLayout)
    updateLayout() // run on init

    // ── Brand icon click ──
    wrapper.querySelector('[data-route="/dashboard"]')?.addEventListener('click', (e) => {
      e.preventDefault()
      this.closeSidebar(wrapper)
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
}
