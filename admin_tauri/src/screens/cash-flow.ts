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
  return Number.isNaN(date.getTime())
    ? '—'
    : new Intl.DateTimeFormat('ar-SY', { year: 'numeric', month: 'short', day: 'numeric' }).format(date)
}

function money(value: unknown): string {
  return `${Number(value || 0).toLocaleString('ar-SY', { maximumFractionDigits: 2 })} ل.س`
}

const SECTION_LABELS: Record<string, string> = {
  OPERATING: 'تشغيلية',
  INVESTING: 'استثمارية',
  FINANCING: 'تمويلية',
}

function arabicCashDescription(value: unknown): string {
  const description = String(value ?? '').trim()
  if (/[\u0600-\u06ff]/.test(description)) return description
  if (/^payment received/i.test(description)) return description.replace(/^Payment received/i, 'قبض من عميل')
  if (/^supplier payment/i.test(description)) return description.replace(/^Supplier payment/i, 'سداد لمورد')
  if (/^expense/i.test(description)) return description.replace(/^Expense/i, 'مصروف')
  if (/^invoice/i.test(description)) return description.replace(/^Invoice/i, 'فاتورة')
  if (/^reversal of:/i.test(description)) return description.replace(/^Reversal of:/i, 'قيد عكس:')
  return 'حركة نقدية'
}

export class CashFlowScreen {
  private report: any = null
  private loading = false

  constructor(private auth: AuthService, private api: ApiClient, private router: Router) {}

  render(): HTMLElement {
    const layout = new AppLayout(this.auth, this.router, 'التدفقات النقدية', 'payments', this.api)
    const content = document.createElement('div')
    content.className = 'page-enter min-h-screen bg-background p-gutter'
    content.innerHTML = `
      <div class="max-w-7xl mx-auto space-y-stack-lg">
        <header class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p class="text-label-md font-semibold text-primary">التقارير المالية</p>
            <h1 class="mt-1 font-headline-lg text-on-surface">التدفقات النقدية</h1>
            <p class="mt-2 text-body-md text-text-secondary">حركة القبض والصرف المسجلة في الصندوق والبنك خلال الفترة.</p>
          </div>
          <button id="cf-refresh" type="button" class="min-h-[44px] rounded-lg border border-border bg-surface px-4 text-body-md text-on-surface hover:bg-surface-subtle focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
            <span class="material-symbols-outlined ml-1 align-middle" aria-hidden="true">refresh</span> تحديث
          </button>
        </header>

        <section class="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-4">
          <label class="text-label-sm text-text-secondary" for="cf-from">من تاريخ
            <input id="cf-from" type="date" class="mt-1 block min-h-[44px] rounded-lg border border-border bg-surface-subtle px-3 text-on-surface" />
          </label>
          <label class="text-label-sm text-text-secondary" for="cf-to">إلى تاريخ
            <input id="cf-to" type="date" class="mt-1 block min-h-[44px] rounded-lg border border-border bg-surface-subtle px-3 text-on-surface" />
          </label>
          <button id="cf-filter" type="button" class="min-h-[44px] rounded-lg bg-primary px-5 font-semibold text-white">تطبيق الفترة</button>
        </section>

        <section class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3" aria-label="ملخص التدفق النقدي">
          <article class="rounded-xl border border-border bg-surface p-4"><p class="text-body-sm text-text-secondary">الرصيد الافتتاحي</p><p id="cf-beginning" class="mt-2 text-headline-sm font-semibold text-on-surface">—</p></article>
          <article class="rounded-xl border border-border bg-surface p-4"><p class="text-body-sm text-text-secondary">إجمالي المقبوضات</p><p id="cf-in" class="mt-2 text-headline-sm font-semibold text-success">—</p></article>
          <article class="rounded-xl border border-border bg-surface p-4"><p class="text-body-sm text-text-secondary">إجمالي المدفوعات</p><p id="cf-out" class="mt-2 text-headline-sm font-semibold text-error">—</p></article>
          <article class="rounded-xl border border-border bg-surface p-4"><p class="text-body-sm text-text-secondary">الرصيد الختامي</p><p id="cf-ending" class="mt-2 text-headline-sm font-semibold text-primary">—</p></article>
        </section>

        <div id="cf-error" class="hidden rounded-xl border border-error/30 bg-error/5 px-4 py-3 text-body-sm text-error" role="alert"></div>
        <section class="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
          <div class="flex flex-wrap items-center justify-between gap-2 border-b border-border p-4">
            <h2 class="font-headline-md text-on-surface">تفاصيل الحركات</h2>
            <p id="cf-net" class="text-body-sm font-semibold text-on-surface"></p>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full min-w-[760px] text-right">
              <thead class="bg-surface-subtle">
                <tr>
                  <th class="px-4 py-3 text-label-sm text-text-secondary">التاريخ</th>
                  <th class="px-4 py-3 text-label-sm text-text-secondary">البيان</th>
                  <th class="px-4 py-3 text-label-sm text-text-secondary">القسم</th>
                  <th class="px-4 py-3 text-label-sm text-text-secondary">نوع الحركة</th>
                  <th class="px-4 py-3 text-label-sm text-text-secondary">المبلغ</th>
                </tr>
              </thead>
              <tbody id="cf-tbody"><tr><td colspan="5" class="px-6 py-8 text-center text-text-secondary">جاري تحميل التدفقات…</td></tr></tbody>
            </table>
          </div>
        </section>
      </div>`

    const fromInput = content.querySelector('#cf-from') as HTMLInputElement
    const toInput = content.querySelector('#cf-to') as HTMLInputElement
    const today = new Date()
    fromInput.value = `${today.getFullYear()}-01-01`
    toInput.value = today.toISOString().slice(0, 10)
    content.querySelector('#cf-refresh')?.addEventListener('click', () => this.loadData(content))
    content.querySelector('#cf-filter')?.addEventListener('click', () => this.loadData(content))
    this.loadData(content)
    return layout.render(content)
  }

  private async loadData(content: HTMLElement): Promise<void> {
    const tbody = content.querySelector('#cf-tbody') as HTMLElement
    const errorBox = content.querySelector('#cf-error') as HTMLElement
    const from = (content.querySelector('#cf-from') as HTMLInputElement).value
    const to = (content.querySelector('#cf-to') as HTMLInputElement).value
    if (!from || !to) {
      errorBox.textContent = 'حدد تاريخ البداية والنهاية.'
      errorBox.classList.remove('hidden')
      return
    }
    this.loading = true
    errorBox.classList.add('hidden')
    tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-text-secondary">جاري تحميل التدفقات…</td></tr>'
    const params = new URLSearchParams({
      fromDate: `${from}T00:00:00.000Z`,
      toDate: `${to}T23:59:59.999Z`,
      currency: 'SYP',
    })

    try {
      const response = await this.api.get<any>(`/api/reports/cash-flow?${params.toString()}`, false)
      if (response.success === false) throw new Error(response.message || 'تعذر تحميل التدفقات النقدية')
      this.report = response.data
      this.loading = false
      this.renderReport(content)
    } catch (error: any) {
      errorBox.textContent = error.message || 'تعذر الاتصال بالخادم'
      errorBox.classList.remove('hidden')
      tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-error">تعذر تحميل التدفقات النقدية.</td></tr>'
    } finally {
      this.loading = false
    }
  }

  private renderReport(content: HTMLElement): void {
    const tbody = content.querySelector('#cf-tbody') as HTMLElement
    if (!this.report) return
    const sections = ['operating', 'investing', 'financing']
      .map((key) => this.report[key])
      .filter(Boolean)
    const rows = sections.flatMap((section: any) => [
      ...(section.inflows || []).map((item: any) => ({ ...item, flow: 'INFLOW', section: section.sectionType })),
      ...(section.outflows || []).map((item: any) => ({ ...item, flow: 'OUTFLOW', section: section.sectionType })),
    ]).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
    const totalIn = sections.reduce((sum: number, section: any) => sum + Number(section.totalInflow || 0), 0)
    const totalOut = sections.reduce((sum: number, section: any) => sum + Number(section.totalOutflow || 0), 0)

    ;(content.querySelector('#cf-beginning') as HTMLElement).textContent = money(this.report.beginningCash)
    ;(content.querySelector('#cf-in') as HTMLElement).textContent = money(totalIn)
    ;(content.querySelector('#cf-out') as HTMLElement).textContent = money(totalOut)
    ;(content.querySelector('#cf-ending') as HTMLElement).textContent = money(this.report.endingCash)
    ;(content.querySelector('#cf-net') as HTMLElement).textContent = `صافي الحركة: ${money(this.report.netCashFlow)}`

    if (!rows.length) {
      tbody.innerHTML = `<tr><td colspan="5" class="px-6 py-10 text-center text-text-secondary">${this.loading ? 'جاري التحميل…' : 'لا توجد حركات نقدية في الفترة المحددة.'}</td></tr>`
      return
    }
    tbody.innerHTML = rows.map((row: any) => `
      <tr class="border-t border-border/70 hover:bg-surface-subtle/40">
        <td class="whitespace-nowrap px-4 py-3 text-body-sm text-on-surface">${formatDate(row.date)}</td>
        <td class="px-4 py-3 text-body-sm text-on-surface">${escapeHtml(arabicCashDescription(row.description || row.reference))}</td>
        <td class="px-4 py-3 text-body-sm text-text-secondary">${escapeHtml(SECTION_LABELS[row.section] || 'أخرى')}</td>
        <td class="px-4 py-3"><span class="rounded-full px-3 py-1 text-xs ${row.flow === 'INFLOW' ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}">${row.flow === 'INFLOW' ? 'واردة' : 'صادرة'}</span></td>
        <td class="whitespace-nowrap px-4 py-3 text-financial-data font-medium ${row.flow === 'INFLOW' ? 'text-success' : 'text-error'}">${row.flow === 'INFLOW' ? '+' : '−'} ${money(row.amount)}</td>
      </tr>`).join('')
  }
}
