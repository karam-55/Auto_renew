import { AuthService } from '../services/auth'
import { ApiClient } from '../api/client'
import { Router } from '../router'
import { AppLayout } from '../components/layout'

export class CustomerReportScreen {
  constructor(private auth: AuthService, private api: ApiClient, private router: Router) {}

  render(): HTMLElement {
    const layout = new AppLayout(this.auth, this.router, 'تحليل العملاء', 'groups', this.api)
    const c = document.createElement('div')
    c.className = 'page-enter min-h-screen bg-background p-gutter'
    c.innerHTML = `
      <div class="max-w-7xl mx-auto space-y-stack-lg">
        <div>
          <h1 class="font-beVietnamPro text-headline-md text-on-surface">تحليل العملاء</h1>
          <p class="text-body-md text-text-secondary mt-1">سلوك العملاء، التقسيم، ومخاطر الاستبعاد</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div class="bg-surface-container-lowest p-card-padding rounded-xl shadow-md border border-surface-subtle">
            <p class="font-label-sm text-text-tertiary mb-1">إجمالي العملاء</p>
            <h3 class="text-financial-data text-headline-lg text-on-surface" id="cust-total">0</h3>
          </div>
          <div class="bg-surface-container-lowest p-card-padding rounded-xl shadow-md border border-surface-subtle">
            <p class="font-label-sm text-text-tertiary mb-1">العملاء النشطون</p>
            <h3 class="text-financial-data text-headline-lg text-on-surface" id="cust-active">0</h3>
          </div>
          <div class="bg-surface-container-lowest p-card-padding rounded-xl shadow-md border border-surface-subtle">
            <p class="font-label-sm text-text-tertiary mb-1">عملاء جدد (30 يوم)</p>
            <h3 class="text-financial-data text-headline-lg text-on-surface" id="cust-new">0</h3>
          </div>
          <div class="bg-surface-container-lowest p-card-padding rounded-xl shadow-md border border-surface-subtle">
            <p class="font-label-sm text-text-tertiary mb-1">متوسط قيمة العميل</p>
            <h3 class="text-financial-data text-headline-lg text-on-surface" id="cust-avg">0</h3>
          </div>
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="bg-surface-container-lowest rounded-xl shadow-md border border-surface-subtle overflow-hidden">
            <div class="p-6 border-b border-outline-variant/10 bg-surface-subtle">
              <h3 class="font-headline-md text-[18px] text-on-surface font-semibold">شرائح العملاء</h3>
            </div>
            <div class="overflow-x-auto p-4">
              <table class="w-full" id="cust-segments-table">
                <thead><tr class="bg-surface-subtle border-b border-outline-variant/10">
                  <th class="px-4 py-3 text-right font-label-sm text-text-tertiary">الشريحة</th>
                  <th class="px-4 py-3 text-right font-label-sm text-text-tertiary">العدد</th>
                  <th class="px-4 py-3 text-right font-label-sm text-text-tertiary">متوسط القيمة</th>
                  <th class="px-4 py-3 text-right font-label-sm text-text-tertiary">الإيراد</th>
                </tr></thead>
                <tbody><tr><td colspan="4" class="px-4 py-8 text-center text-text-secondary">جاري التحميل...</td></tr></tbody>
              </table>
            </div>
          </div>
          <div class="bg-surface-container-lowest rounded-xl shadow-md border border-surface-subtle overflow-hidden">
            <div class="p-6 border-b border-outline-variant/10 bg-surface-subtle">
              <h3 class="font-headline-md text-[18px] text-on-surface font-semibold">مخاطر الاستبعاد</h3>
            </div>
            <div class="overflow-x-auto p-4">
              <table class="w-full" id="cust-churn-table">
                <thead><tr class="bg-surface-subtle border-b border-outline-variant/10">
                  <th class="px-4 py-3 text-right font-label-sm text-text-tertiary">العميل</th>
                  <th class="px-4 py-3 text-right font-label-sm text-text-tertiary">آخر زيارة</th>
                  <th class="px-4 py-3 text-right font-label-sm text-text-tertiary">الأيام</th>
                  <th class="px-4 py-3 text-right font-label-sm text-text-tertiary">المخاطر</th>
                </tr></thead>
                <tbody><tr><td colspan="4" class="px-4 py-8 text-center text-text-secondary">جاري التحميل...</td></tr></tbody>
              </table>
            </div>
          </div>
        </div>
      </div>`
    this.loadData(c)
    return layout.render(c)
  }

  private async loadData(c: HTMLElement) {
    try {
      const res = await this.api.get<any>('/api/reports/advanced/customer-insights')
      if (!res.success || !res.data) {
        c.querySelectorAll('tbody').forEach(tb => { tb.innerHTML = '<tr><td colspan="4" class="px-4 py-8 text-center text-text-secondary">لا توجد بيانات</td></tr>' })
        return
      }
      const d = res.data
      const fmt = (n: number) => new Intl.NumberFormat('ar-SA', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n || 0)

      const elTotal = c.querySelector('#cust-total')
      const elActive = c.querySelector('#cust-active')
      const elNew = c.querySelector('#cust-new')
      const elAvg = c.querySelector('#cust-avg')
      if (elTotal) elTotal.textContent = fmt(d.totalCustomers)
      if (elActive) elActive.textContent = fmt(d.activeCustomers)
      if (elNew) elNew.textContent = fmt(d.newCustomers)
      if (elAvg) elAvg.textContent = fmt(d.averageCustomerValue)

      const segTB = c.querySelector('#cust-segments-table tbody')
      if (segTB && d.customerSegments && d.customerSegments.length) {
        const segMap: Record<string, string> = { NEW: 'جديد', ACTIVE: 'نشط', INACTIVE: 'غير نشط' }
        segTB.innerHTML = d.customerSegments.map((s: any) => `
          <tr class="border-b border-outline-variant/5 hover:bg-surface-subtle/50">
            <td class="px-4 py-3 font-body-md text-on-surface">${segMap[s.segment] || s.segment}</td>
            <td class="px-4 py-3 font-body-md text-on-surface">${fmt(s.count)}</td>
            <td class="px-4 py-3 font-body-md text-on-surface">${fmt(s.averageValue)}</td>
            <td class="px-4 py-3 font-body-md text-on-surface">${fmt(s.totalRevenue)}</td>
          </tr>
        `).join('')
      } else if (segTB) {
        segTB.innerHTML = '<tr><td colspan="4" class="px-4 py-8 text-center text-text-secondary">لا توجد بيانات</td></tr>'
      }

      const churnTB = c.querySelector('#cust-churn-table tbody')
      if (churnTB && d.churnRiskCustomers && d.churnRiskCustomers.length) {
        const riskMap: Record<string, string> = { LOW: 'منخفض', MEDIUM: 'متوسط', HIGH: 'عالي' }
        const riskColor: Record<string, string> = { LOW: 'text-success', MEDIUM: 'text-warning', HIGH: 'text-error' }
        churnTB.innerHTML = d.churnRiskCustomers.map((cust: any) => {
          const lastDate = cust.lastVisitDate ? new Date(cust.lastVisitDate).toLocaleDateString('ar-SY') : '-'
          return `
          <tr class="border-b border-outline-variant/5 hover:bg-surface-subtle/50">
            <td class="px-4 py-3 font-body-md text-on-surface">${cust.customerName}</td>
            <td class="px-4 py-3 font-body-md text-on-surface">${lastDate}</td>
            <td class="px-4 py-3 font-body-md text-on-surface">${fmt(cust.daysSinceLastVisit)}</td>
            <td class="px-4 py-3 font-body-md ${riskColor[cust.riskLevel] || 'text-on-surface'}">${riskMap[cust.riskLevel] || cust.riskLevel}</td>
          </tr>
        `}).join('')
      } else if (churnTB) {
        churnTB.innerHTML = '<tr><td colspan="4" class="px-4 py-8 text-center text-text-secondary">لا توجد بيانات</td></tr>'
      }
    } catch {
      c.querySelectorAll('tbody').forEach(tb => { tb.innerHTML = '<tr><td colspan="4" class="px-4 py-8 text-center text-text-secondary">خطأ في التحميل</td></tr>' })
    }
  }
}
