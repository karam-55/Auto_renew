import { AuthService } from '../services/auth'
import { ApiClient } from '../api/client'
import { Router } from '../router'
import { AppLayout } from '../components/layout'

type Currency = 'SYP' | 'USD'

const todayIso = (): string => new Date().toLocaleDateString('en-CA')
const startOfYearIso = (): string => `${new Date().getFullYear()}-01-01`

export class IncomeStatementScreen {
  private currency: Currency = 'SYP'

  constructor(private auth: AuthService, private api: ApiClient, private router: Router) {}

  render(): HTMLElement {
    const layout = new AppLayout(this.auth, this.router, 'قائمة الدخل', 'trending_up', this.api)
    const c = document.createElement('div')
    c.className = 'page-enter min-h-screen bg-background p-gutter'
    c.innerHTML = `
      <div class="max-w-7xl mx-auto space-y-stack-lg">
        <div class="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 class="font-beVietnamPro text-headline-md text-on-surface">قائمة الدخل</h1>
            <p class="text-body-md text-text-secondary mt-1">تقرير الأرباح والخسائر من القيود المرحّلة ضمن الفترة المحددة</p>
          </div>
          <div class="flex flex-wrap items-end gap-3">
            <label class="text-label-sm text-text-secondary">من تاريخ
              <input id="pl-from" type="date" value="${startOfYearIso()}" class="mt-1 block min-h-[44px] rounded-lg border border-border bg-surface-subtle px-3 text-on-surface" />
            </label>
            <label class="text-label-sm text-text-secondary">إلى تاريخ
              <input id="pl-to" type="date" value="${todayIso()}" class="mt-1 block min-h-[44px] rounded-lg border border-border bg-surface-subtle px-3 text-on-surface" />
            </label>
            <div class="inline-flex rounded-lg border border-border overflow-hidden" role="group" aria-label="العملة">
              <button type="button" data-currency="SYP" class="currency-btn min-h-[44px] px-4 font-semibold">ل.س</button>
              <button type="button" data-currency="USD" class="currency-btn min-h-[44px] px-4 font-semibold">$</button>
            </div>
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div class="bg-surface-container-lowest p-card-padding rounded-xl shadow-md border border-surface-subtle">
            <p class="font-label-sm text-text-tertiary mb-1">الإيرادات</p>
            <h3 class="text-financial-data text-headline-lg text-on-surface" id="pl-revenue" dir="ltr">0</h3>
          </div>
          <div class="bg-surface-container-lowest p-card-padding rounded-xl shadow-md border border-surface-subtle">
            <p class="font-label-sm text-text-tertiary mb-1">تكلفة البضاعة</p>
            <h3 class="text-financial-data text-headline-lg text-error" id="pl-cogs" dir="ltr">0</h3>
          </div>
          <div class="bg-surface-container-lowest p-card-padding rounded-xl shadow-md border border-surface-subtle">
            <p class="font-label-sm text-text-tertiary mb-1">إجمالي الربح</p>
            <h3 class="text-financial-data text-headline-lg text-success" id="pl-gross" dir="ltr">0</h3>
          </div>
          <div class="bg-surface-container-lowest p-card-padding rounded-xl shadow-md border border-surface-subtle">
            <p class="font-label-sm text-text-tertiary mb-1">المصروفات</p>
            <h3 class="text-financial-data text-headline-lg text-on-surface" id="pl-expenses" dir="ltr">0</h3>
          </div>
          <div class="bg-surface-container-lowest p-card-padding rounded-xl shadow-md border border-surface-subtle">
            <p class="font-label-sm text-text-tertiary mb-1">صافي الربح</p>
            <h3 class="text-financial-data text-headline-lg text-on-surface" id="pl-net" dir="ltr">0</h3>
            <p class="font-label-sm text-text-tertiary mt-1" id="pl-margin"></p>
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
    this.attachListeners(c)
    this.paintCurrency(c)
    this.loadData(c)
    return layout.render(c)
  }

  private attachListeners(c: HTMLElement) {
    c.querySelectorAll<HTMLButtonElement>('.currency-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.currency = btn.dataset.currency === 'USD' ? 'USD' : 'SYP'
        this.paintCurrency(c)
        this.loadData(c)
      })
    })
    c.querySelector('#pl-from')?.addEventListener('change', () => this.loadData(c))
    c.querySelector('#pl-to')?.addEventListener('change', () => this.loadData(c))
  }

  private paintCurrency(c: HTMLElement) {
    c.querySelectorAll<HTMLButtonElement>('.currency-btn').forEach((btn) => {
      const active = btn.dataset.currency === this.currency
      btn.className = `currency-btn min-h-[44px] px-4 font-semibold ${active ? 'bg-primary text-on-primary' : 'bg-surface-subtle text-on-surface'}`
    })
  }

  private async loadData(c: HTMLElement) {
    try {
      const from = (c.querySelector('#pl-from') as HTMLInputElement)?.value || startOfYearIso()
      const to = (c.querySelector('#pl-to') as HTMLInputElement)?.value || todayIso()
      const res = await this.api.get<any>(`/api/reports/profit-loss?fromDate=${from}&toDate=${to}&currency=${this.currency}`, false)
      if (!res.success || !res.data) {
        c.querySelectorAll('tbody').forEach(tb => { tb.innerHTML = '<tr><td colspan="2" class="px-4 py-8 text-center text-text-secondary">لا توجد بيانات</td></tr>' })
        return
      }
      const d = res.data
      const fmt = (n: number) => new Intl.NumberFormat('ar-SA', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(n || 0)

      const setText = (selector: string, text: string) => {
        const el = c.querySelector(selector)
        if (el) el.textContent = text
      }
      setText('#pl-revenue', fmt(d.revenue?.total))
      setText('#pl-cogs', fmt(d.cogs?.total))
      setText('#pl-gross', fmt(d.grossProfit))
      setText('#pl-expenses', fmt(d.expenses?.total))
      setText('#pl-net', fmt(d.netProfit))
      setText('#pl-margin', `هامش الربح ${fmt(d.netProfitMargin)}% · ${this.currency === 'USD' ? '$' : 'ل.س'}`)

      const renderRows = (selector: string, accounts: any[] | undefined) => {
        const tb = c.querySelector(selector + ' tbody')
        if (!tb) return
        if (accounts && accounts.length) {
          tb.innerHTML = accounts.map((a: any) => `
            <tr class="border-b border-outline-variant/5 hover:bg-surface-subtle/50">
              <td class="px-4 py-3 font-body-md text-on-surface">${a.accountNameAr || a.accountName || '-'}</td>
              <td class="px-4 py-3 font-body-md text-on-surface" dir="ltr">${fmt(a.amount)}</td>
            </tr>
          `).join('')
        } else {
          tb.innerHTML = '<tr><td colspan="2" class="px-4 py-8 text-center text-text-secondary">لا توجد بيانات</td></tr>'
        }
      }

      renderRows('#pl-revenue-table', d.revenue?.accounts)
      renderRows('#pl-expense-table', d.expenses?.accounts)
      renderRows('#pl-cogs-table', d.cogs?.accounts)
    } catch {
      c.querySelectorAll('tbody').forEach(tb => { tb.innerHTML = '<tr><td colspan="2" class="px-4 py-8 text-center text-text-secondary">خطأ في التحميل</td></tr>' })
    }
  }
}
