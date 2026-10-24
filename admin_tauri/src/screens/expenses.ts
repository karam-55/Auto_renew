import { AuthService } from '../services/auth'
import { ApiClient } from '../api/client'
import { Router } from '../router'
import { AppLayout } from '../components/layout'
import { fmtUsd } from '../utils/currency'

function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]!)
}

const CATEGORIES: { value: string; label: string; hint?: string }[] = [
  { value: 'JOB_PURCHASE', label: 'مشتريات مهمة (قطع/مواد لزبون)', hint: 'تكلفة قطع اشتريتها لمهمة معينة — تُحسب ضمن تكلفة الزبون' },
  { value: 'SUPPLIES', label: 'محارم ومستلزمات', hint: 'مستلزمات مكتبية وتشغيلية' },
  { value: 'BUFFET', label: 'بوفيه', hint: 'مشروبات وطعام للفريق' },
  { value: 'UTILITIES', label: 'كهرباء وماء' },
  { value: 'INTERNET', label: 'إنترنت واتصالات' },
  { value: 'RENT', label: 'إيجار' },
  { value: 'MAINTENANCE', label: 'صيانة معدات وأجهزة' },
  { value: 'EQUIPMENT', label: 'شراء معدات/آلة جديدة', hint: 'يُسجَّل كأصل ثابت (1230) وليس مصروفاً' },
  { value: 'TRANSPORTATION', label: 'نقل ووقود' },
  { value: 'MARKETING', label: 'تسويق وإعلان' },
  { value: 'SALARIES', label: 'رواتب' },
  { value: 'OTHER', label: 'أخرى' },
]

export class ExpensesScreen {
  private bookingsMap = new Map<string, string>()
  private bookingServicesMap = new Map<string, any[]>()
  private costCenters: any[] = []
  private costCentersMap = new Map<string, string>()

  constructor(private auth: AuthService, private api: ApiClient, private router: Router) {}

  private canDelete(): boolean {
    const role = (this.auth.getUser()?.role || '').toUpperCase()
    return ['ADMIN', 'OWNER', 'MANAGER', 'ACCOUNTANT'].includes(role)
  }

  private bookingLabel(b: any): string {
    const name = b.customer?.fullName || 'زبون'
    const vehicle = [b.vehicle?.make, b.vehicle?.model].filter(Boolean).join(' ')
    const plate = b.vehicle?.licensePlate ? ` (${b.vehicle.licensePlate})` : ''
    const date = (b.scheduledDate || '').split('T')[0]
    return `${name} — ${vehicle}${plate}${date ? ' — ' + date : ''}`
  }

  private async uploadAttachment(file: File): Promise<string> {
    if (file.size > 7 * 1024 * 1024) throw new Error('حجم الفاتورة يجب ألا يتجاوز 7 ميغابايت')
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result || ''))
      reader.onerror = () => reject(new Error('تعذر قراءة ملف الفاتورة'))
      reader.readAsDataURL(file)
    })
    const response = await this.api.post<any>('/api/expenses/upload-attachment', {
      fileName: file.name,
      dataUrl,
    })
    if (response.success === false || !response.data?.url) {
      throw new Error(response.message || 'تعذر رفع ملف الفاتورة')
    }
    return response.data.url
  }

  render(): HTMLElement {
    const layout = new AppLayout(this.auth, this.router, 'المصاريف', 'payments', this.api)
    const content = document.createElement('div')
    content.className = 'page-enter max-w-[1200px] mx-auto'
    content.innerHTML = `
      <div class="space-y-stack-lg">
        <div class="flex items-center justify-between page-enter">
          <div>
            <h1 class="font-beVietnamPro text-headline-md text-on-surface">المصاريف</h1>
            <p class="text-body-md text-on-surface-variant mt-1">تسجيل المصاريف العامة ومشتريات المهمات — يُنشأ قيد محاسبي تلقائياً</p>
          </div>
          <button class="h-12 btn-primary-gradient text-white font-body-md rounded-xl shadow-lg shadow-primary/25 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 px-6" id="new-expense-btn">
            <span class="material-symbols-outlined text-[20px]">add</span>
            مصروف جديد
          </button>
        </div>

        <div class="glass-card rounded-2xl p-card-padding stagger-entry stagger-entry-1">
          <div class="flex flex-col sm:flex-row gap-4 items-center mb-4">
            <select id="category-filter" class="h-12 bg-white/50 border border-glass-border rounded-xl pr-4 pl-10 font-body-md text-on-surface input-glow transition-all w-full sm:w-64 appearance-none cursor-pointer">
              <option value="">كل التصنيفات</option>
            </select>
            <input type="date" id="date-from" class="h-12 bg-white/50 border border-glass-border rounded-xl px-4 font-body-md text-on-surface input-glow transition-all" title="من تاريخ"/>
            <input type="date" id="date-to" class="h-12 bg-white/50 border border-glass-border rounded-xl px-4 font-body-md text-on-surface input-glow transition-all" title="إلى تاريخ"/>
            <button class="h-12 px-6 glass-card text-on-surface font-body-md rounded-xl border border-glass-border hover:bg-white/80 transition-all" id="filter-btn">تصفية</button>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-right">
              <thead>
                <tr class="border-b border-glass-border">
                  <th class="px-4 py-3 font-label-lg text-on-surface-variant">التاريخ</th>
                  <th class="px-4 py-3 font-label-lg text-on-surface-variant">التصنيف</th>
                  <th class="px-4 py-3 font-label-lg text-on-surface-variant">الوصف</th>
                  <th class="px-4 py-3 font-label-lg text-on-surface-variant">المبلغ</th>
                  <th class="px-4 py-3 font-label-lg text-on-surface-variant">الدفع</th>
                  <th class="px-4 py-3 font-label-lg text-on-surface-variant">الحجز</th>
                  <th class="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody id="expenses-tbody">
                <tr><td colspan="7" class="px-4 py-8 text-center text-on-surface-variant font-body-md">جاري التحميل...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div id="expense-modal" role="dialog" aria-modal="true" aria-labelledby="expense-modal-title" class="fixed inset-0 bg-black/55 backdrop-blur-sm z-[100] hidden items-start sm:items-center justify-center p-3 sm:p-6 overflow-y-auto overscroll-contain">
        <section class="glass-card rounded-2xl w-full max-w-5xl max-h-[calc(100vh-1.5rem)] overflow-y-auto m-auto shadow-2xl border border-glass-border">
          <header class="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-glass-border bg-white/95 p-5 sm:p-6 backdrop-blur">
            <div>
              <h2 id="expense-modal-title" class="font-headline-md text-xl text-on-surface font-semibold">تسجيل مصروف جديد</h2>
              <p class="mt-1 text-sm text-on-surface-variant">أدخل بيانات المصروف وطريقة تسديده وربطه المحاسبي.</p>
            </div>
            <button type="button" id="exp-close" class="min-h-[44px] min-w-[44px] rounded-xl border border-glass-border text-on-surface-variant hover:bg-white" aria-label="إغلاق نافذة المصروف">
              <span class="material-symbols-outlined" aria-hidden="true">close</span>
            </button>
          </header>
          <div class="p-5 sm:p-6">
          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
            <div>
              <label class="block font-label-sm text-label-sm text-on-surface-variant mb-2">التصنيف</label>
              <select id="exp-category" class="w-full h-12 bg-white/50 border border-glass-border rounded-xl px-4 font-body-md text-on-surface input-glow transition-all">
                <option value="JOB_PURCHASE">مشتريات مهمة (قطع/مواد لزبون)</option>
                <option value="SUPPLIES">محارم ومستلزمات</option>
                <option value="BUFFET">بوفيه</option>
                <option value="UTILITIES">كهرباء وماء</option>
                <option value="INTERNET">إنترنت واتصالات</option>
                <option value="RENT">إيجار</option>
                <option value="MAINTENANCE">صيانة معدات وأجهزة</option>
                <option value="EQUIPMENT">شراء معدات/آلة جديدة (أصل)</option>
                <option value="TRANSPORTATION">نقل ووقود</option>
                <option value="MARKETING">تسويق وإعلان</option>
                <option value="SALARIES">رواتب</option>
                <option value="OTHER">أخرى</option>
              </select>
              <p id="category-hint" class="text-label-sm text-on-surface-variant mt-1 hidden"></p>
            </div>
            <div>
              <label class="block font-label-sm text-label-sm text-on-surface-variant mb-2">الوصف</label>
              <input type="text" id="exp-description" class="w-full h-12 bg-white/50 border border-glass-border rounded-xl px-4 font-body-md text-on-surface input-glow transition-all" placeholder="مثال: فاتورة كهرباء شهر أكتوبر"/>
            </div>
            <div>
              <label class="block font-label-sm text-label-sm text-on-surface-variant mb-2">المبلغ</label>
              <input type="number" step="0.01" min="0" id="exp-amount" class="w-full h-12 bg-white/50 border border-glass-border rounded-xl px-4 font-body-md text-on-surface input-glow transition-all" placeholder="0.00"/>
            </div>
            <div>
              <label class="block font-label-sm text-label-sm text-on-surface-variant mb-2">العملة المدفوعة</label>
              <select id="exp-currency" class="w-full h-12 bg-white/50 border border-glass-border rounded-xl px-4 font-body-md text-on-surface input-glow transition-all">
                <option value="SYP">ليرة سورية (ل.س)</option>
                <option value="USD">دولار ($)</option>
              </select>
            </div>
            <div>
              <label class="block font-label-sm text-label-sm text-on-surface-variant mb-2">طريقة الدفع</label>
              <select id="exp-payment" class="w-full h-12 bg-white/50 border border-glass-border rounded-xl px-4 font-body-md text-on-surface input-glow transition-all">
                <option value="CASH">كاش</option>
                <option value="BANK">بنك / تحويل</option>
                <option value="PAYABLE">على حساب المورد</option>
              </select>
            </div>
            <div id="exp-due-date-field" class="hidden">
              <label class="block font-label-sm text-label-sm text-on-surface-variant mb-2">تاريخ استحقاق المورد</label>
              <input type="date" id="exp-due-date" class="w-full h-12 bg-white/50 border border-glass-border rounded-xl px-4 font-body-md text-on-surface input-glow transition-all"/>
            </div>
            <div>
              <label class="block font-label-sm text-label-sm text-on-surface-variant mb-2">التاريخ</label>
              <input type="date" id="exp-date" class="w-full h-12 bg-white/50 border border-glass-border rounded-xl px-4 font-body-md text-on-surface input-glow transition-all"/>
            </div>
            <div id="booking-field" class="hidden md:col-span-2 xl:col-span-3">
              <label class="block font-label-sm text-label-sm text-on-surface-variant mb-2">الحجز (اختياري — يربط التكلفة بمهمة الزبون)</label>
              <select id="exp-booking" class="w-full h-12 bg-white/50 border border-glass-border rounded-xl px-4 font-body-md text-on-surface input-glow transition-all">
                <option value="">بدون ربط بحجز</option>
              </select>
            </div>
            <div id="job-service-field" class="hidden md:col-span-2 xl:col-span-3">
              <label class="block font-label-sm text-label-sm text-on-surface-variant mb-2">خدمة أمر الشغل (اختياري)</label>
              <select id="exp-booking-service" class="w-full h-12 bg-white/50 border border-glass-border rounded-xl px-4 font-body-md text-on-surface input-glow transition-all">
                <option value="">تكلفة عامة على أمر الشغل</option>
              </select>
            </div>
            <div id="job-purchase-details" class="hidden md:col-span-2 xl:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl border border-secondary/20 bg-secondary/5 p-4">
              <label class="text-sm text-text-secondary">الكمية الفعلية
                <input id="exp-quantity" type="number" min="0.001" step="0.001" class="block mt-1 w-full h-11 rounded-lg border border-border bg-white/70 px-3 text-on-surface" placeholder="مثال: 3.5" />
              </label>
              <label class="text-sm text-text-secondary">المورد (اختياري إذا دُفع نقداً)
                <select id="exp-supplier" class="block mt-1 w-full h-11 rounded-lg border border-border bg-white/70 px-3 text-on-surface">
                  <option value="">بدون مورد محدد</option>
                </select>
              </label>
              <label class="sm:col-span-2 text-sm text-text-secondary">صورة فاتورة المورد أو ملف PDF (مطلوب للمشتريات المباشرة)
                <input id="exp-attachment" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" class="block mt-1 w-full rounded-lg border border-border bg-white/70 p-2 text-on-surface" />
              </label>
            </div>
            <div class="md:col-span-2 xl:col-span-3">
              <label class="block font-label-sm text-label-sm text-on-surface-variant mb-2">مركز التحليل (اختياري)</label>
              <select id="exp-cost-center" class="w-full h-12 bg-white/50 border border-glass-border rounded-xl px-4 font-body-md text-on-surface input-glow transition-all">
                <option value="">بدون مركز محدد</option>
              </select>
            </div>
            <div class="md:col-span-2 xl:col-span-3">
              <label class="block font-label-sm text-label-sm text-on-surface-variant mb-2">ملاحظات / مرجع</label>
              <input type="text" id="exp-notes" class="w-full h-12 bg-white/50 border border-glass-border rounded-xl px-4 font-body-md text-on-surface input-glow transition-all" placeholder="اختياري"/>
            </div>
            <div class="flex flex-col-reverse gap-3 sm:flex-row md:col-span-2 xl:col-span-3 sm:justify-end">
              <button id="exp-save" class="flex-1 h-12 btn-primary-gradient text-white font-body-md rounded-xl shadow-lg shadow-primary/25 hover:scale-105 active:scale-95 transition-all">حفظ</button>
              <button id="exp-cancel" type="button" class="min-h-[48px] px-6 glass-card text-on-surface font-body-md rounded-xl border border-glass-border hover:bg-white/80 transition-all">إلغاء</button>
            </div>
          </div>
          </div>
        </section>
      </div>
    `

    const modal = content.querySelector('#expense-modal') as HTMLElement
    modal.tabIndex = -1
    const catSelect = modal.querySelector('#exp-category') as HTMLSelectElement
    const catHint = modal.querySelector('#category-hint') as HTMLElement
    const bookingField = modal.querySelector('#booking-field') as HTMLElement
    const jobServiceField = modal.querySelector('#job-service-field') as HTMLElement
    const jobPurchaseDetails = modal.querySelector('#job-purchase-details') as HTMLElement
    const paymentSelect = modal.querySelector('#exp-payment') as HTMLSelectElement
    const dueDateField = modal.querySelector('#exp-due-date-field') as HTMLElement
    const bookingServiceSelect = modal.querySelector('#exp-booking-service') as HTMLSelectElement
    const bookingSelect = modal.querySelector('#exp-booking') as HTMLSelectElement
    const filterSelect = content.querySelector('#category-filter') as HTMLSelectElement
    const dateInput = modal.querySelector('#exp-date') as HTMLInputElement
    dateInput.value = new Date().toISOString().split('T')[0]

    const hints: Record<string, string> = {
      JOB_PURCHASE: 'قطع/مواد اشتريتها لمهمة زبون — تُسجَّل كتكلفة مبيعات ويمكن ربطها بالحجز',
      EQUIPMENT: 'يُسجَّل كأصل ثابت (حساب 1230) وليس مصروفاً تشغيلياً',
    }
    let bookingsLoaded = false
    const populateBookingServices = (bookingId: string) => {
      const services = this.bookingServicesMap.get(bookingId) || []
      bookingServiceSelect.replaceChildren(new Option('تكلفة عامة على أمر الشغل', ''))
      services.filter((service: any) => service.bookingServiceId).forEach((service: any) => {
        bookingServiceSelect.add(new Option(service.name || 'خدمة', service.bookingServiceId))
      })
      jobServiceField.classList.toggle('hidden', catSelect.value !== 'JOB_PURCHASE' || !bookingId)
    }
    const loadBookingsForSelect = async () => {
      if (bookingsLoaded) return
      bookingsLoaded = true
      try {
        const res = await this.api.get<any>('/api/bookings?pageSize=0')
        const rows: any[] = Array.isArray(res.data) ? res.data : (res.data?.data || res.data?.bookings || [])
        const active = rows
          .filter((b: any) => b.status !== 'CANCELLED')
          .sort((a: any, b: any) => String(b.scheduledDate || '').localeCompare(String(a.scheduledDate || '')))
        active.forEach((b: any) => this.bookingsMap.set(b.id, this.bookingLabel(b)))
        active.forEach((b: any) => this.bookingServicesMap.set(b.id, b.services || []))
        active.forEach((b: any) => {
          const o = document.createElement('option')
          o.value = b.id
          o.textContent = this.bookingLabel(b)
          bookingSelect.appendChild(o)
        })
        populateBookingServices(bookingSelect.value)
      } catch { /* القائمة تبقى فارغة — الربط اختياري */ }
    }

    bookingSelect.addEventListener('change', () => populateBookingServices(bookingSelect.value))

    const updateCategoryUI = () => {
      const v = catSelect.value
      catHint.textContent = hints[v] || ''
      catHint.classList.toggle('hidden', !hints[v])
      bookingField.classList.toggle('hidden', v !== 'JOB_PURCHASE')
      jobPurchaseDetails.classList.toggle('hidden', v !== 'JOB_PURCHASE')
      if (v === 'JOB_PURCHASE') {
        loadBookingsForSelect()
        populateBookingServices(bookingSelect.value)
      } else {
        jobServiceField.classList.add('hidden')
      }
    }
    const updatePaymentUI = () => {
      dueDateField.classList.toggle('hidden', paymentSelect.value !== 'PAYABLE')
    }
    catSelect.addEventListener('change', updateCategoryUI)
    paymentSelect.addEventListener('change', updatePaymentUI)
    updateCategoryUI()
    updatePaymentUI()
    const resetExpenseForm = () => {
      catSelect.value = 'JOB_PURCHASE'
      ;(modal.querySelector('#exp-description') as HTMLInputElement).value = ''
      ;(modal.querySelector('#exp-amount') as HTMLInputElement).value = ''
      ;(modal.querySelector('#exp-currency') as HTMLSelectElement).value = 'SYP'
      paymentSelect.value = 'CASH'
      ;(modal.querySelector('#exp-due-date') as HTMLInputElement).value = ''
      dateInput.value = new Date().toISOString().split('T')[0]
      ;(modal.querySelector('#exp-notes') as HTMLInputElement).value = ''
      bookingSelect.value = ''
      bookingServiceSelect.replaceChildren(new Option('تكلفة عامة على أمر الشغل', ''))
      ;(modal.querySelector('#exp-cost-center') as HTMLSelectElement).value = ''
      ;(modal.querySelector('#exp-quantity') as HTMLInputElement).value = ''
      ;(modal.querySelector('#exp-supplier') as HTMLSelectElement).value = ''
      ;(modal.querySelector('#exp-attachment') as HTMLInputElement).value = ''
      updateCategoryUI()
      updatePaymentUI()
    }
    const closeExpenseModal = () => {
      modal.classList.add('hidden')
      modal.classList.remove('flex')
      resetExpenseForm()
    }

    CATEGORIES.forEach(c => {
      const o = document.createElement('option')
      o.value = c.value
      o.textContent = c.label
      filterSelect.appendChild(o)
    })
    const costCenterSelect = modal.querySelector('#exp-cost-center') as HTMLSelectElement
    this.api.get<any>('/api/cost-centers', false).then((res) => {
      const centers: any[] = Array.isArray(res.data) ? res.data : (res.data?.data || [])
      this.costCenters = centers.filter((center: any) => center.isActive)
      this.costCentersMap = new Map(this.costCenters.map((center: any) => [
        center.id,
        `${center.code ? center.code + ' — ' : ''}${center.nameAr || center.name}`,
      ]))
      costCenterSelect.replaceChildren(new Option('بدون مركز محدد', ''))
      this.costCenters.forEach((center: any) => {
        costCenterSelect.add(new Option(
          `${center.code ? center.code + ' — ' : ''}${center.nameAr || center.name}`,
          center.id,
        ))
      })
    }).catch(() => {})
    const supplierSelect = modal.querySelector('#exp-supplier') as HTMLSelectElement
    this.api.get<any>('/api/suppliers?limit=100', false).then((res) => {
      const suppliers: any[] = Array.isArray(res.data) ? res.data : (res.data?.data || res.data?.suppliers || [])
      supplierSelect.replaceChildren(new Option('بدون مورد محدد', ''))
      suppliers.filter((supplier: any) => supplier.isActive !== false).forEach((supplier: any) => {
        supplierSelect.add(new Option(supplier.name || 'مورد', supplier.id))
      })
    }).catch(() => {})

    content.querySelector('#new-expense-btn')?.addEventListener('click', () => {
      resetExpenseForm()
      modal.classList.remove('hidden'); modal.classList.add('flex')
      modal.focus()
    })
    modal.querySelector('#exp-cancel')?.addEventListener('click', closeExpenseModal)
    modal.querySelector('#exp-close')?.addEventListener('click', closeExpenseModal)
    modal.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeExpenseModal()
    })
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeExpenseModal()
    })

    modal.querySelector('#exp-save')?.addEventListener('click', async () => {
      const amount = parseFloat((modal.querySelector('#exp-amount') as HTMLInputElement).value)
      const currency = (modal.querySelector('#exp-currency') as HTMLSelectElement).value
      if (!amount || amount <= 0) {
        ;(window as any).toast?.show?.({ message: 'أدخل مبلغاً صحيحاً', type: 'warning' }); return
      }
      const desc = (modal.querySelector('#exp-description') as HTMLInputElement).value.trim()
      if (!desc) {
        ;(window as any).toast?.show?.({ message: 'أدخل وصفاً', type: 'warning' }); return
      }
      const payload: any = {
        category: catSelect.value,
        description: desc,
        expenseDate: dateInput.value,
        paymentMethod: paymentSelect.value,
        notes: (modal.querySelector('#exp-notes') as HTMLInputElement).value || undefined,
        isRecurring: false,
      }
      const paymentMethod = paymentSelect.value
      const dueDate = (modal.querySelector('#exp-due-date') as HTMLInputElement).value
      if (paymentMethod === 'PAYABLE') {
        if (!dueDate) {
          ;(window as any).toast?.show?.({ message: 'أدخل تاريخ استحقاق المورد', type: 'warning' }); return
        }
        payload.dueDate = dueDate
      }
      const bid = bookingSelect.value
      const isJobPurchase = catSelect.value === 'JOB_PURCHASE'
      const quantity = parseFloat((modal.querySelector('#exp-quantity') as HTMLInputElement).value)
      const supplierId = supplierSelect.value
      const attachment = (modal.querySelector('#exp-attachment') as HTMLInputElement).files?.[0]
      if (isJobPurchase) {
        if (!bid) {
          ;(window as any).toast?.show?.({ message: 'اربط المشتريات المباشرة بأمر شغل', type: 'warning' }); return
        }
        if (!Number.isFinite(quantity) || quantity <= 0) {
          ;(window as any).toast?.show?.({ message: 'أدخل الكمية الفعلية المشتراة', type: 'warning' }); return
        }
        if (!attachment) {
          ;(window as any).toast?.show?.({ message: 'أرفق صورة فاتورة المورد أو ملف PDF', type: 'warning' }); return
        }
        if (paymentSelect.value === 'PAYABLE' && !supplierId) {
          ;(window as any).toast?.show?.({ message: 'اختر المورد لتسجيل الالتزام', type: 'warning' }); return
        }
        payload.quantity = quantity
        if (supplierId) payload.supplierId = supplierId
      }
      if (currency === 'USD') payload.amountUSD = amount; else payload.amountSYP = amount
      if (bid) payload.bookingId = bid
      const bookingServiceId = bookingServiceSelect.value
      const bookingService = (this.bookingServicesMap.get(bid) || [])
        .find((service: any) => service.bookingServiceId === bookingServiceId)
      if (bookingServiceId && bookingService) {
        payload.bookingServiceId = bookingServiceId
        payload.serviceId = bookingService.id
      }
      const costCenterId = costCenterSelect.value
      if (costCenterId) payload.costCenterId = costCenterId

      const saveButton = modal.querySelector('#exp-save') as HTMLButtonElement
      saveButton.disabled = true
      try {
        if (isJobPurchase && attachment) {
          payload.attachmentUrl = await this.uploadAttachment(attachment)
        }
        const res = await this.api.post<any>('/api/expenses', payload)
        if (res.success === false && res.message) throw new Error(res.message)
        ;(window as any).toast?.show?.({ message: 'تم تسجيل المصروف وقيده المحاسبي', type: 'success' })
        closeExpenseModal()
        this.api.clearCache()
        this.loadExpenses(content)
      } catch (err: any) {
        ;(window as any).toast?.show?.({ message: 'فشل الحفظ: ' + (err.message || ''), type: 'error' })
      } finally {
        saveButton.disabled = false
      }
    })

    content.querySelector('#filter-btn')?.addEventListener('click', () => this.loadExpenses(content))

    loadBookingsForSelect().finally(() => this.loadExpenses(content))
    const page = layout.render(content)
    page.appendChild(modal)
    return page
  }

  private async loadExpenses(el: HTMLElement) {
    const tbody = el.querySelector('#expenses-tbody')!
    const cat = (el.querySelector('#category-filter') as HTMLSelectElement)?.value
    const from = (el.querySelector('#date-from') as HTMLInputElement)?.value
    const to = (el.querySelector('#date-to') as HTMLInputElement)?.value
    let url = '/api/expenses?limit=200'
    if (cat) url += `&category=${encodeURIComponent(cat)}`
    if (from && to) url += `&startDate=${from}&endDate=${to}T23:59:59Z`
    try {
      const res = await this.api.get<any>(url)
      const rows: any[] = res.data || []
      if (rows.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="px-4 py-8 text-center text-on-surface-variant font-body-md">لا توجد مصاريف مسجلة</td></tr>'
        return
      }
      const catLabel = (v: string) => CATEGORIES.find(c => c.value === v)?.label || v
      tbody.innerHTML = rows.map((e: any) => `
        <tr class="border-b border-glass-border/50 hover:bg-white/40 transition-colors">
          <td class="px-4 py-3 font-body-md text-on-surface-variant">${(e.expenseDate || '').split('T')[0]}</td>
          <td class="px-4 py-3 font-body-md text-on-surface">${catLabel(e.category)}</td>
          <td class="px-4 py-3 font-body-md text-on-surface">
            <div>${escapeHtml(e.description)}</div>
            ${e.quantity != null ? `<div class="mt-1 text-xs text-text-tertiary">${Number(e.quantity).toLocaleString('en-US')} ${e.supplier?.name ? ` · ${escapeHtml(e.supplier.name)}` : ''}${e.attachmentUrl ? ` · <a href="${escapeHtml(e.attachmentUrl)}" target="_blank" rel="noopener noreferrer" class="text-primary underline">فاتورة</a>` : ''}</div>` : ''}
          </td>
          <td class="px-4 py-3 font-body-md text-financial-data">${Number(e.amountSYP).toLocaleString('ar-SA')} ل.س${e.amountUSD ? ` · $${fmtUsd(Number(e.amountUSD))}` : ''}</td>
          <td class="px-4 py-3 font-body-md text-on-surface-variant">${e.paymentMethod === 'PAYABLE' ? 'على حساب المورد' : e.paymentMethod === 'CASH' ? 'كاش' : 'بنك'}</td>
          <td class="px-4 py-3 font-body-md text-on-surface-variant">
            ${e.bookingId ? `${escapeHtml(this.bookingsMap.get(e.bookingId) || e.bookingId.slice(0, 8))}${e.serviceId ? ` · ${escapeHtml((this.bookingServicesMap.get(e.bookingId) || []).find((s: any) => s.id === e.serviceId)?.name || 'خدمة')}` : ''}` : e.costCenterId ? escapeHtml(this.costCentersMap.get(e.costCenterId) || 'مركز تحليل') : '—'}
          </td>
          <td class="px-4 py-3">
            ${this.canDelete() ? `
            <button class="del-exp text-error hover:text-error/80 transition-colors" data-id="${e.id}" title="حذف (يعكس القيد)">
              <span class="material-symbols-outlined text-[18px]">delete</span>
            </button>` : ''}
          </td>
        </tr>
      `).join('')
      tbody.querySelectorAll('.del-exp').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.getAttribute('data-id')!
          if (!confirm('حذف هذا المصروف؟ سيُعكَس قيده المحاسبي.')) return
          try {
            await this.api.delete<any>(`/api/expenses/${id}`)
            ;(window as any).toast?.show?.({ message: 'حُذف المصروف وعُكس قيده', type: 'success' })
            this.loadExpenses(el)
          } catch (err: any) {
            ;(window as any).toast?.show?.({ message: 'فشل الحذف: ' + (err.message || ''), type: 'error' })
          }
        })
      })
    } catch {
      tbody.innerHTML = '<tr><td colspan="7" class="px-4 py-8 text-center text-error font-body-md">حدث خطأ في التحميل</td></tr>'
    }
  }
}
