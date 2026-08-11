import { AuthService } from '../services/auth'
import { ApiClient } from '../api/client'
import { Router } from '../router'
import { AppLayout } from '../components/layout'

interface Warranty {
  id: string
  customerName: string
  customerPhone: string
  manufacturer: string
  vehicleModel: string
  vehicleYear: number
  chassisNumber: string
  plateNumber: string
  mileage: number
  color: string
  durationMonths: number
  amountPaid: number
  currency: string
  startDate: string
  endDate: string
  pdfUrl?: string
}

export class DealerDetailScreen {
  private warranties: Warranty[] = []

  constructor(
    private auth: AuthService,
    private api: ApiClient,
    private router: Router,
    private dealerId: string
  ) {}

  render(): HTMLElement {
    const layout = new AppLayout(this.auth, this.router, 'تفاصيل الوكيل', 'business_center', this.api)
    const c = document.createElement('div')
    c.className = 'page-enter min-h-screen bg-background p-gutter'
    c.innerHTML = `
      <div class="max-w-4xl mx-auto space-y-stack-lg">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="font-beVietnamPro text-headline-md text-on-surface">تفاصيل الوكيل</h1>
            <p class="text-body-md text-text-secondary mt-1">بيانات الوكيل والكفالات المسجلة</p>
          </div>
          <button class="h-[48px] px-4 bg-surface-subtle text-on-surface font-ibmPlexSans font-body-lg rounded-lg border border-border hover:bg-surface-container-low transition-colors flex items-center gap-2" id="back-btn">
            <span class="material-symbols-outlined text-[20px]">arrow_forward</span>
            رجوع
          </button>
        </div>

        <div id="dealer-card" class="bg-surface-container-lowest rounded-xl shadow-md border border-surface-subtle overflow-hidden">
          <div class="p-6 border-b border-outline-variant/10 bg-surface-subtle flex items-center gap-4">
            <div class="w-14 h-14 rounded-full bg-primary-fixed text-primary flex items-center justify-center">
              <span class="material-symbols-outlined text-[28px]">store</span>
            </div>
            <div>
              <h3 class="font-headline-md text-lg text-on-surface font-semibold" id="dealer-name">...</h3>
              <p class="text-text-secondary font-body-md" id="dealer-company">...</p>
            </div>
          </div>
          <div class="p-6 space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><p class="font-label-sm text-text-tertiary mb-1">رقم الهاتف</p><p class="font-body-md text-on-surface font-semibold" dir="ltr" id="dealer-phone">...</p></div>
              <div><p class="font-label-sm text-text-tertiary mb-1">العنوان</p><p class="font-body-md text-on-surface font-semibold" id="dealer-address">...</p></div>
              <div><p class="font-label-sm text-text-tertiary mb-1">الحالة</p><p class="font-body-md text-on-surface font-semibold" id="dealer-status">...</p></div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div class="bg-surface-container-lowest rounded-xl shadow-md border border-surface-subtle p-5">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center"><span class="material-symbols-outlined">people</span></div>
              <div><p class="text-text-tertiary font-label-sm">العملاء</p><p class="text-on-surface font-headline-md font-semibold" id="stat-customers">0</p></div>
            </div>
          </div>
          <div class="bg-surface-container-lowest rounded-xl shadow-md border border-surface-subtle p-5">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-info/10 text-info flex items-center justify-center"><span class="material-symbols-outlined">shield_moon</span></div>
              <div><p class="text-text-tertiary font-label-sm">الكفالات</p><p class="text-on-surface font-headline-md font-semibold" id="stat-warranties">0</p></div>
            </div>
          </div>
          <div class="bg-surface-container-lowest rounded-xl shadow-md border border-surface-subtle p-5">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-success/10 text-success flex items-center justify-center"><span class="material-symbols-outlined">payments</span></div>
              <div><p class="text-text-tertiary font-label-sm">إجمالي المدفوع (ل.س)</p><p class="text-on-surface font-headline-md font-semibold" id="stat-amount-syp">0</p></div>
            </div>
          </div>
          <div class="bg-surface-container-lowest rounded-xl shadow-md border border-surface-subtle p-5">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-accent/10 text-accent flex items-center justify-center"><span class="material-symbols-outlined">attach_money</span></div>
              <div><p class="text-text-tertiary font-label-sm">إجمالي المدفوع ($)</p><p class="text-on-surface font-headline-md font-semibold" id="stat-amount-usd">0</p></div>
            </div>
          </div>
        </div>

        <div class="bg-surface-container-lowest rounded-xl shadow-md border border-surface-subtle p-card-padding">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-headline-md text-lg text-on-surface font-semibold flex items-center gap-2">
              <span class="material-symbols-outlined text-primary">shield_moon</span>
              الكفالات المسجلة
            </h3>
            <button class="h-[40px] px-4 bg-primary text-on-primary font-ibmPlexSans font-body-md rounded-lg hover:bg-primary-hover transition-colors flex items-center gap-2" id="add-warranty-btn">
              <span class="material-symbols-outlined text-[20px]">add</span>
              كفالة جديدة
            </button>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="bg-surface-subtle border-b border-outline-variant/10">
                  <th class="px-4 py-3 text-right font-label-sm text-label-sm text-text-tertiary">العميل</th>
                  <th class="px-4 py-3 text-right font-label-sm text-label-sm text-text-tertiary">المركبة</th>
                  <th class="px-4 py-3 text-right font-label-sm text-label-sm text-text-tertiary">اللوحة</th>
                  <th class="px-4 py-3 text-right font-label-sm text-label-sm text-text-tertiary">المدة</th>
                  <th class="px-4 py-3 text-right font-label-sm text-label-sm text-text-tertiary">المبلغ</th>
                  <th class="px-4 py-3 text-right font-label-sm text-label-sm text-text-tertiary">التاريخ</th>
                  <th class="px-4 py-3 text-center font-label-sm text-label-sm text-text-tertiary">إجراءات</th>
                </tr>
              </thead>
              <tbody id="warranties-tbody">
                <tr><td colspan="7" class="px-6 py-8 text-center text-text-secondary"><div class="skeleton-shimmer h-4 rounded w-32 mx-auto"></div></td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="bg-surface-container-lowest rounded-xl shadow-md border border-surface-subtle p-card-padding">
          <h3 class="font-headline-md text-lg text-on-surface font-semibold mb-4 flex items-center gap-2">
            <span class="material-symbols-outlined text-primary">people</span>
            العملاء المسجلين
          </h3>
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="bg-surface-subtle border-b border-outline-variant/10">
                  <th class="px-4 py-3 text-right font-label-sm text-label-sm text-text-tertiary">الاسم</th>
                  <th class="px-4 py-3 text-right font-label-sm text-label-sm text-text-tertiary">الهاتف</th>
                  <th class="px-4 py-3 text-right font-label-sm text-label-sm text-text-tertiary">عدد الكفالات</th>
                  <th class="px-4 py-3 text-right font-label-sm text-label-sm text-text-tertiary">آخر كفالة</th>
                </tr>
              </thead>
              <tbody id="customers-tbody">
                <tr><td colspan="4" class="px-6 py-8 text-center text-text-secondary"><div class="skeleton-shimmer h-4 rounded w-32 mx-auto"></div></td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `
    c.querySelector('#back-btn')?.addEventListener('click', () => this.router.navigate('/dealers'))
    c.querySelector('#add-warranty-btn')?.addEventListener('click', () => this.openWarrantyModal(c, null))
    this.loadData(c)
    return layout.render(c)
  }

  private async loadData(el: HTMLElement) {
    try {
      const [dealerRes, warrantiesRes, statsRes] = await Promise.all([
        this.api.get<any>(`/api/dealers/${this.dealerId}`),
        this.api.get<any>(`/api/dealers/${this.dealerId}/warranties`),
        this.api.get<any>(`/api/dealers/${this.dealerId}/stats`),
      ])

      if (dealerRes.success && dealerRes.data) {
        const d = dealerRes.data
        el.querySelector('#dealer-name')!.textContent = d.name || '-'
        el.querySelector('#dealer-company')!.textContent = d.companyName || '-'
        el.querySelector('#dealer-phone')!.textContent = d.phone || '-'
        el.querySelector('#dealer-address')!.textContent = d.address || '-'
        el.querySelector('#dealer-status')!.textContent = d.status === 'ACTIVE' ? 'نشط' : d.status || '-'
      }

      const warranties: Warranty[] = warrantiesRes.success && Array.isArray(warrantiesRes.data) ? warrantiesRes.data :
                         warrantiesRes.success && warrantiesRes.data?.data ? warrantiesRes.data.data : []
      this.warranties = warranties

      // FIX: Use Number() to ensure numeric addition, not string concatenation
      const totalSYP = warranties.reduce((sum: number, w: any) => sum + ((w.currency || 'SYP') === 'SYP' ? Number(w.amountPaid) || 0 : 0), 0)
      const totalUSD = warranties.reduce((sum: number, w: any) => sum + (w.currency === 'USD' ? Number(w.amountPaid) || 0 : 0), 0)

      // Aggregate customers from warranties
      const customerMap = new Map<string, any>()
      warranties.forEach((w: any) => {
        const key = w.customerPhone || w.customerName
        if (!customerMap.has(key)) {
          customerMap.set(key, { name: w.customerName, phone: w.customerPhone, count: 0, lastDate: w.startDate })
        }
        const c = customerMap.get(key)
        c.count++
        if (new Date(w.startDate) > new Date(c.lastDate)) c.lastDate = w.startDate
      })
      const customers = Array.from(customerMap.values())

      // Use stats endpoint if available, fallback to calculated values
      const stats = statsRes.success && statsRes.data ? statsRes.data : null
      el.querySelector('#stat-customers')!.textContent = String(stats?.totalCustomers ?? customers.length)
      el.querySelector('#stat-warranties')!.textContent = String(stats?.totalWarranties ?? warranties.length)
      el.querySelector('#stat-amount-syp')!.textContent = Number(stats?.totalRevenueSYP ?? totalSYP).toLocaleString('ar-SY') + ' ل.س'
      el.querySelector('#stat-amount-usd')!.textContent = Number(stats?.totalRevenueUSD ?? totalUSD).toLocaleString('en-US') + ' $'

      this.renderWarranties(el, warranties)

      const cTbody = el.querySelector('#customers-tbody')!
      if (customers.length === 0) {
        cTbody.innerHTML = '<tr><td colspan="4" class="px-6 py-8 text-center text-text-secondary font-body-md">لا يوجد عملاء</td></tr>'
      } else {
        cTbody.innerHTML = customers.map((c: any) => `
          <tr class="border-b border-outline-variant/10 hover:bg-surface-container-low/50 transition-colors">
            <td class="px-4 py-3 font-body-md text-on-surface">${c.name || '-'}</td>
            <td class="px-4 py-3 font-body-md text-on-surface" dir="ltr">${c.phone || '-'}</td>
            <td class="px-4 py-3 font-body-md text-on-surface text-center">${c.count}</td>
            <td class="px-4 py-3 font-body-md text-text-secondary">${c.lastDate ? new Date(c.lastDate).toLocaleDateString('ar-SY') : '-'}</td>
          </tr>
        `).join('')
      }
    } catch {
      el.querySelector('#warranties-tbody')!.innerHTML = '<tr><td colspan="7" class="px-6 py-8 text-center text-error font-body-md">حدث خطأ في تحميل البيانات</td></tr>'
      el.querySelector('#customers-tbody')!.innerHTML = '<tr><td colspan="4" class="px-6 py-8 text-center text-error font-body-md">حدث خطأ في تحميل البيانات</td></tr>'
    }
  }

  private renderWarranties(el: HTMLElement, warranties: Warranty[]) {
    const wTbody = el.querySelector('#warranties-tbody')!
    if (warranties.length === 0) {
      wTbody.innerHTML = '<tr><td colspan="7" class="px-6 py-8 text-center text-text-secondary font-body-md">لا توجد كفالات</td></tr>'
    } else {
      wTbody.innerHTML = warranties.map((w: Warranty) => `
        <tr class="border-b border-outline-variant/10 hover:bg-surface-container-low/50 transition-colors">
          <td class="px-4 py-3 font-body-md text-on-surface">${w.customerName || '-'}</td>
          <td class="px-4 py-3 font-body-md text-on-surface">${w.manufacturer || ''} ${w.vehicleModel || ''}</td>
          <td class="px-4 py-3 font-body-md text-on-surface" dir="ltr">${w.plateNumber || '-'}</td>
          <td class="px-4 py-3 font-body-md text-on-surface">${w.durationMonths || '-'} شهر</td>
          <td class="px-4 py-3 font-body-md text-on-surface">${(Number(w.amountPaid) || 0).toLocaleString('ar-SY')} ${w.currency === 'USD' ? '$' : 'ل.س'}</td>
          <td class="px-4 py-3 font-body-md text-text-secondary">${w.startDate ? new Date(w.startDate).toLocaleDateString('ar-SY') : '-'}</td>
          <td class="px-4 py-3 text-center">
            <div class="flex items-center justify-center gap-1">
              <button class="w-8 h-8 rounded-lg bg-surface-subtle text-on-surface hover:bg-primary/10 hover:text-primary transition-colors flex items-center justify-center" data-edit-warranty="${w.id}" title="تعديل">
                <span class="material-symbols-outlined text-[18px]">edit</span>
              </button>
              <button class="w-8 h-8 rounded-lg bg-surface-subtle text-on-surface hover:bg-error/10 hover:text-error transition-colors flex items-center justify-center" data-delete-warranty="${w.id}" title="حذف">
                <span class="material-symbols-outlined text-[18px]">delete</span>
              </button>
            </div>
          </td>
        </tr>
      `).join('')

      // Attach event listeners
      el.querySelectorAll('[data-edit-warranty]').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = (btn as HTMLElement).dataset.editWarranty!
          const w = this.warranties.find(x => x.id === id)
          if (w) this.openWarrantyModal(el, w)
        })
      })
      el.querySelectorAll('[data-delete-warranty]').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = (btn as HTMLElement).dataset.deleteWarranty!
          this.confirmDelete(el, id)
        })
      })
    }
  }

  private openWarrantyModal(el: HTMLElement, warranty: Warranty | null) {
    const isEdit = !!warranty
    const w = warranty || {} as any

    // Remove existing modal
    document.getElementById('warranty-modal')?.remove()

    const modal = document.createElement('div')
    modal.id = 'warranty-modal'
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/50'
    modal.innerHTML = `
      <div class="bg-surface-container-lowest rounded-xl shadow-2xl border border-surface-subtle w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
        <div class="flex items-center justify-between p-6 border-b border-outline-variant/10">
          <h3 class="font-headline-md text-lg text-on-surface font-semibold flex items-center gap-2">
            <span class="material-symbols-outlined text-primary">${isEdit ? 'edit' : 'add_circle'}</span>
            ${isEdit ? 'تعديل كفالة' : 'كفالة جديدة'}
          </h3>
          <button class="w-8 h-8 rounded-lg hover:bg-surface-container-low transition-colors flex items-center justify-center" id="modal-close">
            <span class="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        <div class="p-6 space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block font-label-sm text-text-tertiary mb-1">اسم العميل *</label>
              <input type="text" id="w-customerName" value="${w.customerName || ''}" class="w-full h-[44px] px-3 bg-surface-subtle border border-border rounded-lg font-body-md text-on-surface focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label class="block font-label-sm text-text-tertiary mb-1">رقم الهاتف *</label>
              <input type="text" id="w-customerPhone" value="${w.customerPhone || ''}" dir="ltr" class="w-full h-[44px] px-3 bg-surface-subtle border border-border rounded-lg font-body-md text-on-surface focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label class="block font-label-sm text-text-tertiary mb-1">الشركة المصنعة *</label>
              <input type="text" id="w-manufacturer" value="${w.manufacturer || ''}" class="w-full h-[44px] px-3 bg-surface-subtle border border-border rounded-lg font-body-md text-on-surface focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label class="block font-label-sm text-text-tertiary mb-1">موديل المركبة *</label>
              <input type="text" id="w-vehicleModel" value="${w.vehicleModel || ''}" class="w-full h-[44px] px-3 bg-surface-subtle border border-border rounded-lg font-body-md text-on-surface focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label class="block font-label-sm text-text-tertiary mb-1">سنة الصنع *</label>
              <input type="number" id="w-vehicleYear" value="${w.vehicleYear || ''}" class="w-full h-[44px] px-3 bg-surface-subtle border border-border rounded-lg font-body-md text-on-surface focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label class="block font-label-sm text-text-tertiary mb-1">رقم الشاسيه *</label>
              <input type="text" id="w-chassisNumber" value="${w.chassisNumber || ''}" dir="ltr" class="w-full h-[44px] px-3 bg-surface-subtle border border-border rounded-lg font-body-md text-on-surface focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label class="block font-label-sm text-text-tertiary mb-1">رقم اللوحة *</label>
              <input type="text" id="w-plateNumber" value="${w.plateNumber || ''}" dir="ltr" class="w-full h-[44px] px-3 bg-surface-subtle border border-border rounded-lg font-body-md text-on-surface focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label class="block font-label-sm text-text-tertiary mb-1">المسافة (km) *</label>
              <input type="number" id="w-mileage" value="${w.mileage || 0}" class="w-full h-[44px] px-3 bg-surface-subtle border border-border rounded-lg font-body-md text-on-surface focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label class="block font-label-sm text-text-tertiary mb-1">اللون *</label>
              <input type="text" id="w-color" value="${w.color || ''}" class="w-full h-[44px] px-3 bg-surface-subtle border border-border rounded-lg font-body-md text-on-surface focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label class="block font-label-sm text-text-tertiary mb-1">مدة الكفالة (أشهر) *</label>
              <input type="number" id="w-durationMonths" value="${w.durationMonths || 12}" class="w-full h-[44px] px-3 bg-surface-subtle border border-border rounded-lg font-body-md text-on-surface focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label class="block font-label-sm text-text-tertiary mb-1">المبلغ المدفوع *</label>
              <input type="number" id="w-amountPaid" value="${w.amountPaid || 0}" class="w-full h-[44px] px-3 bg-surface-subtle border border-border rounded-lg font-body-md text-on-surface focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label class="block font-label-sm text-text-tertiary mb-1">العملة</label>
              <select id="w-currency" class="w-full h-[44px] px-3 bg-surface-subtle border border-border rounded-lg font-body-md text-on-surface focus:outline-none focus:border-primary">
                <option value="SYP" ${w.currency === 'SYP' || !w.currency ? 'selected' : ''}>ل.س</option>
                <option value="USD" ${w.currency === 'USD' ? 'selected' : ''}>$</option>
              </select>
            </div>
          </div>
          <div id="modal-error" class="hidden p-3 bg-error/10 border border-error/20 rounded-lg text-error font-body-sm"></div>
          <div class="flex items-center justify-end gap-3 pt-2">
            <button class="h-[44px] px-5 bg-surface-subtle text-on-surface font-body-md rounded-lg border border-border hover:bg-surface-container-low transition-colors" id="modal-cancel">إلغاء</button>
            <button class="h-[44px] px-5 bg-primary text-on-primary font-body-md rounded-lg hover:bg-primary-hover transition-colors flex items-center gap-2" id="modal-save">
              <span class="material-symbols-outlined text-[20px]">${isEdit ? 'save' : 'check'}</span>
              ${isEdit ? 'حفظ التعديلات' : 'إضافة الكفالة'}
            </button>
          </div>
        </div>
      </div>
    `
    document.body.appendChild(modal)

    const close = () => modal.remove()
    modal.querySelector('#modal-close')?.addEventListener('click', close)
    modal.querySelector('#modal-cancel')?.addEventListener('click', close)
    modal.addEventListener('click', (e) => { if (e.target === modal) close() })

    modal.querySelector('#modal-save')?.addEventListener('click', async () => {
      const errEl = modal.querySelector('#modal-error')! as HTMLElement
      errEl.classList.add('hidden')

      const data: any = {
        customerName: (modal.querySelector('#w-customerName') as HTMLInputElement).value.trim(),
        customerPhone: (modal.querySelector('#w-customerPhone') as HTMLInputElement).value.trim(),
        manufacturer: (modal.querySelector('#w-manufacturer') as HTMLInputElement).value.trim(),
        vehicleModel: (modal.querySelector('#w-vehicleModel') as HTMLInputElement).value.trim(),
        vehicleYear: parseInt((modal.querySelector('#w-vehicleYear') as HTMLInputElement).value, 10),
        chassisNumber: (modal.querySelector('#w-chassisNumber') as HTMLInputElement).value.trim(),
        plateNumber: (modal.querySelector('#w-plateNumber') as HTMLInputElement).value.trim(),
        mileage: parseInt((modal.querySelector('#w-mileage') as HTMLInputElement).value, 10) || 0,
        color: (modal.querySelector('#w-color') as HTMLInputElement).value.trim(),
        durationMonths: parseInt((modal.querySelector('#w-durationMonths') as HTMLInputElement).value, 10),
        amountPaid: parseFloat((modal.querySelector('#w-amountPaid') as HTMLInputElement).value) || 0,
        currency: (modal.querySelector('#w-currency') as HTMLSelectElement).value,
      }

      // Validate required fields
      const required: [string, string][] = [
        ['customerName', 'اسم العميل'],
        ['customerPhone', 'رقم الهاتف'],
        ['manufacturer', 'الشركة المصنعة'],
        ['vehicleModel', 'موديل المركبة'],
        ['chassisNumber', 'رقم الشاسيه'],
        ['plateNumber', 'رقم اللوحة'],
        ['color', 'اللون'],
      ]
      for (const [field, label] of required) {
        if (!data[field]) {
          errEl.textContent = `الحقل "${label}" مطلوب`
          errEl.classList.remove('hidden')
          return
        }
      }
      if (!Number.isFinite(data.vehicleYear) || data.vehicleYear < 1900 || data.vehicleYear > 2100) {
        errEl.textContent = 'سنة الصنع غير صحيحة'
        errEl.classList.remove('hidden')
        return
      }
      if (!Number.isFinite(data.durationMonths) || data.durationMonths <= 0) {
        errEl.textContent = 'مدة الكفالة يجب أن تكون أكبر من صفر'
        errEl.classList.remove('hidden')
        return
      }
      if (!Number.isFinite(data.mileage) || data.mileage < 0) {
        errEl.textContent = 'المسافة غير صحيحة'
        errEl.classList.remove('hidden')
        return
      }
      if (!Number.isFinite(data.amountPaid) || data.amountPaid < 0) {
        errEl.textContent = 'المبلغ غير صحيح'
        errEl.classList.remove('hidden')
        return
      }

      const saveBtn = modal.querySelector('#modal-save') as HTMLButtonElement
      saveBtn.disabled = true
      saveBtn.innerHTML = '<span class="material-symbols-outlined text-[20px] animate-spin">progress_activity</span> جاري الحفظ...'

      try {
        if (isEdit && warranty) {
          const res = await this.api.put<any>(`/api/dealers/warranties/${warranty.id}`, data)
          if (!res.success) throw new Error(res.message || 'Failed to update')
        } else {
          const res = await this.api.post<any>(`/api/dealers/${this.dealerId}/warranties`, data)
          if (!res.success) throw new Error(res.message || 'Failed to create')
        }
        modal.remove()
        this.loadData(el)
      } catch (err: any) {
        errEl.textContent = err.message || 'حدث خطأ أثناء الحفظ'
        errEl.classList.remove('hidden')
        saveBtn.disabled = false
        saveBtn.innerHTML = `<span class="material-symbols-outlined text-[20px]">${isEdit ? 'save' : 'check'}</span> ${isEdit ? 'حفظ التعديلات' : 'إضافة الكفالة'}`
      }
    })
  }

  private confirmDelete(el: HTMLElement, warrantyId: string) {
    document.getElementById('delete-confirm-modal')?.remove()

    const modal = document.createElement('div')
    modal.id = 'delete-confirm-modal'
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/50'
    modal.innerHTML = `
      <div class="bg-surface-container-lowest rounded-xl shadow-2xl border border-surface-subtle w-full max-w-md m-4">
        <div class="p-6">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-12 h-12 rounded-full bg-error/10 text-error flex items-center justify-center">
              <span class="material-symbols-outlined text-[24px]">warning</span>
            </div>
            <div>
              <h3 class="font-headline-md text-lg text-on-surface font-semibold">تأكيد الحذف</h3>
              <p class="text-text-secondary font-body-sm">هل أنت متأكد من حذف هذه الكفالة؟</p>
            </div>
          </div>
          <p class="text-text-secondary font-body-md mb-6">لا يمكن التراجع عن هذه العملية. سيتم حذف الكفالة نهائياً.</p>
          <div class="flex items-center justify-end gap-3">
            <button class="h-[44px] px-5 bg-surface-subtle text-on-surface font-body-md rounded-lg border border-border hover:bg-surface-container-low transition-colors" id="del-cancel">إلغاء</button>
            <button class="h-[44px] px-5 bg-error text-on-primary font-body-md rounded-lg hover:bg-error/90 transition-colors flex items-center gap-2" id="del-confirm">
              <span class="material-symbols-outlined text-[20px]">delete</span>
              حذف
            </button>
          </div>
        </div>
      </div>
    `
    document.body.appendChild(modal)

    const close = () => modal.remove()
    modal.querySelector('#del-cancel')?.addEventListener('click', close)
    modal.addEventListener('click', (e) => { if (e.target === modal) close() })

    modal.querySelector('#del-confirm')?.addEventListener('click', async () => {
      const btn = modal.querySelector('#del-confirm') as HTMLButtonElement
      btn.disabled = true
      btn.innerHTML = '<span class="material-symbols-outlined text-[20px] animate-spin">progress_activity</span> جاري الحذف...'

      try {
        const res = await this.api.delete<any>(`/api/dealers/warranties/${warrantyId}`)
        if (!res.success) throw new Error(res.message || 'Failed to delete')
        modal.remove()
        this.loadData(el)
      } catch (err: any) {
        btn.disabled = false
        btn.innerHTML = '<span class="material-symbols-outlined text-[20px]">delete</span> حذف'
        alert('حدث خطأ أثناء الحذف: ' + (err.message || ''))
      }
    })
  }
}
