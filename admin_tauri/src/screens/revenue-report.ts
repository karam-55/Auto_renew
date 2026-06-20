import { AuthService } from '../services/auth'
import { ApiClient } from '../api/client'
import { Router } from '../router'
import { AppLayout } from '../components/layout'

export class RevenueReportScreen {
  constructor(private auth: AuthService, private api: ApiClient, private router: Router) {}

  render(): HTMLElement {
    const layout = new AppLayout(this.auth, this.router, 'تقرير الإيرادات', 'bar_chart', this.api)
    const c = document.createElement('div')
    c.className = 'page-enter min-h-screen bg-background p-gutter'
    c.innerHTML = `
      <div class="max-w-7xl mx-auto space-y-stack-lg">
        <div>
          <h1 class="font-beVietnamPro text-headline-md text-on-surface">تقرير الإيرادات</h1>
          <p class="text-body-md text-text-secondary mt-1">الإيرادات اليومية والشهرية والسنوية</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div class="bg-surface-container-lowest p-card-padding rounded-xl shadow-md border border-surface-subtle">
            <p class="font-label-sm text-text-tertiary mb-1">إجمالي الإيرادات (ل.س)</p>
            <h3 class="text-financial-data text-headline-lg text-on-surface" id="rev-total-syp">0</h3>
          </div>
          <div class="bg-surface-container-lowest p-card-padding rounded-xl shadow-md border border-surface-subtle">
            <p class="font-label-sm text-text-tertiary mb-1">إجمالي الإيرادات (USD)</p>
            <h3 class="text-financial-data text-headline-lg text-on-surface" id="rev-total-usd">0</h3>
          </div>
          <div class="bg-surface-container-lowest p-card-padding rounded-xl shadow-md border border-surface-subtle">
            <p class="font-label-sm text-text-tertiary mb-1">عدد الفواتير</p>
            <h3 class="text-financial-data text-headline-lg text-on-surface" id="rev-invoices">0</h3>
          </div>
          <div class="bg-surface-container-lowest p-card-padding rounded-xl shadow-md border border-surface-subtle">
            <p class="font-label-sm text-text-tertiary mb-1">متوسط قيمة الفاتورة</p>
            <h3 class="text-financial-data text-headline-lg text-on-surface" id="rev-avg">0</h3>
          </div>
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="bg-surface-container-lowest rounded-xl shadow-md border border-surface-subtle overflow-hidden">
            <div class="p-6 border-b border-outline-variant/10 bg-surface-subtle">
              <h3 class="font-headline-md text-[18px] text-on-surface font-semibold">الإيرادات الشهرية</h3>
            </div>
            <div class="overflow-x-auto p-4">
              <table class="w-full" id="rev-monthly-table">
                <thead><tr class="bg-surface-subtle border-b border-outline-variant/10">
                  <th class="px-4 py-3 text-right font-label-sm text-text-tertiary">الشهر</th>
                  <th class="px-4 py-3 text-right font-label-sm text-text-tertiary">الفواتير</th>
                  <th class="px-4 py-3 text-right font-label-sm text-text-tertiary">الإيراد (ل.س)</th>
                  <th class="px-4 py-3 text-right font-label-sm text-text-tertiary">الإيراد (USD)</th>
                </tr></thead>
                <tbody><tr><td colspan="4" class="px-4 py-8 text-center text-text-secondary">جاري التحميل...</td></tr></tbody>
              </table>
            </div>
          </div>
          <div class="bg-surface-container-lowest rounded-xl shadow-md border border-surface-subtle overflow-hidden">
            <div class="p-6 border-b border-outline-variant/10 bg-surface-subtle">
              <h3 class="font-headline-md text-[18px] text-on-surface font-semibold">أفضل العملاء</h3>
            </div>
            <div class="overflow-x-auto p-4">
              <table class="w-full" id="rev-customers-table">
                <thead><tr class="bg-surface-subtle border-b border-outline-variant/10">
                  <th class="px-4 py-3 text-right font-label-sm text-text-tertiary">العميل</th>
                  <th class="px-4 py-3 text-right font-label-sm text-text-tertiary">الفواتير</th>
                  <th class="px-4 py-3 text-right font-label-sm text-text-tertiary">الإيراد (ل.س)</th>
                </tr></thead>
                <tbody><tr><td colspan="3" class="px-4 py-8 text-center text-text-secondary">جاري التحميل...</td></tr></tbody>
              </table>
            </div>
          </div>
          <div class="bg-surface-container-lowest rounded-xl shadow-md border border-surface-subtle overflow-hidden">
            <div class="p-6 border-b border-outline-variant/10 bg-surface-subtle">
              <h3 class="font-headline-md text-[18px] text-on-surface font-semibold">الإيرادات حسب الخدمة</h3>
            </div>
            <div class="overflow-x-auto p-4">
              <table class="w-full" id="rev-service-table">
                <thead><tr class="bg-surface-subtle border-b border-outline-variant/10">
                  <th class="px-4 py-3 text-right font-label-sm text-text-tertiary">الخدمة</th>
                  <th class="px-4 py-3 text-right font-label-sm text-text-tertiary">الفواتير</th>
                  <th class="px-4 py-3 text-right font-label-sm text-text-tertiary">الإيراد (ل.س)</th>
                </tr></thead>
                <tbody><tr><td colspan="3" class="px-4 py-8 text-center text-text-secondary">جاري التحميل...</td></tr></tbody>
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
      const res = await this.api.get<any>('/api/reports/advanced/revenue')
      if (!res.success || !res.data) {
        c.querySelectorAll('tbody').forEach(tb => { tb.innerHTML = '<tr><td colspan="4" class="px-4 py-8 text-center text-text-secondary">لا توجد بيانات</td></tr>' })
        return
      }
      const d = res.data
      const fmt = (n: number) => new Intl.NumberFormat('ar-SA', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n || 0)

      const elTotalSYP = c.querySelector('#rev-total-syp')
      const elTotalUSD = c.querySelector('#rev-total-usd')
      const elInvoices = c.querySelector('#rev-invoices')
      const elAvg = c.querySelector('#rev-avg')
      if (elTotalSYP) elTotalSYP.textContent = fmt(d.totalRevenueSYP)
      if (elTotalUSD) elTotalUSD.textContent = fmt(d.totalRevenueUSD)
      if (elInvoices) elInvoices.textContent = fmt(d.totalInvoices)
      if (elAvg) elAvg.textContent = fmt(d.averageInvoiceValue)

      // Monthly table
      const monthlyTB = c.querySelector('#rev-monthly-table tbody')
      if (monthlyTB && d.revenueByMonth && d.revenueByMonth.length) {
        monthlyTB.innerHTML = d.revenueByMonth.map((m: any) => `
          <tr class="border-b border-outline-variant/5 hover:bg-surface-subtle/50">
            <td class="px-4 py-3 font-body-md text-on-surface">${m.month}</td>
            <td class="px-4 py-3 font-body-md text-on-surface">${fmt(m.invoiceCount)}</td>
            <td class="px-4 py-3 font-body-md text-on-surface">${fmt(m.revenueSYP)}</td>
            <td class="px-4 py-3 font-body-md text-on-surface">${fmt(m.revenueUSD)}</td>
          </tr>
        `).join('')
      } else if (monthlyTB) {
        monthlyTB.innerHTML = '<tr><td colspan="4" class="px-4 py-8 text-center text-text-secondary">لا توجد بيانات</td></tr>'
      }

      // Top customers table
      const custTB = c.querySelector('#rev-customers-table tbody')
      if (custTB && d.topCustomers && d.topCustomers.length) {
        custTB.innerHTML = d.topCustomers.map((cust: any) => `
          <tr class="border-b border-outline-variant/5 hover:bg-surface-subtle/50">
            <td class="px-4 py-3 font-body-md text-on-surface">${cust.customerName || cust.customerId}</td>
            <td class="px-4 py-3 font-body-md text-on-surface">${fmt(cust.invoiceCount)}</td>
            <td class="px-4 py-3 font-body-md text-on-surface">${fmt(cust.totalRevenueSYP)}</td>
          </tr>
        `).join('')
      } else if (custTB) {
        custTB.innerHTML = '<tr><td colspan="3" class="px-4 py-8 text-center text-text-secondary">لا توجد بيانات</td></tr>'
      }

      // Service revenue table
      const svcTB = c.querySelector('#rev-service-table tbody')
      if (svcTB && d.revenueByService && d.revenueByService.length) {
        svcTB.innerHTML = d.revenueByService.map((svc: any) => `
          <tr class="border-b border-outline-variant/5 hover:bg-surface-subtle/50">
            <td class="px-4 py-3 font-body-md text-on-surface">${svc.serviceName}</td>
            <td class="px-4 py-3 font-body-md text-on-surface">${fmt(svc.invoiceCount)}</td>
            <td class="px-4 py-3 font-body-md text-on-surface">${fmt(svc.totalRevenueSYP)}</td>
          </tr>
        `).join('')
      } else if (svcTB) {
        svcTB.innerHTML = '<tr><td colspan="3" class="px-4 py-8 text-center text-text-secondary">لا توجد بيانات</td></tr>'
      }
    } catch {
      c.querySelectorAll('tbody').forEach(tb => { tb.innerHTML = '<tr><td colspan="4" class="px-4 py-8 text-center text-text-secondary">خطأ في التحميل</td></tr>' })
    }
  }
}
