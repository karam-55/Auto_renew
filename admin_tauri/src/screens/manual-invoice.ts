import { AuthService } from '../services/auth'
import { ApiClient } from '../api/client'
import { Router } from '../router'
import { AppLayout } from '../components/layout'

export class ManualInvoiceScreen {
  private type: 'manual' | 'booking'
  private selectedCustomerId: string = ''
  private selectedVehicleId: string = ''
  private selectedBookingId: string = ''
  private servicesList: any[] = []
  private invoiceItems: any[] = []
  private discountType: 'FIXED' | 'PERCENTAGE' = 'FIXED'
  private discountValue: number = 0

  constructor(
    private auth: AuthService,
    private api: ApiClient,
    private router: Router,
    type: 'manual' | 'booking'
  ) {
    this.type = type
  }

  render(): HTMLElement {
    const layout = new AppLayout(this.auth, this.router, 'فاتورة جديدة', 'receipt_long', this.api)
    const content = document.createElement('div')
    content.className = 'page-enter min-h-screen bg-background p-gutter'
    content.innerHTML = `
      <div class="max-w-4xl mx-auto space-y-stack-lg">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="font-beVietnamPro text-headline-md text-on-surface">فاتورة جديدة</h1>
            <p class="text-body-md text-text-secondary mt-1">${this.type === 'manual' ? 'فاتورة عامة - اختيار الخدمات يدوياً' : 'فاتورة من حجز'}</p>
          </div>
          <button class="h-[48px] px-4 bg-surface-subtle text-on-surface font-ibmPlexSans font-body-lg rounded-lg border border-border hover:bg-surface-container-low transition-colors flex items-center gap-2" id="cancel-btn" aria-label="إلغاء إنشاء الفاتورة">
            <span class="material-symbols-outlined text-[20px]" aria-hidden="true">close</span>
            إلغاء
          </button>
        </div>

        <!-- Steps -->
        <div class="flex items-center gap-2" id="wizard-steps">
          <div class="flex items-center gap-2" data-step="1">
            <div class="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-sm step-num">1</div>
            <span class="font-label-sm text-primary font-semibold step-label">العميل</span>
          </div>
          <div class="flex-1 h-[2px] bg-border step-line" data-from="1" data-to="2"></div>
          <div class="flex items-center gap-2" data-step="2">
            <div class="w-8 h-8 rounded-full bg-surface-container-high text-text-secondary flex items-center justify-center font-bold text-sm step-num">2</div>
            <span class="font-label-sm text-text-secondary step-label">${this.type === 'manual' ? 'الخدمات' : 'الحجز'}</span>
          </div>
          <div class="flex-1 h-[2px] bg-border step-line" data-from="2" data-to="3"></div>
          <div class="flex items-center gap-2" data-step="3">
            <div class="w-8 h-8 rounded-full bg-surface-container-high text-text-secondary flex items-center justify-center font-bold text-sm step-num">3</div>
            <span class="font-label-sm text-text-secondary step-label">الخصم والإجمالي</span>
          </div>
        </div>

        <!-- Step 1: Customer -->
        <div id="step-1" class="wizard-step">
          <div class="bg-surface-container-lowest rounded-xl shadow-md border border-surface-subtle overflow-hidden">
            <div class="p-6 border-b border-outline-variant/10 bg-surface-subtle">
              <h3 class="font-headline-md text-lg text-on-surface font-semibold">اختيار العميل</h3>
            </div>
            <div class="p-6 space-y-4">
              <div>
                <label class="block font-label-sm text-label-sm text-text-tertiary mb-2">اختر العميل *</label>
                <select class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg pr-4 pl-10 font-ibmPlexSans font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow appearance-none" style="background-image: url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2716%27 height=%2716%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%23475569%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Cpath d=%27M6 9l6 6 6-6%27/%3E%3C/svg%3E'); background-repeat: no-repeat; background-position: left 0.75rem center; background-size: 1rem;" id="customer-select">
                  <option value="">جاري تحميل العملاء...</option>
                </select>
              </div>
              <div id="vehicle-section" class="hidden">
                <label class="block font-label-sm text-label-sm text-text-tertiary mb-2">اختر المركبة</label>
                <select class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg pr-4 pl-10 font-ibmPlexSans font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow appearance-none" style="background-image: url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2716%27 height=%2716%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%23475569%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Cpath d=%27M6 9l6 6 6-6%27/%3E%3C/svg%3E'); background-repeat: no-repeat; background-position: left 0.75rem center; background-size: 1rem;" id="vehicle-select">
                  <option value="">جاري تحميل المركبات...</option>
                </select>
              </div>
              <div id="customer-warning" class="hidden"></div>
              <div class="flex justify-end pt-2">
                <button class="h-[48px] px-6 bg-primary text-on-primary font-ibmPlexSans font-body-lg rounded-lg shadow-sm hover:shadow-lg hover:-translate-y-[1px] transition-all duration-200 flex items-center gap-2" id="step1-next" disabled>
                  التالي
                  <span class="material-symbols-outlined text-[20px]" aria-hidden="true">arrow_back</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Step 2: Services or Booking -->
        <div id="step-2" class="wizard-step hidden">
          <div class="bg-surface-container-lowest rounded-xl shadow-md border border-surface-subtle overflow-hidden">
            <div class="p-6 border-b border-outline-variant/10 bg-surface-subtle">
              <h3 class="font-headline-md text-lg text-on-surface font-semibold">${this.type === 'manual' ? 'اختيار الخدمات' : 'اختيار الحجز'}</h3>
            </div>
            <div class="p-6 space-y-4">
              <div id="step2-content"></div>
              <div class="flex justify-between pt-2">
                <button class="h-[48px] px-4 bg-surface-subtle text-on-surface font-ibmPlexSans font-body-lg rounded-lg border border-border hover:bg-surface-container-low transition-colors flex items-center gap-2" id="step2-prev">
                  <span class="material-symbols-outlined text-[20px]" aria-hidden="true">arrow_forward</span>
                  السابق
                </button>
                <button class="h-[48px] px-6 bg-primary text-on-primary font-ibmPlexSans font-body-lg rounded-lg shadow-sm hover:shadow-lg hover:-translate-y-[1px] transition-all duration-200 flex items-center gap-2" id="step2-next" disabled>
                  التالي
                  <span class="material-symbols-outlined text-[20px]" aria-hidden="true">arrow_back</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Step 3: Discount & Summary -->
        <div id="step-3" class="wizard-step hidden">
          <div class="bg-surface-container-lowest rounded-xl shadow-md border border-surface-subtle overflow-hidden">
            <div class="p-6 border-b border-outline-variant/10 bg-surface-subtle">
              <h3 class="font-headline-md text-lg text-on-surface font-semibold">الخصم والإجمالي</h3>
            </div>
            <div class="p-6 space-y-4">
              <!-- Discount -->
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div>
                  <label class="block font-label-sm text-label-sm text-text-tertiary mb-2">نوع الخصم</label>
                  <select class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg pr-4 pl-10 font-ibmPlexSans font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow appearance-none" style="background-image: url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2716%27 height=%2716%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%23475569%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Cpath d=%27M6 9l6 6 6-6%27/%3E%3C/svg%3E'); background-repeat: no-repeat; background-position: left 0.75rem center; background-size: 1rem;" id="discount-type">
                    <option value="FIXED">مبلغ ثابت</option>
                    <option value="PERCENTAGE">نسبة مئوية</option>
                  </select>
                </div>
                <div>
                  <label class="block font-label-sm text-label-sm text-text-tertiary mb-2">قيمة الخصم</label>
                  <input type="number" class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-ibmPlexSans font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow" id="discount-value" placeholder="0.00" value="0" />
                </div>
                <div>
                  <button id="apply-discount-btn" class="w-full h-[48px] bg-gradient-to-r from-primary to-primary-container text-on-primary font-ibmPlexSans font-body-lg rounded-full shadow-md hover:shadow-xl hover:-translate-y-[2px] active:translate-y-0 active:shadow-sm transition-all duration-200 flex items-center justify-center gap-2 border border-primary/20">
                    <span class="material-symbols-outlined text-[20px]" aria-hidden="true">discount</span>
                    <span class="font-semibold">تطبيق الخصم</span>
                  </button>
                </div>
              </div>

              <!-- Notes -->
              <div>
                <label class="block font-label-sm text-label-sm text-text-tertiary mb-2">ملاحظات</label>
                <textarea class="w-full bg-surface-subtle border border-border rounded-lg p-4 font-ibmPlexSans font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow resize-none" id="invoice-notes" rows="2" placeholder="ملاحظات الفاتورة..."></textarea>
              </div>

              <!-- Summary -->
              <div class="bg-surface-subtle rounded-lg p-4 space-y-2">
                <div class="flex justify-between">
                  <span class="font-body-md text-text-secondary">المجموع الفرعي</span>
                  <span class="font-body-md text-on-surface" id="summary-subtotal">0 ل.س</span>
                </div>
                <div class="flex justify-between">
                  <span class="font-body-md text-text-secondary">الخصم</span>
                  <span class="font-body-md text-error" id="summary-discount">0 ل.س</span>
                </div>
                <div class="flex justify-between border-t border-outline-variant/10 pt-2">
                  <span class="font-headline-md text-lg font-semibold text-on-surface">الإجمالي</span>
                  <span class="font-headline-md text-lg font-semibold text-primary" id="summary-total">0 ل.س</span>
                </div>
              </div>

              <div class="flex justify-between pt-2">
                <button class="h-[48px] px-4 bg-surface-subtle text-on-surface font-ibmPlexSans font-body-lg rounded-lg border border-border hover:bg-surface-container-low transition-colors flex items-center gap-2" id="step3-prev">
                  <span class="material-symbols-outlined text-[20px]" aria-hidden="true">arrow_forward</span>
                  السابق
                </button>
                <button class="h-[48px] px-6 bg-tertiary text-on-tertiary font-ibmPlexSans font-body-lg rounded-lg shadow-sm hover:shadow-lg hover:-translate-y-[1px] transition-all duration-200 flex items-center gap-2" id="create-invoice-btn">
                  <span class="material-symbols-outlined text-[20px]" aria-hidden="true">receipt_long</span>
                  إنشاء الفاتورة
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `

    this.loadCustomers(content)
    this.loadServices()

    content.querySelector('#cancel-btn')?.addEventListener('click', () => {
      this.router.navigate('/invoices')
    })

    content.querySelector('#step1-next')?.addEventListener('click', () => {
      this.goToStep(content, 2)
    })

    content.querySelector('#step2-prev')?.addEventListener('click', () => {
      this.goToStep(content, 1)
    })

    content.querySelector('#step2-next')?.addEventListener('click', () => {
      this.goToStep(content, 3)
      this.updateSummary(content)
    })

    content.querySelector('#step3-prev')?.addEventListener('click', () => {
      this.goToStep(content, 2)
    })

    content.querySelector('#apply-discount-btn')?.addEventListener('click', () => {
      this.applyDiscount(content)
    })

    content.querySelector('#create-invoice-btn')?.addEventListener('click', () => {
      this.createInvoice(content)
    })

    content.querySelector('#customer-select')?.addEventListener('change', (e) => {
      const select = e.target as HTMLSelectElement
      this.selectedCustomerId = select.value
      this.selectedVehicleId = ''
      const nextBtn = content.querySelector('#step1-next') as HTMLButtonElement
      nextBtn.disabled = !this.selectedCustomerId
      if (this.selectedCustomerId) {
        this.checkCustomerInvoices(content, this.selectedCustomerId)
        this.loadCustomerVehicles(content, this.selectedCustomerId)
      } else {
        const vehicleSection = content.querySelector('#vehicle-section') as HTMLElement
        if (vehicleSection) vehicleSection.classList.add('hidden')
      }
    })

    content.querySelector('#vehicle-select')?.addEventListener('change', (e) => {
      const select = e.target as HTMLSelectElement
      this.selectedVehicleId = select.value
    })

    return layout.render(content)
  }

  private goToStep(el: HTMLElement, step: number) {
    for (let i = 1; i <= 3; i++) {
      const stepEl = el.querySelector(`#step-${i}`) as HTMLElement
      if (stepEl) stepEl.classList.toggle('hidden', i !== step)

      const stepIndicator = el.querySelector(`[data-step="${i}"]`)
      if (stepIndicator) {
        const num = stepIndicator.querySelector('.step-num')
        const label = stepIndicator.querySelector('.step-label')
        if (num) {
          num.className = `w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm step-num ${i <= step ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-text-secondary'}`
        }
        if (label) {
          label.className = `font-label-sm step-label ${i <= step ? 'text-primary font-semibold' : 'text-text-secondary'}`
        }
      }

      const line = el.querySelector(`[data-from="${i}"][data-to="${i + 1}"]`)
      if (line) {
        line.className = `flex-1 h-[2px] step-line ${i < step ? 'bg-primary' : 'bg-border'}`
      }
    }

    if (step === 2 && this.type === 'manual') {
      this.renderManualServices(el)
    } else if (step === 2 && this.type === 'booking') {
      this.loadBookings(el)
    }
  }

  private async loadCustomers(el: HTMLElement) {
    try {
      // Load only first 20 customers for better performance
      const res = await this.api.get<any>('/api/customers?limit=20&page=1')
      const select = el.querySelector('#customer-select') as HTMLSelectElement
      if (res.success && res.data) {
        const customers = Array.isArray(res.data) ? res.data : res.data.data || []
        select.innerHTML = `<option value="">اختر عميل...</option>` +
          customers.map((c: any) => `<option value="${c.id}">${c.fullName || c.name || '-'} ${c.phone ? '(' + c.phone + ')' : ''}</option>`).join('')
      } else {
        select.innerHTML = '<option value="">لا يوجد عملاء</option>'
      }
    } catch {
      const select = el.querySelector('#customer-select') as HTMLSelectElement
      select.innerHTML = '<option value="">خطأ في تحميل العملاء</option>'
    }
  }

  private async loadServices() {
    try {
      const res = await this.api.get<any>('/api/services')
      if (res.success && res.data) {
        this.servicesList = Array.isArray(res.data) ? res.data : res.data.data || []
      }
    } catch {
      this.servicesList = []
    }
  }

  private async loadCustomerVehicles(el: HTMLElement, customerId: string) {
    const section = el.querySelector('#vehicle-section') as HTMLElement
    const select = el.querySelector('#vehicle-select') as HTMLSelectElement
    section.classList.remove('hidden')
    select.innerHTML = '<option value="">جاري تحميل المركبات...</option>'

    try {
      const res = await this.api.get<any>(`/api/customers/${customerId}`)
      if (res.success && res.data && res.data.vehicles) {
        const vehicles = res.data.vehicles
        if (vehicles.length === 0) {
          select.innerHTML = '<option value="">لا يوجد مركبات مسجلة</option>'
        } else {
          select.innerHTML = `<option value="">اختر مركبة (اختياري)</option>` +
            vehicles.map((v: any) => `<option value="${v.id}">${v.make || ''} ${v.model || ''} ${v.licensePlate ? '(' + v.licensePlate + ')' : ''}</option>`).join('')
        }
      } else {
        select.innerHTML = '<option value="">لا يوجد مركبات</option>'
      }
    } catch {
      select.innerHTML = '<option value="">خطأ في تحميل المركبات</option>'
    }
  }

  private async checkCustomerInvoices(el: HTMLElement, customerId: string) {
    const warningDiv = el.querySelector('#customer-warning')!
    warningDiv.className = 'hidden'
    warningDiv.innerHTML = ''

    try {
      const res = await this.api.get<any>(`/api/invoices?customerId=${customerId}`)
      if (res.success && res.data) {
        const invoices = Array.isArray(res.data) ? res.data : res.data.data || []
        const problematic = invoices.filter((inv: any) =>
          inv.status === 'ISSUED' || inv.status === 'SENT' || inv.status === 'DRAFT' || inv.status === 'PARTIALLY_PAID'
        )
        if (problematic.length > 0) {
          const statuses = problematic.map((i: any) => {
            const map: Record<string, string> = {
              ISSUED: 'مُصدرة', SENT: 'مرسلة', DRAFT: 'مسودة', PARTIALLY_PAID: 'مدفوعة جزئياً'
            }
            return map[i.status] || i.status
          }).join('، ')
          warningDiv.className = 'bg-warning/10 border border-warning/20 rounded-lg p-4 text-warning font-body-md'
          warningDiv.innerHTML = `
            <div class="flex items-start gap-2">
              <span class="material-symbols-outlined text-[20px] mt-0.5">warning</span>
              <div>
                <p class="font-semibold">تنبيه: هذا العميل لديه فاتورة غير مدفوعة أو مدفوعة جزئياً</p>
                <p class="text-sm mt-1">${problematic.length} فاتورة بحالة: ${statuses}</p>
                <p class="text-sm">هل أنت متأكد من إنشاء فاتورة جديدة؟</p>
              </div>
            </div>
          `
        }
      }
    } catch {
      // ignore
    }
  }

  private async loadBookings(el: HTMLElement) {
    const content = el.querySelector('#step2-content')!
    content.innerHTML = '<div class="text-center py-8"><div class="skeleton-shimmer h-4 rounded w-32 mx-auto"></div></div>'

    try {
      const res = await this.api.get<any>(`/api/bookings?customerId=${this.selectedCustomerId}`)
      if (res.success && res.data) {
        const bookings = Array.isArray(res.data) ? res.data : res.data.data || []
        if (bookings.length === 0) {
          content.innerHTML = `
            <div class="text-center py-8 text-error font-body-md">
              <span class="material-symbols-outlined text-[40px] mb-2">event_busy</span>
              <p>لا يوجد حجوزات لهذا العميل</p>
              <p class="text-sm mt-1 text-text-secondary">لا يمكن إنشاء فاتورة حجز لعميل ليس لديه حجوزات</p>
            </div>
          `
          const nextBtn = el.querySelector('#step2-next') as HTMLButtonElement
          if (nextBtn) nextBtn.disabled = true
          return
        }

        content.innerHTML = `
          <div class="space-y-3">
            <p class="font-body-md text-text-secondary">اختر الحجز المراد إنشاء فاتورة له:</p>
            ${bookings.map((b: any) => `
              <div class="booking-card border border-border rounded-lg p-4 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all ${this.selectedBookingId === b.id ? 'border-primary bg-primary/5' : ''}" data-booking-id="${b.id}">
                <div class="flex justify-between items-start">
                  <div>
                    <p class="font-body-md text-on-surface font-semibold">${b.vehicle?.make || ''} ${b.vehicle?.model || ''} ${b.vehicle?.licensePlate ? '(' + b.vehicle.licensePlate + ')' : ''}</p>
                    <p class="text-sm text-text-secondary mt-1">${b.scheduledDate ? new Date(b.scheduledDate).toLocaleDateString('ar-SA') : '-'} ${b.scheduledTime || ''}</p>
                    <p class="text-sm text-text-secondary">${b.services?.length || 0} خدمة</p>
                  </div>
                  <span class="material-symbols-outlined text-primary ${this.selectedBookingId === b.id ? '' : 'opacity-0'}">check_circle</span>
                </div>
                <div class="mt-2 flex flex-wrap gap-1">
                  ${(b.services || []).map((s: any) => `<span class="px-2 py-0.5 bg-surface-container rounded text-xs text-text-secondary">${s.name}</span>`).join('')}
                </div>
              </div>
            `).join('')}
          </div>
        `

        content.querySelectorAll('.booking-card').forEach(card => {
          card.addEventListener('click', () => {
            const id = card.getAttribute('data-booking-id')!
            this.selectedBookingId = id
            content.querySelectorAll('.booking-card').forEach(c => {
              c.classList.remove('border-primary', 'bg-primary/5')
              c.querySelector('.material-symbols-outlined')?.classList.add('opacity-0')
            })
            card.classList.add('border-primary', 'bg-primary/5')
            card.querySelector('.material-symbols-outlined')?.classList.remove('opacity-0')

            const nextBtn = el.querySelector('#step2-next') as HTMLButtonElement
            if (nextBtn) nextBtn.disabled = false

            const booking = bookings.find((b: any) => b.id === id)
            if (booking && booking.services) {
              this.invoiceItems = booking.services.map((s: any) => {
                const fullService = this.servicesList.find((svc: any) => svc.id === s.id)
                return {
                  serviceId: s.id,
                  description: s.name,
                  quantity: 1,
                  priceSYP: fullService?.priceSYP || s.basePrice || 0,
                  priceUSD: fullService?.priceUSD || null,
                }
              })
            }
          })
        })
      } else {
        content.innerHTML = '<p class="text-error text-center py-8">لا يوجد حجوزات لهذا العميل</p>'
      }
    } catch {
      content.innerHTML = '<p class="text-error text-center py-8">حدث خطأ في تحميل الحجوزات</p>'
    }
  }

  private renderManualServices(el: HTMLElement) {
    const content = el.querySelector('#step2-content')!
    content.innerHTML = `
      <div class="space-y-4">
        <div class="flex gap-2">
          <select class="flex-1 h-[48px] bg-surface-subtle border border-border rounded-lg pr-4 pl-10 font-ibmPlexSans font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow appearance-none" style="background-image: url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2716%27 height=%2716%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%23475569%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Cpath d=%27M6 9l6 6 6-6%27/%3E%3C/svg%3E'); background-repeat: no-repeat; background-position: left 0.75rem center; background-size: 1rem;" id="service-select">
            <option value="">اختر خدمة...</option>
            ${this.servicesList.map((s: any) => `<option value="${s.id}" data-price="${s.basePrice || s.priceSYP || 0}" data-price-usd="${s.priceUSD || ''}">${s.name} - ${s.basePrice || s.priceSYP || 0} ل.س</option>`).join('')}
          </select>
          <button class="h-[48px] px-4 bg-primary text-on-primary font-ibmPlexSans font-body-lg rounded-lg shadow-sm hover:shadow-md transition-all flex items-center gap-2" id="add-service-btn">
            <span class="material-symbols-outlined text-[20px]" aria-hidden="true">add</span>
            إضافة
          </button>
        </div>
        <div id="services-list" class="space-y-2"></div>
      </div>
    `

    // Event delegation on services-list (performance fix)
    const servicesList = el.querySelector('#services-list') as HTMLElement
    if (servicesList) {
      servicesList.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement
        if (target.tagName === 'INPUT' && target.type === 'number') {
          const idx = parseInt(target.getAttribute('data-idx')!)
          const val = parseInt(target.value)
          if (val > 0 && !isNaN(idx)) this.invoiceItems[idx].quantity = val
          this.refreshServicesList(el)
        }
      })
      servicesList.addEventListener('click', (e) => {
        const btn = (e.target as HTMLElement).closest('[data-remove]') as HTMLButtonElement | null
        if (btn) {
          const idx = parseInt(btn.getAttribute('data-remove')!)
          if (!isNaN(idx)) {
            this.invoiceItems.splice(idx, 1)
            this.refreshServicesList(el)
          }
        }
      })
    }

    this.refreshServicesList(el)

    const addBtn = content.querySelector('#add-service-btn')
    addBtn?.addEventListener('click', () => {
      const select = content.querySelector('#service-select') as HTMLSelectElement
      const option = select.options[select.selectedIndex]
      if (!select.value) return
      const priceSYP = parseFloat(option.getAttribute('data-price') || '0')
      const priceUSD = option.getAttribute('data-price-usd') || null
      this.invoiceItems.push({
        serviceId: select.value,
        description: (option.textContent || '').split(' - ')[0],
        quantity: 1,
        priceSYP,
        priceUSD: priceUSD ? parseFloat(priceUSD) : null,
      })
      select.value = ''
      this.refreshServicesList(el)
    })
  }

  private refreshServicesList(el: HTMLElement) {
    const list = el.querySelector('#services-list')!
    if (this.invoiceItems.length === 0) {
      list.innerHTML = '<p class="text-text-secondary text-center py-4 text-sm">لم يتم إضافة خدمات بعد</p>'
    } else {
      list.innerHTML = this.invoiceItems.map((item, idx) => `
        <div class="flex items-center gap-3 bg-surface-subtle rounded-lg p-3 border border-border">
          <div class="flex-1">
            <p class="font-body-md text-on-surface">${item.description}</p>
            <p class="text-sm text-text-secondary">${item.priceSYP} ل.س × ${item.quantity}</p>
          </div>
          <div class="flex items-center gap-2">
            <input type="number" min="1" value="${item.quantity}" class="w-16 h-[36px] bg-surface-container-lowest border border-border rounded px-2 text-center font-body-md text-on-surface" data-idx="${idx}" />
            <button class="touch-safe w-8 h-8 rounded-lg hover:bg-error/10 text-error flex items-center justify-center transition-colors" aria-label="حذف الخدمة من الفاتورة" data-remove="${idx}">
              <span class="material-symbols-outlined text-[18px]" aria-hidden="true">delete</span>
            </button>
          </div>
        </div>
      `).join('')

    }

    const nextBtn = el.querySelector('#step2-next') as HTMLButtonElement
    if (nextBtn) nextBtn.disabled = this.invoiceItems.length === 0
  }

  private applyDiscount(el: HTMLElement) {
    const typeSelect = el.querySelector('#discount-type') as HTMLSelectElement
    const valueInput = el.querySelector('#discount-value') as HTMLInputElement
    this.discountType = typeSelect.value as 'FIXED' | 'PERCENTAGE'
    this.discountValue = parseFloat(valueInput.value) || 0

    const subtotal = this.invoiceItems.reduce((sum, item) => sum + (item.priceSYP * item.quantity), 0)
    let discount = 0
    if (this.discountType === 'PERCENTAGE' && this.discountValue > 0) {
      discount = Math.round(subtotal * (this.discountValue / 100))
    } else {
      discount = this.discountValue
    }
    if (discount > subtotal) {
      ;(window as any).toast?.show?.({ message: 'الخصم يتجاوز المجموع الفرعي', type: 'warning' })
      this.discountValue = 0
      valueInput.value = '0'
    }

    this.updateSummary(el)
  }

  private updateSummary(el: HTMLElement) {
    const subtotal = this.invoiceItems.reduce((sum, item) => sum + (item.priceSYP * item.quantity), 0)
    let discount = 0
    if (this.discountType === 'PERCENTAGE' && this.discountValue > 0) {
      discount = Math.round(subtotal * (this.discountValue / 100))
    } else {
      discount = this.discountValue
    }
    const total = Math.max(0, subtotal - discount)

    const subtotalEl = el.querySelector('#summary-subtotal')
    const discountEl = el.querySelector('#summary-discount')
    const totalEl = el.querySelector('#summary-total')

    if (subtotalEl) subtotalEl.textContent = `${subtotal.toLocaleString('ar-SA')} ل.س`
    if (discountEl) discountEl.textContent = `${discount.toLocaleString('ar-SA')} ل.س`
    if (totalEl) totalEl.textContent = `${total.toLocaleString('ar-SA')} ل.س`
  }

  private async createInvoice(el: HTMLElement) {
    if (!this.selectedCustomerId) { ;(window as any).toast?.show?.({ message: 'يرجى اختيار عميل', type: 'warning' }); return }
    if (this.invoiceItems.length === 0) { ;(window as any).toast?.show?.({ message: 'يرجى إضافة عناصر للفاتورة', type: 'warning' }); return }

    const subtotal = this.invoiceItems.reduce((sum, item) => sum + (item.priceSYP * item.quantity), 0)
    let discount = 0
    if (this.discountType === 'PERCENTAGE' && this.discountValue > 0) {
      discount = Math.round(subtotal * (this.discountValue / 100))
    } else {
      discount = this.discountValue
    }
    if (discount > subtotal) { ;(window as any).toast?.show?.({ message: 'الخصم يتجاوز المجموع الفرعي', type: 'warning' }); return }

    const btn = el.querySelector('#create-invoice-btn') as HTMLButtonElement
    if (btn) {
      btn.disabled = true
      btn.innerHTML = `<span class="material-symbols-outlined text-[20px] animate-spin" aria-hidden="true">sync</span> جاري الإنشاء...`
    }

    const notes = (el.querySelector('#invoice-notes') as HTMLTextAreaElement)?.value || ''

    const payload: any = {
      customerId: this.selectedCustomerId,
      vehicleId: this.selectedVehicleId || undefined,
      invoiceDate: new Date().toISOString(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      notes,
      items: this.invoiceItems.map(item => ({
        serviceId: item.serviceId,
        description: item.description,
        quantity: item.quantity,
        priceSYP: item.priceSYP,
        priceUSD: item.priceUSD,
      })),
    }

    if (this.type === 'booking' && this.selectedBookingId) {
      payload.bookingId = this.selectedBookingId
    }

    if (this.discountType === 'PERCENTAGE' && this.discountValue > 0) {
      payload.discountType = 'PERCENTAGE'
      payload.discountPercent = this.discountValue
    } else if (this.discountValue > 0) {
      payload.discountType = 'FIXED'
      payload.discountSYP = this.discountValue
    }

    try {
      const res = await this.api.post<any>('/api/invoices', payload)
      if (res.success && res.data) {
        ;(window as any).toast?.show?.({ message: 'تم إنشاء الفاتورة بنجاح', type: 'success' })
        this.router.navigate(`/invoices/${res.data.id}`)
      } else {
        ;(window as any).toast?.show?.({ message: res.message || 'فشل إنشاء الفاتورة', type: 'error' })
        if (btn) {
          btn.disabled = false
          btn.innerHTML = `<span class="material-symbols-outlined text-[20px]" aria-hidden="true">receipt_long</span> إنشاء الفاتورة`
        }
      }
    } catch (err: any) {
      ;(window as any).toast?.show?.({ message: 'حدث خطأ: ' + (err.message || 'فشل الاتصال'), type: 'error' })
      if (btn) {
        btn.disabled = false
        btn.innerHTML = `<span class="material-symbols-outlined text-[20px]" aria-hidden="true">receipt_long</span> إنشاء الفاتورة`
      }
    }
  }
}
