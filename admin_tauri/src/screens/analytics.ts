import { AuthService } from '../services/auth'
import { ApiClient } from '../api/client'
import { Router } from '../router'
import { AppLayout } from '../components/layout'

export class AnalyticsScreen {
  private auth: AuthService
  private api: ApiClient
  private router: Router

  constructor(auth: AuthService, api: ApiClient, router: Router) {
    this.auth = auth
    this.api = api
    this.router = router
  }

  render(): HTMLElement {
    const layout = new AppLayout(this.auth, this.router, 'التحليلات والذكاء الاصطناعي', 'analytics', this.api)
    const content = document.createElement('div')
    content.className = 'page-enter min-h-screen bg-background p-gutter'
    content.innerHTML = `
      <div class="max-w-7xl mx-auto space-y-stack-lg">
        <div>
          <h1 class="font-beVietnamPro text-headline-md text-on-surface">التحليلات والذكاء الاصطناعي</h1>
          <p class="text-body-md text-text-secondary mt-1">رؤى عميقة وتحليلات متقدمة مدعومة بالذكاء الاصطناعي</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div class="bg-surface-container-lowest p-card-padding rounded-xl shadow-md hover-lift border border-surface-subtle relative overflow-hidden">
            <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary-fixed"></div>
            <p class="font-label-sm text-text-tertiary mb-1">معدل رضا العملاء</p>
            <h3 class="font-headline-lg text-headline-lg text-on-surface" id="kpi-satisfaction">...</h3>
            <div class="flex items-center gap-2 text-sm mt-2" id="kpi-satisfaction-trend"></div>
          </div>
          <div class="bg-surface-container-lowest p-card-padding rounded-xl shadow-md hover-lift border border-surface-subtle relative overflow-hidden">
            <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-secondary to-secondary-container"></div>
            <p class="font-label-sm text-text-tertiary mb-1">متوسط قيمة الفاتورة</p>
            <h3 class="text-financial-data text-headline-lg text-on-surface" id="kpi-avg-invoice">...</h3>
            <span class="text-text-tertiary text-sm">ل.س</span>
          </div>
          <div class="bg-surface-container-lowest p-card-padding rounded-xl shadow-md hover-lift border border-surface-subtle relative overflow-hidden">
            <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-info to-cyan-300"></div>
            <p class="font-label-sm text-text-tertiary mb-1">معدل العائدة</p>
            <h3 class="font-headline-lg text-headline-lg text-on-surface" id="kpi-retention">...</h3>
          </div>
          <div class="bg-surface-container-lowest p-card-padding rounded-xl shadow-md hover-lift border border-surface-subtle relative overflow-hidden">
            <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-tertiary to-tertiary-fixed"></div>
            <p class="font-label-sm text-text-tertiary mb-1">توقعات الشهر القادم</p>
            <h3 class="font-headline-lg text-headline-lg text-on-surface" id="kpi-forecast">...</h3>
            <span class="text-text-tertiary text-sm">نمو متوقع</span>
          </div>
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="bg-surface-container-lowest p-card-padding rounded-xl shadow-md border border-surface-subtle flex flex-col">
            <h3 class="font-headline-md text-[18px] text-on-surface font-semibold mb-6">أداء الخدمات</h3>
            <div class="flex-1 relative w-full h-64 flex items-center justify-center bg-surface-subtle rounded-lg">
              <p class="text-text-tertiary">جاري تحميل البيانات...</p>
            </div>
          </div>
          <div class="bg-surface-container-lowest p-card-padding rounded-xl shadow-md border border-surface-subtle flex flex-col">
            <h3 class="font-headline-md text-[18px] text-on-surface font-semibold mb-6">تحليل العملاء</h3>
            <div class="flex-1 relative w-full h-64 flex items-center justify-center bg-surface-subtle rounded-lg">
              <p class="text-text-tertiary">جاري تحميل البيانات...</p>
            </div>
          </div>
        </div>
      </div>
    `
    this.loadData(content)
    return layout.render(content)
  }

  private async loadData(el: HTMLElement) {
    try {
      const res = await this.api.get<any>('/api/analytics')
      const setText = (id: string, val: string) => {
        const e = el.querySelector('#' + id)
        if (e) e.textContent = val
      }
      if (res.success && res.data) {
        const d = res.data
        setText('kpi-satisfaction', (d.satisfactionRate || 0) + '%')
        const trend = el.querySelector('#kpi-satisfaction-trend')!
        if (d.satisfactionTrend) {
          trend.innerHTML = `<span class="flex items-center text-tertiary font-medium bg-tertiary/10 px-2 py-0.5 rounded-full"><span class="material-symbols-outlined text-[16px]">trending_up</span> ${d.satisfactionTrend}%</span>`
        }
        setText('kpi-avg-invoice', (d.avgInvoiceValue || 0).toLocaleString('ar-SA'))
        setText('kpi-retention', (d.retentionRate || 0) + '%')
        setText('kpi-forecast', '+' + (d.forecastGrowth || 0) + '%')
      }
    } catch {
      el.querySelector('#kpi-satisfaction')!.textContent = '--'
      el.querySelector('#kpi-avg-invoice')!.textContent = '--'
      el.querySelector('#kpi-retention')!.textContent = '--'
      el.querySelector('#kpi-forecast')!.textContent = '--'
    }
  }
}
