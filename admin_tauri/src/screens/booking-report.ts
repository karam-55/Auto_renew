import { AuthService } from '../services/auth'
import { ApiClient } from '../api/client'
import { Router } from '../router'
import { AppLayout } from '../components/layout'

export class BookingReportScreen {
  constructor(private auth: AuthService, private api: ApiClient, private router: Router) {}

  render(): HTMLElement {
    const layout = new AppLayout(this.auth, this.router, 'تحليل الحجوزات', 'trending_up', this.api)
    const c = document.createElement('div')
    c.className = 'page-enter min-h-screen bg-background p-gutter'
    c.innerHTML = `
      <div class="max-w-7xl mx-auto space-y-stack-lg">
        <div>
          <h1 class="font-beVietnamPro text-headline-md text-on-surface">تحليل الحجوزات</h1>
          <p class="text-body-md text-text-secondary mt-1">أداء الحجوزات والميكانيكيين</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div class="bg-surface-container-lowest p-card-padding rounded-xl shadow-md border border-surface-subtle">
            <p class="font-label-sm text-text-tertiary mb-1">إجمالي الحجوزات</p>
            <h3 class="text-financial-data text-headline-lg text-on-surface" id="book-total">0</h3>
          </div>
          <div class="bg-surface-container-lowest p-card-padding rounded-xl shadow-md border border-surface-subtle">
            <p class="font-label-sm text-text-tertiary mb-1">المكتملة</p>
            <h3 class="text-financial-data text-headline-lg text-success" id="book-completed">0</h3>
          </div>
          <div class="bg-surface-container-lowest p-card-padding rounded-xl shadow-md border border-surface-subtle">
            <p class="font-label-sm text-text-tertiary mb-1">معدل الإنجاز</p>
            <h3 class="text-financial-data text-headline-lg text-on-surface" id="book-rate">0%</h3>
          </div>
          <div class="bg-surface-container-lowest p-card-padding rounded-xl shadow-md border border-surface-subtle">
            <p class="font-label-sm text-text-tertiary mb-1">متوسط الوقت (س)</p>
            <h3 class="text-financial-data text-headline-lg text-on-surface" id="book-avg-time">0</h3>
          </div>
        </div>
        <div class="bg-surface-container-lowest rounded-xl shadow-md border border-surface-subtle overflow-hidden">
          <div class="p-6 border-b border-outline-variant/10 bg-surface-subtle">
            <h3 class="font-headline-md text-[18px] text-on-surface font-semibold">أداء الميكانيكيين</h3>
          </div>
          <div class="overflow-x-auto p-4">
            <table class="w-full" id="book-mechanics-table">
              <thead><tr class="bg-surface-subtle border-b border-outline-variant/10">
                <th class="px-4 py-3 text-right font-label-sm text-text-tertiary">الميكانيكي</th>
                <th class="px-4 py-3 text-right font-label-sm text-text-tertiary">المهام</th>
                <th class="px-4 py-3 text-right font-label-sm text-text-tertiary">المكتملة</th>
                <th class="px-4 py-3 text-right font-label-sm text-text-tertiary">معدل الإنجاز</th>
                <th class="px-4 py-3 text-right font-label-sm text-text-tertiary">الإيراد (ل.س)</th>
              </tr></thead>
              <tbody><tr><td colspan="5" class="px-4 py-8 text-center text-text-secondary">جاري التحميل...</td></tr></tbody>
            </table>
          </div>
        </div>
      </div>`
    this.loadData(c)
    return layout.render(c)
  }

  private async loadData(c: HTMLElement) {
    // Show skeleton in KPI cards
    const kpiIds = ['book-total', 'book-completed', 'book-rate', 'book-avg-time']
    kpiIds.forEach(id => {
      const el = c.querySelector(`#${id}`)
      if (el) el.innerHTML = '<span class="skeleton-shimmer inline-block h-6 w-16 rounded"></span>'
    })
    
    try {
      // Fallback to /api/reports/bookings if advanced endpoint fails
      let res = await this.api.get<any>('/api/reports/advanced/mechanic-performance')
      if (!res.success || !res.data) {
        // Try fallback endpoint
        res = await this.api.get<any>('/api/reports/bookings')
      }
      
      if (!res.success || !res.data) {
        c.querySelectorAll('tbody').forEach(tb => { tb.innerHTML = '<tr><td colspan="5" class="px-4 py-8 text-center text-text-secondary">لا توجد بيانات</td></tr>' })
        kpiIds.forEach(id => {
          const el = c.querySelector(`#${id}`)
          if (el) el.textContent = '0'
        })
        return
      }
      
      const d = res.data
      const fmt = (n: number) => new Intl.NumberFormat('ar-SA', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n || 0)

      const elTotal = c.querySelector('#book-total')
      const elCompleted = c.querySelector('#book-completed')
      const elRate = c.querySelector('#book-rate')
      const elAvg = c.querySelector('#book-avg-time')
      if (elTotal) elTotal.textContent = fmt(d.totalBookings)
      if (elCompleted) elCompleted.textContent = fmt(d.completedBookings)
      if (elRate) elRate.textContent = (d.completionRate || 0).toFixed(1) + '%'
      if (elAvg) elAvg.textContent = (d.averageServiceTime || 0).toFixed(1)

      const mechTB = c.querySelector('#book-mechanics-table tbody')
      if (mechTB && d.mechanicPerformance && d.mechanicPerformance.length) {
        mechTB.innerHTML = d.mechanicPerformance.map((m: any) => `
          <tr class="border-b border-outline-variant/5 hover:bg-surface-subtle/50">
            <td class="px-4 py-3 font-body-md text-on-surface">${m.mechanicName}</td>
            <td class="px-4 py-3 font-body-md text-on-surface">${fmt(m.totalAssignments)}</td>
            <td class="px-4 py-3 font-body-md text-on-surface">${fmt(m.completedAssignments)}</td>
            <td class="px-4 py-3 font-body-md text-on-surface">${(m.completionRate || 0).toFixed(1)}%</td>
            <td class="px-4 py-3 font-body-md text-on-surface">${fmt(m.totalRevenueSYP)}</td>
          </tr>
        `).join('')
      } else if (mechTB) {
        mechTB.innerHTML = '<tr><td colspan="5" class="px-4 py-8 text-center text-text-secondary">لا توجد بيانات</td></tr>'
      }
    } catch {
      c.querySelectorAll('tbody').forEach(tb => { tb.innerHTML = '<tr><td colspan="5" class="px-4 py-8 text-center text-text-secondary">خطأ في التحميل</td></tr>' })
      kpiIds.forEach(id => {
        const el = c.querySelector(`#${id}`)
        if (el) el.textContent = '-'
      })
    }
  }
}
