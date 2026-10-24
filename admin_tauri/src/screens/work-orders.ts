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

const STATUS_LABELS: Record<string, { label: string; style: string }> = {
  OPEN: { label: 'جديد', style: 'bg-warning/10 text-warning' },
  IN_PROGRESS: { label: 'قيد التنفيذ', style: 'bg-primary/10 text-primary' },
  READY: { label: 'جاهز للفوترة', style: 'bg-success/10 text-success' },
  COMPLETED: { label: 'مكتمل', style: 'bg-surface-subtle text-text-secondary' },
  CANCELLED: { label: 'ملغى', style: 'bg-error/10 text-error' },
}

export class WorkOrdersScreen {
  private workOrders: any[] = []

  constructor(private auth: AuthService, private api: ApiClient, private router: Router) {}

  render(): HTMLElement {
    const layout = new AppLayout(this.auth, this.router, 'أوامر الشغل', 'assignment', this.api)
    const content = document.createElement('div')
    content.className = 'page-enter min-h-screen bg-background p-gutter'
    content.innerHTML = `
      <div class="max-w-7xl mx-auto space-y-stack-lg">
        <header class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p class="text-label-md text-primary font-semibold">دورة تنفيذ الخدمات</p>
            <h1 class="mt-1 font-headline-lg text-on-surface">أوامر الشغل</h1>
            <p class="mt-2 text-body-md text-text-secondary">كل حجز ينشئ أمر شغل مرتبطاً يجمع المواد والتكاليف والأسعار النهائية.</p>
          </div>
          <button id="work-orders-refresh" class="min-h-[44px] rounded-lg border border-border bg-surface px-4 text-body-md text-on-surface hover:bg-surface-subtle focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
            <span class="material-symbols-outlined align-middle ml-1" aria-hidden="true">refresh</span>
            تحديث
          </button>
        </header>

        <section class="grid grid-cols-1 sm:grid-cols-3 gap-3" aria-label="ملخص أوامر الشغل">
          <div class="rounded-xl border border-border bg-surface p-4">
            <p class="text-body-sm text-text-secondary">إجمالي الأوامر</p>
            <p id="work-orders-total" class="mt-2 text-headline-md font-semibold text-on-surface">—</p>
          </div>
          <div class="rounded-xl border border-border bg-surface p-4">
            <p class="text-body-sm text-text-secondary">قيد التنفيذ</p>
            <p id="work-orders-active" class="mt-2 text-headline-md font-semibold text-primary">—</p>
          </div>
          <div class="rounded-xl border border-border bg-surface p-4">
            <p class="text-body-sm text-text-secondary">جاهزة أو مكتملة</p>
            <p id="work-orders-ready" class="mt-2 text-headline-md font-semibold text-success">—</p>
          </div>
        </section>

        <section class="rounded-xl border border-border bg-surface shadow-sm overflow-hidden">
          <div class="flex flex-col sm:flex-row gap-3 p-4 border-b border-border">
            <label class="sr-only" for="work-orders-search">ابحث بالعميل أو السيارة</label>
            <input id="work-orders-search" type="search" class="min-h-[44px] flex-1 rounded-lg border border-border bg-surface-subtle px-4 text-body-md text-on-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary" placeholder="ابحث بالعميل أو السيارة أو رقم اللوحة" />
            <label class="sr-only" for="work-orders-status">حالة أمر الشغل</label>
            <select id="work-orders-status" class="min-h-[44px] rounded-lg border border-border bg-surface px-3 text-body-md text-on-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
              <option value="">كل الحالات</option>
              <option value="OPEN">جديد</option>
              <option value="IN_PROGRESS">قيد التنفيذ</option>
              <option value="READY">جاهز للفوترة</option>
              <option value="COMPLETED">مكتمل</option>
              <option value="CANCELLED">ملغى</option>
            </select>
          </div>
          <div id="work-orders-list" class="divide-y divide-border">
            <div class="p-8 text-center text-text-secondary">جاري تحميل أوامر الشغل…</div>
          </div>
        </section>
      </div>
    `

    content.querySelector('#work-orders-refresh')?.addEventListener('click', () => this.load(content))
    content.querySelector('#work-orders-search')?.addEventListener('input', () => this.renderList(content))
    content.querySelector('#work-orders-status')?.addEventListener('change', () => this.renderList(content))
    this.load(content)
    return layout.render(content)
  }

  private async load(content: HTMLElement): Promise<void> {
    const list = content.querySelector('#work-orders-list') as HTMLElement
    list.innerHTML = '<div class="p-8 text-center text-text-secondary">جاري تحميل أوامر الشغل…</div>'
    try {
      const response = await this.api.get<any>('/api/work-orders?limit=200', false)
      if (!response.success) throw new Error(response.message || 'تعذر تحميل أوامر الشغل')
      this.workOrders = Array.isArray(response.data) ? response.data : response.data?.data || []
      this.updateSummary(content)
      this.renderList(content)
    } catch (error: any) {
      list.innerHTML = `<div class="p-8 text-center text-error">${escapeHtml(error.message || 'تعذر الاتصال بالخادم')}</div>`
    }
  }

  private updateSummary(content: HTMLElement): void {
    const total = this.workOrders.length
    const active = this.workOrders.filter((item) => ['OPEN', 'IN_PROGRESS'].includes(item.status)).length
    const ready = this.workOrders.filter((item) => ['READY', 'COMPLETED'].includes(item.status)).length
    ;(content.querySelector('#work-orders-total') as HTMLElement).textContent = total.toLocaleString('ar-SY')
    ;(content.querySelector('#work-orders-active') as HTMLElement).textContent = active.toLocaleString('ar-SY')
    ;(content.querySelector('#work-orders-ready') as HTMLElement).textContent = ready.toLocaleString('ar-SY')
  }

  private renderList(content: HTMLElement): void {
    const list = content.querySelector('#work-orders-list') as HTMLElement
    const query = (content.querySelector('#work-orders-search') as HTMLInputElement).value.trim().toLocaleLowerCase()
    const status = (content.querySelector('#work-orders-status') as HTMLSelectElement).value
    const rows = this.workOrders.filter((order) => {
      const booking = order.booking || {}
      const vehicle = booking.vehicle || {}
      const haystack = [
        booking.customer?.fullName,
        vehicle.make,
        vehicle.model,
        vehicle.licensePlate,
        booking.id,
      ].join(' ').toLocaleLowerCase()
      return (!status || order.status === status) && (!query || haystack.includes(query))
    })

    if (!rows.length) {
      list.innerHTML = `
        <div class="p-10 text-center">
          <span class="material-symbols-outlined text-4xl text-text-tertiary" aria-hidden="true">assignment</span>
          <p class="mt-2 text-body-md text-text-secondary">لا توجد أوامر شغل مطابقة</p>
          <p class="mt-1 text-body-sm text-text-tertiary">ينشأ أمر الشغل تلقائياً عند حفظ الحجز.</p>
        </div>`
      return
    }

    list.innerHTML = rows.map((order) => {
      const booking = order.booking || {}
      const vehicle = booking.vehicle || {}
      const statusInfo = STATUS_LABELS[order.status] || STATUS_LABELS.OPEN
      const services = booking.bookingServices || []
      const serviceNames = services.map((line: any) => line.customName || line.service?.nameAr || line.service?.name).filter(Boolean)
      const vehicleName = [vehicle.make, vehicle.model].filter(Boolean).join(' ')
      return `
        <article class="flex flex-col lg:flex-row lg:items-center gap-4 p-4 sm:p-5 hover:bg-surface-subtle/60 transition-colors">
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2">
              <span class="font-mono text-body-sm text-text-tertiary" dir="ltr">#${escapeHtml(order.id.slice(0, 8))}</span>
              <span class="inline-flex min-h-[28px] items-center rounded-full px-3 text-label-sm ${statusInfo.style}">${statusInfo.label}</span>
            </div>
            <h2 class="mt-2 text-body-lg font-semibold text-on-surface">${escapeHtml(booking.customer?.fullName || 'عميل')}</h2>
            <p class="mt-1 text-body-sm text-text-secondary">
              ${escapeHtml(vehicleName || 'مركبة')}
              ${vehicle.licensePlate ? ` · <span dir="ltr">${escapeHtml(vehicle.licensePlate)}</span>` : ''}
              ${booking.scheduledDate ? ` · ${escapeHtml(String(booking.scheduledDate).slice(0, 10))}` : ''}
            </p>
            <p class="mt-2 text-body-sm text-text-tertiary">${serviceNames.map(escapeHtml).join('، ') || 'لا توجد خدمات محددة'}</p>
          </div>
          <button type="button" data-work-order-id="${escapeHtml(order.id)}" class="open-work-order min-h-[44px] shrink-0 rounded-lg bg-primary px-5 text-body-md font-semibold text-white hover:bg-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
            فتح أمر الشغل
          </button>
        </article>`
    }).join('')

    list.querySelectorAll<HTMLButtonElement>('.open-work-order').forEach((button) => {
      button.addEventListener('click', () => {
        const workOrderId = button.dataset.workOrderId
        if (workOrderId) this.router.navigate(`/work-orders/${workOrderId}`)
      })
    })
  }
}
