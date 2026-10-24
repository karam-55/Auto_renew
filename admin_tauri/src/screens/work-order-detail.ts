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

const WORK_ORDER_STATUS: Record<string, string> = {
  OPEN: 'جديد',
  IN_PROGRESS: 'قيد التنفيذ',
  READY: 'جاهز للفوترة',
  COMPLETED: 'مكتمل',
  CANCELLED: 'ملغى',
}

export class WorkOrderDetailScreen {
  private workOrder: any = null
  private parts: any[] = []
  private suppliers: any[] = []
  private selectedBookingServiceId: string | null = null

  constructor(
    private auth: AuthService,
    private api: ApiClient,
    private router: Router,
    private workOrderId: string,
  ) {}

  private canEdit(): boolean {
    const role = (this.auth.getUser()?.role || '').toUpperCase()
    return ['ADMIN', 'OWNER', 'MANAGER', 'MECHANIC', 'ACCOUNTANT'].includes(role)
  }

  render(): HTMLElement {
    const layout = new AppLayout(this.auth, this.router, 'أمر الشغل', 'assignment', this.api)
    const content = document.createElement('div')
    const editable = this.canEdit()
    content.className = 'page-enter min-h-screen bg-background p-gutter'
    content.innerHTML = `
      <div class="max-w-7xl mx-auto space-y-stack-lg">
        <header class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <button id="work-order-back" class="mb-2 inline-flex min-h-[44px] items-center gap-1 rounded-lg px-2 text-body-sm text-text-secondary hover:bg-surface-subtle focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
              <span class="material-symbols-outlined" aria-hidden="true">arrow_forward</span> أوامر الشغل
            </button>
            <h1 class="font-headline-lg text-on-surface">أمر الشغل</h1>
            <p id="work-order-subtitle" class="mt-1 text-body-sm text-text-secondary">جاري تحميل بيانات الحجز…</p>
          </div>
          ${editable ? `
          <div class="flex flex-wrap gap-2">
            <button id="work-order-issue" class="min-h-[44px] rounded-lg border border-border bg-surface px-4 text-body-md text-on-surface hover:bg-surface-subtle focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
              <span class="material-symbols-outlined align-middle ml-1" aria-hidden="true">inventory</span> تأكيد صرف المواد
            </button>
            <button id="work-order-finish" class="min-h-[44px] rounded-lg bg-primary px-5 text-body-md font-semibold text-white hover:bg-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
              إنهاء العمل وإصدار الفاتورة
            </button>
          </div>` : `<span class="rounded-full bg-surface-subtle px-4 py-2 text-label-sm text-text-secondary">عرض فقط</span>`}
        </header>

        <section id="work-order-summary" class="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-border bg-surface px-4 py-3 text-body-sm">
          <div><span class="text-text-secondary">العميل: </span><span class="font-semibold text-on-surface">—</span></div>
          <div><span class="text-text-secondary">المركبة: </span><span class="font-semibold text-on-surface">—</span></div>
          <div><span class="text-text-secondary">الحالة: </span><span class="font-semibold text-on-surface">—</span></div>
        </section>

        <section class="space-y-3">
          <div>
            <h2 class="font-headline-md text-on-surface">تنفيذ الخدمة</h2>
            <p class="mt-1 text-body-sm text-text-secondary">اعمل على خدمة واحدة في كل مرة؛ اختر خدمة أخرى من القائمة عند الحاجة.</p>
          </div>
          <div id="work-order-services" class="space-y-4">
            <div class="rounded-xl border border-border bg-surface p-8 text-center text-text-secondary">جاري تحميل الخدمات…</div>
          </div>
        </section>

        <section id="work-order-invoice" class="hidden rounded-xl border border-success/30 bg-success/5 p-5">
          <h2 class="font-headline-md text-on-surface">تم إصدار الفاتورة</h2>
          <div id="work-order-invoice-summary" class="mt-2 text-body-md text-text-secondary"></div>
          <button id="work-order-open-invoice" class="mt-4 min-h-[44px] rounded-lg bg-success px-5 text-body-md font-semibold text-white hover:bg-success-dark">فتح الفاتورة</button>
        </section>
      </div>
      <div id="work-order-overlay-root"></div>
    `

    content.querySelector('#work-order-back')?.addEventListener('click', () => this.router.navigate('/work-orders'))
    content.querySelector('#work-order-issue')?.addEventListener('click', () => this.openIssueDialog(content))
    content.querySelector('#work-order-finish')?.addEventListener('click', () => this.finishWorkOrder(content))
    content.addEventListener('click', (event) => {
      const target = event.target as HTMLElement
      if (target.closest('#service-picker-toggle') || target.closest('#service-picker-menu')) return
      const menu = content.querySelector('#service-picker-menu')
      const toggle = content.querySelector('#service-picker-toggle')
      menu?.classList.add('hidden')
      toggle?.setAttribute('aria-expanded', 'false')
    })
    content.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return
      const menu = content.querySelector('#service-picker-menu')
      if (menu && !menu.classList.contains('hidden')) {
        menu.classList.add('hidden')
        content.querySelector('#service-picker-toggle')?.setAttribute('aria-expanded', 'false')
        ;(content.querySelector('#service-picker-toggle') as HTMLButtonElement | null)?.focus()
      }
    })
    this.load(content)
    return layout.render(content)
  }

  private async load(content: HTMLElement): Promise<void> {
    try {
      const [workOrderResponse, partsResponse, suppliersResponse] = await Promise.all([
        this.api.get<any>(`/api/work-orders/${this.workOrderId}`, false),
        this.api.get<any>('/api/parts?limit=0', false),
        this.api.get<any>('/api/suppliers?limit=100', false),
      ])
      if (!workOrderResponse.success || !workOrderResponse.data) {
        throw new Error(workOrderResponse.message || 'تعذر تحميل أمر الشغل')
      }
      this.workOrder = workOrderResponse.data
      this.parts = Array.isArray(partsResponse.data) ? partsResponse.data : partsResponse.data?.data || []
      this.suppliers = Array.isArray(suppliersResponse.data) ? suppliersResponse.data : suppliersResponse.data?.data || []
      this.renderSummary(content)
      this.renderServices(content)
      this.renderInvoice(content)
    } catch (error: any) {
      const target = content.querySelector('#work-order-services') as HTMLElement
      target.innerHTML = `<div class="rounded-xl border border-error/30 bg-error/5 p-6 text-error">${escapeHtml(error.message || 'تعذر تحميل أمر الشغل')}</div>`
    }
  }

  private renderSummary(content: HTMLElement): void {
    const booking = this.workOrder.booking || {}
    const vehicle = booking.vehicle || {}
    const vehicleName = [vehicle.make, vehicle.model, vehicle.year].filter(Boolean).join(' ')
    const summary = content.querySelector('#work-order-summary') as HTMLElement
    const boxes = summary.children
    boxes[0].innerHTML = `<span class="text-text-secondary">العميل: </span><span class="font-semibold text-on-surface">${escapeHtml(booking.customer?.fullName || '—')}</span><span class="mr-2 text-text-tertiary" dir="ltr">${escapeHtml(booking.customer?.phone || '')}</span>`
    boxes[1].innerHTML = `<span class="text-text-secondary">المركبة: </span><span class="font-semibold text-on-surface">${escapeHtml(vehicleName || '—')}</span><span class="mr-2 text-text-tertiary" dir="ltr">${escapeHtml(vehicle.licensePlate || '')}</span>`
    boxes[2].innerHTML = `<span class="text-text-secondary">الحالة: </span><span class="font-semibold text-on-surface">${escapeHtml(WORK_ORDER_STATUS[this.workOrder.status] || this.workOrder.status)}</span><span class="mr-2 text-text-tertiary">الحجز #${escapeHtml(String(booking.id || '').slice(0, 8))}</span>`
    ;(content.querySelector('#work-order-subtitle') as HTMLElement).textContent = `أمر شغل #${String(this.workOrder.id).slice(0, 8)} · ${booking.bookingServices?.length || 0} خدمات`

    const finished = ['COMPLETED', 'CANCELLED'].includes(this.workOrder.status)
    ;(content.querySelector('#work-order-issue') as HTMLButtonElement).disabled = finished
    ;(content.querySelector('#work-order-finish') as HTMLButtonElement).disabled = finished
  }

  private renderServices(content: HTMLElement): void {
    const container = content.querySelector('#work-order-services') as HTMLElement
    const editable = this.canEdit()
    const services = this.workOrder.booking?.bookingServices || []
    if (!services.length) {
      container.innerHTML = '<div class="rounded-xl border border-border bg-surface p-8 text-center text-text-secondary">لا توجد خدمات مرتبطة بهذا الحجز.</div>'
      return
    }

    const selectedLine = services.find((line: any) => line.id === this.selectedBookingServiceId) || services[0]
    this.selectedBookingServiceId = selectedLine.id
    const selectedIndex = services.findIndex((line: any) => line.id === selectedLine.id)
    const selectedName = selectedLine.customName || selectedLine.service?.nameAr || selectedLine.service?.name || 'خدمة'

    container.innerHTML = `
      <div class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface p-3 sm:p-4">
        <div class="relative min-w-0 flex-1">
          <button id="service-picker-toggle" type="button" aria-haspopup="listbox" aria-expanded="false" aria-controls="service-picker-menu"
            class="flex min-h-[48px] w-full items-center justify-between gap-3 rounded-lg px-2 text-right hover:bg-surface-subtle focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
            <span class="min-w-0">
              <span class="block text-xs text-text-secondary">الخدمة الحالية</span>
              <span class="mt-0.5 block truncate text-body-lg font-semibold text-on-surface">${escapeHtml(selectedName)}</span>
              <span class="mt-0.5 block text-body-sm text-text-secondary">${escapeHtml(selectedLine.service?.code || '')}${selectedLine.service?.pricingUnit ? ` · ${escapeHtml(selectedLine.service.pricingUnit)}` : ''}</span>
            </span>
            <span class="material-symbols-outlined shrink-0 text-text-secondary" aria-hidden="true">expand_more</span>
          </button>
          <div id="service-picker-menu" role="listbox" aria-label="الخدمات المطلوبة في الحجز"
            class="hidden absolute right-0 top-full z-30 mt-2 max-h-80 w-full min-w-[min(100%,24rem)] overflow-y-auto rounded-xl border border-border bg-surface p-2 shadow-xl">
            <p class="px-3 py-2 text-xs font-semibold text-text-secondary">الخدمات المطلوبة في هذا الحجز</p>
            ${services.map((item: any, index: number) => {
              const itemName = item.customName || item.service?.nameAr || item.service?.name || 'خدمة'
              const active = item.id === selectedLine.id
              return `<button type="button" role="option" aria-selected="${active}" data-select-service="${escapeHtml(item.id)}"
                class="flex min-h-[48px] w-full items-center justify-between gap-3 rounded-lg px-3 text-right hover:bg-surface-subtle focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${active ? 'bg-primary/5 text-primary' : 'text-on-surface'}">
                <span class="min-w-0"><span class="block truncate font-medium">${index + 1}. ${escapeHtml(itemName)}</span><span class="block text-xs text-text-secondary">${escapeHtml(item.service?.code || '')}</span></span>
                <span class="shrink-0 rounded-full px-2 py-1 text-xs ${item.priceFinalized ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}">${item.priceFinalized ? 'مسعّرة' : 'بانتظار السعر'}</span>
              </button>`
            }).join('')}
          </div>
        </div>
        <div class="flex shrink-0 items-center gap-2">
          <span class="rounded-full px-3 py-2 text-label-sm ${selectedLine.priceFinalized ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}">${selectedLine.priceFinalized ? 'السعر معتمد' : 'بانتظار تحديد السعر'}</span>
          <span class="rounded-full bg-surface-subtle px-3 py-2 text-label-sm text-text-secondary">${selectedIndex + 1} / ${services.length}</span>
        </div>
      </div>
      ${[selectedLine].map((line: any) => {
      const service = line.service || {}
      const catalogSYP = Number(service.priceSYP ?? service.basePrice ?? 0)
      const materials = line.materials || []
      const expenses = line.expenses || []
      const jobCost = (this.workOrder.jobCosts || []).find((cost: any) => cost.serviceId === line.serviceId) || null
      const directCostSYP = expenses.reduce((sum: number, expense: any) => sum + Number(expense.amountSYP || 0), 0)
        + Number(jobCost?.laborCost || 0)
      const directCostUSD = expenses.reduce((sum: number, expense: any) => sum + Number(expense.amountUSD || 0), 0)
        + Number(jobCost?.laborCostUSD || 0)
      const serviceType = service.serviceType || 'STANDARD'
      const isCostBased = ['JOB_BASED', 'VARIABLE'].includes(serviceType)
      const margin = Number(service.profitMargin ?? 25) / 100
      const suggestedSYP = isCostBased && directCostSYP > 0
        ? service.profitType === 'fixed'
          ? directCostSYP + Number(service.profitAmountSYP || 0)
          : directCostSYP * (1 + margin)
        : catalogSYP
      const suggestedUSD = isCostBased && directCostUSD > 0
        ? service.profitType === 'fixed'
          ? directCostUSD + Number(service.profitAmountUSD || 0)
          : directCostUSD * (1 + margin)
        : Number(service.priceUSD || 0)
      const isOilMaterialService = ['OIL_PAID', 'OIL_WARRANTY'].includes(serviceType)
      const priceSYP = line.priceFinalized ? Number(line.priceSYP || 0) : isOilMaterialService ? 0 : Math.round(suggestedSYP)
      const priceUSD = line.priceFinalized && line.priceUSD != null
        ? Number(line.priceUSD)
        : isOilMaterialService
          ? 0
          : Math.round(suggestedUSD * 100) / 100
      return `
        <article class="service-work-order rounded-2xl border border-border bg-surface shadow-sm overflow-hidden"
          data-booking-service-id="${escapeHtml(line.id)}" data-service-id="${escapeHtml(line.serviceId)}">
          <div class="space-y-5 p-4 sm:p-5">
              <section class="rounded-xl bg-surface-subtle/60 p-4">
                <div class="mb-3">
                  <h4 class="font-semibold text-on-surface">سعر البيع للزبون</h4>
                  <p class="text-body-sm text-text-secondary">${isCostBased && directCostSYP + directCostUSD > 0 ? 'سعر مقترح حسب تكلفة المشتريات/الأجور ونسبة الربح، ويمكن تعديله.' : 'سعر الخدمة منفصل عن تكلفتها الفعلية؛ للعمليات الثابتة يبدأ من سعر بطاقة الخدمة.'}</p>
                </div>
                ${!editable ? `
                <div class="flex flex-wrap items-center gap-x-6 gap-y-2 text-body-md">
                  <span class="text-text-secondary">الكمية: <span class="font-semibold text-on-surface">${Number(line.quantity || 1).toLocaleString('ar-SY')}</span></span>
                  <span class="text-text-secondary">السعر: <span class="text-financial-data font-semibold text-on-surface">${priceSYP.toLocaleString('ar-SY')} ل.س${priceUSD ? ` · $${Number(priceUSD).toLocaleString('en-US')}` : ''}</span></span>
                  <span class="text-text-secondary">${line.priceFinalized ? 'السعر معتمد' : 'بانتظار اعتماد السعر'}</span>
                </div>` : `
                <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-[150px_1fr_1fr_auto] gap-3 items-end">
                  <label class="text-label-sm text-text-secondary">الكمية
                    <input data-service-quantity type="number" min="0.001" step="0.001" value="${Number(line.quantity || 1)}" class="mt-1 min-h-[44px] w-full rounded-lg border border-border bg-surface px-3 text-on-surface" />
                  </label>
                  <label class="text-label-sm text-text-secondary">ليرة سورية
                    <input data-sale-syp type="number" min="0" step="1" value="${priceSYP}" class="mt-1 min-h-[44px] w-full rounded-lg border border-border bg-surface px-3 text-on-surface" />
                  </label>
                  <label class="text-label-sm text-text-secondary">دولار
                    <input data-sale-usd type="number" min="0" step="0.01" value="${priceUSD || ''}" class="mt-1 min-h-[44px] w-full rounded-lg border border-border bg-surface px-3 text-on-surface" />
                  </label>
                  <button data-save-price type="button" class="min-h-[44px] rounded-lg bg-primary px-4 font-semibold text-white hover:bg-primary-hover">اعتماد السعر</button>
                </div>`}
              </section>

              <section>
                <div class="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h4 class="font-semibold text-on-surface">مواد من المخزون</h4>
                    <p class="text-body-sm text-text-secondary">يعرض الرصيد المتوفر. الصرف الفعلي يُسجل منفصلاً عن السعر المباع للزبون.</p>
                  </div>
                  ${editable ? `<button data-add-stock type="button" class="min-h-[44px] rounded-lg border border-primary/30 bg-primary/5 px-4 text-primary hover:bg-primary/10">إضافة مادة</button>` : ''}
                </div>
                <div class="mt-3 space-y-2">
                  ${materials.length ? materials.map((material: any) => `
                    <div class="grid grid-cols-1 sm:grid-cols-4 gap-2 rounded-lg border border-border p-3 text-body-sm">
                      <span class="font-medium text-on-surface">${escapeHtml(material.part?.nameAr || material.part?.name || 'مادة')}</span>
                      <span class="text-text-secondary">متوفر: ${Number(material.part?.quantity || 0).toLocaleString('ar-SY')} ${escapeHtml(material.part?.baseUnitName || '')}</span>
                      <span class="text-text-secondary">مطلوب: ${Number(material.quantity).toLocaleString('ar-SY')} · مصروف: ${Number(material.issuedQuantity || 0).toLocaleString('ar-SY')}</span>
                      <span class="text-primary">بيع الوحدة: ${Number(material.part?.sellingPriceSYP || 0).toLocaleString('ar-SY')} ل.س</span>
                    </div>
                  `).join('') : '<p class="rounded-lg border border-dashed border-border p-4 text-body-sm text-text-tertiary">لم تُضف مواد من المخزون لهذه الخدمة.</p>'}
                </div>
              </section>

              <section class="rounded-xl border border-border p-4">
                <div class="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h4 class="font-semibold text-on-surface">شراء مباشر للخدمة</h4>
                    <p class="text-body-sm text-text-secondary">يسجل كتكلفة لأمر الشغل، مع فاتورة المورد؛ لا يزيد المخزون.</p>
                  </div>
                  ${editable ? `<button data-toggle-direct type="button" class="min-h-[44px] rounded-lg border border-border bg-surface-subtle px-4 text-on-surface hover:bg-surface">إضافة مشتريات</button>` : ''}
                </div>
                ${editable ? `
                <div data-direct-form class="hidden mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label class="text-label-sm text-text-secondary">اسم المادة
                    <input data-direct-name class="mt-1 min-h-[44px] w-full rounded-lg border border-border bg-surface px-3 text-on-surface" />
                  </label>
                  <label class="text-label-sm text-text-secondary">الكمية
                    <input data-direct-quantity type="number" min="0.001" step="0.001" class="mt-1 min-h-[44px] w-full rounded-lg border border-border bg-surface px-3 text-on-surface" />
                  </label>
                  <label class="text-label-sm text-text-secondary">تكلفة الوحدة
                    <div class="mt-1 flex gap-2">
                      <input data-direct-unit-cost type="number" min="0.01" step="0.01" class="min-h-[44px] min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 text-on-surface" />
                      <select data-direct-currency class="min-h-[44px] rounded-lg border border-border bg-surface px-2 text-on-surface"><option value="SYP">ل.س</option><option value="USD">USD</option></select>
                    </div>
                  </label>
                  <label class="text-label-sm text-text-secondary">طريقة التسوية
                    <select data-direct-payment class="mt-1 min-h-[44px] w-full rounded-lg border border-border bg-surface px-3 text-on-surface"><option value="CASH">الصندوق</option><option value="BANK">البنك</option><option value="PAYABLE">على الحساب</option></select>
                  </label>
                  <label data-direct-supplier-field class="hidden text-label-sm text-text-secondary">المورد
                    <select data-direct-supplier class="mt-1 min-h-[44px] w-full rounded-lg border border-border bg-surface px-3 text-on-surface"><option value="">اختر المورد</option>${this.suppliers.filter((supplier) => supplier.isActive !== false).map((supplier) => `<option value="${escapeHtml(supplier.id)}">${escapeHtml(supplier.name)}</option>`).join('')}</select>
                  </label>
                  <label data-direct-due-field class="hidden text-label-sm text-text-secondary">تاريخ استحقاق المورد
                    <input data-direct-due type="date" class="mt-1 min-h-[44px] w-full rounded-lg border border-border bg-surface px-3 text-on-surface" />
                  </label>
                  <label class="sm:col-span-2 text-label-sm text-text-secondary">صورة الفاتورة أو ملف PDF
                    <input data-direct-attachment type="file" accept="image/jpeg,image/png,image/webp,application/pdf" class="mt-1 block min-h-[44px] w-full rounded-lg border border-border bg-surface px-3 py-2 text-on-surface" />
                  </label>
                  <div class="sm:col-span-2 flex justify-end">
                    <button data-save-direct type="button" class="min-h-[44px] rounded-lg bg-primary px-5 font-semibold text-white hover:bg-primary-hover">حفظ التكلفة وإرفاق الفاتورة</button>
                  </div>
                </div>` : ''}
                <div class="mt-3 space-y-2">
                  ${expenses.length ? expenses.map((expense: any) => `
                    <div class="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-surface-subtle/60 p-3 text-body-sm">
                      <span class="text-on-surface">${escapeHtml(expense.description)} · ${Number(expense.quantity || 0).toLocaleString('ar-SY')}</span>
                      <span class="text-financial-data text-text-secondary">${Number(expense.amountSYP || 0).toLocaleString('ar-SY')} ل.س${expense.amountUSD ? ` · $${Number(expense.amountUSD).toLocaleString('en-US')}` : ''}${expense.supplier?.name ? ` · ${escapeHtml(expense.supplier.name)}` : ''}${expense.attachmentUrl ? ` · <a href="${escapeHtml(expense.attachmentUrl)}" target="_blank" rel="noopener noreferrer" class="text-primary underline">الفاتورة</a>` : ''}</span>
                    </div>`).join('') : '<p class="text-body-sm text-text-tertiary">لا توجد مشتريات مباشرة مسجلة.</p>'}
                </div>
              </section>

              <section class="rounded-xl bg-amber-50 p-4">
                <h4 class="font-semibold text-on-surface">أجور الفني (تكلفة مباشرة)</h4>
                <p class="mt-1 text-body-sm text-text-secondary">تسجل ضمن تحليل تكلفة الخدمة، ولا تضاف تلقائياً كسعر على فاتورة العميل.</p>
                ${!editable ? `
                <div class="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-body-md text-text-secondary">
                  ${jobCost ? `
                    <span>ساعات العمل: <span class="font-semibold text-on-surface">${Number(jobCost.laborHours || 0).toLocaleString('ar-SY')}</span></span>
                    <span>الأجرة: <span class="font-semibold text-on-surface text-financial-data">${Number(jobCost.laborCost || 0).toLocaleString('ar-SY')} ل.س${jobCost.laborCostUSD ? ` · $${Number(jobCost.laborCostUSD).toLocaleString('en-US')}` : ''}</span></span>`
                  : '<span>لم تُسجل أجور فني لهذه الخدمة.</span>'}
                </div>` : `
                <div class="mt-3 grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-3 items-end">
                  <label class="text-label-sm text-text-secondary">ساعات العمل
                    <input data-labor-hours type="number" min="0" step="0.1" value="${jobCost?.laborHours ?? ''}" class="mt-1 min-h-[44px] w-full rounded-lg border border-border bg-surface px-3 text-on-surface" />
                  </label>
                  <label class="text-label-sm text-text-secondary">أجرة الفني
                    <input data-labor-amount type="number" min="0" step="0.01" value="${jobCost?.laborCostUSD ? Number(jobCost.laborCostUSD) : (jobCost?.laborCost ? Number(jobCost.laborCost) : '')}" class="mt-1 min-h-[44px] w-full rounded-lg border border-border bg-surface px-3 text-on-surface" />
                  </label>
                  <label class="text-label-sm text-text-secondary">العملة
                    <select data-labor-currency class="mt-1 min-h-[44px] w-full rounded-lg border border-border bg-surface px-3 text-on-surface"><option value="${jobCost?.laborCostUSD ? 'USD' : 'SYP'}">${jobCost?.laborCostUSD ? 'USD' : 'ل.س'}</option><option value="${jobCost?.laborCostUSD ? 'SYP' : 'USD'}">${jobCost?.laborCostUSD ? 'ل.س' : 'USD'}</option></select>
                  </label>
                  <button data-save-labor type="button" class="min-h-[44px] rounded-lg border border-border bg-surface px-4 text-on-surface hover:bg-surface-subtle">حفظ الأجرة</button>
                </div>`}
              </section>
          </div>
        </article>`
      }).join('')}
    `

    container.querySelectorAll<HTMLElement>('.service-work-order').forEach((card) => this.attachServiceHandlers(content, card))
    const pickerButton = container.querySelector('#service-picker-toggle') as HTMLButtonElement | null
    const pickerMenu = container.querySelector('#service-picker-menu') as HTMLElement | null
    pickerButton?.addEventListener('click', () => {
      const isOpening = pickerMenu?.classList.contains('hidden') ?? false
      pickerMenu?.classList.toggle('hidden', !isOpening)
      pickerButton.setAttribute('aria-expanded', String(isOpening))
    })
    pickerMenu?.querySelectorAll<HTMLButtonElement>('[data-select-service]').forEach((button) => {
      button.addEventListener('click', () => {
        this.selectedBookingServiceId = button.dataset.selectService || null
        this.renderServices(content)
        requestAnimationFrame(() => (content.querySelector('#service-picker-toggle') as HTMLButtonElement | null)?.focus())
      })
    })
  }

  private attachServiceHandlers(content: HTMLElement, card: HTMLElement): void {
    const bookingServiceId = card.dataset.bookingServiceId!
    const serviceId = card.dataset.serviceId!
    const saleSYPInput = card.querySelector('[data-sale-syp]') as HTMLInputElement
    const saleUSDInput = card.querySelector('[data-sale-usd]') as HTMLInputElement
    saleSYPInput?.addEventListener('input', () => { if (saleSYPInput.value) saleUSDInput.value = '' })
    saleUSDInput?.addEventListener('input', () => { if (saleUSDInput.value) saleSYPInput.value = '' })
    card.querySelector('[data-save-price]')?.addEventListener('click', async () => {
      const button = card.querySelector('[data-save-price]') as HTMLButtonElement
      const priceSYP = Number(saleSYPInput.value || 0)
      const priceUSDText = saleUSDInput.value
      const quantity = Number((card.querySelector('[data-service-quantity]') as HTMLInputElement).value || 0)
      const payload: any = { priceSYP, quantity }
      if (priceUSDText) payload.priceUSD = Number(priceUSDText)
      button.disabled = true
      try {
        await this.request(`/api/work-orders/${this.workOrder.id}/services/${bookingServiceId}/price`, 'PUT', payload)
        this.notify('تم اعتماد سعر الخدمة', 'success')
        await this.load(content)
      } catch (error: any) {
        this.notify(error.message || 'تعذر حفظ السعر', 'error')
      } finally {
        button.disabled = false
      }
    })

    card.querySelector('[data-add-stock]')?.addEventListener('click', () => this.openStockMaterialDialog(content, bookingServiceId))
    card.querySelector('[data-toggle-direct]')?.addEventListener('click', () => {
      const form = card.querySelector('[data-direct-form]') as HTMLElement
      form.classList.toggle('hidden')
    })
    card.querySelector('[data-direct-payment]')?.addEventListener('change', () => {
      const method = (card.querySelector('[data-direct-payment]') as HTMLSelectElement).value
      card.querySelector('[data-direct-supplier-field]')?.classList.toggle('hidden', method !== 'PAYABLE')
      card.querySelector('[data-direct-due-field]')?.classList.toggle('hidden', method !== 'PAYABLE')
    })
    card.querySelector('[data-save-direct]')?.addEventListener('click', async () => {
      await this.saveDirectPurchase(content, card, bookingServiceId, serviceId)
    })
    card.querySelector('[data-save-labor]')?.addEventListener('click', async () => {
      await this.saveLaborCost(content, card, serviceId)
    })
  }

  private async openStockMaterialDialog(content: HTMLElement, bookingServiceId: string): Promise<void> {
    if (!this.parts.length) {
      const response = await this.api.get<any>('/api/parts?limit=0', false)
      this.parts = Array.isArray(response.data) ? response.data : response.data?.data || []
    }
    const parts = this.parts.filter((part) => part.isActive !== false)
    const overlay = document.createElement('div')
    overlay.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'
    overlay.innerHTML = `
      <section role="dialog" aria-modal="true" aria-labelledby="stock-dialog-title" class="w-full max-w-xl rounded-2xl border border-border bg-surface p-6 shadow-2xl">
        <h2 id="stock-dialog-title" class="font-headline-md text-on-surface">إضافة مادة من المخزون</h2>
        <p class="mt-1 text-body-sm text-text-secondary">اختر المادة والكمية المستخدمة فعلياً. مثال: لاستهلاك 2.5 لتر من برميل، اختر الوحدة الأساسية وأدخل 2.5.</p>
        <div class="mt-5 space-y-4">
          <label class="block text-label-sm text-text-secondary">المادة
            <select data-part class="mt-1 min-h-[48px] w-full rounded-lg border border-border bg-surface-subtle px-3 text-on-surface">
              <option value="">اختر مادة</option>
              ${parts.map((part: any) => `<option value="${escapeHtml(part.id)}">${escapeHtml(part.nameAr || part.name)} — المتوفر ${Number(part.quantity || 0).toLocaleString('ar-SY')} ${escapeHtml(part.baseUnitName || '')} — بيع ${Number(part.sellingPriceSYP || 0).toLocaleString('ar-SY')} ل.س</option>`).join('')}
            </select>
          </label>
          <div class="grid grid-cols-1 sm:grid-cols-[1fr_200px] gap-3">
            <label class="block text-label-sm text-text-secondary">الكمية المستخدمة
              <input data-quantity type="number" min="0.001" step="0.001" placeholder="مثال: 2.5" class="mt-1 min-h-[48px] w-full rounded-lg border border-border bg-surface-subtle px-3 text-on-surface" />
            </label>
            <label class="block text-label-sm text-text-secondary">أدخل بـ
              <select data-unit class="mt-1 min-h-[48px] w-full rounded-lg border border-border bg-surface-subtle px-3 text-on-surface"></select>
            </label>
          </div>
          <p data-stock-info class="min-h-5 text-body-sm text-text-secondary"></p>
          <p data-conv-info class="min-h-5 rounded-lg bg-secondary/5 px-3 py-2 text-body-sm text-on-surface hidden"></p>
        </div>
        <div class="mt-6 flex justify-end gap-2">
          <button data-cancel class="min-h-[44px] rounded-lg border border-border px-4 text-on-surface">إلغاء</button>
          <button data-save class="min-h-[44px] rounded-lg bg-primary px-5 font-semibold text-white">إضافة للمهمة</button>
        </div>
      </section>`

    const partSelect = overlay.querySelector('[data-part]') as HTMLSelectElement
    const unitSelect = overlay.querySelector('[data-unit]') as HTMLSelectElement
    const quantityInput = overlay.querySelector('[data-quantity]') as HTMLInputElement
    const info = overlay.querySelector('[data-stock-info]') as HTMLElement
    const convInfo = overlay.querySelector('[data-conv-info]') as HTMLElement
    const updateInfo = () => {
      const part = parts.find((item: any) => item.id === partSelect.value)
      const upp = Number(part?.unitsPerPackage || 0)
      unitSelect.innerHTML = `<option value="BASE">الوحدة الأساسية (${part?.baseUnitName || 'وحدة'})</option>` +
        (upp > 0 ? `<option value="PACKAGE">${part?.purchaseUnitName || 'عبوة'} كاملة</option>` : '')
      if (!part) { info.textContent = ''; convInfo.classList.add('hidden'); return }
      const packageNote = upp > 0
        ? ` · كل ${part.purchaseUnitName || 'عبوة'} = ${upp} ${part.baseUnitName || 'وحدة'}`
        : ''
      info.textContent = `المتوفر: ${Number(part.quantity || 0).toLocaleString('ar-SY')} ${part.baseUnitName || ''}${packageNote}`
    }
    const updateConversion = () => {
      const part = parts.find((item: any) => item.id === partSelect.value)
      const upp = Number(part?.unitsPerPackage || 0)
      const entered = Number(quantityInput.value)
      if (!part || !Number.isFinite(entered) || entered <= 0) { convInfo.classList.add('hidden'); return }
      const baseQty = unitSelect.value === 'PACKAGE' ? entered * upp : entered
      const baseUnit = part.baseUnitName || 'وحدة'
      let text = `سيُخصم ${Number(baseQty.toFixed(3))} ${baseUnit} من المخزون`
      if (upp > 0) {
        text += unitSelect.value === 'PACKAGE'
          ? ` (${entered} ${part.purchaseUnitName || 'عبوة'} × ${upp})`
          : ` — يعادل ${Number((entered / upp).toFixed(3))} ${part.purchaseUnitName || 'عبوة'}`
      }
      if (baseQty > Number(part.quantity || 0)) {
        text += ' — الكمية أكبر من المتوفر!'
      }
      convInfo.textContent = text
      convInfo.classList.remove('hidden')
    }
    partSelect.addEventListener('change', () => { updateInfo(); updateConversion() })
    unitSelect.addEventListener('change', updateConversion)
    quantityInput.addEventListener('input', updateConversion)
    overlay.querySelector('[data-cancel]')?.addEventListener('click', () => overlay.remove())
    overlay.addEventListener('click', (event) => { if (event.target === overlay) overlay.remove() })
    overlay.querySelector('[data-save]')?.addEventListener('click', async (event) => {
      const button = event.currentTarget as HTMLButtonElement
      const quantity = Number((overlay.querySelector('[data-quantity]') as HTMLInputElement).value)
      if (!partSelect.value || !Number.isFinite(quantity) || quantity <= 0) {
        this.notify('اختر المادة وأدخل كمية صحيحة', 'warning')
        return
      }
      button.disabled = true
      try {
        await this.request(`/api/work-orders/${this.workOrder.id}/materials`, 'POST', {
          bookingServiceId,
          partId: partSelect.value,
          quantity,
          quantityUnit: unitSelect.value,
        })
        overlay.remove()
        this.notify('تمت إضافة المادة إلى أمر الشغل', 'success')
        await this.load(content)
      } catch (error: any) {
        this.notify(error.message || 'تعذر إضافة المادة', 'error')
      } finally {
        button.disabled = false
      }
    })
    content.querySelector('#work-order-overlay-root')?.appendChild(overlay)
  }

  private async saveDirectPurchase(content: HTMLElement, card: HTMLElement, bookingServiceId: string, serviceId: string): Promise<void> {
    const description = (card.querySelector('[data-direct-name]') as HTMLInputElement).value.trim()
    const quantity = Number((card.querySelector('[data-direct-quantity]') as HTMLInputElement).value)
    const unitCost = Number((card.querySelector('[data-direct-unit-cost]') as HTMLInputElement).value)
    const currency = (card.querySelector('[data-direct-currency]') as HTMLSelectElement).value
    const paymentMethod = (card.querySelector('[data-direct-payment]') as HTMLSelectElement).value
    const supplierId = (card.querySelector('[data-direct-supplier]') as HTMLSelectElement).value
    const dueDate = (card.querySelector('[data-direct-due]') as HTMLInputElement).value
    const file = (card.querySelector('[data-direct-attachment]') as HTMLInputElement).files?.[0]
    if (!description || !Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(unitCost) || unitCost <= 0 || !file) {
      this.notify('أدخل اسم المادة والكمية والتكلفة وأرفق فاتورة الشراء', 'warning')
      return
    }
    if (paymentMethod === 'PAYABLE' && (!supplierId || !dueDate)) {
      this.notify('اختر المورد وحدد تاريخ الاستحقاق للمشتريات الآجلة', 'warning')
      return
    }
    const button = card.querySelector('[data-save-direct]') as HTMLButtonElement
    button.disabled = true
    try {
      const attachmentUrl = await this.uploadAttachment(file)
      const payload: any = {
        category: 'JOB_PURCHASE',
        description,
        expenseDate: new Date().toISOString(),
        paymentMethod,
        quantity,
        bookingId: this.workOrder.bookingId,
        bookingServiceId,
        serviceId,
        attachmentUrl,
      }
      const totalCost = Math.round(quantity * unitCost * 100) / 100
      if (currency === 'USD') payload.amountUSD = totalCost
      else payload.amountSYP = totalCost
      if (paymentMethod === 'PAYABLE') {
        payload.supplierId = supplierId
        payload.dueDate = dueDate
      }
      await this.request('/api/expenses', 'POST', payload)
      await this.request(`/api/work-orders/${this.workOrder.id}`, 'PUT', { status: 'IN_PROGRESS' })
      this.notify('تم تسجيل الشراء المباشر وربطه بالخدمة', 'success')
      await this.load(content)
    } catch (error: any) {
      this.notify(error.message || 'تعذر تسجيل الشراء المباشر', 'error')
    } finally {
      button.disabled = false
    }
  }

  private async saveLaborCost(content: HTMLElement, card: HTMLElement, serviceId: string): Promise<void> {
    const hoursValue = (card.querySelector('[data-labor-hours]') as HTMLInputElement).value
    const amount = Number((card.querySelector('[data-labor-amount]') as HTMLInputElement).value)
    const currency = (card.querySelector('[data-labor-currency]') as HTMLSelectElement).value
    if (!Number.isFinite(amount) || amount < 0) {
      this.notify('أدخل أجرة فني صحيحة', 'warning')
      return
    }
    const payload: any = {
      bookingId: this.workOrder.bookingId,
      serviceId,
      laborHours: hoursValue ? Number(hoursValue) : undefined,
    }
    if (currency === 'USD') payload.laborCostUSD = amount
    else payload.laborCost = amount
    const button = card.querySelector('[data-save-labor]') as HTMLButtonElement
    button.disabled = true
    try {
      await this.request('/api/booking-job-costs', 'POST', payload)
      await this.request(`/api/work-orders/${this.workOrder.id}`, 'PUT', { status: 'IN_PROGRESS' })
      this.notify('تم حفظ تكلفة أجور الفني', 'success')
      await this.load(content)
    } catch (error: any) {
      this.notify(error.message || 'تعذر حفظ أجور الفني', 'error')
    } finally {
      button.disabled = false
    }
  }

  private async uploadAttachment(file: File): Promise<string> {
    if (file.size > 7 * 1024 * 1024) throw new Error('حجم الفاتورة يجب ألا يتجاوز 7 ميغابايت')
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result || ''))
      reader.onerror = () => reject(new Error('تعذر قراءة ملف الفاتورة'))
      reader.readAsDataURL(file)
    })
    const response = await this.request('/api/expenses/upload-attachment', 'POST', { fileName: file.name, dataUrl })
    if (!response.data?.url) throw new Error(response.message || 'تعذر رفع الفاتورة')
    return response.data.url
  }

  private async openIssueDialog(content: HTMLElement): Promise<void> {
    const booking = this.workOrder.booking
    const pending = (booking?.bookingServices || []).flatMap((service: any) =>
      (service.materials || []).map((material: any) => ({
        ...material,
        serviceName: service.customName || service.service?.nameAr || service.service?.name,
        remaining: Math.max(0, Number(material.quantity) - Number(material.issuedQuantity || 0)),
      })).filter((material: any) => material.remaining > 0))
    if (!pending.length) {
      this.notify('لا توجد مواد مخزون بانتظار الصرف', 'warning')
      return
    }
    const overlay = document.createElement('div')
    overlay.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'
    overlay.innerHTML = `
      <section role="dialog" aria-modal="true" class="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-surface p-6 shadow-2xl">
        <h2 class="font-headline-md text-on-surface">تأكيد الكميات المستخدمة من المخزون</h2>
        <p class="mt-1 text-body-sm text-text-secondary">أدخل الكمية الفعلية المصروفة لكل مادة. ستُسجل حركة المخزون والتكلفة مرة واحدة.</p>
        <div class="mt-4 space-y-3">
          ${pending.map((material: any) => `
            <label class="grid grid-cols-1 sm:grid-cols-[1fr_150px] items-center gap-3 rounded-xl border border-border p-3">
              <span class="text-body-sm text-on-surface">${escapeHtml(material.serviceName)} · ${escapeHtml(material.part?.nameAr || material.part?.name)}
                <span class="block text-xs text-text-tertiary">المتبقي المخطط ${material.remaining.toFixed(3)} ${escapeHtml(material.part?.baseUnitName || '')}</span>
              </span>
              <input type="number" min="0" max="${material.remaining}" step="0.001" value="${material.remaining.toFixed(3)}" data-material-id="${escapeHtml(material.id)}" class="min-h-[44px] rounded-lg border border-border bg-surface-subtle px-3 text-on-surface" />
            </label>`).join('')}
        </div>
        <div class="mt-5 flex justify-end gap-2">
          <button data-cancel class="min-h-[44px] rounded-lg border border-border px-4 text-on-surface">إلغاء</button>
          <button data-confirm class="min-h-[44px] rounded-lg bg-primary px-5 font-semibold text-white">تأكيد الصرف</button>
        </div>
      </section>`
    overlay.querySelector('[data-cancel]')?.addEventListener('click', () => overlay.remove())
    overlay.addEventListener('click', (event) => { if (event.target === overlay) overlay.remove() })
    overlay.querySelector('[data-confirm]')?.addEventListener('click', async (event) => {
      const button = event.currentTarget as HTMLButtonElement
      const items = Array.from(overlay.querySelectorAll<HTMLInputElement>('[data-material-id]'))
        .map((input) => ({ materialId: input.dataset.materialId!, quantity: Number(input.value || 0) }))
        .filter((item) => item.quantity > 0)
      if (!items.length) { this.notify('أدخل كمية واحدة على الأقل', 'warning'); return }
      button.disabled = true
      try {
        await this.request(`/api/bookings/${this.workOrder.bookingId}/issue-materials`, 'POST', {
          items,
          idempotencyKey: crypto.randomUUID(),
        })
        overlay.remove()
        this.notify('تم صرف المواد وتسجيل تكلفتها', 'success')
        await this.load(content)
      } catch (error: any) {
        this.notify(error.message || 'تعذر صرف المواد', 'error')
      } finally {
        button.disabled = false
      }
    })
    content.querySelector('#work-order-overlay-root')?.appendChild(overlay)
  }

  private renderInvoice(content: HTMLElement): void {
    const invoice = this.workOrder.booking?.invoices?.[0]
    const panel = content.querySelector('#work-order-invoice') as HTMLElement
    if (!invoice) return
    panel.classList.remove('hidden')
    ;(content.querySelector('#work-order-invoice-summary') as HTMLElement).textContent =
      `${invoice.invoiceNumber} · ${Number(invoice.totalSYP || 0).toLocaleString('ar-SY')} ل.س`
    content.querySelector('#work-order-open-invoice')?.addEventListener('click', () => {
      this.router.navigate(`/invoices/${invoice.id}`)
    })
  }

  private async finishWorkOrder(content: HTMLElement): Promise<void> {
    if (!confirm('إنهاء أمر الشغل وإنشاء الفاتورة وترحيل القيد؟')) return
    const button = content.querySelector('#work-order-finish') as HTMLButtonElement
    button.disabled = true
    try {
      const response = await this.request(`/api/work-orders/${this.workOrder.id}/complete`, 'POST', {})
      const invoiceId = response.data?.invoice?.id
      this.notify('اكتمل أمر الشغل وتم إنشاء الفاتورة', 'success')
      await this.load(content)
      if (invoiceId) this.router.navigate(`/invoices/${invoiceId}`)
    } catch (error: any) {
      this.notify(error.message || 'تعذر إنهاء أمر الشغل', 'error')
    } finally {
      button.disabled = false
    }
  }

  private async request(path: string, method: 'POST' | 'PUT', body: unknown): Promise<any> {
    const response = method === 'POST'
      ? await this.api.post<any>(path, body)
      : await this.api.put<any>(path, body)
    if (response.success === false) throw new Error(response.message || 'فشل الطلب')
    return response
  }

  private notify(message: string, type: string): void {
    ;(window as any).toast?.show?.({ message, type })
  }
}
