import { AuthService } from '../services/auth'
import { ApiClient } from '../api/client'
import { Router } from '../router'
import { AppLayout } from '../components/layout'

export class InventoryReportScreen {
  constructor(private auth: AuthService, private api: ApiClient, private router: Router) {}

  render(): HTMLElement {
    const layout = new AppLayout(this.auth, this.router, 'تقرير المخزون', 'stacked_bar_chart', this.api)
    const c = document.createElement('div')
    c.className = 'page-enter min-h-screen bg-background p-gutter'
    c.innerHTML = `
      <div class="max-w-7xl mx-auto space-y-stack-lg">
        <div>
          <h1 class="font-beVietnamPro text-headline-md text-on-surface">تقرير المخزون</h1>
          <p class="text-body-md text-text-secondary mt-1">الكميات، القيم، السلع السريعة والبطيئة</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div class="bg-surface-container-lowest p-card-padding rounded-xl shadow-md border border-surface-subtle">
            <p class="font-label-sm text-text-tertiary mb-1">إجمالي القطع</p>
            <h3 class="text-financial-data text-headline-lg text-on-surface" id="inv-total-parts">0</h3>
          </div>
          <div class="bg-surface-container-lowest p-card-padding rounded-xl shadow-md border border-surface-subtle">
            <p class="font-label-sm text-text-tertiary mb-1">القيمة (ل.س)</p>
            <h3 class="text-financial-data text-headline-lg text-on-surface" id="inv-total-syp">0</h3>
          </div>
          <div class="bg-surface-container-lowest p-card-padding rounded-xl shadow-md border border-surface-subtle">
            <p class="font-label-sm text-text-tertiary mb-1">القيمة (USD)</p>
            <h3 class="text-financial-data text-headline-lg text-on-surface" id="inv-total-usd">0</h3>
          </div>
          <div class="bg-surface-container-lowest p-card-padding rounded-xl shadow-md border border-surface-subtle">
            <p class="font-label-sm text-text-tertiary mb-1">منخفضة المخزون</p>
            <h3 class="text-financial-data text-headline-lg text-error" id="inv-low">0</h3>
          </div>
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="bg-surface-container-lowest rounded-xl shadow-md border border-surface-subtle overflow-hidden">
            <div class="p-6 border-b border-outline-variant/10 bg-surface-subtle">
              <h3 class="font-headline-md text-[18px] text-on-surface font-semibold">سلع سريعة الحركة</h3>
            </div>
            <div class="overflow-x-auto p-4">
              <table class="w-full" id="inv-fast-table">
                <thead><tr class="bg-surface-subtle border-b border-outline-variant/10">
                  <th class="px-4 py-3 text-right font-label-sm text-text-tertiary">القطعة</th>
                  <th class="px-4 py-3 text-right font-label-sm text-text-tertiary">المباع</th>
                  <th class="px-4 py-3 text-right font-label-sm text-text-tertiary">الإيراد</th>
                  <th class="px-4 py-3 text-right font-label-sm text-text-tertiary">معدل الدوران</th>
                </tr></thead>
                <tbody><tr><td colspan="4" class="px-4 py-8 text-center text-text-secondary">جاري التحميل...</td></tr></tbody>
              </table>
            </div>
          </div>
          <div class="bg-surface-container-lowest rounded-xl shadow-md border border-surface-subtle overflow-hidden">
            <div class="p-6 border-b border-outline-variant/10 bg-surface-subtle">
              <h3 class="font-headline-md text-[18px] text-on-surface font-semibold">منخفضة المخزون</h3>
            </div>
            <div class="overflow-x-auto p-4">
              <table class="w-full" id="inv-low-table">
                <thead><tr class="bg-surface-subtle border-b border-outline-variant/10">
                  <th class="px-4 py-3 text-right font-label-sm text-text-tertiary">القطعة</th>
                  <th class="px-4 py-3 text-right font-label-sm text-text-tertiary">الرمز</th>
                  <th class="px-4 py-3 text-right font-label-sm text-text-tertiary">الكمية</th>
                  <th class="px-4 py-3 text-right font-label-sm text-text-tertiary">الحد الأدنى</th>
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
      const res = await this.api.get<any>('/api/reports/advanced/inventory')
      if (!res.success || !res.data) {
        c.querySelectorAll('tbody').forEach(tb => { tb.innerHTML = '<tr><td colspan="4" class="px-4 py-8 text-center text-text-secondary">لا توجد بيانات</td></tr>' })
        return
      }
      const d = res.data
      const fmt = (n: number) => new Intl.NumberFormat('ar-SA', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n || 0)

      const elParts = c.querySelector('#inv-total-parts')
      const elSYP = c.querySelector('#inv-total-syp')
      const elUSD = c.querySelector('#inv-total-usd')
      const elLow = c.querySelector('#inv-low')
      if (elParts) elParts.textContent = fmt(d.totalParts)
      if (elSYP) elSYP.textContent = fmt(d.totalValueSYP)
      if (elUSD) elUSD.textContent = fmt(d.totalValueUSD)
      if (elLow) elLow.textContent = fmt((d.lowStockItems || []).length)

      const fastTB = c.querySelector('#inv-fast-table tbody')
      if (fastTB && d.fastMovingItems && d.fastMovingItems.length) {
        fastTB.innerHTML = d.fastMovingItems.map((item: any) => `
          <tr class="border-b border-outline-variant/5 hover:bg-surface-subtle/50">
            <td class="px-4 py-3 font-body-md text-on-surface">${item.name || '-'}</td>
            <td class="px-4 py-3 font-body-md text-on-surface">${fmt(item.totalSold)}</td>
            <td class="px-4 py-3 font-body-md text-on-surface">${fmt(item.totalRevenueSYP)}</td>
            <td class="px-4 py-3 font-body-md text-on-surface">${(item.turnoverRate || 0).toFixed(1)}%</td>
          </tr>
        `).join('')
      } else if (fastTB) {
        fastTB.innerHTML = '<tr><td colspan="4" class="px-4 py-8 text-center text-text-secondary">لا توجد بيانات</td></tr>'
      }

      const lowTB = c.querySelector('#inv-low-table tbody')
      if (lowTB && d.lowStockItems && d.lowStockItems.length) {
        lowTB.innerHTML = d.lowStockItems.map((item: any) => `
          <tr class="border-b border-outline-variant/5 hover:bg-surface-subtle/50">
            <td class="px-4 py-3 font-body-md text-on-surface">${item.name || '-'}</td>
            <td class="px-4 py-3 font-body-md text-on-surface">${item.partNumber || '-'}</td>
            <td class="px-4 py-3 font-body-md text-error">${fmt(item.currentQuantity)}</td>
            <td class="px-4 py-3 font-body-md text-on-surface">${fmt(item.minQuantity)}</td>
          </tr>
        `).join('')
      } else if (lowTB) {
        lowTB.innerHTML = '<tr><td colspan="4" class="px-4 py-8 text-center text-text-secondary">لا توجد بيانات</td></tr>'
      }
    } catch {
      c.querySelectorAll('tbody').forEach(tb => { tb.innerHTML = '<tr><td colspan="4" class="px-4 py-8 text-center text-text-secondary">خطأ في التحميل</td></tr>' })
    }
  }
}
