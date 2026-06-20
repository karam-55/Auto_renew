import { AuthService } from '../services/auth'
import { ApiClient } from '../api/client'
import { Router } from '../router'
import { AppLayout } from '../components/layout'

export class IncomeStatementScreen {
  constructor(private auth: AuthService, private api: ApiClient, private router: Router) {}

  render(): HTMLElement {
    const layout = new AppLayout(this.auth, this.router, 'قائمة الدخل', 'trending_up', this.api)
    const c = document.createElement('div')
    c.className = 'page-enter min-h-screen bg-background p-gutter'
    c.innerHTML = `
      <div class="max-w-7xl mx-auto space-y-stack-lg">
        <div>
          <h1 class="font-beVietnamPro text-headline-md text-on-surface">قائمة الدخل</h1>
          <p class="text-body-md text-text-secondary mt-1">تقرير الأرباح والخسائر التفصيلي</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div class="bg-surface-container-lowest p-card-padding rounded-xl shadow-md border border-surface-subtle">
            <p class="font-label-sm text-text-tertiary mb-1">الإيرادات</p>
            <h3 class="text-financial-data text-headline-lg text-on-surface" id="pl-revenue">0</h3>
          </div>
          <div class="bg-surface-container-lowest p-card-padding rounded-xl shadow-md border border-surface-subtle">
            <p class="font-label-sm text-text-tertiary mb-1">تكلفة البضاعة</p>
            <h3 class="text-financial-data text-headline-lg text-error" id="pl-cogs">0</h3>
          </div>
          <div class="bg-surface-container-lowest p-card-padding rounded-xl shadow-md border border-surface-subtle">
            <p class="font-label-sm text-text-tertiary mb-1">إجمالي الربح</p>
            <h3 class="text-financial-data text-headline-lg text-success" id="pl-gross">0</h3>
          </div>
          <div class="bg-surface-container-lowest p-card-padding rounded-xl shadow-md border border-surface-subtle">
            <p class="font-label-sm text-text-tertiary mb-1">المصروفات</p>
            <h3 class="text-financial-data text-headline-lg text-on-surface" id="pl-expenses">0</h3>
          </div>
          <div class="bg-surface-container-lowest p-card-padding rounded-xl shadow-md border border-surface-subtle">
            <p class="font-label-sm text-text-tertiary mb-1">صافي الربح</p>
            <h3 class="text-financial-data text-headline-lg text-on-surface" id="pl-net">0</h3>
          </div>
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="bg-surface-container-lowest rounded-xl shadow-md border border-surface-subtle overflow-hidden">
            <div class="p-6 border-b border-outline-variant/10 bg-surface-subtle">
              <h3 class="font-headline-md text-[18px] text-on-surface font-semibold">الإيرادات</h3>
            </div>
            <div class="overflow-x-auto p-4">
              <table class="w-full" id="pl-revenue-table">
                <thead><tr class="bg-surface-subtle border-b border-outline-variant/10">
                  <th class="px-4 py-3 text-right font-label-sm text-text-tertiary">الحساب</th>
                  <th class="px-4 py-3 text-right font-label-sm text-text-tertiary">المبلغ</th>
                </tr></thead>
                <tbody><tr><td colspan="2" class="px-4 py-8 text-center text-text-secondary">جاري التحميل...</td></tr></tbody>
              </table>
            </div>
          </div>
          <div class="bg-surface-container-lowest rounded-xl shadow-md border border-surface-subtle overflow-hidden">
            <div class="p-6 border-b border-outline-variant/10 bg-surface-subtle">
              <h3 class="font-headline-md text-[18px] text-on-surface font-semibold">تكلفة البضاعة المباعة</h3>
            </div>
            <div class="overflow-x-auto p-4">
              <table class="w-full" id="pl-cogs-table">
                <thead><tr class="bg-surface-subtle border-b border-outline-variant/10">
                  <th class="px-4 py-3 text-right font-label-sm text-text-tertiary">الحساب</th>
                  <th class="px-4 py-3 text-right font-label-sm text-text-tertiary">المبلغ</th>
                </tr></thead>
                <tbody><tr><td colspan="2" class="px-4 py-8 text-center text-text-secondary">جاري التحميل...</td></tr></tbody>
              </table>
            </div>
          </div>
          <div class="bg-surface-container-lowest rounded-xl shadow-md border border-surface-subtle overflow-hidden">
            <div class="p-6 border-b border-outline-variant/10 bg-surface-subtle">
              <h3 class="font-headline-md text-[18px] text-on-surface font-semibold">المصروفات التشغيلية</h3>
            </div>
            <div class="overflow-x-auto p-4">
              <table class="w-full" id="pl-expense-table">
                <thead><tr class="bg-surface-subtle border-b border-outline-variant/10">
                  <th class="px-4 py-3 text-right font-label-sm text-text-tertiary">الحساب</th>
                  <th class="px-4 py-3 text-right font-label-sm text-text-tertiary">المبلغ</th>
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
      const res = await this.api.get<any>('/api/reports/profit-loss')
      if (!res.success || !res.data) {
        c.querySelectorAll('tbody').forEach(tb => { tb.innerHTML = '<tr><td colspan="2" class="px-4 py-8 text-center text-text-secondary">لا توجد بيانات</td></tr>' })
        return
      }
      const d = res.data
      const fmt = (n: number) => new Intl.NumberFormat('ar-SA', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n || 0)

      const elRev = c.querySelector('#pl-revenue')
      const elCogs = c.querySelector('#pl-cogs')
      const elGross = c.querySelector('#pl-gross')
      const elExp = c.querySelector('#pl-expenses')
      const elNet = c.querySelector('#pl-net')
      if (elRev) elRev.textContent = fmt(d.revenue?.total)
      if (elCogs) elCogs.textContent = fmt(d.cogs?.total)
      if (elGross) elGross.textContent = fmt(d.grossProfit)
      if (elExp) elExp.textContent = fmt(d.expenses?.total)
      if (elNet) elNet.textContent = fmt(d.netProfit)

      const revTB = c.querySelector('#pl-revenue-table tbody')
      if (revTB && d.revenue?.accounts && d.revenue.accounts.length) {
        revTB.innerHTML = d.revenue.accounts.map((a: any) => `
          <tr class="border-b border-outline-variant/5 hover:bg-surface-subtle/50">
            <td class="px-4 py-3 font-body-md text-on-surface">${a.accountNameAr || a.accountName}</td>
            <td class="px-4 py-3 font-body-md text-on-surface">${fmt(a.amount)}</td>
          </tr>
        `).join('')
      } else if (revTB) {
        revTB.innerHTML = '<tr><td colspan="2" class="px-4 py-8 text-center text-text-secondary">لا توجد بيانات</td></tr>'
      }

      const expTB = c.querySelector('#pl-expense-table tbody')
      if (expTB && d.expenses?.accounts && d.expenses.accounts.length) {
        expTB.innerHTML = d.expenses.accounts.map((a: any) => `
          <tr class="border-b border-outline-variant/5 hover:bg-surface-subtle/50">
            <td class="px-4 py-3 font-body-md text-on-surface">${a.accountNameAr || a.accountName}</td>
            <td class="px-4 py-3 font-body-md text-on-surface">${fmt(a.amount)}</td>
          </tr>
        `).join('')
      } else if (expTB) {
        expTB.innerHTML = '<tr><td colspan="2" class="px-4 py-8 text-center text-text-secondary">لا توجد بيانات</td></tr>'
      }

      const cogsTB = c.querySelector('#pl-cogs-table tbody')
      if (cogsTB && d.cogs?.accounts && d.cogs.accounts.length) {
        cogsTB.innerHTML = d.cogs.accounts.map((a: any) => `
          <tr class="border-b border-outline-variant/5 hover:bg-surface-subtle/50">
            <td class="px-4 py-3 font-body-md text-on-surface">${a.accountNameAr || a.accountName}</td>
            <td class="px-4 py-3 font-body-md text-on-surface">${fmt(a.amount)}</td>
          </tr>
        `).join('')
      } else if (cogsTB) {
        cogsTB.innerHTML = '<tr><td colspan="2" class="px-4 py-8 text-center text-text-secondary">لا توجد بيانات</td></tr>'
      }
    } catch {
      c.querySelectorAll('tbody').forEach(tb => { tb.innerHTML = '<tr><td colspan="2" class="px-4 py-8 text-center text-text-secondary">خطأ في التحميل</td></tr>' })
    }
  }
}
