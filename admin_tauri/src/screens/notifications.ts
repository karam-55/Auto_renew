import { AuthService } from '../services/auth'
import { ApiClient } from '../api/client'
import { Router } from '../router'
import { AppLayout } from '../components/layout'

export class NotificationsScreen {
  private auth: AuthService
  private api: ApiClient
  private router: Router

  constructor(auth: AuthService, api: ApiClient, router: Router) {
    this.auth = auth
    this.api = api
    this.router = router
  }

  render(): HTMLElement {
    const layout = new AppLayout(this.auth, this.router, 'مركز التنبيهات والمهام', 'notifications', this.api)
    const content = document.createElement('div')
    content.className = 'page-enter min-h-screen bg-background p-gutter'
    content.innerHTML = `
      <div class="max-w-7xl mx-auto space-y-stack-lg">
        <!-- Page Header -->
        <div>
          <h1 class="font-beVietnamPro text-headline-lg text-headline-lg text-on-surface mb-2">مركز التنبيهات والمهام</h1>
          <p class="text-text-secondary font-body-md max-w-2xl">إدارة وتتبع جميع إشعارات النظام، المهام المجدولة للفريق، والتواصل الداخلي في منصة واحدة متكاملة.</p>
        </div>
        <!-- Tabs -->
        <div class="flex border-b border-border" id="notif-tabs">
          <button class="px-6 py-4 font-label-sm text-label-sm transition-all flex items-center gap-2 border-b-2 border-primary text-primary font-bold" data-tab="alerts">
            <span class="material-symbols-outlined text-[20px]">notifications_active</span>
            تنبيهات النظام
            <span class="bg-error-container text-on-error-container text-xs px-2 py-0.5 rounded-full mr-2" id="tab-alerts-badge">-</span>
          </button>
          <button class="px-6 py-4 font-label-sm text-label-sm transition-all flex items-center gap-2 border-b-2 border-transparent text-on-surface-variant hover:text-primary hover:bg-surface-container-low" data-tab="tasks">
            <span class="material-symbols-outlined text-[20px]">task_alt</span>
            المهام المجدولة
            <span class="bg-primary-container text-on-primary-container text-xs px-2 py-0.5 rounded-full mr-2 hidden" id="tab-tasks-badge">-</span>
          </button>
          <button class="px-6 py-4 font-label-sm text-label-sm transition-all flex items-center gap-2 border-b-2 border-transparent text-on-surface-variant hover:text-primary hover:bg-surface-container-low" data-tab="chat">
            <span class="material-symbols-outlined text-[20px]">forum</span>
            محادثات الفريق
            <span class="bg-secondary-container text-on-secondary-container text-xs px-2 py-0.5 rounded-full mr-2 hidden" id="tab-chat-badge">-</span>
          </button>
        </div>
        <!-- Alerts Content -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-stack-lg" id="alerts-panel">
          <div class="lg:col-span-8 flex flex-col gap-stack-md">
            <!-- Filters -->
            <div class="flex justify-between items-center bg-surface-subtle p-3 rounded-lg border border-border">
              <div class="flex gap-2">
                <button class="bg-primary text-on-primary px-4 py-1.5 rounded-full font-label-sm text-sm shadow-sm" id="filter-all">الكل</button>
                <button class="bg-surface text-on-surface-variant border border-border px-4 py-1.5 rounded-full font-label-sm text-sm hover:bg-surface-container-low transition-colors" id="filter-high">عالية الأهمية</button>
                <button class="bg-surface text-on-surface-variant border border-border px-4 py-1.5 rounded-full font-label-sm text-sm hover:bg-surface-container-low transition-colors" id="filter-read">تمت القراءة</button>
              </div>
              <button class="text-text-secondary hover:text-primary transition-colors flex items-center gap-1 font-label-sm text-sm" id="mark-all-read">
                <span class="material-symbols-outlined text-[18px]">done_all</span>
                تحديد الكل كمقروء
              </button>
            </div>
            <!-- Alerts List (dynamic) -->
            <div id="alerts-list">
              <div class="skeleton-shimmer h-24 rounded-xl mb-4"></div>
              <div class="skeleton-shimmer h-24 rounded-xl mb-4"></div>
              <div class="skeleton-shimmer h-24 rounded-xl"></div>
            </div>
          </div>
          <!-- Sidebar Summary -->
          <div class="lg:col-span-4 flex flex-col gap-stack-md">
            <div class="glass-panel p-card-padding rounded-xl shadow-lg border border-border">
              <h3 class="font-headline-md text-[18px] text-on-surface font-semibold mb-4">ملخص التنبيهات</h3>
              <div class="space-y-3">
                <div class="flex items-center justify-between p-3 bg-error/5 rounded-lg">
                  <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-error">error</span>
                    <span class="font-body-md text-on-surface">عالية الأهمية</span>
                  </div>
                  <span class="text-financial-data font-bold text-error" id="summary-high">-</span>
                </div>
                <div class="flex items-center justify-between p-3 bg-warning/5 rounded-lg">
                  <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-warning">schedule</span>
                    <span class="font-body-md text-on-surface">متوسطة</span>
                  </div>
                  <span class="text-financial-data font-bold text-warning" id="summary-med">-</span>
                </div>
                <div class="flex items-center justify-between p-3 bg-info/5 rounded-lg">
                  <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-info">info</span>
                    <span class="font-body-md text-on-surface">معلوماتية</span>
                  </div>
                  <span class="text-financial-data font-bold text-info" id="summary-info">-</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tasks Panel -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-stack-lg hidden" id="tasks-panel">
          <div class="lg:col-span-8 flex flex-col gap-stack-md">
            <div class="flex justify-between items-center bg-surface-subtle p-3 rounded-lg border border-border">
              <div class="flex gap-2">
                <button class="bg-primary text-on-primary px-4 py-1.5 rounded-full font-label-sm text-sm shadow-sm" id="filter-task-all">الكل</button>
                <button class="bg-surface text-on-surface-variant border border-border px-4 py-1.5 rounded-full font-label-sm text-sm hover:bg-surface-container-low transition-colors" id="filter-task-pending">قيد التنفيذ</button>
                <button class="bg-surface text-on-surface-variant border border-border px-4 py-1.5 rounded-full font-label-sm text-sm hover:bg-surface-container-low transition-colors hidden sm:block" id="filter-task-completed">مكتملة</button>
              </div>
              <button class="bg-primary text-on-primary px-4 py-2 rounded-lg font-label-sm text-sm flex items-center gap-1" id="btn-new-task">
                <span class="material-symbols-outlined text-[18px]">add</span>
                مهمة جديدة
              </button>
            </div>
            <div id="tasks-list">
              <div class="skeleton-shimmer h-20 rounded-xl mb-4"></div>
              <div class="skeleton-shimmer h-20 rounded-xl mb-4"></div>
              <div class="skeleton-shimmer h-20 rounded-xl"></div>
            </div>
          </div>
          <div class="lg:col-span-4 flex flex-col gap-stack-md">
            <div class="glass-panel p-card-padding rounded-xl shadow-lg border border-border">
              <h3 class="font-headline-md text-[18px] text-on-surface font-semibold mb-4">ملخص المهام</h3>
              <div class="space-y-3">
                <div class="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
                  <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-primary">task_alt</span>
                    <span class="font-body-md text-on-surface">إجمالي المهام</span>
                  </div>
                  <span class="text-financial-data font-bold text-primary" id="summary-total-tasks">-</span>
                </div>
                <div class="flex items-center justify-between p-3 bg-warning/5 rounded-lg">
                  <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-warning">pending_actions</span>
                    <span class="font-body-md text-on-surface">قيد التنفيذ</span>
                  </div>
                  <span class="text-financial-data font-bold text-warning" id="summary-pending-tasks">-</span>
                </div>
                <div class="flex items-center justify-between p-3 bg-tertiary/5 rounded-lg">
                  <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-tertiary">check_circle</span>
                    <span class="font-body-md text-on-surface">مكتملة</span>
                  </div>
                  <span class="text-financial-data font-bold text-tertiary" id="summary-completed-tasks">-</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Chat Panel -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-stack-lg hidden" id="chat-panel">
          <div class="lg:col-span-4 flex flex-col gap-stack-md">
            <div class="bg-surface-container-lowest rounded-xl shadow-md border border-surface-subtle overflow-hidden flex flex-col h-[600px]">
              <div class="p-4 border-b border-outline-variant/10 bg-surface-subtle flex justify-between items-center">
                <h3 class="font-headline-md text-on-surface font-semibold">المحادثات</h3>
                <button class="text-primary hover:bg-primary/10 p-1.5 rounded-lg transition-colors" id="btn-new-chat">
                  <span class="material-symbols-outlined text-[20px]">edit</span>
                </button>
              </div>
              <div class="flex-1 overflow-y-auto p-2" id="chat-conversations-list">
                <div class="text-center py-8">
                  <span class="material-symbols-outlined text-text-tertiary text-3xl mb-2">forum</span>
                  <p class="text-text-tertiary text-sm">لا توجد محادثات حالياً</p>
                </div>
              </div>
            </div>
          </div>
          <div class="lg:col-span-8 flex flex-col gap-stack-md">
            <div class="bg-surface-container-lowest rounded-xl shadow-md border border-surface-subtle flex flex-col h-[600px]">
              <div class="p-4 border-b border-outline-variant/10 bg-surface-subtle flex items-center gap-3" id="chat-header">
                <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <span class="material-symbols-outlined">group</span>
                </div>
                <div>
                  <h3 class="font-headline-md text-on-surface font-semibold">فريق العمل</h3>
                  <p class="text-text-tertiary text-xs">5 أعضاء نشطون</p>
                </div>
              </div>
              <div class="flex-1 overflow-y-auto p-4 space-y-4" id="chat-messages">
                <div class="text-center py-12">
                  <span class="material-symbols-outlined text-text-tertiary text-4xl mb-3">chat</span>
                  <p class="text-text-tertiary text-sm">اختر محادثة لبدء التواصل</p>
                </div>
              </div>
              <div class="p-4 border-t border-outline-variant/10">
                <div class="flex items-center gap-2 bg-surface-container-high rounded-full px-4 py-2">
                  <input type="text" placeholder="اكتب رسالة..." class="flex-1 bg-transparent outline-none text-sm text-on-surface placeholder:text-text-tertiary" id="chat-input" disabled />
                  <button class="text-primary hover:bg-primary/10 p-2 rounded-full transition-colors" id="chat-send-btn" disabled>
                    <span class="material-symbols-outlined text-[20px]">send</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `
    // Tab switching
    content.querySelectorAll('#notif-tabs button[data-tab]').forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.getAttribute('data-tab')
        content.querySelectorAll('#notif-tabs button').forEach(t => {
          t.classList.remove('border-primary', 'text-primary', 'font-bold')
          t.classList.add('border-transparent', 'text-on-surface-variant')
        })
        tab.classList.remove('border-transparent', 'text-on-surface-variant')
        tab.classList.add('border-primary', 'text-primary', 'font-bold')
        // Hide all panels
        content.querySelector('#alerts-panel')?.classList.add('hidden')
        content.querySelector('#tasks-panel')?.classList.add('hidden')
        content.querySelector('#chat-panel')?.classList.add('hidden')
        // Show target panel
        const panel = content.querySelector(`#${target}-panel`)
        if (panel) panel.classList.remove('hidden')
      })
    })
    // Load real data
    this.loadNotifications(content)

    // Filter buttons
    content.querySelector('#filter-all')?.addEventListener('click', () => {
      this.setActiveFilter(content, 'all')
      this.loadNotifications(content)
    })
    content.querySelector('#filter-high')?.addEventListener('click', () => {
      this.setActiveFilter(content, 'high')
      this.loadNotifications(content, 'high')
    })
    content.querySelector('#filter-read')?.addEventListener('click', () => {
      this.setActiveFilter(content, 'read')
      this.loadNotifications(content, 'read')
    })
    content.querySelector('#mark-all-read')?.addEventListener('click', async () => {
      await this.markAllAsRead(content)
    })

    // Task filter buttons
    content.querySelector('#filter-task-all')?.addEventListener('click', () => {
      this.setActiveTaskFilter(content, 'all')
      this.loadTasks(content)
    })
    content.querySelector('#filter-task-pending')?.addEventListener('click', () => {
      this.setActiveTaskFilter(content, 'pending')
      this.loadTasks(content, 'pending')
    })
    content.querySelector('#filter-task-completed')?.addEventListener('click', () => {
      this.setActiveTaskFilter(content, 'completed')
      this.loadTasks(content, 'completed')
    })
    content.querySelector('#btn-new-task')?.addEventListener('click', () => {
      this.showNewTaskModal(content)
    })

    // Event delegation for mark-read buttons (performance fix)
    content.querySelector('#alerts-list')?.addEventListener('click', (e) => {
      const btn = (e.target as HTMLElement).closest('.mark-read-btn') as HTMLButtonElement | null
      if (btn) {
        e.stopPropagation()
        const id = btn.getAttribute('data-id')
        if (id) this.markAsRead(content, id)
      }
    })
    // Load tasks when tab is clicked (lazy load)
    content.querySelectorAll('#notif-tabs button[data-tab]').forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.getAttribute('data-tab')
        if (target === 'tasks') {
          this.loadTasks(content, this.currentTaskFilter)
        }
      })
    })

    return layout.render(content)
  }

  private currentFilter: string = 'all'

  private setActiveFilter(content: HTMLElement, filter: string) {
    this.currentFilter = filter
    content.querySelectorAll('#filter-all, #filter-high, #filter-read').forEach(btn => {
      btn.classList.remove('bg-primary', 'text-on-primary', 'shadow-sm')
      btn.classList.add('bg-surface', 'text-on-surface-variant', 'border', 'border-border')
    })
    const activeBtn = content.querySelector(`#filter-${filter}`)
    if (activeBtn) {
      activeBtn.classList.remove('bg-surface', 'text-on-surface-variant', 'border', 'border-border')
      activeBtn.classList.add('bg-primary', 'text-on-primary', 'shadow-sm')
    }
  }

  private async loadNotifications(content: HTMLElement, filter?: string) {
    const list = content.querySelector('#alerts-list')
    if (!list) return

    // Show skeletons
    list.innerHTML = `
      <div class="skeleton-shimmer h-24 rounded-xl mb-4"></div>
      <div class="skeleton-shimmer h-24 rounded-xl mb-4"></div>
      <div class="skeleton-shimmer h-24 rounded-xl"></div>
    `

    try {
      const params: Record<string, string> = {}
      if (filter === 'high') params.type = 'INVENTORY_LOW'
      else if (filter === 'read') params.isRead = 'true'
      else params.isRead = 'false'

      const queryString = Object.entries(params).map(([k, v]) => `${k}=${v}`).join('&')
      const url = '/api/notifications' + (queryString ? `?${queryString}` : '')

      const res = await this.api.get<any>(url)
      // Defensive: handle different response formats
      let notifications: any[] = []
      if (res.success && res.data) {
        if (Array.isArray(res.data.notifications)) {
          notifications = res.data.notifications
        } else if (Array.isArray(res.data)) {
          notifications = res.data
        }
      }

      if (!Array.isArray(notifications) || notifications.length === 0) {
        list.innerHTML = `
          <div class="text-center py-12 bg-surface-container-lowest rounded-xl border border-outline-variant/10">
            <span class="material-symbols-outlined text-text-tertiary text-4xl mb-3">notifications_off</span>
            <p class="text-text-tertiary text-sm">لا توجد تنبيهات</p>
            <p class="text-text-tertiary text-xs mt-1">سيتم إظهار التنبيهات الجديدة هنا تلقائياً</p>
          </div>
        `
        this.updateSidebarSummary(content, 0, 0, 0)
        return
      }

      const typeConfig: Record<string, { icon: string; color: string; border: string; label: string }> = {
        INVENTORY_LOW: { icon: 'warning', color: 'error', border: 'border-error', label: 'أولوية قصوى' },
        BOOKING_CREATED: { icon: 'calendar_month', color: 'primary', border: 'border-primary', label: 'حجز جديد' },
        BOOKING_UPDATED: { icon: 'edit_calendar', color: 'primary', border: 'border-primary', label: 'تحديث حجز' },
        BOOKING_COMPLETED: { icon: 'check_circle', color: 'tertiary', border: 'border-tertiary', label: 'حجز مكتمل' },
        PAYMENT_RECEIVED: { icon: 'payments', color: 'tertiary', border: 'border-tertiary', label: 'دفعة جديدة' },
        INVOICE_SENT: { icon: 'receipt_long', color: 'secondary', border: 'border-secondary', label: 'فاتورة مرسلة' },
        PAYROLL_READY: { icon: 'account_balance', color: 'info', border: 'border-info', label: 'رواتب' },
        SYSTEM: { icon: 'info', color: 'info', border: 'border-info', label: 'نظام' },
      }

      let highCount = 0
      let medCount = 0
      let infoCount = 0

      list.innerHTML = (notifications as any[]).map((n: any) => {
        const cfg = typeConfig[n.type] || { icon: 'notifications', color: 'text-tertiary', border: 'border-tertiary', label: n.type }
        const time = n.createdAt ? new Date(n.createdAt).toLocaleTimeString('ar-SY', { hour: '2-digit', minute: '2-digit' }) : '-'
        const isRead = n.isRead

        if (n.type === 'INVENTORY_LOW') highCount++
        else if (n.type === 'SYSTEM' || n.type === 'PAYROLL_READY') infoCount++
        else medCount++

        return `
          <div class="glass-panel p-card-padding rounded-xl border-r-4 ${cfg.border} relative overflow-hidden group mb-4 ${isRead ? 'opacity-60' : ''}" data-notif-id="${n.id}">
            <div class="flex items-start gap-4">
              <div class="w-10 h-10 rounded-full bg-${cfg.color}/10 text-${cfg.color} flex items-center justify-center shrink-0">
                <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">${cfg.icon}</span>
              </div>
              <div class="flex-1">
                <div class="flex justify-between items-start mb-1">
                  <h3 class="font-headline-md text-lg text-on-surface">${n.title || '-'}</h3>
                  <span class="text-xs text-text-tertiary">${time}</span>
                </div>
                <p class="text-text-secondary font-body-md text-sm mb-3">${n.body || '-'}</p>
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <span class="bg-${cfg.color}/10 text-${cfg.color} px-2.5 py-1 rounded-full font-label-sm text-xs flex items-center gap-1">
                      <span class="w-1.5 h-1.5 rounded-full bg-${cfg.color}"></span> ${cfg.label}
                    </span>
                  </div>
                  ${!isRead ? `<button class="mark-read-btn text-primary text-sm font-medium hover:underline" data-id="${n.id}">تحديد كمقروء</button>` : ''}
                </div>
              </div>
            </div>
          </div>
        `
      }).join('')

      this.updateSidebarSummary(content, highCount, medCount, infoCount)

    } catch (e) {
      console.error('Failed to load notifications:', e)
      if (list) list.innerHTML = `
        <div class="text-center py-12 bg-error/5 rounded-xl border border-error/20">
          <span class="material-symbols-outlined text-error text-4xl mb-3">error</span>
          <p class="text-error text-sm font-medium">فشل تحميل التنبيهات</p>
          <button class="mt-3 text-primary text-sm font-medium retry-notif-btn">إعادة المحاولة</button>
        </div>
      `
      list.querySelector('.retry-notif-btn')?.addEventListener('click', () => this.loadNotifications(content, filter))
    }
  }

  private async markAsRead(content: HTMLElement, id: string) {
    try {
      await this.api.patch(`/api/notifications/${id}/read`, {})
      this.loadNotifications(content, this.currentFilter)
    } catch (e) {
      console.error('Mark as read failed:', e)
    }
  }

  private async markAllAsRead(content: HTMLElement) {
    try {
      await this.api.patch('/api/notifications/read-all', {})
      this.loadNotifications(content, this.currentFilter)
    } catch (e) {
      console.error('Mark all as read failed:', e)
    }
  }

  private updateSidebarSummary(content: HTMLElement, high: number, med: number, info: number) {
    const total = high + med + info
    const highEl = content.querySelector('#summary-high') as HTMLElement
    const medEl = content.querySelector('#summary-med') as HTMLElement
    const infoEl = content.querySelector('#summary-info') as HTMLElement
    if (highEl) highEl.textContent = high.toString()
    if (medEl) medEl.textContent = med.toString()
    if (infoEl) infoEl.textContent = info.toString()

    // Update tab badge
    const tabBadge = content.querySelector('#tab-alerts-badge') as HTMLElement
    if (tabBadge) {
      if (total > 0) {
        tabBadge.textContent = total.toString()
        tabBadge.classList.remove('hidden')
      } else {
        tabBadge.classList.add('hidden')
      }
    }
  }

  private currentTaskFilter: string = 'all'

  private setActiveTaskFilter(content: HTMLElement, filter: string) {
    this.currentTaskFilter = filter
    content.querySelectorAll('#filter-task-all, #filter-task-pending, #filter-task-completed').forEach(btn => {
      btn.classList.remove('bg-primary', 'text-on-primary', 'shadow-sm')
      btn.classList.add('bg-surface', 'text-on-surface-variant', 'border', 'border-border')
    })
    const activeBtn = content.querySelector(`#filter-task-${filter}`)
    if (activeBtn) {
      activeBtn.classList.remove('bg-surface', 'text-on-surface-variant', 'border', 'border-border')
      activeBtn.classList.add('bg-primary', 'text-on-primary', 'shadow-sm')
    }
  }

  private async loadTasks(content: HTMLElement, filter?: string) {
    const list = content.querySelector('#tasks-list')
    if (!list) return

    list.innerHTML = `
      <div class="skeleton-shimmer h-20 rounded-xl mb-4"></div>
      <div class="skeleton-shimmer h-20 rounded-xl mb-4"></div>
      <div class="skeleton-shimmer h-20 rounded-xl"></div>
    `

    try {
      // Backend may not have a tasks endpoint yet - try to fetch
      const res = await this.api.get<any>('/api/tasks')
      let tasks: any[] = []
      if (res.success && res.data) {
        if (Array.isArray(res.data.tasks)) {
          tasks = res.data.tasks
        } else if (Array.isArray(res.data)) {
          tasks = res.data
        }
      }

      // Backend doesn't have /api/tasks — show coming soon
      if (!res.success && (res.message?.includes('404') || res.message?.includes('not found') || res.message?.includes('لا يمكن'))) {
        list.innerHTML = `
          <div class="text-center py-12 bg-surface-container-lowest rounded-xl border border-outline-variant/10">
            <span class="material-symbols-outlined text-text-tertiary text-4xl mb-3">construction</span>
            <p class="text-text-tertiary text-sm font-medium">ميزة المهام قيد التطوير</p>
            <p class="text-text-tertiary text-xs mt-1">ستكون متاحة قريباً</p>
          </div>
        `
        this.updateTaskSummary(content, 0, 0, 0)
        return
      }

      if (!Array.isArray(tasks) || tasks.length === 0) {
        list.innerHTML = `
          <div class="text-center py-12 bg-surface-container-lowest rounded-xl border border-outline-variant/10">
            <span class="material-symbols-outlined text-text-tertiary text-4xl mb-3">task_alt</span>
            <p class="text-text-tertiary text-sm">لا توجد مهام مجدولة</p>
            <button class="mt-3 text-primary font-medium text-sm" id="btn-empty-new-task">إنشاء مهمة جديدة</button>
          </div>
        `
        list.querySelector('#btn-empty-new-task')?.addEventListener('click', () => this.showNewTaskModal(content))
        this.updateTaskSummary(content, 0, 0, 0)
        return
      }

      // Filter client-side if needed
      let filtered = tasks
      if (filter === 'pending') filtered = tasks.filter((t: any) => t.status === 'PENDING')
      if (filter === 'completed') filtered = tasks.filter((t: any) => t.status === 'COMPLETED')

      const statusMap: Record<string, { label: string; color: string }> = {
        PENDING: { label: 'قيد التنفيذ', color: 'warning' },
        COMPLETED: { label: 'مكتملة', color: 'tertiary' },
        OVERDUE: { label: 'متأخرة', color: 'error' },
      }

      let total = 0, pending = 0, completed = 0
      tasks.forEach((t: any) => {
        total++
        if (t.status === 'PENDING' || t.status === 'OVERDUE') pending++
        if (t.status === 'COMPLETED') completed++
      })

      list.innerHTML = filtered.map((t: any) => {
        const s = statusMap[t.status] || { label: t.status, color: 'text-tertiary' }
        const dueDate = t.dueDate ? new Date(t.dueDate).toLocaleDateString('ar-SY') : '-'
        return `
          <div class="glass-panel p-card-padding rounded-xl border border-outline-variant/10 relative overflow-hidden group mb-4">
            <div class="flex items-start gap-4">
              <div class="w-10 h-10 rounded-full bg-${s.color}/10 text-${s.color} flex items-center justify-center shrink-0">
                <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">${t.status === 'COMPLETED' ? 'check_circle' : 'task_alt'}</span>
              </div>
              <div class="flex-1">
                <div class="flex justify-between items-start mb-1">
                  <h3 class="font-headline-md text-lg text-on-surface">${t.title || '-'}</h3>
                  <span class="text-xs text-text-tertiary">${dueDate}</span>
                </div>
                <p class="text-text-secondary font-body-md text-sm mb-3">${t.description || '-'}</p>
                <div class="flex items-center gap-3">
                  <span class="bg-${s.color}/10 text-${s.color} px-2.5 py-1 rounded-full font-label-sm text-xs flex items-center gap-1">
                    <span class="w-1.5 h-1.5 rounded-full bg-${s.color}"></span> ${s.label}
                  </span>
                  ${t.assignedTo ? `<span class="text-text-tertiary text-xs">${t.assignedTo.name || t.assignedTo}</span>` : ''}
                </div>
              </div>
            </div>
          </div>
        `
      }).join('')

      this.updateTaskSummary(content, total, pending, completed)

    } catch (e) {
      console.error('Failed to load tasks:', e)
      if (list) list.innerHTML = `
        <div class="text-center py-12 bg-error/5 rounded-xl border border-error/20">
          <span class="material-symbols-outlined text-error text-4xl mb-3">error</span>
          <p class="text-error text-sm font-medium">فشل تحميل المهام</p>
          <p class="text-text-tertiary text-xs mt-1">تأكد من تشغيل الباك-اند</p>
          <button class="mt-3 text-primary text-sm font-medium retry-tasks-btn">إعادة المحاولة</button>
        </div>
      `
      list?.querySelector('.retry-tasks-btn')?.addEventListener('click', () => this.loadTasks(content, filter))
    }
  }

  private updateTaskSummary(content: HTMLElement, total: number, pending: number, completed: number) {
    const totalEl = content.querySelector('#summary-total-tasks') as HTMLElement
    const pendingEl = content.querySelector('#summary-pending-tasks') as HTMLElement
    const completedEl = content.querySelector('#summary-completed-tasks') as HTMLElement
    if (totalEl) totalEl.textContent = total.toString()
    if (pendingEl) pendingEl.textContent = pending.toString()
    if (completedEl) completedEl.textContent = completed.toString()

    const badge = content.querySelector('#tab-tasks-badge') as HTMLElement
    if (badge) {
      if (pending > 0) {
        badge.textContent = pending.toString()
        badge.classList.remove('hidden')
      } else {
        badge.classList.add('hidden')
      }
    }
  }

  private showNewTaskModal(content: HTMLElement) {
    let modal = content.querySelector('#task-modal') as HTMLElement
    if (!modal) {
      modal = document.createElement('div')
      modal.id = 'task-modal'
      modal.className = 'fixed inset-0 bg-black/50 z-50 hidden items-center justify-center'
      modal.innerHTML = `
        <div class="bg-surface-container-lowest rounded-xl shadow-2xl border border-border w-full max-w-sm p-6 m-4">
          <h3 class="font-headline-md text-on-surface font-semibold mb-4">مهمة جديدة</h3>
          <input id="task-title" class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-body-md text-on-surface mb-4" placeholder="عنوان المهمة" required />
          <div class="flex justify-end gap-2">
            <button id="task-cancel" class="h-10 px-4 rounded-lg font-body-md text-text-secondary hover:bg-surface-subtle transition-colors">إلغاء</button>
            <button id="task-save" class="h-10 px-4 bg-primary text-white rounded-lg font-body-md hover:bg-primary-dark transition-colors">حفظ</button>
          </div>
        </div>
      `
      content.appendChild(modal)
      modal.querySelector('#task-cancel')?.addEventListener('click', () => {
        modal!.classList.add('hidden')
        modal!.classList.remove('flex')
      })
      modal.querySelector('#task-save')?.addEventListener('click', async () => {
        const title = (modal!.querySelector('#task-title') as HTMLInputElement)?.value.trim()
        if (!title) { ;(window as any).toast?.show?.({ message: 'عنوان المهمة مطلوب', type: 'warning' }); return }
        try {
          const res: any = await this.api.post('/api/tasks', { title, status: 'PENDING' })
          if (res.success || res.id) {
            modal!.classList.add('hidden'); modal!.classList.remove('flex')
            ;(modal!.querySelector('#task-title') as HTMLInputElement).value = ''
            this.loadTasks(content, this.getActiveTab(content))
          } else {
            ;(window as any).toast?.show?.({ message: res.message || 'فشل الإنشاء', type: 'error' })
          }
        } catch { ;(window as any).toast?.show?.({ message: 'حدث خطأ في الاتصال', type: 'error' }) }
      })
    }
    modal.classList.remove('hidden')
    modal.classList.add('flex')
  }

  private getActiveTab(content: HTMLElement): string {
    const activeBtn = content.querySelector('[data-task-tab].bg-primary\/10') as HTMLElement
    return activeBtn?.dataset.taskTab || 'pending'
  }
}
