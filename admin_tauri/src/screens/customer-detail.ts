import { AuthService } from '../services/auth'
import { ApiClient } from '../api/client'
import { Router } from '../router'
import { AppLayout } from '../components/layout'

export class CustomerDetailScreen {
  private customerId: string
  constructor(private auth: AuthService, private api: ApiClient, private router: Router, customerId: string) {
    this.customerId = customerId
  }

  render(): HTMLElement {
    const layout = new AppLayout(this.auth, this.router, 'تفاصيل العميل', 'person', this.api)
    const c = document.createElement('div')
    c.className = 'page-enter min-h-screen bg-background p-gutter'
    c.innerHTML = `
      <div class="max-w-3xl mx-auto space-y-stack-lg">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="font-beVietnamPro text-headline-md text-on-surface">تفاصيل العميل</h1>
            <p class="text-body-md text-text-secondary mt-1">بيانات العميل والمركبات</p>
          </div>
          <button class="h-[48px] px-4 bg-surface-subtle text-on-surface font-ibmPlexSans font-body-lg rounded-lg border border-border hover:bg-surface-container-low transition-colors flex items-center gap-2" id="back-btn">
            <span class="material-symbols-outlined text-[20px]">arrow_forward</span>
            رجوع
          </button>
        </div>
        <div id="customer-card" class="bg-surface-container-lowest rounded-xl shadow-md border border-surface-subtle overflow-hidden">
          <div class="p-6 border-b border-outline-variant/10 bg-surface-subtle flex items-center gap-4">
            <div class="w-14 h-14 rounded-full bg-primary-fixed text-primary flex items-center justify-center">
              <span class="material-symbols-outlined text-[28px]">person</span>
            </div>
            <div>
              <h3 class="font-headline-md text-lg text-on-surface font-semibold" id="cust-name">...</h3>
              <p class="text-text-secondary font-body-md" dir="ltr" id="cust-phone">...</p>
            </div>
          </div>
          <div class="p-6 space-y-6">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="font-label-sm text-text-tertiary mb-1">العنوان</p>
                <p class="font-body-md text-on-surface font-semibold" id="cust-address">...</p>
              </div>
              <div>
                <p class="font-label-sm text-text-tertiary mb-1">المدينة</p>
                <p class="font-body-md text-on-surface font-semibold" id="cust-city">...</p>
              </div>
            </div>
          </div>
        </div>
        <div id="vehicles-section" class="bg-surface-container-lowest rounded-xl shadow-md border border-surface-subtle p-card-padding">
          <h3 class="font-headline-md text-lg text-on-surface font-semibold mb-4 flex items-center gap-2">
            <span class="material-symbols-outlined text-primary">directions_car</span>
            المركبات
          </h3>
          <div class="space-y-3" id="vehicles-list">
            <div class="skeleton-shimmer h-4 rounded w-32"></div>
          </div>
        </div>
        <!-- Delete Vehicle Confirmation Modal -->
        <div id="delete-vehicle-modal" class="fixed inset-0 bg-black/50 z-[100] hidden items-center justify-center p-4">
          <div class="bg-surface-container-lowest rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 border border-border">
            <div class="flex flex-col items-center text-center gap-4">
              <div class="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center">
                <span class="material-symbols-outlined text-[32px] text-error">warning</span>
              </div>
              <h3 class="font-headline-md text-lg text-on-surface font-semibold">تأكيد حذف المركبة</h3>
              <p class="text-body-md text-text-secondary" id="delete-vehicle-message">هل أنت متأكد من حذف هذه المركبة؟</p>
              <div class="flex gap-3 w-full">
                <button class="flex-1 h-[48px] bg-surface-subtle text-on-surface font-ibmPlexSans font-body-md rounded-lg border border-border hover:bg-surface-container-low transition-colors" id="delete-vehicle-cancel">إلغاء</button>
                <button class="flex-1 h-[48px] bg-error text-on-error font-ibmPlexSans font-body-md rounded-lg hover:bg-error/90 transition-colors" id="delete-vehicle-confirm">حذف</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `
    c.querySelector('#back-btn')?.addEventListener('click', () => this.router.navigate('/customers'))
    this.loadData(c)
    return layout.render(c)
  }

  private async loadData(el: HTMLElement) {
    try {
      const res = await this.api.get<any>(`/api/customers/${this.customerId}`)
      if (res.success && res.data) {
        const raw = res.data
        const cust = raw.customer || raw
        const setText = (id: string, val: string) => {
          const e = el.querySelector('#' + id)
          if (e) e.textContent = val
        }
        setText('cust-name', cust.fullName || '-')
        setText('cust-phone', cust.phone || '-')
        setText('cust-address', cust.address || '-')
        setText('cust-city', cust.city || '-')
        const vehicles = cust.vehicles || []
        const list = el.querySelector('#vehicles-list')!
        if (vehicles.length === 0) {
          list.innerHTML = '<p class="text-text-secondary font-body-md">لا توجد مركبات مسجلة</p>'
        } else {
          list.innerHTML = vehicles.map((v: any) => `
            <div class="flex items-center justify-between p-3 bg-surface-subtle rounded-lg">
              <div class="flex items-center gap-3">
                <span class="material-symbols-outlined text-primary">directions_car</span>
                <div>
                  <p class="font-body-md text-on-surface font-semibold">${v.model || v.make || '-'}</p>
                  <p class="text-text-secondary text-sm" dir="ltr">${v.licensePlate || '-'}</p>
                </div>
              </div>
              <div class="flex items-center gap-1">
                <button class="touch-safe w-8 h-8 rounded-lg hover:bg-surface-container flex items-center justify-center text-text-tertiary hover:text-primary transition-colors" title="عرض" aria-label="عرض تفاصيل المركبة" data-view-vehicle="${v.id}">
                  <span class="material-symbols-outlined text-[18px]" aria-hidden="true">visibility</span>
                </button>
                <button class="touch-safe w-8 h-8 rounded-lg hover:bg-error/10 flex items-center justify-center text-text-tertiary hover:text-error transition-colors" title="حذف" aria-label="حذف المركبة" data-delete-vehicle="${v.id}" data-make="${v.make || ''}" data-model="${v.model || ''}" data-plate="${v.licensePlate || ''}">
                  <span class="material-symbols-outlined text-[18px]" aria-hidden="true">delete</span>
                </button>
              </div>
            </div>
          `).join('')
        const vlist = el.querySelector('#vehicles-list')!
        vlist.querySelectorAll('button[data-view-vehicle]').forEach(btn => {
          btn.addEventListener('click', () => {
            const vid = btn.getAttribute('data-view-vehicle')
            if (vid) this.router.navigate(`/vehicles/${vid}`)
          })
        })
        vlist.querySelectorAll('button[data-delete-vehicle]').forEach(btn => {
          btn.addEventListener('click', () => {
            const vid = btn.getAttribute('data-delete-vehicle')
            const vMake = btn.getAttribute('data-make') || ''
            const vModel = btn.getAttribute('data-model') || ''
            const vPlate = btn.getAttribute('data-plate') || ''
            if (vid) this.openDeleteVehicleModal(el, vid, vMake, vModel, vPlate)
          })
        })
        }
      } else {
        el.querySelector('#customer-card')!.innerHTML = '<p class="p-6 text-error font-body-md">لا توجد بيانات لهذا العميل</p>'
        el.querySelector('#vehicles-section')!.innerHTML = ''
      }
    } catch {
      el.querySelector('#customer-card')!.innerHTML = '<p class="p-6 text-error font-body-md">حدث خطأ أثناء تحميل البيانات</p>'
      el.querySelector('#vehicles-section')!.innerHTML = ''
    }
  }

  private openDeleteVehicleModal(el: HTMLElement, vehicleId: string, make: string, model: string, plate: string) {
    const modal = el.querySelector('#delete-vehicle-modal') as HTMLElement
    const message = el.querySelector('#delete-vehicle-message') as HTMLElement
    const confirmBtn = el.querySelector('#delete-vehicle-confirm') as HTMLElement
    const cancelBtn = el.querySelector('#delete-vehicle-cancel') as HTMLElement
    if (!modal || !message || !confirmBtn || !cancelBtn) return

    const vehicleName = model && make ? `${make} ${model}` : (model || make || 'هذه المركبة')
    message.textContent = `هل أنت متأكد من حذف ${vehicleName} (${plate || ''})؟`

    modal.classList.remove('hidden')
    modal.classList.add('flex')

    const doCancel = () => {
      modal.classList.add('hidden')
      modal.classList.remove('flex')
    }
    const doConfirm = () => {
      modal.classList.add('hidden')
      modal.classList.remove('flex')
      this.executeDeleteVehicle(el, vehicleId)
    }

    cancelBtn.onclick = doCancel
    confirmBtn.onclick = doConfirm
  }

  private async executeDeleteVehicle(el: HTMLElement, vehicleId: string) {
    try {
      const res = await this.api.delete(`/api/vehicles/${vehicleId}`)
      if (res.success) {
        this.loadData(el)
      } else {
        const msg = res.message || (res.data as any)?.error || 'فشل حذف المركبة'
        ;(window as any).toast?.show?.({ message: msg, type: 'error' })
      }
    } catch (err: any) {
      ;(window as any).toast?.show?.({ message: err.message || 'حدث خطأ أثناء حذف المركبة', type: 'error' })
    }
  }
}
