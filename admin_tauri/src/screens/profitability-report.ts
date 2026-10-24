import { AuthService } from '../services/auth'
import { ApiClient } from '../api/client'
import { Router } from '../router'
import { AppLayout } from '../components/layout'

type ProfitDimension = 'service' | 'work-order' | 'department'

const DIMENSIONS: Array<{ id: ProfitDimension; label: string; endpoint: string }> = [
  { id: 'service', label: 'حسب الخدمة', endpoint: '/api/reports/service-profit' },
  { id: 'work-order', label: 'حسب أمر الشغل', endpoint: '/api/reports/work-order-profit' },
  { id: 'department', label: 'حسب القسم', endpoint: '/api/reports/department-profit' },
]

function money(value: unknown): string {
  return `${Number(value || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })} ل.س`
}

export class ProfitabilityReportScreen {
  private dimension: ProfitDimension = 'service'
  private rows: any[] = []
  private from = ''
  private to = ''

  constructor(private auth: AuthService, private api: ApiClient, private router: Router) {}

  render(): HTMLElement {
    const layout = new AppLayout(this.auth, this.router, 'تحليل الربحية', 'monitoring', this.api)
    const content = document.createElement('div')
    content.className = 'page-enter min-h-screen bg-background p-gutter'
    content.innerHTML = `
      <div class="max-w-7xl mx-auto space-y-stack-lg">
        <header>
          <h1 class="font-beVietnamPro text-headline-md text-on-surface">تحليل الربحية</h1>
          <p class="mt-1 text-body-md text-text-secondary">التكلفة المباشرة والربح الإجمالي من القيود المرحلة. أجور أمر الشغل اليدوية تظهر منفصلة ولا تُخصم مرتين من الدفاتر.</p>
        </header>
        <section class="glass-panel rounded-xl border border-border p-4 flex flex-wrap items-end gap-3">
          <label class="text-sm text-text-secondary">من
            <input id="profit-from" type="date" class="block mt-1 h-10 rounded-lg border border-border bg-surface-subtle px-3 text-on-surface" />
          </label>
          <label class="text-sm text-text-secondary">إلى
            <input id="profit-to" type="date" class="block mt-1 h-10 rounded-lg border border-border bg-surface-subtle px-3 text-on-surface" />
          </label>
          <button id="profit-load" class="h-10 px-5 rounded-lg bg-primary text-white">تحديث التقرير</button>
        </section>
        <nav class="flex flex-wrap gap-2" id="profit-tabs">
          ${DIMENSIONS.map((item) => `
            <button data-dimension="${item.id}" class="px-4 py-2 rounded-lg border border-border text-sm">${item.label}</button>
          `).join('')}
        </nav>
        <div id="profit-error" class="hidden rounded-lg border border-error/30 bg-error/5 p-4 text-error"></div>
        <section class="overflow-x-auto rounded-xl border border-border bg-surface-container-lowest shadow-md">
          <table class="w-full min-w-[900px] text-right">
            <thead class="bg-surface-subtle">
              <tr>
                <th class="px-4 py-3">البند</th>
                <th class="px-4 py-3">الإيراد</th>
                <th class="px-4 py-3">التكلفة المباشرة</th>
                <th class="px-4 py-3">أجور فنية تحليلية</th>
                <th class="px-4 py-3">الربح بعد الأجور</th>
                <th class="px-4 py-3">هامش الربح</th>
                <th class="px-4 py-3">القيود</th>
              </tr>
            </thead>
            <tbody id="profit-tbody">
              <tr><td colspan="7" class="px-4 py-8 text-center text-text-secondary">اختر الفترة ثم حدّث التقرير</td></tr>
            </tbody>
          </table>
        </section>
      </div>
    `

    const fromInput = content.querySelector('#profit-from') as HTMLInputElement
    const toInput = content.querySelector('#profit-to') as HTMLInputElement
    const today = new Date()
    fromInput.value = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10)
    toInput.value = today.toISOString().slice(0, 10)
    this.from = fromInput.value
    this.to = toInput.value

    content.querySelector('#profit-load')?.addEventListener('click', () => {
      this.from = fromInput.value
      this.to = toInput.value
      this.load(content)
    })
    content.querySelectorAll<HTMLButtonElement>('[data-dimension]').forEach((button) => {
      button.addEventListener('click', () => {
        this.dimension = button.dataset.dimension as ProfitDimension
        this.renderTabs(content)
        this.load(content)
      })
    })
    this.renderTabs(content)
    this.load(content)
    return layout.render(content)
  }

  private renderTabs(content: HTMLElement) {
    content.querySelectorAll<HTMLButtonElement>('[data-dimension]').forEach((button) => {
      const selected = button.dataset.dimension === this.dimension
      button.className = `px-4 py-2 rounded-lg border text-sm ${
        selected ? 'border-primary bg-primary/10 text-primary font-semibold' : 'border-border text-on-surface hover:bg-surface-subtle'
      }`
      button.setAttribute('aria-pressed', String(selected))
    })
  }

  private async load(content: HTMLElement) {
    const tbody = content.querySelector('#profit-tbody') as HTMLElement
    const error = content.querySelector('#profit-error') as HTMLElement
    const dimension = DIMENSIONS.find((item) => item.id === this.dimension)!
      tbody.innerHTML = '<tr><td colspan="7" class="px-4 py-8 text-center text-text-secondary">جاري التحميل...</td></tr>'
    error.classList.add('hidden')
    try {
      const params = new URLSearchParams()
      if (this.from) params.set('from', `${this.from}T00:00:00.000Z`)
      if (this.to) params.set('to', `${this.to}T23:59:59.999Z`)
      const response = await this.api.get<any>(`${dimension.endpoint}?${params.toString()}`, false)
      if (response.success === false) throw new Error(response.message || 'تعذر تحميل التقرير')
      const rows = Array.isArray(response.data) ? response.data : (response.data?.data || [])
      this.rows = rows
      this.renderRows(tbody)
    } catch (cause: any) {
      tbody.innerHTML = '<tr><td colspan="7" class="px-4 py-8 text-center text-text-secondary">لا توجد بيانات للفترة</td></tr>'
      error.textContent = cause.message || 'تعذر تحميل التقرير'
      error.classList.remove('hidden')
    }
  }

  private renderRows(tbody: HTMLElement) {
    if (this.rows.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="px-4 py-8 text-center text-text-secondary">لا توجد قيود مرحلة مرتبطة بهذا التحليل</td></tr>'
      return
    }
    tbody.innerHTML = this.rows.map((row) => `
      <tr class="border-t border-border/60">
        <td class="px-4 py-3 font-medium text-on-surface">${row.label || row.id}</td>
        <td class="px-4 py-3">${money(row.revenueSYP)}</td>
        <td class="px-4 py-3">${money(row.directCostSYP)}</td>
        <td class="px-4 py-3">${money(row.analyticalLaborCostSYP)}</td>
        <td class="px-4 py-3 font-semibold ${Number(row.grossProfitAfterAnalyticalLaborSYP) < 0 ? 'text-error' : 'text-success'}">${money(row.grossProfitAfterAnalyticalLaborSYP)}</td>
        <td class="px-4 py-3">${Number(row.grossMarginPercent || 0).toFixed(1)}%</td>
        <td class="px-4 py-3">${Number(row.entries || 0)}</td>
      </tr>
    `).join('')
  }
}
