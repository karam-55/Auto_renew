import { AuthService } from '../services/auth'
import { ApiClient } from '../api/client'
import { Router } from '../router'
import { AppLayout } from '../components/layout'

export class CashFlowScreen {
  constructor(private auth: AuthService, private api: ApiClient, private router: Router) {}
  render(): HTMLElement {
    const layout = new AppLayout(this.auth, this.router, 'التدفقات النقدية', 'payments', this.api)
    const c = document.createElement('div')
    c.className = 'page-enter min-h-screen bg-background p-gutter'
    c.innerHTML = `
      <div class="max-w-7xl mx-auto space-y-stack-lg">
        <div>
          <h1 class="font-beVietnamPro text-headline-md text-on-surface">التدفقات النقدية</h1>
          <p class="text-body-md text-text-secondary mt-1">تقرير مالي تفصيلي</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="bg-surface-container-lowest p-card-padding rounded-xl shadow-md hover-lift border border-surface-subtle relative overflow-hidden">
            <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary-fixed"></div>
            <p class="font-label-sm text-text-tertiary mb-1">التدفقات الواردة</p>
            <h3 id="cf-in" class="text-financial-data text-headline-lg text-on-surface"><div class="skeleton-shimmer h-8 rounded w-24"></div></h3>
          </div>
          <div class="bg-surface-container-lowest p-card-padding rounded-xl shadow-md hover-lift border border-surface-subtle relative overflow-hidden">
            <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-secondary to-secondary-container"></div>
            <p class="font-label-sm text-text-tertiary mb-1">التدفقات الصادرة</p>
            <h3 id="cf-out" class="text-financial-data text-headline-lg text-on-surface"><div class="skeleton-shimmer h-8 rounded w-24"></div></h3>
          </div>
          <div class="bg-surface-container-lowest p-card-padding rounded-xl shadow-md hover-lift border border-surface-subtle relative overflow-hidden">
            <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-tertiary to-tertiary-fixed"></div>
            <p class="font-label-sm text-text-tertiary mb-1">صافي التدفق</p>
            <h3 id="cf-net" class="text-financial-data text-headline-lg text-on-surface"><div class="skeleton-shimmer h-8 rounded w-24"></div></h3>
          </div>
        </div>
        <div class="bg-surface-container-lowest rounded-xl shadow-md border border-surface-subtle overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="bg-surface-subtle border-b border-outline-variant/10">
                  <th class="px-6 py-4 text-right font-label-sm text-label-sm text-text-tertiary uppercase">التاريخ</th>
                  <th class="px-6 py-4 text-right font-label-sm text-label-sm text-text-tertiary uppercase">البيان</th>
                  <th class="px-6 py-4 text-right font-label-sm text-label-sm text-text-tertiary uppercase">النوع</th>
                  <th class="px-6 py-4 text-right font-label-sm text-label-sm text-text-tertiary uppercase">المبلغ</th>
                </tr>
              </thead>
              <tbody id="cf-tbody">
                <tr><td colspan="4" class="px-6 py-8 text-center text-text-secondary font-body-md">جاري التحميل...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>`
    this.loadData(c)
    return layout.render(c)
  }

  private async loadData(c: HTMLElement) {
    try {
      const res: any = await this.api.get('/api/accounting/cash-flow')
      const data = res.data || res
      const items = Array.isArray(data) ? data : data.transactions || data.items || []
      const totalIn = data.totalIn ?? items.filter((i: any) => (i.type || i.flowType) === 'IN').reduce((s: number, i: any) => s + (Number(i.amount) || 0), 0)
      const totalOut = data.totalOut ?? items.filter((i: any) => (i.type || i.flowType) === 'OUT').reduce((s: number, i: any) => s + (Number(i.amount) || 0), 0)

      const inEl = c.querySelector('#cf-in')
      const outEl = c.querySelector('#cf-out')
      const netEl = c.querySelector('#cf-net')
      if (inEl) inEl.textContent = Number(totalIn).toLocaleString('ar-SA') + ' ل.س'
      if (outEl) outEl.textContent = Number(totalOut).toLocaleString('ar-SA') + ' ل.س'
      if (netEl) netEl.textContent = Number(totalIn - totalOut).toLocaleString('ar-SA') + ' ل.س'

      const tbody = c.querySelector('#cf-tbody')!
      if (items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="px-6 py-8 text-center text-text-secondary font-body-md">لا توجد بيانات</td></tr>'
        return
      }
      tbody.innerHTML = items.map((i: any) => `
        <tr class="border-b border-outline-variant/10 hover:bg-surface-container-low/50 transition-colors">
          <td class="px-6 py-4 font-body-md text-text-secondary">${i.date || i.transactionDate || '-'}</td>
          <td class="px-6 py-4 font-body-md text-on-surface">${i.description || i.reference || '-'}</td>
          <td class="px-6 py-4 font-body-md">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${(i.type || i.flowType) === 'IN' ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}">
              ${(i.type || i.flowType) === 'IN' ? 'واردة' : 'صادرة'}
            </span>
          </td>
          <td class="px-6 py-4 font-body-md text-financial-data">${(Number(i.amount) || 0).toLocaleString('ar-SA')} ل.س</td>
        </tr>
      `).join('')
    } catch {
      c.querySelector('#cf-in')!.textContent = '—'
      c.querySelector('#cf-out')!.textContent = '—'
      c.querySelector('#cf-net')!.textContent = '—'
      c.querySelector('#cf-tbody')!.innerHTML = '<tr><td colspan="4" class="px-6 py-8 text-center text-error font-body-md">فشل تحميل البيانات</td></tr>'
    }
  }
}
