import { AuthService } from '../services/auth'
import { ApiClient } from '../api/client'
import { Router } from '../router'
import { AppLayout } from '../components/layout'

export class DashboardScreen {
  private auth: AuthService
  private api: ApiClient
  private router: Router

  constructor(auth: AuthService, api: ApiClient, router: Router) {
    this.auth = auth
    this.api = api
    this.router = router
  }

  render(): HTMLElement {
    const layout = new AppLayout(this.auth, this.router, 'لوحة التحكم', 'dashboard', this.api)
    const content = document.createElement('div')
    content.className = 'page-enter max-w-[1600px] mx-auto'
    const today = new Date()
    const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
    const monthNames = ['يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
    const dateStr = `${dayNames[today.getDay()]}، ${today.getDate()} ${monthNames[today.getMonth()]} ${today.getFullYear()}`

    content.innerHTML = `
      <div class="space-y-stack-lg">
        <!-- Date & Welcome -->
        <div class="flex items-center justify-between page-enter">
          <div>
            <h2 class="font-headline-lg text-on-surface font-beVietnamPro">لوحة التحكم</h2>
            <p class="text-on-surface-variant text-sm mt-1">${dateStr}</p>
          </div>
          <button id="dashboard-retry" class="hidden text-primary font-semibold text-sm flex items-center gap-2 bg-primary-container/10 px-4 py-2 rounded-xl hover:bg-primary-container/20 transition-all border border-glass-border">
            <span class="material-symbols-outlined text-[18px]">refresh</span>
            إعادة المحاولة
          </button>
        </div>

        <!-- Error State (hidden by default) -->
        <div id="dashboard-error" class="hidden glass-card border border-error/20 rounded-2xl p-6 text-center">
          <span class="material-symbols-outlined text-error text-4xl mb-2">error</span>
          <h3 class="font-headline-md text-error font-semibold mb-1">فشل تحميل البيانات</h3>
          <p class="text-on-surface-variant text-sm mb-4">تعذر الاتصال بالخادم. يرجى التحقق من الاتصال والمحاولة مرة أخرى.</p>
          <button id="error-retry-btn" class="btn-primary-gradient text-white px-5 py-2.5 rounded-xl font-semibold hover:scale-105 active:scale-95 transition-all">إعادة المحاولة</button>
        </div>

        <!-- Row 1: KPI Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" id="kpi-cards">
          <!-- KPI 1: Bookings -->
          <div class="glass-card p-card-padding rounded-2xl border-t-[3px] border-primary hover-lift-8 cursor-pointer stagger-entry stagger-entry-1" data-route="/bookings">
            <div class="flex justify-between items-start mb-4">
              <div>
                <p class="font-label-sm text-on-surface-variant mb-1">إجمالي الحجوزات</p>
                <h3 class="font-headline-lg text-on-surface" id="kpi-bookings"><span class="skeleton-shimmer inline-block w-16 h-8 rounded"></span></h3>
              </div>
              <div class="w-14 h-14 rounded-2xl bg-primary-container/10 flex items-center justify-center text-primary">
                <span class="material-symbols-outlined text-2xl" style="font-variation-settings: 'FILL' 1;">calendar_month</span>
              </div>
            </div>
            <div class="flex items-center gap-2 text-sm" id="kpi-bookings-trend">
              <span class="flex items-center gap-1 text-tertiary font-semibold bg-tertiary/10 px-3 py-1 rounded-full">
                <span class="material-symbols-outlined text-[16px]">trending_up</span> --
              </span>
              <span class="text-on-surface-variant">مقارنة بالشهر الماضي</span>
            </div>
          </div>
          <!-- KPI 2: Revenue -->
          <div class="glass-card p-card-padding rounded-2xl border-t-[3px] border-secondary hover-lift-8 cursor-pointer stagger-entry stagger-entry-2" data-route="/invoices">
            <div class="flex justify-between items-start mb-4">
              <div>
                <p class="font-label-sm text-on-surface-variant mb-1">إيرادات اليوم</p>
                <h3 class="text-financial-data font-headline-lg text-on-surface" id="kpi-revenue"><span class="skeleton-shimmer inline-block w-20 h-8 rounded"></span></h3>
                <span class="text-on-surface-variant text-sm">ل.س</span>
              </div>
              <div class="w-14 h-14 rounded-2xl bg-secondary-container/10 flex items-center justify-center text-secondary">
                <span class="material-symbols-outlined text-2xl" style="font-variation-settings: 'FILL' 1;">payments</span>
              </div>
            </div>
            <div class="flex items-center gap-2 text-sm" id="kpi-revenue-trend">
              <span class="flex items-center gap-1 text-tertiary font-semibold bg-tertiary/10 px-3 py-1 rounded-full">
                <span class="material-symbols-outlined text-[16px]">trending_up</span> --
              </span>
              <span class="text-on-surface-variant">مقارنة بالأمس</span>
            </div>
          </div>
          <!-- KPI 3: Mechanics -->
          <div class="glass-card p-card-padding rounded-2xl border-t-[3px] border-info hover-lift-8 stagger-entry stagger-entry-3">
            <div class="flex justify-between items-start mb-4">
              <div>
                <p class="font-label-sm text-on-surface-variant mb-1">الميكانيكيون النشطون</p>
                <h3 class="font-headline-lg text-on-surface" id="kpi-mechanics"><span class="skeleton-shimmer inline-block w-16 h-8 rounded"></span></h3>
              </div>
              <div class="w-14 h-14 rounded-2xl bg-info/10 flex items-center justify-center text-info">
                <span class="material-symbols-outlined text-2xl" style="font-variation-settings: 'FILL' 1;">engineering</span>
              </div>
            </div>
            <div class="w-full bg-white/50 rounded-full h-2 mt-4 border border-glass-border">
              <div class="bg-info h-2 rounded-full transition-all duration-1000" id="kpi-mechanics-bar" style="width: 0%"></div>
            </div>
            <p class="text-xs text-on-surface-variant mt-2" id="kpi-mechanics-trend">-- طاقة استيعابية</p>
          </div>
          <!-- KPI 4: Overdue -->
          <div class="glass-card p-card-padding rounded-2xl border-t-[3px] border-error hover-lift-8 cursor-pointer stagger-entry stagger-entry-4" data-route="/invoices">
            <div class="flex justify-between items-start mb-4">
              <div>
                <p class="font-label-sm text-on-surface-variant mb-1">الفواتير المتأخرة</p>
                <h3 class="font-headline-lg text-error" id="kpi-overdue"><span class="skeleton-shimmer inline-block w-12 h-8 rounded"></span></h3>
              </div>
              <div class="w-14 h-14 rounded-2xl bg-error/10 flex items-center justify-center text-error">
                <span class="material-symbols-outlined text-2xl" style="font-variation-settings: 'FILL' 1;">warning</span>
              </div>
            </div>
            <div class="flex items-center gap-2 text-sm mt-4">
              <button class="text-error font-semibold hover:underline flex items-center gap-1 transition-all" data-route="/invoices">
                مراجعة الآن <span class="material-symbols-outlined text-[16px]">arrow_left_alt</span>
              </button>
            </div>
          </div>
        </div>
        <!-- Row 2: Charts -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Main Chart -->
          <div class="lg:col-span-2 glass-card p-card-padding rounded-2xl flex flex-col stagger-entry stagger-entry-5">
            <div class="flex justify-between items-center mb-6">
              <h3 class="font-headline-md text-[18px] text-on-surface font-beVietnamPro">إيرادات آخر 7 أيام</h3>
              <button class="text-on-surface-variant hover:text-primary hover:bg-primary-container/10 transition-all p-2 rounded-full" id="revenue-more">
                <span class="material-symbols-outlined">more_horiz</span>
              </button>
            </div>
            <div class="flex-1 relative w-full h-72">
              <canvas id="revenueChart"></canvas>
            </div>
          </div>
          <!-- Donut Chart -->
          <div class="glass-card p-card-padding rounded-2xl flex flex-col stagger-entry stagger-entry-6">
            <div class="flex justify-between items-center mb-6">
              <h3 class="font-headline-md text-[18px] text-on-surface font-beVietnamPro">حالة الحجوزات</h3>
              <button class="text-on-surface-variant hover:text-primary hover:bg-primary-container/10 transition-all p-2 rounded-full" id="status-more">
                <span class="material-symbols-outlined">more_horiz</span>
              </button>
            </div>
            <div class="flex-1 relative w-full flex items-center justify-center h-56">
              <canvas id="statusChart"></canvas>
            </div>
            <div class="mt-6 flex flex-col gap-3">
              <div class="flex items-center justify-between text-sm">
                <div class="flex items-center gap-2">
                  <div class="w-3 h-3 rounded-full shadow-[0_0_8px_rgba(5,150,105,0.5)]" style="background:#059669"></div>
                  <span class="text-on-surface-variant">مكتمل (مدفوع)</span>
                </div>
                <span class="text-financial-data font-semibold" id="status-complete">65%</span>
              </div>
              <div class="flex items-center justify-between text-sm">
                <div class="flex items-center gap-2">
                  <div class="w-3 h-3 rounded-full shadow-[0_0_8px_rgba(217,119,6,0.5)]" style="background:#D97706"></div>
                  <span class="text-on-surface-variant">قيد الانتظار</span>
                </div>
                <span class="text-financial-data font-semibold" id="status-pending">25%</span>
              </div>
              <div class="flex items-center justify-between text-sm">
                <div class="flex items-center gap-2">
                  <div class="w-3 h-3 rounded-full shadow-[0_0_8px_rgba(0,53,148,0.5)]" style="background:#003594"></div>
                  <span class="text-on-surface-variant">قيد العمل</span>
                </div>
                <span class="text-financial-data font-semibold" id="status-inprogress">0%</span>
              </div>
              <div class="flex items-center justify-between text-sm">
                <div class="flex items-center gap-2">
                  <div class="w-3 h-3 rounded-full shadow-[0_0_8px_rgba(186,26,26,0.5)]" style="background:#ba1a1a"></div>
                  <span class="text-on-surface-variant">ملغى</span>
                </div>
                <span class="text-financial-data font-semibold" id="status-cancelled">0%</span>
              </div>
            </div>
          </div>
        </div>
        <!-- Row 3: Quick Actions -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button class="glass-card p-4 rounded-2xl hover-lift-8 flex flex-col items-center justify-center gap-3 group" data-route="/bookings/new">
            <div class="w-14 h-14 rounded-2xl bg-primary-container/10 group-hover:bg-primary-container/20 flex items-center justify-center transition-all text-primary group-hover:scale-110">
              <span class="material-symbols-outlined text-[28px]" style="font-variation-settings: 'FILL' 0">add_box</span>
            </div>
            <span class="font-label-sm text-on-surface font-semibold">حجز جديد</span>
          </button>
          <button class="glass-card p-4 rounded-2xl hover-lift-8 flex flex-col items-center justify-center gap-3 group" data-route="/invoices">
            <div class="w-14 h-14 rounded-2xl bg-secondary-container/10 group-hover:bg-secondary-container/20 flex items-center justify-center transition-all text-secondary group-hover:scale-110">
              <span class="material-symbols-outlined text-[28px]" style="font-variation-settings: 'FILL' 0">receipt_long</span>
            </div>
            <span class="font-label-sm text-on-surface font-semibold">فاتورة جديدة</span>
          </button>
          <button class="glass-card p-4 rounded-2xl hover-lift-8 flex flex-col items-center justify-center gap-3 group" data-route="/customers">
            <div class="w-14 h-14 rounded-2xl bg-info/10 group-hover:bg-info/20 flex items-center justify-center transition-all text-info group-hover:scale-110">
              <span class="material-symbols-outlined text-[28px]" style="font-variation-settings: 'FILL' 0">person_add</span>
            </div>
            <span class="font-label-sm text-on-surface font-semibold">عميل جديد</span>
          </button>
          <button class="glass-card p-4 rounded-2xl hover-lift-8 flex flex-col items-center justify-center gap-3 group" data-route="/inventory">
            <div class="w-14 h-14 rounded-2xl bg-tertiary/10 group-hover:bg-tertiary/20 flex items-center justify-center transition-all text-tertiary group-hover:scale-110">
              <span class="material-symbols-outlined text-[28px]" style="font-variation-settings: 'FILL' 0">build</span>
            </div>
            <span class="font-label-sm text-on-surface font-semibold">تحديث المخزون</span>
          </button>
        </div>
        <!-- Row 4: Two Columns -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Recent Bookings -->
          <div class="glass-card rounded-2xl overflow-hidden stagger-entry stagger-entry-5">
            <div class="p-6 border-b border-glass-border flex justify-between items-center bg-white/40">
              <h3 class="font-headline-md text-[18px] text-on-surface font-beVietnamPro">آخر الحجوزات</h3>
              <button class="text-primary hover:text-primary-dark hover:underline font-label-sm font-semibold transition-all" data-route="/bookings">عرض الكل</button>
            </div>
            <div class="p-0" id="recent-bookings-list">
              <div class="p-6">
                <div class="skeleton-shimmer h-12 rounded-lg mb-3"></div>
                <div class="skeleton-shimmer h-12 rounded-lg mb-3"></div>
                <div class="skeleton-shimmer h-12 rounded-lg"></div>
              </div>
            </div>
          </div>
          <!-- Recent Activity -->
          <div class="glass-card rounded-2xl overflow-hidden stagger-entry stagger-entry-6">
            <div class="p-6 border-b border-glass-border flex justify-between items-center bg-white/40">
              <h3 class="font-headline-md text-[18px] text-on-surface font-beVietnamPro">النشاط الأخير</h3>
              <button class="text-primary hover:text-primary-dark hover:underline font-label-sm font-semibold transition-all" id="view-all-activity">عرض الكل</button>
            </div>
            <div class="p-6" id="activity-list">
              <div class="skeleton-shimmer h-16 rounded-lg mb-4"></div>
              <div class="skeleton-shimmer h-16 rounded-lg mb-4"></div>
              <div class="skeleton-shimmer h-16 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Smart FAB -->
      <button class="fab-glass pulse-glow" id="dashboard-fab" title="إضافة جديد">
        <span class="material-symbols-outlined text-[28px]" style="font-variation-settings: 'FILL' 1">add</span>
      </button>
    `

    this.loadData(content)

    content.querySelectorAll('[data-route]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault()
        e.stopPropagation()
        const route = el.getAttribute('data-route')
        if (route) this.router.navigate(route)
      })
    })
    content.querySelector('#revenue-more')?.addEventListener('click', () => this.router.navigate('/reports/revenue'))
    content.querySelector('#status-more')?.addEventListener('click', () => this.router.navigate('/bookings'))
    content.querySelector('#view-all-activity')?.addEventListener('click', () => this.router.navigate('/notifications'))
    content.querySelector('#error-retry-btn')?.addEventListener('click', () => this.loadData(content))
    content.querySelector('#dashboard-retry')?.addEventListener('click', () => this.loadData(content))
    content.querySelector('#dashboard-fab')?.addEventListener('click', () => this.router.navigate('/bookings/new'))

    return layout.render(content)
  }

  private async loadData(el: HTMLElement) {
    const errorEl = el.querySelector('#dashboard-error') as HTMLElement
    const kpiCards = el.querySelector('#kpi-cards') as HTMLElement
    const retryBtn = el.querySelector('#dashboard-retry') as HTMLElement

    // Hide error, show loading state
    if (errorEl) errorEl.classList.add('hidden')
    if (kpiCards) kpiCards.classList.remove('hidden')
    if (retryBtn) retryBtn.classList.add('hidden')

    try {
      const [kpiRes, bookingsRes] = await Promise.all([
        this.api.get<any>('/api/dashboard/kpis'),
        this.api.get<any>('/api/bookings?limit=5'),
      ])

      if (!kpiRes.success || !kpiRes.data) {
        throw new Error('Failed to load KPI data')
      }

      const d = kpiRes.data

      // KPI: Revenue
      this.setText(el, 'kpi-revenue', this.fmtNumber(d.todayRevenue || 0))

      // KPI: Bookings
      this.setText(el, 'kpi-bookings', d.totalBookings?.toString() || '0')

      // KPI: Mechanics
      const mechanicsText = `${d.activeMechanics || 0} / ${d.totalMechanics || 0}`
      this.setText(el, 'kpi-mechanics', mechanicsText)
      const totalMech = d.totalMechanics || 1
      const barWidth = Math.round(((d.activeMechanics || 0) / totalMech) * 100)
      const bar = el.querySelector('#kpi-mechanics-bar') as HTMLElement
      if (bar) bar.style.width = `${barWidth}%`
      this.setText(el, 'kpi-mechanics-trend', `${barWidth}% طاقة استيعابية`)

      // KPI: Overdue
      this.setText(el, 'kpi-overdue', d.overdueInvoices?.toString() || '0')

      // Recent Bookings
      const bookingsList = el.querySelector('#recent-bookings-list')
      if (bookingsList) {
        const bookings = bookingsRes.success && bookingsRes.data ? (bookingsRes.data.data || bookingsRes.data) : []
        if (Array.isArray(bookings) && bookings.length > 0) {
          bookingsList.innerHTML = `
            <table class="w-full text-sm">
              <thead class="bg-surface-subtle text-text-tertiary">
                <tr>
                  <th class="text-right px-4 py-2 font-medium">العميل</th>
                  <th class="text-right px-4 py-2 font-medium">المركبة</th>
                  <th class="text-right px-4 py-2 font-medium">الحالة</th>
                  <th class="text-right px-4 py-2 font-medium">التاريخ</th>
                </tr>
              </thead>
              <tbody>
                ${bookings.slice(0, 5).map((b: any) => {
                  const statusMap: Record<string, { label: string; color: string }> = {
                    PENDING: { label: 'قيد الانتظار', color: 'text-warning bg-warning/10' },
                    CONFIRMED: { label: 'مؤكد', color: 'text-info bg-info/10' },
                    IN_PROGRESS: { label: 'قيد العمل', color: 'text-primary bg-primary/10' },
                    COMPLETED: { label: 'مكتمل', color: 'text-tertiary bg-tertiary/10' },
                    CANCELLED: { label: 'ملغى', color: 'text-error bg-error/10' },
                  }
                  const s = statusMap[b.status] || { label: b.status, color: 'text-text-tertiary bg-surface-container' }
                  const date = b.scheduledDate ? new Date(b.scheduledDate).toLocaleDateString('ar-SY') : '-'
                  return `
                    <tr class="border-b border-outline-variant/5 hover:bg-surface-subtle/50 transition-colors cursor-pointer" data-route="/bookings">
                      <td class="px-4 py-3 font-medium text-on-surface">${b.customer?.name || b.customerName || '-'}</td>
                      <td class="px-4 py-3 text-text-tertiary">${b.vehicle?.plateNumber || b.vehiclePlate || '-'}</td>
                      <td class="px-4 py-3"><span class="${s.color} px-2 py-0.5 rounded-full text-xs font-medium">${s.label}</span></td>
                      <td class="px-4 py-3 text-text-tertiary">${date}</td>
                    </tr>
                  `
                }).join('')}
              </tbody>
            </table>
          `
          // Re-bind click handlers for the new rows
          bookingsList.querySelectorAll('[data-route]').forEach(row => {
            row.addEventListener('click', () => {
              const route = row.getAttribute('data-route')
              if (route) this.router.navigate(route)
            })
          })
        } else {
          bookingsList.innerHTML = `
            <div class="p-8 text-center">
              <span class="material-symbols-outlined text-text-tertiary text-4xl mb-2">calendar_month</span>
              <p class="text-text-tertiary text-sm">لا توجد حجوزات حالياً</p>
              <button class="mt-3 text-primary font-medium text-sm" data-route="/bookings/new">إنشاء حجز جديد</button>
            </div>
          `
          bookingsList.querySelector('[data-route]')?.addEventListener('click', () => this.router.navigate('/bookings/new'))
        }
      }

      // Recent Activity
      const activityList = el.querySelector('#activity-list')
      if (activityList) {
        if (d.recentActivities && d.recentActivities.length > 0) {
          const entityLabels: Record<string, string> = {
            booking: 'حجز',
            invoice: 'فاتورة',
            payment: 'دفعة',
            customer: 'عميل',
            vehicle: 'مركبة',
          }
          activityList.innerHTML = `
            <div class="relative mr-6 border-r-2 border-outline-variant/20 space-y-6">
              ${d.recentActivities.map((a: any, i: number) => {
                const colors = ['bg-tertiary', 'bg-secondary', 'bg-primary', 'bg-warning', 'bg-info']
                const color = colors[i % colors.length]
                const entityLabel = entityLabels[a.entity] || a.entity || ''
                return `
                  <div class="relative pr-6">
                    <div class="absolute -right-[29px] top-0 w-4 h-4 rounded-full ${color} ring-4 ring-surface-container-lowest"></div>
                    <div class="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                      <div>
                        <p class="font-body-md text-on-surface">${a.description}</p>
                        <p class="text-sm text-text-tertiary mt-0.5">${entityLabel}${a.userName ? ' · ' + a.userName : ''}</p>
                      </div>
                      <span class="text-xs text-text-tertiary whitespace-nowrap bg-surface-container px-2 py-1 rounded-md">${a.timeAgo}</span>
                    </div>
                  </div>
                `
              }).join('')}
            </div>
          `
        } else {
          activityList.innerHTML = `
            <div class="text-center py-6">
              <span class="material-symbols-outlined text-text-tertiary text-3xl mb-2">history</span>
              <p class="text-text-tertiary text-sm">لا يوجد نشاط حديث</p>
            </div>
          `
        }
      }

      this.initCharts(d)
    } catch (e) {
      console.error('Dashboard load error:', e)
      if (errorEl) errorEl.classList.remove('hidden')
      if (kpiCards) kpiCards.classList.add('hidden')
      if (retryBtn) retryBtn.classList.remove('hidden')

      // Keep charts hidden
      const revCanvas = el.querySelector('#revenueChart') as HTMLCanvasElement
      const statusCanvas = el.querySelector('#statusChart') as HTMLCanvasElement
      if (revCanvas) revCanvas.style.display = 'none'
      if (statusCanvas) statusCanvas.style.display = 'none'
    }
  }

  private initCharts(d: any) {
    const revCanvas = document.getElementById('revenueChart') as HTMLCanvasElement
    const statusCanvas = document.getElementById('statusChart') as HTMLCanvasElement
    if (!revCanvas || !statusCanvas) return

    const Chart = (window as any).Chart
    if (!Chart) return

    // Revenue Bar Chart
    new Chart(revCanvas.getContext('2d'), {
      type: 'bar',
      data: {
        labels: d.revenueByDay?.map((r: any) => {
          const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
          const date = r.date ? new Date(r.date) : null
          return date && !isNaN(date.getTime()) ? dayNames[date.getDay()] : ''
        }) || ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
        datasets: [{
          label: 'الإيرادات (ل.س)',
          data: d.revenueByDay?.map((r: any) => r.amount || 0) || [],
          backgroundColor: '#003594',
          borderRadius: 8,
          barThickness: 28
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: '#E2E8F0', borderDash: [5, 5] },
            ticks: { font: { family: 'JetBrains Mono' }, color: '#94A3B8' }
          },
          x: {
            grid: { display: false },
            ticks: { font: { family: 'IBM Plex Sans Arabic' }, color: '#475569' }
          }
        }
      }
    })

    // Status Donut Chart — fixed: colors bound to status keys, not by index
    const bs = d.bookingsByStatus || []
    const statusMap: Record<string, number> = {}
    bs.forEach((s: any) => { statusMap[s.status] = (statusMap[s.status] || 0) + (s.count || 0) })

    // Define ALL known statuses with their labels and colors
    const statusDefs: { key: string; label: string; color: string }[] = [
      { key: 'COMPLETED', label: 'مكتمل', color: '#059669' },
      { key: 'PENDING', label: 'قيد الانتظار', color: '#D97706' },
      { key: 'IN_PROGRESS', label: 'قيد العمل', color: '#003594' },
      { key: 'CANCELLED', label: 'ملغى', color: '#ba1a1a' },
      { key: 'CONFIRMED', label: 'مؤكد', color: '#712ae2' },
      { key: 'DRAFT', label: 'مسودة', color: '#737685' },
      { key: 'OVERDUE', label: 'متأخر', color: '#751f00' },
    ]

    // Build chart data arrays preserving color→status binding
    const chartData: number[] = []
    const chartLabels: string[] = []
    const chartColors: string[] = []
    let total = 0

    statusDefs.forEach(def => {
      const count = statusMap[def.key] || 0
      if (count > 0) {
        chartData.push(count)
        chartLabels.push(def.label)
        chartColors.push(def.color)
      }
      total += count
    })

    // Also catch any unknown statuses from API
    const knownKeys = new Set(statusDefs.map(d => d.key))
    Object.entries(statusMap).forEach(([key, count]) => {
      if (!knownKeys.has(key) && (count || 0) > 0) {
        chartData.push(count)
        chartLabels.push(key)
        chartColors.push('#6B7280') // gray for unknown
      }
      total += knownKeys.has(key) ? 0 : (count || 0)
    })

    new Chart(statusCanvas.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: chartLabels,
        datasets: [{
          data: chartData,
          backgroundColor: chartColors,
          borderWidth: 0,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '75%',
        plugins: { legend: { display: false } }
      }
    })

    // Update HTML legend percentages and hide items with 0 count
    this.updateStatusLabel('status-complete', statusMap['COMPLETED'] || 0, total)
    this.updateStatusLabel('status-pending', statusMap['PENDING'] || 0, total)
    this.updateStatusLabel('status-inprogress', statusMap['IN_PROGRESS'] || 0, total)
    this.updateStatusLabel('status-cancelled', statusMap['CANCELLED'] || 0, total)
    this.toggleStatusItem('status-complete', statusMap['COMPLETED'] || 0)
    this.toggleStatusItem('status-pending', statusMap['PENDING'] || 0)
    this.toggleStatusItem('status-inprogress', statusMap['IN_PROGRESS'] || 0)
    this.toggleStatusItem('status-cancelled', statusMap['CANCELLED'] || 0)
  }

  private toggleStatusItem(id: string, count: number) {
    const el = document.getElementById(id)
    if (el) {
      const row = el.closest('div.flex.items-center.justify-between') as HTMLElement
      if (row) row.style.display = count > 0 ? 'flex' : 'none'
    }
  }

  private updateStatusLabel(id: string, val: number, total: number) {
    const el = document.getElementById(id)
    if (el) el.textContent = total ? `${Math.round((val / total) * 100)}%` : '0%'
  }

  private setText(el: HTMLElement, id: string, text: string) {
    const node = el.querySelector(`#${id}`)
    if (node) node.textContent = text
  }

  private fmtNumber(n: number): string {
    return n.toLocaleString('ar-SA')
  }

}
