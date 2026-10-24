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

function formatMoney(syp: unknown, usd: unknown): string {
  const sypAmount = Number(syp || 0)
  const usdAmount = Number(usd || 0)
  const primary = `${formatNumber(sypAmount)} ل.س`
  return usdAmount > 0 ? `${primary}<span class="block text-xs text-text-tertiary" dir="ltr">$ ${formatNumber(usdAmount)}</span>` : primary
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

const SOURCE_LABELS: Record<string, string> = {
  INVOICE: 'فاتورة مبيعات',
  PAYMENT: 'قبض من عميل',
  PAYMENT_UPDATE: 'تسوية دفعة عميل',
  EXPENSE: 'مصروف',
  GRN: 'استلام بضاعة من مورد',
  INVENTORY_TRANSACTION: 'حركة مخزون',
  SUPPLIER_PAYMENT: 'سداد مورد',
  PAYROLL: 'رواتب وأجور',
  DEPRECIATION: 'إهلاك أصل',
  INSTALLMENT: 'دفعة قسط',
  DEALER_WARRANTY_RECEIPT: 'قبض حصة كفالة',
  CHEQUE: 'شيك',
  CHEQUE_TRANSACTION: 'حركة شيك',
  CUSTOMER_PAYMENT: 'قبض من عميل',
  STOCK_CONSUMPTION: 'استهلاك مادة من المخزون',
}

function journalDescription(entry: any): string {
  const sourceType = String(entry.sourceType || '')
  const referenceText = readableReference(entry.reference)
  const reference = referenceText ? ` · ${referenceText}` : ''
  if (sourceType.startsWith('REVERSAL_OF_')) {
    const originalType = sourceType.slice('REVERSAL_OF_'.length)
    return `قيد عكس ${SOURCE_LABELS[originalType] || 'قيد محاسبي'}${reference}`
  }
  const raw = String(entry.description || '')
  if (/[\u0600-\u06ff]/.test(raw)) return raw
  const intakeItem = raw.match(/^stock intake\s*[-:]\s*(.+)$/i)?.[1]
  if (intakeItem) return `استلام مادة إلى المخزون: ${intakeItem}${reference}`
  const adjustmentItem = raw.match(/^inventory adjustment\s*[-:]\s*(.+)$/i)?.[1]
  if (adjustmentItem) return `تسوية مخزون المادة: ${adjustmentItem}${reference}`
  const lineDescription = String(entry.lines?.find((line: any) => line.description)?.description || '')
  const materialName = lineDescription.match(/^(?:COGS for|Inventory reduction for)\s+[^-]+\s*-\s*(.+)$/i)?.[1]
  if (materialName) return `تكلفة مادة مستهلكة في العمل: ${materialName}${reference}`
  const translated = SOURCE_LABELS[sourceType]
  if (translated) return `${translated}${reference}`

  if (/^invoice\b/i.test(raw)) return `قيد فاتورة مبيعات${reference}`
  if (/^payment received\b/i.test(raw)) return `قبض من عميل${reference}`
  if (/^expense:/i.test(raw)) return `مصروف تشغيلي${reference}`
  if (/^stock consumption|^cogs for/i.test(raw)) return `تكلفة المواد المصروفة للعمل${reference}`
  if (/^inventory received|^stock intake/i.test(raw)) return `إدخال مواد إلى المخزون${reference}`
  if (/^supplier payment/i.test(raw)) return `سداد مستحقات مورد${reference}`
  if (/^reversal of:/i.test(raw)) return `قيد عكس محاسبي${reference}`
  return reference ? `قيد محاسبي${reference}` : 'قيد محاسبي'
}

const STATUS_LABELS: Record<string, string> = {
  POSTED: 'مرحل',
  DRAFT: 'مسودة',
  PENDING: 'قيد المراجعة',
  APPROVED: 'معتمد',
  CANCELLED: 'ملغى',
}

export class JournalEntriesScreen {
  private entries: any[] = []
  private errorMessage = ''
  private loading = false

  constructor(private auth: AuthService, private api: ApiClient, private router: Router) {}

  render(): HTMLElement {
    const layout = new AppLayout(this.auth, this.router, 'القيود اليومية', 'receipt', this.api)
    const content = document.createElement('div')
    content.className = 'page-enter min-h-screen bg-background p-gutter'
    content.innerHTML = `
      <div class="max-w-7xl mx-auto space-y-stack-lg">
        <header class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p class="text-label-md font-semibold text-primary">المحاسبة</p>
            <h1 class="mt-1 font-headline-lg text-on-surface">القيود اليومية</h1>
            <p class="mt-2 text-body-md text-text-secondary">تفاصيل الترحيل المحاسبي مع إجمالي المدين والدائن لكل قيد.</p>
          </div>
          <button id="journal-refresh" type="button" class="min-h-[44px] rounded-lg border border-border bg-surface px-4 text-body-md text-on-surface hover:bg-surface-subtle focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
            <span class="material-symbols-outlined ml-1 align-middle" aria-hidden="true">refresh</span> تحديث
          </button>
        </header>

        <section class="grid grid-cols-1 sm:grid-cols-3 gap-3" aria-label="ملخص القيود">
          <article class="rounded-xl border border-border bg-surface p-4">
            <p class="text-body-sm text-text-secondary">عدد القيود</p>
            <p id="journal-count" class="mt-2 text-headline-md font-semibold text-on-surface">—</p>
          </article>
          <article class="rounded-xl border border-border bg-surface p-4">
            <p class="text-body-sm text-text-secondary">إجمالي المدين المرحّل</p>
            <p id="journal-debit-total" class="mt-2 text-headline-sm font-semibold text-on-surface">—</p>
          </article>
          <article class="rounded-xl border border-border bg-surface p-4">
            <p class="text-body-sm text-text-secondary">إجمالي الدائن المرحّل</p>
            <p id="journal-credit-total" class="mt-2 text-headline-sm font-semibold text-on-surface">—</p>
          </article>
        </section>

        <section class="rounded-xl border border-border bg-surface p-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-[minmax(240px,1fr)_180px_180px_180px_auto] gap-3 items-end">
            <label class="text-label-sm text-text-secondary" for="journal-search">بحث بالبيان أو الحساب أو المرجع
              <input id="journal-search" type="search" class="mt-1 min-h-[44px] w-full rounded-lg border border-border bg-surface-subtle px-3 text-body-md text-on-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary" placeholder="مثال: مواد مستهلكة، مورد، فاتورة" />
            </label>
            <label class="text-label-sm text-text-secondary" for="journal-from">من تاريخ
              <input id="journal-from" type="date" class="mt-1 min-h-[44px] w-full rounded-lg border border-border bg-surface-subtle px-3 text-body-md text-on-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary" />
            </label>
            <label class="text-label-sm text-text-secondary" for="journal-to">إلى تاريخ
              <input id="journal-to" type="date" class="mt-1 min-h-[44px] w-full rounded-lg border border-border bg-surface-subtle px-3 text-body-md text-on-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary" />
            </label>
            <label class="text-label-sm text-text-secondary" for="journal-status">حالة القيد
              <select id="journal-status" class="mt-1 min-h-[44px] w-full rounded-lg border border-border bg-surface-subtle px-3 text-body-md text-on-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
                <option value="">كل الحالات</option>
                <option value="POSTED">مرحّل</option>
                <option value="DRAFT">مسودة</option>
                <option value="PENDING">قيد المراجعة</option>
                <option value="APPROVED">معتمد</option>
                <option value="CANCELLED">ملغى</option>
              </select>
            </label>
            <button id="journal-filter" type="button" class="min-h-[44px] rounded-lg bg-primary px-5 font-semibold text-white hover:bg-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">تصفية</button>
          </div>
        </section>

        <section class="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
          <div id="journal-table-wrap" class="overflow-x-auto">
            <table class="w-full min-w-[880px] text-right">
              <thead>
                <tr class="border-b border-border bg-surface-subtle">
                  <th class="px-4 py-3 text-label-sm text-text-secondary">التاريخ</th>
                  <th class="px-4 py-3 text-label-sm text-text-secondary">المرجع</th>
                  <th class="px-4 py-3 text-label-sm text-text-secondary">نوع القيد والبيان</th>
                  <th class="px-4 py-3 text-label-sm text-text-secondary">مدين</th>
                  <th class="px-4 py-3 text-label-sm text-text-secondary">دائن</th>
                  <th class="px-4 py-3 text-label-sm text-text-secondary">الحالة</th>
                  <th class="px-4 py-3 text-label-sm text-text-secondary">التفاصيل</th>
                </tr>
              </thead>
              <tbody id="table-tbody">
                <tr><td colspan="7" class="px-6 py-8 text-center text-text-secondary">جاري تحميل القيود…</td></tr>
              </tbody>
            </table>
          </div>
          <div id="journal-error" class="hidden border-t border-error/20 bg-error/5 px-4 py-3 text-body-sm text-error" role="alert"></div>
        </section>
      </div>`

    content.querySelector('#journal-refresh')?.addEventListener('click', () => this.loadData(content))
    content.querySelector('#journal-filter')?.addEventListener('click', () => this.loadData(content))
    content.querySelector('#journal-search')?.addEventListener('input', () => this.renderEntries(content))
    this.loadData(content)
    return layout.render(content)
  }

  private async loadData(content: HTMLElement): Promise<void> {
    const tbody = content.querySelector('#table-tbody') as HTMLElement
    const errorBox = content.querySelector('#journal-error') as HTMLElement
    this.loading = true
    this.errorMessage = ''
    errorBox.classList.add('hidden')
    tbody.innerHTML = Array(5).fill('<tr><td colspan="7" class="px-4 py-3"><div class="skeleton-shimmer h-8 rounded"></div></td></tr>').join('')

    const params = new URLSearchParams({ limit: '200' })
    const from = (content.querySelector('#journal-from') as HTMLInputElement).value
    const to = (content.querySelector('#journal-to') as HTMLInputElement).value
    const status = (content.querySelector('#journal-status') as HTMLSelectElement).value
    if (from) params.set('dateFrom', `${from}T00:00:00.000Z`)
    if (to) params.set('dateTo', `${to}T23:59:59.999Z`)
    if (status) params.set('status', status)

    try {
      const response = await this.api.get<any>(`/api/journal-entries?${params.toString()}`, false)
      if (!response.success) throw new Error(response.message || 'تعذر تحميل القيود اليومية')
      this.entries = Array.isArray(response.data) ? response.data : response.data?.data || []
      this.loading = false
      this.renderEntries(content)
    } catch (caught: any) {
      this.errorMessage = caught.message || 'تعذر الاتصال بالخادم'
      errorBox.classList.remove('hidden')
      errorBox.textContent = this.errorMessage
      tbody.innerHTML = '<tr><td colspan="7" class="px-6 py-8 text-center text-error">تعذر تحميل القيود. تحقق من الاتصال ثم أعد المحاولة.</td></tr>'
    } finally {
      this.loading = false
    }
  }

  private renderEntries(content: HTMLElement): void {
    const tbody = content.querySelector('#table-tbody') as HTMLElement
    const query = (content.querySelector('#journal-search') as HTMLInputElement).value.trim().toLocaleLowerCase()
    const filtered = this.entries.filter((entry) => {
      const searchable = `${journalDescription(entry)} ${entry.reference || ''} ${entry.description || ''}`.toLocaleLowerCase()
      return !query || searchable.includes(query)
    })
    const posted = filtered.filter((entry) => entry.status === 'POSTED')
    const debitTotal = posted.reduce((sum, entry) => sum + Number(entry.totalDebitSYP ?? entry.lines?.reduce((n: number, line: any) => n + Number(line.debitSYP || 0), 0) ?? 0), 0)
    const creditTotal = posted.reduce((sum, entry) => sum + Number(entry.totalCreditSYP ?? entry.lines?.reduce((n: number, line: any) => n + Number(line.creditSYP || 0), 0) ?? 0), 0)
    ;(content.querySelector('#journal-count') as HTMLElement).textContent = filtered.length.toLocaleString('ar-SY')
    ;(content.querySelector('#journal-debit-total') as HTMLElement).textContent = `${formatNumber(debitTotal)} ل.س`
    ;(content.querySelector('#journal-credit-total') as HTMLElement).textContent = `${formatNumber(creditTotal)} ل.س`

    if (!filtered.length) {
      tbody.innerHTML = `<tr><td colspan="7" class="px-6 py-12 text-center">
        <span class="material-symbols-outlined text-4xl text-text-tertiary" aria-hidden="true">receipt_long</span>
        <p class="mt-2 font-medium text-on-surface">${this.loading ? 'جاري تحميل القيود…' : 'لا توجد قيود في الفترة المحددة'}</p>
        <p class="mt-1 text-body-sm text-text-secondary">جرّب تغيير التاريخ أو الحالة، أو حدّث البيانات.</p>
      </td></tr>`
      return
    }

    tbody.innerHTML = filtered.map((entry) => {
      const id = escapeHtml(entry.id)
      const status = String(entry.status || '')
      const badgeClass = status === 'POSTED' ? 'bg-success/10 text-success' : status === 'CANCELLED' ? 'bg-error/10 text-error' : 'bg-warning/10 text-warning'
      const lines = entry.lines || []
      const totalDebitSYP = entry.totalDebitSYP ?? lines.reduce((sum: number, line: any) => sum + Number(line.debitSYP || 0), 0)
      const totalCreditSYP = entry.totalCreditSYP ?? lines.reduce((sum: number, line: any) => sum + Number(line.creditSYP || 0), 0)
      const totalDebitUSD = entry.totalDebitUSD ?? lines.reduce((sum: number, line: any) => sum + Number(line.debitUSD || 0), 0)
      const totalCreditUSD = entry.totalCreditUSD ?? lines.reduce((sum: number, line: any) => sum + Number(line.creditUSD || 0), 0)
      return `
        <tr class="border-b border-border hover:bg-surface-subtle/60">
          <td class="whitespace-nowrap px-4 py-4 text-body-sm text-on-surface">${formatDate(entry.entryDate)}</td>
          <td class="whitespace-nowrap px-4 py-4 text-body-sm text-text-secondary">${escapeHtml(readableReference(entry.reference) || '—')}</td>
          <td class="min-w-[220px] px-4 py-4 text-body-sm text-on-surface">
            <span class="font-medium">${escapeHtml(journalDescription(entry))}</span>
            ${entry.isReversed ? '<span class="mr-2 rounded-full bg-warning/10 px-2 py-1 text-xs text-warning">تم عكسه</span>' : ''}
          </td>
          <td class="whitespace-nowrap px-4 py-4 text-financial-data text-on-surface">${formatMoney(totalDebitSYP, totalDebitUSD)}</td>
          <td class="whitespace-nowrap px-4 py-4 text-financial-data text-on-surface">${formatMoney(totalCreditSYP, totalCreditUSD)}</td>
          <td class="px-4 py-4"><span class="inline-flex min-h-[28px] items-center rounded-full px-3 text-label-sm ${badgeClass}">${escapeHtml(STATUS_LABELS[status] || 'غير معروف')}</span></td>
          <td class="px-4 py-4"><button type="button" data-toggle-entry="${id}" aria-expanded="false" class="min-h-[40px] rounded-lg border border-border px-3 text-body-sm text-primary hover:bg-primary/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">عرض القيد</button></td>
        </tr>
        <tr id="journal-detail-${id}" class="hidden border-b border-border bg-surface-subtle/40">
          <td colspan="7" class="p-4">
            <div class="mb-3 text-body-sm font-semibold text-on-surface">تفاصيل القيد · ${lines.length.toLocaleString('ar-SY')} سطور</div>
            ${this.renderLines(lines)}
          </td>
        </tr>`
    }).join('')

    tbody.querySelectorAll<HTMLButtonElement>('[data-toggle-entry]').forEach((button) => {
      button.addEventListener('click', () => {
        const detail = tbody.querySelector(`#journal-detail-${button.dataset.toggleEntry}`)
        const opening = detail?.classList.contains('hidden') ?? false
        detail?.classList.toggle('hidden', !opening)
        button.setAttribute('aria-expanded', String(opening))
        button.textContent = opening ? 'إخفاء التفاصيل' : 'عرض القيد'
      })
    })
  }

  private renderLines(lines: any[]): string {
    if (!lines.length) return '<p class="rounded-lg bg-surface px-4 py-3 text-body-sm text-text-secondary">لا توجد سطور لهذا القيد.</p>'
    return `<div class="overflow-x-auto rounded-lg border border-border bg-surface">
      <table class="w-full min-w-[620px] text-right">
        <thead><tr class="border-b border-border bg-surface-subtle">
          <th class="px-3 py-2 text-xs text-text-secondary">الحساب</th><th class="px-3 py-2 text-xs text-text-secondary">البيان</th><th class="px-3 py-2 text-xs text-text-secondary">مدين</th><th class="px-3 py-2 text-xs text-text-secondary">دائن</th>
        </tr></thead>
        <tbody>${lines.map((line: any) => `<tr class="border-b border-border last:border-0">
          <td class="px-3 py-3 text-body-sm text-on-surface">${escapeHtml(readableAccountName(line.accountNameAr || line.accountName))}</td>
          <td class="px-3 py-3 text-body-sm text-text-secondary">${escapeHtml(journalLineDescription(line))}</td>
          <td class="px-3 py-3 text-body-sm text-on-surface">${formatMoney(line.debitSYP, line.debitUSD)}</td>
          <td class="px-3 py-3 text-body-sm text-on-surface">${formatMoney(line.creditSYP, line.creditUSD)}</td>
        </tr>`).join('')}</tbody>
      </table>
    </div>`
  }
}

function journalLineDescription(line: any): string {
  const text = String(line.description || '')
  if (/[\u0600-\u06ff]/.test(text)) return text
  const cogsMaterial = text.match(/^cogs for\s+[^-]+\s*-\s*(.+)$/i)?.[1]
  if (cogsMaterial) return `تكلفة مادة مستهلكة: ${cogsMaterial}`
  const inventoryMaterial = text.match(/^inventory reduction for\s+[^-]+\s*-\s*(.+)$/i)?.[1]
  if (inventoryMaterial) return `تخفيض مخزون المادة: ${inventoryMaterial}`
  if (/^cogs for|^stock consumption/i.test(text)) return 'تكلفة مواد مستهلكة ضمن أمر الشغل'
  if (/^inventory received|^stock intake/i.test(text)) return 'إدخال مواد إلى المخزون'
  if (/^supplier payable/i.test(text)) return 'مبلغ مستحق للمورد'
  if (/^supplier payment/i.test(text)) return 'سداد للمورد'
  if (/^payment received/i.test(text)) return 'قبض من العميل'
  if (/^expense/i.test(text)) return 'مصروف تشغيلي'
  if (/^sales revenue|^revenue/i.test(text)) return 'إيراد مبيعات'
  if (/^accounts receivable/i.test(text)) return 'ذمم مدينة — عملاء'
  if (/^inventory adjustment increase/i.test(text)) return 'زيادة رصيد المخزون بالتسوية'
  if (/^inventory adjustment decrease/i.test(text)) return 'تخفيض رصيد المخزون بالتسوية'
  if (/^inventory adjustment gain/i.test(text)) return 'إيراد ناتج عن تسوية زيادة المخزون'
  if (/^inventory shrinkage expense/i.test(text)) return 'خسارة أو عجز مواد من المخزون'
  if (/^inventory reduction/i.test(text)) return 'تخفيض قيمة المخزون بسبب الصرف'
  if (/^stock intake offset/i.test(text)) return 'مقابل استلام المواد (نقد أو بنك أو ذمم مورد)'
  return 'حركة محاسبية'
}
