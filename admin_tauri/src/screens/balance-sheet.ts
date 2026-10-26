import { AuthService } from '../services/auth'
import { ApiClient } from '../api/client'
import { Router } from '../router'
import { AppLayout } from '../components/layout'

type Currency = 'SYP' | 'USD'

const todayIso = (): string => new Date().toLocaleDateString('en-CA')

export class BalanceSheetScreen {
  private currency: Currency = 'SYP'

  constructor(private auth: AuthService, private api: ApiClient, private router: Router) {}

  render(): HTMLElement {
    const layout = new AppLayout(this.auth, this.router, 'الميزانية العمومية', 'balance', this.api)
    const c = document.createElement('div')
    c.className = 'page-enter min-h-screen bg-background p-gutter'
    c.innerHTML = `
      <div class="max-w-7xl mx-auto space-y-stack-lg">
        <div class="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 class="font-beVietnamPro text-headline-md text-on-surface">الميزانية العمومية</h1>
            <p class="text-body-md text-text-secondary mt-1">الأصول = الالتزامات + حقوق الملكية (تشمل نتيجة الفترة الجارية غير المقفلة)</p>
          </div>
          <div class="flex flex-wrap items-end gap-3">
            <label class="text-label-sm text-text-secondary">حتى تاريخ
              <input id="bs-asof" type="date" value="${todayIso()}" class="mt-1 block min-h-[44px] rounded-lg border border-border bg-surface-subtle px-3 text-on-surface" />
            </label>
            <div class="inline-flex rounded-lg border border-border overflow-hidden" role="group" aria-label="العملة">
              <button type="button" data-currency="SYP" class="currency-btn min-h-[44px] px-4 font-semibold">ل.س</button>
              <button type="button" data-currency="USD" class="currency-btn min-h-[44px] px-4 font-semibold">$</button>
            </div>
          </div>
        </div>
        <div id="bs-status" class="hidden rounded-xl border px-4 py-3 font-body-md"></div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="bg-surface-container-lowest p-card-padding rounded-xl shadow-md border border-surface-subtle">
            <p class="font-label-sm text-text-tertiary mb-1">إجمالي الأصول</p>
            <h3 class="text-financial-data text-headline-lg text-on-surface" id="bs-assets" dir="ltr">0</h3>
          </div>
          <div class="bg-surface-container-lowest p-card-padding rounded-xl shadow-md border border-surface-subtle">
            <p class="font-label-sm text-text-tertiary mb-1">إجمالي الالتزامات</p>
            <h3 class="text-financial-data text-headline-lg text-on-surface" id="bs-liabilities" dir="ltr">0</h3>
          </div>
          <div class="bg-surface-container-lowest p-card-padding rounded-xl shadow-md border border-surface-subtle">
            <p class="font-label-sm text-text-tertiary mb-1">حقوق الملكية</p>
            <h3 class="text-financial-data text-headline-lg text-on-surface" id="bs-equity" dir="ltr">0</h3>
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
    c.querySelector('#bs-asof')?.addEventListener('change', () => this.loadData(c))
  }

  private paintCurrency(c: HTMLElement) {
    c.querySelectorAll<HTMLButtonElement>('.currency-btn').forEach((btn) => {
      const active = btn.dataset.currency === this.currency
      btn.className = `currency-btn min-h-[44px] px-4 font-semibold ${active ? 'bg-primary text-on-primary' : 'bg-surface-subtle text-on-surface'}`
    })
  }

  private async loadData(c: HTMLElement) {
    try {
      const asOf = (c.querySelector('#bs-asof') as HTMLInputElement)?.value || todayIso()
      const res = await this.api.get<any>(`/api/reports/balance-sheet?toDate=${asOf}&currency=${this.currency}`, false)
      if (!res.success || !res.data) {
        c.querySelectorAll('tbody').forEach(tb => { tb.innerHTML = '<tr><td colspan="2" class="px-4 py-8 text-center text-text-secondary">لا توجد بيانات</td></tr>' })
        return
      }
      const d = res.data
      const suffix = this.currency === 'USD' ? '$' : 'ل.س'
      const fmt = (n: number) => new Intl.NumberFormat('ar-SA', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(n || 0)

      const setText = (selector: string, text: string) => {
        const el = c.querySelector(selector)
        if (el) el.textContent = text
      }
      setText('#bs-assets', `${fmt(d.totalAssets)} ${suffix}`)
      setText('#bs-liabilities', `${fmt(d.totalLiabilities)} ${suffix}`)
      setText('#bs-equity', `${fmt(d.totalEquity)} ${suffix}`)

      const status = c.querySelector('#bs-status') as HTMLElement
      if (status) {
        status.classList.remove('hidden', 'border-success/40', 'bg-success/10', 'text-success', 'border-error/40', 'bg-error/10', 'text-error')
        if (d.isBalanced) {
          status.classList.add('border-success/40', 'bg-success/10', 'text-success')
          status.textContent = 'الميزانية متوازنة: الأصول تساوي الالتزامات مضافاً إليها حقوق الملكية.'
        } else {
          status.classList.add('border-error/40', 'bg-error/10', 'text-error')
          status.textContent = `الميزانية غير متوازنة: الفرق ${fmt(d.difference)} ${suffix}. راجع القيود غير المتوازنة أو الحسابات خارج الدليل.`
        }
      }

      const renderSection = (selector: string, section: any) => {
        const tb = c.querySelector(selector + ' tbody')
        if (!tb) return
        if (section?.accounts && section.accounts.length) {
          tb.innerHTML = section.accounts.map((a: any) => `
            <tr class="border-b border-outline-variant/5 hover:bg-surface-subtle/50">
              <td class="px-4 py-3 font-body-md text-on-surface">${a.accountNameAr || a.accountName || '-'}</td>
              <td class="px-4 py-3 font-body-md text-on-surface" dir="ltr">${fmt(a.balance)}</td>
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
