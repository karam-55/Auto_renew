import { AuthService } from '../services/auth'
import { ApiClient } from '../api/client'
import { Router } from '../router'
import { AppLayout } from '../components/layout'

export class BalanceSheetScreen {
  constructor(private auth: AuthService, private api: ApiClient, private router: Router) {}

  render(): HTMLElement {
    const layout = new AppLayout(this.auth, this.router, 'الميزانية العمومية', 'balance', this.api)
    const c = document.createElement('div')
    c.className = 'page-enter min-h-screen bg-background p-gutter'
    c.innerHTML = `
      <div class="max-w-7xl mx-auto space-y-stack-lg">
        <div>
          <h1 class="font-beVietnamPro text-headline-md text-on-surface">الميزانية العمومية</h1>
          <p class="text-body-md text-text-secondary mt-1">الأصول، الالتزامات، وحقوق الملكية</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="bg-surface-container-lowest p-card-padding rounded-xl shadow-md border border-surface-subtle">
            <p class="font-label-sm text-text-tertiary mb-1">إجمالي الأصول</p>
            <h3 class="text-financial-data text-headline-lg text-on-surface" id="bs-assets">0</h3>
          </div>
          <div class="bg-surface-container-lowest p-card-padding rounded-xl shadow-md border border-surface-subtle">
            <p class="font-label-sm text-text-tertiary mb-1">إجمالي الالتزامات</p>
            <h3 class="text-financial-data text-headline-lg text-on-surface" id="bs-liabilities">0</h3>
          </div>
          <div class="bg-surface-container-lowest p-card-padding rounded-xl shadow-md border border-surface-subtle">
            <p class="font-label-sm text-text-tertiary mb-1">حقوق الملكية</p>
            <h3 class="text-financial-data text-headline-lg text-on-surface" id="bs-equity">0</h3>
          </div>
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="bg-surface-container-lowest rounded-xl shadow-md border border-surface-subtle overflow-hidden">
            <div class="p-6 border-b border-outline-variant/10 bg-surface-subtle">
              <h3 class="font-headline-md text-[18px] text-on-surface font-semibold">الأصول</h3>
            </div>
            <div class="overflow-x-auto p-4">
              <table class="w-full" id="bs-assets-table">
                <thead><tr class="bg-surface-subtle border-b border-outline-variant/10">
                  <th class="px-4 py-3 text-right font-label-sm text-text-tertiary">الحساب</th>
                  <th class="px-4 py-3 text-right font-label-sm text-text-tertiary">الرصيد</th>
                </tr></thead>
                <tbody><tr><td colspan="2" class="px-4 py-8 text-center text-text-secondary">جاري التحميل...</td></tr></tbody>
              </table>
            </div>
          </div>
          <div class="bg-surface-container-lowest rounded-xl shadow-md border border-surface-subtle overflow-hidden">
            <div class="p-6 border-b border-outline-variant/10 bg-surface-subtle">
              <h3 class="font-headline-md text-[18px] text-on-surface font-semibold">الالتزامات</h3>
            </div>
            <div class="overflow-x-auto p-4">
              <table class="w-full" id="bs-liab-table">
                <thead><tr class="bg-surface-subtle border-b border-outline-variant/10">
                  <th class="px-4 py-3 text-right font-label-sm text-text-tertiary">الحساب</th>
                  <th class="px-4 py-3 text-right font-label-sm text-text-tertiary">الرصيد</th>
                </tr></thead>
                <tbody><tr><td colspan="2" class="px-4 py-8 text-center text-text-secondary">جاري التحميل...</td></tr></tbody>
              </table>
            </div>
          </div>
          <div class="bg-surface-container-lowest rounded-xl shadow-md border border-surface-subtle overflow-hidden">
            <div class="p-6 border-b border-outline-variant/10 bg-surface-subtle">
              <h3 class="font-headline-md text-[18px] text-on-surface font-semibold">حقوق الملكية</h3>
            </div>
            <div class="overflow-x-auto p-4">
              <table class="w-full" id="bs-equity-table">
                <thead><tr class="bg-surface-subtle border-b border-outline-variant/10">
                  <th class="px-4 py-3 text-right font-label-sm text-text-tertiary">الحساب</th>
                  <th class="px-4 py-3 text-right font-label-sm text-text-tertiary">الرصيد</th>
                </tr></thead>
                <tbody><tr><td colspan="2" class="px-4 py-8 text-center text-text-secondary">جاري التحميل...</td></tr></tbody>
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
      const res = await this.api.get<any>('/api/reports/balance-sheet')
      if (!res.success || !res.data) {
        c.querySelectorAll('tbody').forEach(tb => { tb.innerHTML = '<tr><td colspan="2" class="px-4 py-8 text-center text-text-secondary">لا توجد بيانات</td></tr>' })
        return
      }
      const d = res.data
      const fmt = (n: number) => new Intl.NumberFormat('ar-SA', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n || 0)

      const elAssets = c.querySelector('#bs-assets')
      const elLiab = c.querySelector('#bs-liabilities')
      const elEquity = c.querySelector('#bs-equity')
      if (elAssets) elAssets.textContent = fmt(d.totalAssets)
      if (elLiab) elLiab.textContent = fmt(d.totalLiabilities)
      if (elEquity) elEquity.textContent = fmt(d.totalEquity)

      const renderSection = (selector: string, section: any) => {
        const tb = c.querySelector(selector + ' tbody')
        if (!tb) return
        if (section?.accounts && section.accounts.length) {
          tb.innerHTML = section.accounts.map((a: any) => `
            <tr class="border-b border-outline-variant/5 hover:bg-surface-subtle/50">
              <td class="px-4 py-3 font-body-md text-on-surface">${a.accountNameAr || a.accountName}</td>
              <td class="px-4 py-3 font-body-md text-on-surface">${fmt(a.balance)}</td>
            </tr>
          `).join('')
        } else {
          tb.innerHTML = '<tr><td colspan="2" class="px-4 py-8 text-center text-text-secondary">لا توجد بيانات</td></tr>'
        }
      }

      renderSection('#bs-assets-table', d.assets)
      renderSection('#bs-liab-table', d.liabilities)
      renderSection('#bs-equity-table', d.equity)
    } catch {
      c.querySelectorAll('tbody').forEach(tb => { tb.innerHTML = '<tr><td colspan="2" class="px-4 py-8 text-center text-text-secondary">خطأ في التحميل</td></tr>' })
    }
  }
}
