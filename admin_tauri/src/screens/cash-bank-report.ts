import { AuthService } from '../services/auth'
import { ApiClient } from '../api/client'
import { Router } from '../router'
import { AppLayout } from '../components/layout'

function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]!)
}

function amount(value: unknown): string {
  return Number(value || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })
}

export class CashBankReportScreen {
  private account: 'CASH' | 'BANK' = 'CASH'

  constructor(private auth: AuthService, private api: ApiClient, private router: Router) {}

  render(): HTMLElement {
    const layout = new AppLayout(this.auth, this.router, 'حركة الصندوق والبنك', 'payments', this.api)
    const content = document.createElement('div')
    content.className = 'page-enter min-h-screen bg-background p-gutter'
    content.innerHTML = `
      <div class="max-w-7xl mx-auto space-y-stack-lg">
        <header>
          <h1 class="font-beVietnamPro text-headline-md text-on-surface">حركة الصندوق والبنك</h1>
          <p class="mt-1 text-body-md text-text-secondary">الأرصدة والحركات من القيود المرحلة المرتبطة بحسابات الصندوق والبنك.</p>
        </header>
        <div class="flex flex-wrap items-end gap-3">
          <label class="text-sm text-text-secondary">من <input id="cash-from" type="date" class="block mt-1 h-10 rounded-lg border border-border bg-surface-subtle px-3 text-on-surface" /></label>
          <label class="text-sm text-text-secondary">إلى <input id="cash-to" type="date" class="block mt-1 h-10 rounded-lg border border-border bg-surface-subtle px-3 text-on-surface" /></label>
          <button id="cash-refresh" class="h-10 rounded-lg bg-primary px-5 text-white">تحديث</button>
          <div class="flex gap-2" role="group" aria-label="اختيار الحساب">
            <button data-cash-account="CASH" class="rounded-lg border border-border px-4 py-2">الصندوق</button>
            <button data-cash-account="BANK" class="rounded-lg border border-border px-4 py-2">البنك</button>
          </div>
        </div>
        <div id="cash-summary" class="grid grid-cols-1 gap-4 md:grid-cols-3"></div>
        <div id="cash-error" class="hidden rounded-lg border border-error/30 bg-error/5 p-4 text-error"></div>
        <section class="overflow-x-auto rounded-xl border border-border bg-surface-container-lowest shadow-md">
          <table class="w-full min-w-[800px] text-right">
            <thead class="bg-surface-subtle"><tr>
              <th class="px-4 py-3">التاريخ</th><th class="px-4 py-3">المرجع</th><th class="px-4 py-3">البيان</th>
              <th class="px-4 py-3">داخل (ل.س)</th><th class="px-4 py-3">خارج (ل.س)</th><th class="px-4 py-3">الرصيد (ل.س)</th>
            </tr></thead>
            <tbody id="cash-movements"><tr><td colspan="6" class="px-4 py-8 text-center text-text-secondary">جاري التحميل...</td></tr></tbody>
          </table>
        </section>
      </div>
    `
    const today = new Date()
    ;(content.querySelector('#cash-from') as HTMLInputElement).value = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10)
    ;(content.querySelector('#cash-to') as HTMLInputElement).value = today.toISOString().slice(0, 10)
    content.querySelector('#cash-refresh')?.addEventListener('click', () => this.load(content))
    content.querySelectorAll<HTMLButtonElement>('[data-cash-account]').forEach((button) => {
      button.addEventListener('click', () => {
        this.account = button.dataset.cashAccount === 'BANK' ? 'BANK' : 'CASH'
        this.renderTabs(content)
        this.load(content)
      })
    })
    this.renderTabs(content)
    this.load(content)
    return layout.render(content)
  }

  private renderTabs(content: HTMLElement) {
    content.querySelectorAll<HTMLButtonElement>('[data-cash-account]').forEach((button) => {
      const selected = button.dataset.cashAccount === this.account
      button.className = `rounded-lg border px-4 py-2 ${selected ? 'border-primary bg-primary/10 text-primary font-semibold' : 'border-border text-on-surface'}`
      button.setAttribute('aria-pressed', String(selected))
    })
  }

  private async load(content: HTMLElement) {
    const tbody = content.querySelector('#cash-movements') as HTMLElement
    const summary = content.querySelector('#cash-summary') as HTMLElement
    const error = content.querySelector('#cash-error') as HTMLElement
    const from = (content.querySelector('#cash-from') as HTMLInputElement).value
    const to = (content.querySelector('#cash-to') as HTMLInputElement).value
    const query = new URLSearchParams({ account: this.account })
    if (from) query.set('from', from)
    if (to) query.set('to', to)
    tbody.innerHTML = '<tr><td colspan="6" class="px-4 py-8 text-center text-text-secondary">جاري التحميل...</td></tr>'
    error.classList.add('hidden')
    try {
      const response = await this.api.get<any>(`/api/reports/cash-bank-movement?${query}`, false)
      if (response.success === false) throw new Error(response.message || 'تعذر تحميل التقرير')
      const data = response.data
      summary.innerHTML = [
        ['الحساب', `${data.account?.code || ''} — ${data.account?.nameAr || ''}`],
        ['رصيد أول الفترة', `${amount(data.openingBalanceSYP)} ل.س`],
        ['رصيد آخر الفترة', `${amount(data.closingBalanceSYP)} ل.س`],
      ].map(([title, value]) => `
        <div class="rounded-xl border border-border bg-surface-container-lowest p-4 shadow-sm">
          <p class="text-sm text-text-secondary">${escapeHtml(title)}</p>
          <p class="mt-2 font-semibold text-on-surface">${escapeHtml(value)}</p>
        </div>
      `).join('')
      const rows = data.movements || []
      tbody.innerHTML = rows.length ? rows.map((line: any) => `
        <tr class="border-t border-border/60">
          <td class="px-4 py-3">${new Date(line.date).toLocaleDateString()}</td>
          <td class="px-4 py-3">${escapeHtml(line.reference || '-')}</td>
          <td class="px-4 py-3">${escapeHtml(line.description || '-')}</td>
          <td class="px-4 py-3 text-success">${amount(line.inflowSYP)}</td>
          <td class="px-4 py-3 text-error">${amount(line.outflowSYP)}</td>
          <td class="px-4 py-3 font-semibold">${amount(line.balanceSYP)}</td>
        </tr>
      `).join('') : '<tr><td colspan="6" class="px-4 py-8 text-center text-text-secondary">لا توجد قيود مرحلة للفترة</td></tr>'
    } catch (cause: any) {
      summary.innerHTML = ''
      tbody.innerHTML = '<tr><td colspan="6" class="px-4 py-8 text-center text-text-secondary">تعذر عرض الحركات</td></tr>'
      error.textContent = cause.message || 'تعذر تحميل التقرير'
      error.classList.remove('hidden')
    }
  }
}
