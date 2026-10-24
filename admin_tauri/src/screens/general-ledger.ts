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

function formatDate(value: unknown): string {
  if (!value) return '—'
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('ar-SY', { year: 'numeric', month: 'short', day: 'numeric' }).format(date)
}

function formatNumber(value: unknown): string {
  const amount = Number(value || 0)
  return Number.isFinite(amount)
    ? new Intl.NumberFormat('ar-SY', { maximumFractionDigits: 2 }).format(amount)
    : '0'
}

function formatMoney(syp: unknown, usd?: unknown): string {
  const sypAmount = Number(syp || 0)
  const usdAmount = Number(usd || 0)
  return `${formatNumber(sypAmount)} ل.س${usdAmount ? `<span class="block text-xs text-text-tertiary" dir="ltr">$ ${formatNumber(usdAmount)}</span>` : ''}`
}

function readableReference(value: unknown): string {
  const reference = String(value || '').trim()
  if (!reference || /^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(reference)) return ''
  if (/^(?:WORKORDER|BOOKING|INTAKE|INVENTORY_TRANSACTION|TRANSFER|CANCEL):/i.test(reference)) return ''
  const invoice = reference.match(/^(?:INVOICE:)?INV[-_]?(\d{4})[-_]?0*(\d+)$/i)
  if (invoice) return `فاتورة رقم ${invoice[2]} لسنة ${invoice[1]}`
  const purchaseOrder = reference.match(/^PO:(.+)$/i)
  if (purchaseOrder) return `طلب شراء ${purchaseOrder[1]}`
  const receipt = reference.match(/^GRN:(.+)$/i)
  if (receipt) return `سند استلام ${receipt[1]}`
  const returnedInvoice = reference.match(/^RETURN:(.+)$/i)
  if (returnedInvoice) return `مرتجع من الفاتورة ${returnedInvoice[1]}`
  const count = reference.match(/^COUNT:(.+)$/i)
  if (count) return `جرد مخزون ${count[1]}`
  const journal = reference.match(/^(?:JE|JRN)[-_]?0*(\d+)$/i)
  if (journal) return `قيد رقم ${journal[1]}`
  const payment = reference.match(/^PAY[-_]?(\d{4})[-_]?0*(\d+)$/i)
  if (payment) return `سند قبض رقم ${payment[2]} لسنة ${payment[1]}`
  const expense = reference.match(/^EXP[-_]?(\d{4})[-_]?0*(\d+)$/i)
  if (expense) return `سند مصروف رقم ${expense[2]} لسنة ${expense[1]}`
  const grn = reference.match(/^GRN[-_]?(\d{4})[-_]?0*(\d+)$/i)
  if (grn) return `سند استلام رقم ${grn[2]} لسنة ${grn[1]}`
  if (/[a-z]{8,}/i.test(reference) && !/^(?:INV|JE|JRN|PAY|EXP)[-_]/i.test(reference)) return ''
  return reference
}

function readableAccountName(value: unknown): string {
  const name = String(value || '').trim()
  if (!name) return 'حساب محاسبي'
  if (/[\u0600-\u06ff]/.test(name)) return name
  if (/^cash|cash on hand/i.test(name)) return 'الصندوق النقدي'
  if (/^bank/i.test(name)) return 'الحسابات البنكية'
  if (/accounts receivable|customer receivable/i.test(name)) return 'ذمم العملاء'
  if (/accounts payable|supplier payable/i.test(name)) return 'ذمم الموردين'
  if (/inventory/i.test(name)) return 'المخزون'
  if (/cost of goods sold|cogs/i.test(name)) return 'تكلفة المواد والخدمات'
  if (/revenue|sales/i.test(name)) return 'إيرادات المبيعات'
  if (/expense/i.test(name)) return 'مصروفات تشغيلية'
  if (/capital|equity/i.test(name)) return 'حقوق الملكية'
  return 'حساب محاسبي'
}

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  ASSET: 'أصول',
  LIABILITY: 'التزامات',
  EQUITY: 'حقوق ملكية',
  REVENUE: 'إيرادات',
  COGS: 'تكاليف مباشرة',
  EXPENSE: 'مصروفات',
}

function arabicDescription(value: unknown): string {
  const description = String(value ?? '').trim()
  if (!description) return 'حركة محاسبية'
  if (/[\u0600-\u06ff]/.test(description)) return description
  if (/^cogs for|^stock consumption/i.test(description)) return 'تكلفة مواد مستهلكة'
  if (/^inventory received|^stock intake/i.test(description)) return 'إدخال مواد إلى المخزون'
  if (/^supplier payable/i.test(description)) return 'مبلغ مستحق للمورد'
  if (/^supplier payment/i.test(description)) return 'سداد للمورد'
  if (/^payment received/i.test(description)) return 'قبض من العميل'
  if (/^expense:/i.test(description)) return `مصروف — ${description.slice(description.indexOf(':') + 1).trim()}`
  if (/^invoice/i.test(description)) return 'قيد فاتورة مبيعات'
  if (/^reversal of:/i.test(description)) return 'قيد عكس محاسبي'
  return 'حركة محاسبية'
}

export class GeneralLedgerScreen {
  private report: any = null
  private loading = false

  constructor(private auth: AuthService, private api: ApiClient, private router: Router) {}

  render(): HTMLElement {
    const layout = new AppLayout(this.auth, this.router, 'دفتر الأستاذ', 'menu_book', this.api)
    const content = document.createElement('div')
    content.className = 'page-enter min-h-screen bg-background p-gutter'
    content.innerHTML = `
      <div class="max-w-7xl mx-auto space-y-stack-lg">
        <header class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p class="text-label-md font-semibold text-primary">التقارير المحاسبية</p>
            <h1 class="mt-1 font-headline-lg text-on-surface">دفتر الأستاذ العام</h1>
            <p class="mt-2 text-body-md text-text-secondary">الحركات المرحلة مجمعة حسب الحساب مع الرصيد الافتتاحي والرصيد الجاري.</p>
          </div>
          <button id="ledger-refresh" type="button" class="min-h-[44px] rounded-lg border border-border bg-surface px-4 text-body-md text-on-surface hover:bg-surface-subtle focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
            <span class="material-symbols-outlined ml-1 align-middle" aria-hidden="true">refresh</span> تحديث
          </button>
        </header>

        <section class="grid grid-cols-1 sm:grid-cols-3 gap-3" aria-label="ملخص دفتر الأستاذ">
          <article class="rounded-xl border border-border bg-surface p-4">
            <p class="text-body-sm text-text-secondary">عدد الحسابات ذات الحركة</p>
            <p id="ledger-account-count" class="mt-2 text-headline-md font-semibold text-on-surface">—</p>
          </article>
          <article class="rounded-xl border border-border bg-surface p-4">
            <p class="text-body-sm text-text-secondary">إجمالي المدين</p>
            <p id="ledger-debit-total" class="mt-2 text-headline-sm font-semibold text-on-surface">—</p>
          </article>
          <article class="rounded-xl border border-border bg-surface p-4">
            <p class="text-body-sm text-text-secondary">إجمالي الدائن</p>
            <p id="ledger-credit-total" class="mt-2 text-headline-sm font-semibold text-on-surface">—</p>
          </article>
        </section>

        <section class="rounded-xl border border-border bg-surface p-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-[minmax(240px,1fr)_200px_200px_auto] gap-3 items-end">
            <label class="text-label-sm text-text-secondary" for="ledger-search">بحث بالحساب أو المرجع أو البيان
              <input id="ledger-search" type="search" class="mt-1 min-h-[44px] w-full rounded-lg border border-border bg-surface-subtle px-3 text-body-md text-on-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary" placeholder="مثال: الصندوق، مواد مستهلكة، فاتورة" />
            </label>
            <label class="text-label-sm text-text-secondary" for="ledger-from">من تاريخ
              <input id="ledger-from" type="date" class="mt-1 min-h-[44px] w-full rounded-lg border border-border bg-surface-subtle px-3 text-body-md text-on-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary" />
            </label>
            <label class="text-label-sm text-text-secondary" for="ledger-to">إلى تاريخ
              <input id="ledger-to" type="date" class="mt-1 min-h-[44px] w-full rounded-lg border border-border bg-surface-subtle px-3 text-body-md text-on-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary" />
            </label>
            <button id="ledger-filter" type="button" class="min-h-[44px] rounded-lg bg-primary px-5 font-semibold text-white hover:bg-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">تصفية</button>
          </div>
        </section>

        <div id="ledger-error" class="hidden rounded-xl border border-error/30 bg-error/5 px-4 py-3 text-body-sm text-error" role="alert"></div>
        <section id="ledger-sections" class="space-y-3">
          <div class="rounded-xl border border-border bg-surface p-8 text-center text-text-secondary">جاري تحميل دفتر الأستاذ…</div>
        </section>
      </div>`

    content.querySelector('#ledger-refresh')?.addEventListener('click', () => this.loadData(content))
    content.querySelector('#ledger-filter')?.addEventListener('click', () => this.loadData(content))
    content.querySelector('#ledger-search')?.addEventListener('input', () => this.renderReport(content))
    this.loadData(content)
    return layout.render(content)
  }

  private async loadData(content: HTMLElement): Promise<void> {
    const sections = content.querySelector('#ledger-sections') as HTMLElement
    const error = content.querySelector('#ledger-error') as HTMLElement
    this.loading = true
    error.classList.add('hidden')
    sections.innerHTML = '<div class="rounded-xl border border-border bg-surface p-8 text-center text-text-secondary">جاري تحميل الحركات المحاسبية…</div>'
    const params = new URLSearchParams({ limit: '500' })
    const from = (content.querySelector('#ledger-from') as HTMLInputElement).value
    const to = (content.querySelector('#ledger-to') as HTMLInputElement).value
    if (from) params.set('fromDate', from)
    if (to) params.set('toDate', `${to}T23:59:59.999`)
    try {
      const response = await this.api.get<any>(`/api/general-ledger?${params.toString()}`, false)
      if (!response.success) throw new Error(response.message || 'تعذر تحميل دفتر الأستاذ')
      this.report = response.data?.sections ? response.data : response.data?.data
      if (!this.report || !Array.isArray(this.report.sections)) {
        throw new Error('استجابة دفتر الأستاذ غير مكتملة')
      }
      this.loading = false
      this.renderReport(content)
    } catch (error: any) {
      const errorBox = content.querySelector('#ledger-error') as HTMLElement
      errorBox.textContent = error.message || 'تعذر الاتصال بالخادم'
      errorBox.classList.remove('hidden')
      sections.innerHTML = '<div class="rounded-xl border border-error/30 bg-error/5 p-8 text-center text-error">تعذر تحميل دفتر الأستاذ. أعد المحاولة بعد التحقق من الاتصال.</div>'
    } finally {
      this.loading = false
    }
  }

  private renderReport(content: HTMLElement): void {
    const container = content.querySelector('#ledger-sections') as HTMLElement
    if (!this.report) return
    const query = (content.querySelector('#ledger-search') as HTMLInputElement).value.trim().toLocaleLowerCase()
    const sections = (this.report.sections || []).map((section: any) => {
      const sectionText = `${section.accountCode} ${section.accountNameAr || ''} ${section.accountName || ''}`.toLocaleLowerCase()
      const matchingLines = (section.lines || []).filter((line: any) => {
        const text = `${line.reference || ''} ${line.description || ''} ${line.accountNameAr || ''}`.toLocaleLowerCase()
        return !query || sectionText.includes(query) || text.includes(query)
      })
      if (query && !sectionText.includes(query) && matchingLines.length === 0) return null
      return { ...section, visibleLines: query && !sectionText.includes(query) ? matchingLines : section.lines || [] }
    }).filter(Boolean) as any[]

    const debitSYP = Number(this.report.grandTotalDebitSYP || 0)
    const creditSYP = Number(this.report.grandTotalCreditSYP || 0)
    ;(content.querySelector('#ledger-account-count') as HTMLElement).textContent = sections.length.toLocaleString('ar-SY')
    ;(content.querySelector('#ledger-debit-total') as HTMLElement).textContent = `${formatNumber(debitSYP)} ل.س`
    ;(content.querySelector('#ledger-credit-total') as HTMLElement).textContent = `${formatNumber(creditSYP)} ل.س`

    if (!sections.length) {
      container.innerHTML = `<div class="rounded-xl border border-border bg-surface p-10 text-center">
        <span class="material-symbols-outlined text-4xl text-text-tertiary" aria-hidden="true">menu_book</span>
        <p class="mt-2 font-semibold text-on-surface">${this.loading ? 'جاري تحميل دفتر الأستاذ…' : 'لا توجد حركات مطابقة'}</p>
        <p class="mt-1 text-body-sm text-text-secondary">${query ? 'امسح البحث أو غيّر الفترة.' : 'ستظهر الحسابات هنا عند ترحيل أول قيد محاسبي.'}</p>
      </div>`
      return
    }

    container.innerHTML = sections.map((section, index) => `
      <details ${index === 0 ? 'open' : ''} class="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
        <summary class="flex cursor-pointer flex-wrap items-center justify-between gap-4 list-none p-4 hover:bg-surface-subtle/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
          <div class="flex min-w-0 items-center gap-3">
            <div class="min-w-0">
              <h2 class="truncate font-semibold text-on-surface">${escapeHtml(readableAccountName(section.accountNameAr || section.accountName))}</h2>
              <p class="mt-0.5 text-xs text-text-secondary">${escapeHtml(ACCOUNT_TYPE_LABELS[section.accountType] || 'حساب')} · ${section.visibleLines.length.toLocaleString('ar-SY')} حركات</p>
            </div>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-x-5 gap-y-2 text-left">
            <div><p class="text-xs text-text-tertiary">افتتاحي</p><p class="text-body-sm font-medium text-on-surface">${formatMoney(section.openingBalanceSYP, section.openingBalanceUSD)}</p></div>
            <div><p class="text-xs text-text-tertiary">مدين</p><p class="text-body-sm font-medium text-on-surface">${formatMoney(section.totalDebitSYP, section.totalDebitUSD)}</p></div>
            <div><p class="text-xs text-text-tertiary">دائن</p><p class="text-body-sm font-medium text-on-surface">${formatMoney(section.totalCreditSYP, section.totalCreditUSD)}</p></div>
            <div><p class="text-xs text-text-tertiary">ختامي</p><p class="text-body-sm font-semibold text-primary">${formatMoney(section.closingBalanceSYP, section.closingBalanceUSD)}</p></div>
          </div>
        </summary>
        <div class="border-t border-border">
          <div class="overflow-x-auto">
            <table class="w-full min-w-[850px] text-right">
              <thead><tr class="bg-surface-subtle">
                <th class="px-4 py-3 text-xs text-text-secondary">التاريخ</th>
                <th class="px-4 py-3 text-xs text-text-secondary">المرجع</th>
                <th class="px-4 py-3 text-xs text-text-secondary">البيان</th>
                <th class="px-4 py-3 text-xs text-text-secondary">مدين</th>
                <th class="px-4 py-3 text-xs text-text-secondary">دائن</th>
                <th class="px-4 py-3 text-xs text-text-secondary">الرصيد الجاري</th>
              </tr></thead>
              <tbody>
                ${section.visibleLines.length ? section.visibleLines.map((line: any) => `
                  <tr class="border-t border-border/70 hover:bg-surface-subtle/40">
                    <td class="whitespace-nowrap px-4 py-3 text-body-sm text-on-surface">${formatDate(line.entryDate)}</td>
                    <td class="whitespace-nowrap px-4 py-3 text-body-sm text-text-secondary">${escapeHtml(readableReference(line.reference) || '—')}</td>
                    <td class="px-4 py-3 text-body-sm text-on-surface">${escapeHtml(arabicDescription(line.description))}</td>
                    <td class="whitespace-nowrap px-4 py-3 text-body-sm text-on-surface">${formatMoney(line.debitSYP, line.debitUSD)}</td>
                    <td class="whitespace-nowrap px-4 py-3 text-body-sm text-on-surface">${formatMoney(line.creditSYP, line.creditUSD)}</td>
                    <td class="whitespace-nowrap px-4 py-3 text-body-sm font-semibold text-primary">${formatMoney(line.runningBalanceSYP, line.runningBalanceUSD)}</td>
                  </tr>`).join('') : '<tr><td colspan="6" class="px-4 py-6 text-center text-body-sm text-text-secondary">لا توجد حركات للحساب ضمن البحث.</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      </details>
    `).join('')
  }
}
