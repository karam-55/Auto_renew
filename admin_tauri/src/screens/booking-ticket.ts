import { AuthService } from '../services/auth'
import { ApiClient } from '../api/client'
import { Router } from '../router'

const SELECT_ARROW = `data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2716%27 height=%2716%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%23475569%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Cpath d=%27M6 9l6 6 6-6%27/%3E%3C/svg%3E`
const SELECT_STYLE = `background-image: url('${SELECT_ARROW}'); background-repeat: no-repeat; background-position: left 0.75rem center; background-size: 1rem; appearance: none;`

export class BookingTicketScreen {
  private api: ApiClient
  private router: Router
  private bookingId: string
  private isEditing = false
  private bookingData: any = null
  private allServices: any[] = []

  constructor(_auth: AuthService, api: ApiClient, router: Router, bookingId: string) {
    this.api = api
    this.router = router
    this.bookingId = bookingId
  }

  render(): HTMLElement {
    const el = document.createElement('div')
    el.className = 'page-enter min-h-screen bg-background p-gutter'
    el.innerHTML = `
      <div class="max-w-3xl mx-auto space-y-stack-lg">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="font-beVietnamPro text-headline-md text-on-surface">تذكرة الحجز</h1>
            <p class="text-body-md text-text-secondary mt-1">#${this.bookingId.slice(0, 8)}</p>
          </div>
          <div class="flex items-center gap-2">
            <button class="h-[48px] px-4 bg-primary text-on-primary font-ibmPlexSans font-body-lg rounded-lg shadow-sm hover:shadow-md transition-all flex items-center gap-2" id="edit-btn">
              <span class="material-symbols-outlined text-[20px]">edit</span>
              تعديل
            </button>
            <button class="h-[48px] px-4 bg-surface-subtle text-on-surface font-ibmPlexSans font-body-lg rounded-lg border border-border hover:bg-surface-container-low transition-colors flex items-center gap-2" id="back-btn">
              <span class="material-symbols-outlined text-[20px]">arrow_forward</span>
              رجوع
            </button>
          </div>
        </div>
        <div id="ticket-card" class="bg-surface-container-lowest rounded-xl shadow-md border border-surface-subtle overflow-hidden">
          <div class="p-6 border-b border-outline-variant/10 bg-surface-subtle flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <span class="material-symbols-outlined">calendar_month</span>
              </div>
              <div>
                <h3 class="font-headline-md text-lg text-on-surface font-semibold" id="ticket-type"><span class="skeleton skeleton-text-lg inline-block w-32"></span></h3>
                <span class="bg-primary-container/20 text-primary px-3 py-1 rounded-full font-label-sm text-sm inline-flex items-center gap-1 mt-1" id="ticket-status-badge">
                  <span class="w-1.5 h-1.5 rounded-full bg-primary"></span> <span id="ticket-status-text"><span class="skeleton skeleton-text-sm inline-block w-16"></span></span>
                </span>
              </div>
            </div>
            <span class="text-financial-data text-text-tertiary" id="ticket-date"><span class="skeleton skeleton-text w-24"></span></span>
          </div>
          <div class="p-6 space-y-6" id="ticket-fields">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="font-label-sm text-text-tertiary mb-1">العميل</p>
                <p class="font-body-md text-on-surface font-semibold" id="ticket-customer"><span class="skeleton skeleton-text w-28"></span></p>
              </div>
              <div>
                <p class="font-label-sm text-text-tertiary mb-1">المركبة</p>
                <p class="font-body-md text-on-surface font-semibold" id="ticket-vehicle"><span class="skeleton skeleton-text w-24"></span></p>
              </div>
              <div>
                <p class="font-label-sm text-text-tertiary mb-1">رقم اللوحة</p>
                <p class="font-body-md text-on-surface font-semibold" dir="ltr" id="ticket-plate"><span class="skeleton skeleton-text w-20"></span></p>
              </div>
              <div>
                <p class="font-label-sm text-text-tertiary mb-1">الأولوية</p>
                <p class="font-body-md text-on-surface font-semibold" id="ticket-priority"><span class="skeleton skeleton-text w-16"></span></p>
              </div>
              <div>
                <p class="font-label-sm text-text-tertiary mb-1">طريقة الدفع</p>
                <p class="font-body-md text-on-surface font-semibold" id="ticket-payment"><span class="skeleton skeleton-text w-16"></span></p>
              </div>
            </div>
            <div class="border-t border-outline-variant/10 pt-4" id="services-section">
              <p class="font-label-sm text-text-tertiary mb-2">الخدمات المطلوبة</p>
              <div class="flex flex-wrap gap-2" id="services-list">...</div>
            </div>
            <div class="border-t border-outline-variant/10 pt-4">
              <p class="font-label-sm text-text-tertiary mb-2">ملاحظات</p>
              <p class="font-body-md text-text-secondary" id="ticket-notes">...</p>
            </div>
          </div>
        </div>
        <div id="ticket-costs" class="bg-surface-container-lowest rounded-xl shadow-md border border-surface-subtle p-card-padding">
          <h3 class="font-headline-md text-lg text-on-surface font-semibold mb-4">تفاصيل التكلفة</h3>
          <div class="space-y-2">
            <div class="flex justify-between font-body-md text-text-secondary">
              <span>تكلفة الخدمة</span>
              <span class="text-financial-data" id="cost-service">0 ل.س</span>
            </div>
            <div class="flex justify-between font-body-md text-text-secondary">
              <span>المواد</span>
              <span class="text-financial-data" id="cost-parts">0 ل.س</span>
            </div>
            <div class="border-t border-outline-variant/10 pt-2 flex justify-between font-headline-md text-lg text-on-surface font-bold">
              <span>الإجمالي</span>
              <span class="text-financial-data text-primary" id="cost-total">0 ل.س</span>
            </div>
          </div>
        </div>

        <div id="job-costs" class="hidden bg-surface-container-lowest rounded-xl shadow-md border border-surface-subtle p-card-padding">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-headline-md text-lg text-on-surface font-semibold">تكاليف العمل الفعلية (Job Costing)</h3>
            <button class="h-[40px] px-4 bg-secondary text-on-secondary font-body-md rounded-lg shadow-sm hover:shadow-md transition-all flex items-center gap-2" id="add-job-cost-btn">
              <span class="material-symbols-outlined text-[18px]">add</span>
              إضافة تكلفة
            </button>
          </div>

          <div id="job-cost-form" class="hidden mb-4 bg-surface-subtle rounded-lg p-4 border border-border space-y-3">
            <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div>
                <label class="block font-label-sm text-text-tertiary mb-1">الخدمة</label>
                <select class="w-full h-[40px] bg-surface-container-lowest border border-border rounded-lg px-3 font-body-md text-on-surface focus:border-primary focus:outline-none" id="jc-service">
                  <option value="">اختر خدمة</option>
                </select>
              </div>
              <div>
                <label class="block font-label-sm text-text-tertiary mb-1">ساعات العمل</label>
                <input type="number" step="0.1" class="w-full h-[40px] bg-surface-container-lowest border border-border rounded-lg px-3 font-body-md text-on-surface focus:border-primary focus:outline-none" id="jc-labor-hours" placeholder="0" />
              </div>
              <div>
                <label class="block font-label-sm text-text-tertiary mb-1">تكلفة العمل</label>
                <input type="number" class="w-full h-[40px] bg-surface-container-lowest border border-border rounded-lg px-3 font-body-md text-on-surface focus:border-primary focus:outline-none" id="jc-labor-cost" placeholder="0" />
              </div>
              <div>
                <label class="block font-label-sm text-text-tertiary mb-1">تكلفة المواد</label>
                <input type="number" class="w-full h-[40px] bg-surface-container-lowest border border-border rounded-lg px-3 font-body-md text-on-surface focus:border-primary focus:outline-none" id="jc-material-cost" placeholder="0" />
              </div>
              <div class="hidden">
                <label class="block font-label-sm text-text-tertiary mb-1">Overhead</label>
                <input type="number" class="w-full h-[40px] bg-surface-container-lowest border border-border rounded-lg px-3 font-body-md text-on-surface focus:border-primary focus:outline-none" id="jc-overhead" placeholder="0" />
              </div>
            </div>
            <div class="flex gap-2 justify-end">
              <button class="h-[36px] px-4 bg-surface-container-high text-on-surface font-body-md rounded-lg border border-border hover:bg-surface-container-low transition-colors" id="jc-cancel">إلغاء</button>
              <button class="h-[36px] px-4 bg-primary text-on-primary font-body-md rounded-lg shadow-sm hover:shadow-md transition-all" id="jc-save">حفظ</button>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-right">
              <thead>
                <tr class="border-b border-surface-subtle">
                  <th class="px-3 py-2 font-label-sm text-text-tertiary">الخدمة</th>
                  <th class="px-3 py-2 font-label-sm text-text-tertiary">ساعات</th>
                  <th class="px-3 py-2 font-label-sm text-text-tertiary">عمل</th>
                  <th class="px-3 py-2 font-label-sm text-text-tertiary">مواد</th>
                  <th class="px-3 py-2 font-label-sm text-text-tertiary hidden">Overhead</th>
                  <th class="px-3 py-2 font-label-sm text-text-tertiary">الإجمالي</th>
                </tr>
              </thead>
              <tbody id="job-costs-tbody">
                <tr><td colspan="5" class="px-3 py-4 text-center text-text-secondary font-body-md">جاري التحميل...</td></tr>
              </tbody>
            </table>
          </div>
          <div id="job-costs-summary" class="mt-3 pt-3 border-t border-outline-variant/10 hidden">
            <div class="flex justify-between font-body-md text-text-secondary">
              <span>التكلفة الفعلية الإجمالية</span>
              <span class="text-financial-data font-bold" id="job-costs-actual">0 ل.س</span>
            </div>
            <div class="flex justify-between font-body-md text-text-secondary mt-1">
              <span>الفرق (Actual - Estimated)</span>
              <span class="text-financial-data" id="job-costs-variance">0 ل.س</span>
            </div>
          </div>
        </div>
      </div>
    `
    el.querySelector('#back-btn')?.addEventListener('click', () => {
      this.router.navigate('/bookings')
    })
    el.querySelector('#edit-btn')?.addEventListener('click', () => {
      this.toggleEdit(el)
    })
    this.loadServices()
    this.loadData(el)
    this.loadJobCosts(el)

    // Job cost form handlers
    const form = el.querySelector('#job-cost-form') as HTMLElement
    const addBtn = el.querySelector('#add-job-cost-btn') as HTMLElement

    const populateServiceSelect = () => {
      const select = el.querySelector('#jc-service') as HTMLSelectElement
      const services = this.bookingData?.services || this.bookingData?.bookingServices?.map((bs: any) => bs.service) || []
      select.innerHTML = '<option value="">اختر خدمة</option>' +
        services.map((s: any) => `<option value="${s.id}">${s.name}</option>`).join('')
    }

    addBtn?.addEventListener('click', () => {
      populateServiceSelect()
      form.classList.remove('hidden')
    })

    el.querySelector('#jc-cancel')?.addEventListener('click', () => {
      form.classList.add('hidden')
      ;(el.querySelector('#jc-service') as HTMLSelectElement).value = ''
      ;(el.querySelector('#jc-labor-hours') as HTMLInputElement).value = ''
      ;(el.querySelector('#jc-labor-cost') as HTMLInputElement).value = ''
      ;(el.querySelector('#jc-material-cost') as HTMLInputElement).value = ''
      ;(el.querySelector('#jc-overhead') as HTMLInputElement).value = ''
    })

    el.querySelector('#jc-save')?.addEventListener('click', async () => {
      const serviceId = (el.querySelector('#jc-service') as HTMLSelectElement).value
      if (!serviceId) { ;(window as any).toast?.show?.({ message: 'اختر خدمة', type: 'warning' }); return }

      const payload = {
        bookingId: this.bookingId,
        serviceId,
        laborHours: parseFloat((el.querySelector('#jc-labor-hours') as HTMLInputElement).value) || undefined,
        laborCost: parseFloat((el.querySelector('#jc-labor-cost') as HTMLInputElement).value) || undefined,
        materialCost: parseFloat((el.querySelector('#jc-material-cost') as HTMLInputElement).value) || undefined,
        overheadCost: parseFloat((el.querySelector('#jc-overhead') as HTMLInputElement).value) || undefined,
      }

      const saveBtn = el.querySelector('#jc-save') as HTMLButtonElement
      saveBtn.disabled = true
      saveBtn.textContent = 'جاري...'

      try {
        const res = await this.api.post<any>('/api/booking-job-costs', payload)
        if (res.success) {
          form.classList.add('hidden')
          ;(el.querySelector('#jc-service') as HTMLSelectElement).value = ''
          ;(el.querySelector('#jc-labor-hours') as HTMLInputElement).value = ''
          ;(el.querySelector('#jc-labor-cost') as HTMLInputElement).value = ''
          ;(el.querySelector('#jc-material-cost') as HTMLInputElement).value = ''
          ;(el.querySelector('#jc-overhead') as HTMLInputElement).value = ''
          this.loadJobCosts(el)
        } else {
          ;(window as any).toast?.show?.({ message: res.message || 'فشل الحفظ', type: 'error' })
        }
      } catch {
        ;(window as any).toast?.show?.({ message: 'حدث خطأ', type: 'error' })
      } finally {
        saveBtn.disabled = false
        saveBtn.textContent = 'حفظ'
      }
    })

    return el
  }

  private getServiceName(serviceId: string): string {
    const services = this.bookingData?.services || this.bookingData?.bookingServices?.map((bs: any) => bs.service) || []
    const s = services.find((svc: any) => svc.id === serviceId)
    return s?.name || serviceId?.slice(0, 8) || '-'
  }

  private async loadJobCosts(el: HTMLElement) {
    try {
      const res = await this.api.get<any>(`/api/booking-job-costs/booking/${this.bookingId}`)
      const tbody = el.querySelector('#job-costs-tbody')!
      const summary = el.querySelector('#job-costs-summary') as HTMLElement
      if (res.success && res.data && res.data.length > 0) {
        tbody.innerHTML = res.data.map((jc: any) => `
          <tr class="border-b border-surface-subtle/50 hover:bg-surface-subtle/30 transition-colors">
            <td class="px-3 py-2 font-body-md text-on-surface">${this.getServiceName(jc.serviceId)}</td>
            <td class="px-3 py-2 font-body-md text-text-secondary">${jc.laborHours ?? '-'}</td>
            <td class="px-3 py-2 font-body-md text-text-secondary">${(jc.laborCost || 0).toLocaleString('ar-SA')} ل.س</td>
            <td class="px-3 py-2 font-body-md text-text-secondary">${(jc.materialCost || 0).toLocaleString('ar-SA')} ل.س</td>
            <td class="px-3 py-2 font-body-md text-text-secondary hidden">${(jc.overheadCost || 0).toLocaleString('ar-SA')} ل.س</td>
            <td class="px-3 py-2 font-body-md text-primary font-semibold">${(jc.totalCost || 0).toLocaleString('ar-SA')} ل.س</td>
          </tr>
        `).join('')
        const actualTotal = res.data.reduce((sum: number, jc: any) => sum + (jc.totalCost || 0), 0)
        const estimatedTotal = (this.bookingData?.totalCost || 0)
        const variance = actualTotal - estimatedTotal
        summary.classList.remove('hidden')
        ;(el.querySelector('#job-costs-actual') as HTMLElement).textContent = actualTotal.toLocaleString('ar-SA') + ' ل.س'
        const varEl = el.querySelector('#job-costs-variance') as HTMLElement
        varEl.textContent = (variance >= 0 ? '+' : '') + variance.toLocaleString('ar-SA') + ' ل.س'
        varEl.className = 'text-financial-data font-bold ' + (variance > 0 ? 'text-error' : variance < 0 ? 'text-success' : '')
      } else {
        tbody.innerHTML = '<tr><td colspan="5" class="px-3 py-4 text-center text-text-secondary font-body-md">لا توجد تكاليف مسجلة</td></tr>'
        summary.classList.add('hidden')
      }
    } catch {
      el.querySelector('#job-costs-tbody')!.innerHTML = '<tr><td colspan="5" class="px-3 py-4 text-center text-error font-body-md">حدث خطأ</td></tr>'
    }
  }

  private async loadServices() {
    try {
      const res = await this.api.get<any>('/api/services')
      if (res.success && res.data) {
        this.allServices = Array.isArray(res.data) ? res.data : res.data.data || []
      }
    } catch { /* keep empty */ }
  }

  private toggleEdit(el: HTMLElement) {
    this.isEditing = !this.isEditing
    const editBtn = el.querySelector('#edit-btn') as HTMLButtonElement
    const badge = el.querySelector('#ticket-status-badge') as HTMLElement
    const dateEl = el.querySelector('#ticket-date') as HTMLElement

    if (!this.bookingData) return
    const b = this.bookingData

    if (this.isEditing) {
      editBtn.innerHTML = `<span class="material-symbols-outlined text-[20px]">close</span> إلغاء`
      editBtn.classList.remove('bg-primary', 'text-on-primary')
      editBtn.classList.add('bg-error/10', 'text-error')

      // Status badge -> select with arrow on left
      badge.outerHTML = `
        <select class="h-[36px] bg-surface-subtle border border-border rounded-lg px-3 font-body-md text-on-surface focus:border-primary focus:outline-none" id="edit-status" style="${SELECT_STYLE}">
          <option value="PENDING" ${b.status === 'PENDING' ? 'selected' : ''}>قيد الانتظار</option>
          <option value="CONFIRMED" ${b.status === 'CONFIRMED' ? 'selected' : ''}>مؤكد</option>
          <option value="IN_PROGRESS" ${b.status === 'IN_PROGRESS' ? 'selected' : ''}>قيد العمل</option>
          <option value="WAITING_PARTS" ${b.status === 'WAITING_PARTS' ? 'selected' : ''}>بانتظار المواد</option>
          <option value="READY" ${b.status === 'READY' ? 'selected' : ''}>جاهز</option>
          <option value="COMPLETED" ${b.status === 'COMPLETED' ? 'selected' : ''}>مكتمل</option>
          <option value="CANCELLED" ${b.status === 'CANCELLED' ? 'selected' : ''}>ملغي</option>
        </select>
      `

      // Date -> input
      dateEl.outerHTML = `
        <div class="flex items-center gap-2">
          <input type="date" class="h-[36px] bg-surface-subtle border border-border rounded-lg px-3 font-body-md text-on-surface focus:border-primary focus:outline-none" id="edit-date" value="${b.scheduledDate?.split('T')[0] || ''}" />
          <input type="time" class="h-[36px] bg-surface-subtle border border-border rounded-lg px-3 font-body-md text-on-surface focus:border-primary focus:outline-none" id="edit-time" value="${b.scheduledTime || ''}" />
        </div>
      `

      // Notes -> textarea
      const notesP = el.querySelector('#ticket-notes') as HTMLElement
      const notesVal = b.notes || b.description || ''
      notesP.outerHTML = `<textarea class="w-full bg-surface-subtle border border-border rounded-lg p-3 font-body-md text-on-surface focus:border-primary focus:outline-none resize-none" id="edit-notes" rows="3">${notesVal}</textarea>`

      // Priority -> select with arrow on left
      const priorityP = el.querySelector('#ticket-priority') as HTMLElement
      if (priorityP) {
        priorityP.outerHTML = `
          <select class="h-[36px] bg-surface-subtle border border-border rounded-lg px-3 font-body-md text-on-surface focus:border-primary focus:outline-none" id="edit-priority" style="${SELECT_STYLE}">
            <option value="LOW" ${b.priority === 'LOW' ? 'selected' : ''}>منخفض</option>
            <option value="NORMAL" ${b.priority === 'NORMAL' ? 'selected' : ''}>عادي</option>
            <option value="HIGH" ${b.priority === 'HIGH' ? 'selected' : ''}>عالي</option>
            <option value="URGENT" ${b.priority === 'URGENT' ? 'selected' : ''}>عاجل</option>
          </select>
        `
      }

      // Services -> checkboxes
      const servicesSection = el.querySelector('#services-section') as HTMLElement
      const currentServiceIds = new Set([
        ...(b.services?.map((s: any) => s.id) || []),
        ...(b.serviceIds || []),
        ...(b.bookingServices?.map((bs: any) => bs.serviceId) || []),
      ])
      const checkboxes = this.allServices.length > 0
        ? this.allServices.map((s: any) => `
            <label class="flex items-center gap-2 cursor-pointer hover:bg-surface-container-low/50 rounded px-2 py-1.5 transition-colors">
              <input type="checkbox" value="${s.id}" ${currentServiceIds.has(s.id) ? 'checked' : ''} class="w-4 h-4 rounded border-border text-primary focus:ring-primary" />
              <span class="font-body-md text-on-surface">${s.name}</span>
            </label>
          `).join('')
        : ''
      if (servicesSection) {
        servicesSection.innerHTML = `
          <p class="font-label-sm text-text-tertiary mb-2">الخدمات</p>
          <div class="w-full max-h-[160px] overflow-y-auto bg-surface-subtle border border-border rounded-lg p-3 space-y-2" id="edit-services">
            ${checkboxes || '<p class="text-text-secondary text-sm">لا توجد خدمات</p>'}
          </div>
          <p class="text-text-tertiary text-xs mt-1">اختر خدمة واحدة أو أكثر</p>
        `
      }

      // Payment method -> select
      const paymentDiv = document.createElement('div')
      paymentDiv.className = 'border-t border-outline-variant/10 pt-4'
      paymentDiv.innerHTML = `
        <p class="font-label-sm text-text-tertiary mb-2">طريقة الدفع</p>
        <select class="h-[40px] w-full max-w-md bg-surface-subtle border border-border rounded-lg px-3 font-body-md text-on-surface focus:border-primary focus:outline-none" id="edit-payment" style="${SELECT_STYLE}">
          <option value="CASH" ${b.paymentMethod === 'CASH' ? 'selected' : ''}>نقدي</option>
          <option value="CREDIT" ${b.paymentMethod === 'CREDIT' ? 'selected' : ''}>آجل</option>
          <option value="ELECTRONIC" ${b.paymentMethod === 'ELECTRONIC' ? 'selected' : ''}>إلكتروني</option>
        </select>
      `
      const fieldsContainer = el.querySelector('#ticket-fields')
      fieldsContainer?.appendChild(paymentDiv)

      // Add save button
      const card = el.querySelector('#ticket-card') as HTMLElement
      const saveBar = document.createElement('div')
      saveBar.id = 'edit-save-bar'
      saveBar.className = 'p-4 border-t border-outline-variant/10 bg-surface-subtle flex justify-end gap-2'
      saveBar.innerHTML = `
        <button class="h-[40px] px-6 bg-primary text-on-primary font-body-md rounded-lg shadow-sm hover:shadow-md transition-all flex items-center gap-2" id="save-btn">
          <span class="material-symbols-outlined text-[18px]">save</span>
          حفظ
        </button>
      `
      card.appendChild(saveBar)
      el.querySelector('#save-btn')?.addEventListener('click', () => this.saveEdit(el))
    } else {
      this.loadData(el)
    }
  }

  private async saveEdit(el: HTMLElement) {
    const status = (el.querySelector('#edit-status') as HTMLSelectElement)?.value
    const date = (el.querySelector('#edit-date') as HTMLInputElement)?.value
    const time = (el.querySelector('#edit-time') as HTMLInputElement)?.value
    const notes = (el.querySelector('#edit-notes') as HTMLTextAreaElement)?.value
    const priority = (el.querySelector('#edit-priority') as HTMLSelectElement)?.value

    const checkedServices = el.querySelectorAll('#edit-services input[type="checkbox"]:checked')
    const selectedServiceIds = Array.from(checkedServices).map((cb: any) => cb.value)
    const paymentMethod = (el.querySelector('#edit-payment') as HTMLSelectElement)?.value

    const payload: any = {}
    if (status) payload.status = status
    if (date) payload.scheduledDate = new Date(date).toISOString()
    if (time) payload.scheduledTime = time
    if (notes !== undefined) payload.notes = notes
    if (priority) payload.priority = priority
    if (selectedServiceIds.length > 0) payload.serviceIds = selectedServiceIds
    if (paymentMethod) payload.paymentMethod = paymentMethod

    const saveBtn = el.querySelector('#save-btn') as HTMLButtonElement
    if (saveBtn) {
      saveBtn.disabled = true
      saveBtn.innerHTML = `<span class="material-symbols-outlined text-[18px] animate-spin">sync</span> جاري...`
    }

    try {
      const res = await this.api.put<any>(`/api/bookings/${this.bookingId}`, payload)
      if (res.success) {
        this.isEditing = false
        this.loadData(el)
      } else {
        ;(window as any).toast?.show?.({ message: res.message || 'فشل تحديث الحجز', type: 'error' })
      }
    } catch (err: any) {
      ;(window as any).toast?.show?.({ message: err.message || 'حدث خطأ: فشل الاتصال', type: 'error' })
    } finally {
      if (saveBtn) {
        saveBtn.disabled = false
        saveBtn.innerHTML = `<span class="material-symbols-outlined text-[18px]">save</span> حفظ`
      }
    }
  }

  private async loadData(el: HTMLElement) {
    // Restore edit-mode elements back to view mode if needed
    const statusSelect = el.querySelector('#edit-status')
    if (statusSelect) {
      statusSelect.outerHTML = `<span class="bg-primary-container/20 text-primary px-3 py-1 rounded-full font-label-sm text-sm inline-flex items-center gap-1 mt-1" id="ticket-status-badge">
        <span class="w-1.5 h-1.5 rounded-full bg-primary"></span> <span id="ticket-status-text">...</span>
      </span>`
    }
    const prioritySelect = el.querySelector('#edit-priority')
    if (prioritySelect) {
      prioritySelect.outerHTML = `<p class="font-body-md text-on-surface font-semibold" id="ticket-priority">...</p>`
    }
    const servicesEditDiv = el.querySelector('#edit-services')
    if (servicesEditDiv) {
      const servicesSection = el.querySelector('#services-section')
      if (servicesSection) {
        servicesSection.innerHTML = `
          <p class="font-label-sm text-text-tertiary mb-2">الخدمات المطلوبة</p>
          <div class="flex flex-wrap gap-2" id="services-list">...</div>
        `
      }
    }
    // Restore date element (edit-date + edit-time were added)
    const dateInputs = el.querySelector('#edit-date')
    if (dateInputs) {
      const parent = dateInputs.closest('.flex.items-center.gap-2')
      if (parent) {
        parent.outerHTML = `<span class="text-financial-data text-text-tertiary" id="ticket-date">...</span>`
      }
    }
    // Restore notes element (edit-notes textarea)
    const notesTextarea = el.querySelector('#edit-notes')
    if (notesTextarea) {
      notesTextarea.outerHTML = `<p class="font-body-md text-text-secondary" id="ticket-notes">...</p>`
    }
    // Remove payment method edit block
    const paymentSelect = el.querySelector('#edit-payment')
    if (paymentSelect) {
      const paymentBlock = paymentSelect.closest('.border-t.border-outline-variant\\/10.pt-4')
      if (paymentBlock) paymentBlock.remove()
    }

    try {
      const res = await this.api.get<any>(`/api/bookings/${this.bookingId}`)
      if (res.success && res.data) {
        const b = res.data
        this.bookingData = b
        const setText = (id: string, val: string) => {
          const e = el.querySelector('#' + id)
          if (e) e.textContent = val
        }
        const statusMap: Record<string, { label: string; dot: string; bg: string; text: string }> = {
          PENDING: { label: 'قيد الانتظار', dot: 'bg-warning', bg: 'bg-warning/10', text: 'text-warning' },
          CONFIRMED: { label: 'مؤكد', dot: 'bg-info', bg: 'bg-info/10', text: 'text-info' },
          IN_PROGRESS: { label: 'قيد العمل', dot: 'bg-primary', bg: 'bg-primary/10', text: 'text-primary' },
          WAITING_PARTS: { label: 'بانتظار المواد', dot: 'bg-amber-500', bg: 'bg-amber-500/10', text: 'text-amber-600' },
          READY: { label: 'جاهز', dot: 'bg-cyan-500', bg: 'bg-cyan-500/10', text: 'text-cyan-600' },
          INVOICED: { label: 'تمت الفوترة', dot: 'bg-indigo-500', bg: 'bg-indigo-500/10', text: 'text-indigo-600' },
          PAID: { label: 'مدفوع', dot: 'bg-emerald-500', bg: 'bg-emerald-500/10', text: 'text-emerald-600' },
          DELIVERED: { label: 'تم التسليم', dot: 'bg-teal-500', bg: 'bg-teal-500/10', text: 'text-teal-600' },
          COMPLETED: { label: 'مكتمل', dot: 'bg-success', bg: 'bg-success/10', text: 'text-success' },
          CANCELLED: { label: 'ملغى', dot: 'bg-error', bg: 'bg-error/10', text: 'text-error' },
          NO_SHOW: { label: 'لم يحضر', dot: 'bg-gray-400', bg: 'bg-gray-400/10', text: 'text-gray-600' },
          NO_INVOICE_REQUIRED: { label: 'بدون فاتورة', dot: 'bg-slate-400', bg: 'bg-slate-400/10', text: 'text-slate-600' },
        }
        const st = statusMap[b.status] || { label: b.status || '-', dot: 'bg-primary', bg: 'bg-primary-container/20', text: 'text-primary' }
        setText('ticket-type', b.serviceType || b.service?.name || 'حجز صيانة')
        setText('ticket-status-text', st.label)
        const badge = el.querySelector('#ticket-status-badge') as HTMLElement
        if (badge) {
          badge.className = `${st.bg} ${st.text} px-3 py-1 rounded-full font-label-sm text-sm inline-flex items-center gap-1 mt-1`
          const dot = badge.querySelector('span:first-child')
          if (dot) dot.className = `w-1.5 h-1.5 rounded-full ${st.dot}`
        }
        setText('ticket-date', b.scheduledDate?.split('T')[0] || b.date?.split('T')[0] || '-')
        setText('ticket-customer', b.customer?.fullName || '-')
        setText('ticket-vehicle', b.vehicle?.model || b.vehicleModel || '-')
        setText('ticket-plate', b.vehicle?.licensePlate || '-')
        setText('ticket-priority', b.priority === 'URGENT' ? 'عاجل' : b.priority === 'HIGH' ? 'عالي' : b.priority === 'LOW' ? 'منخفض' : 'عادي')
        setText('ticket-payment', b.paymentMethod === 'CREDIT' ? 'آجل' : b.paymentMethod === 'ELECTRONIC' ? 'إلكتروني' : 'نقدي')
        setText('ticket-notes', b.notes || b.description || 'لا توجد ملاحظات')
        // Calculate costs from services (basePrice) since backend doesn't return aggregate cost fields
        const svcs = b.services || b.bookingServices?.map((bs: any) => bs.service) || []
        const serviceCost = svcs.reduce((sum: number, s: any) => sum + (s.basePrice || 0), 0)
        const partsCost = b.partsCost || 0
        const totalCost = serviceCost + partsCost
        const costSection = el.querySelector('#ticket-costs') as HTMLElement
        if (costSection) {
          if (serviceCost === 0 && partsCost === 0) {
            costSection.classList.add('hidden')
          } else {
            costSection.classList.remove('hidden')
            setText('cost-service', serviceCost.toLocaleString('ar-SA') + ' ل.س')
            setText('cost-parts', partsCost.toLocaleString('ar-SA') + ' ل.س')
            setText('cost-total', totalCost.toLocaleString('ar-SA') + ' ل.س')
          }
        }

        // Render services tags
        const servicesList = el.querySelector('#services-list') as HTMLElement
        if (servicesList) {
          const svcs = b.services || b.bookingServices?.map((bs: any) => bs.service) || []
          if (svcs.length > 0) {
            servicesList.innerHTML = svcs.map((s: any) => `
              <span class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 text-primary font-body-md text-sm">
                <span class="material-symbols-outlined text-[16px]">build</span>
                ${s.name || 'خدمة'}
              </span>
            `).join('')
          } else {
            servicesList.innerHTML = '<span class="text-text-secondary font-body-md">لا توجد خدمات محددة</span>'
          }
        }
        // Restore services section label
        const servicesSection = el.querySelector('#services-section') as HTMLElement
        if (servicesSection) {
          const label = servicesSection.querySelector('p')
          if (label) label.textContent = 'الخدمات المطلوبة'
        }

        // Restore edit button style
        const editBtn = el.querySelector('#edit-btn') as HTMLButtonElement
        if (editBtn) {
          editBtn.innerHTML = `<span class="material-symbols-outlined text-[20px]">edit</span> تعديل`
          editBtn.classList.add('bg-primary', 'text-on-primary')
          editBtn.classList.remove('bg-error/10', 'text-error')
        }
        // Remove edit controls
        el.querySelector('#edit-save-bar')?.remove()
      } else {
        el.querySelector('#ticket-card')!.innerHTML = '<p class="p-6 text-error font-body-md">لا توجد بيانات لهذا الحجز</p>'
        el.querySelector('#ticket-costs')!.innerHTML = ''
      }
    } catch {
      el.querySelector('#ticket-card')!.innerHTML = '<p class="p-6 text-error font-body-md">حدث خطأ أثناء تحميل البيانات</p>'
      el.querySelector('#ticket-costs')!.innerHTML = ''
    }
  }
}
