import { AuthService } from '../services/auth'
import { ApiClient } from '../api/client'
import { Router } from '../router'
import { AppLayout } from '../components/layout'
import { isPhone } from '../utils/validation'

export class DealersScreen {
  private auth: AuthService
  private api: ApiClient
  private router: Router
  private items: any[] = []

  constructor(auth: AuthService, api: ApiClient, router: Router) {
    this.auth = auth
    this.api = api
    this.router = router
  }

  render(): HTMLElement {
    const layout = new AppLayout(this.auth, this.router, 'إدارة الوكلاء', 'business_center', this.api)
    const content = document.createElement('div')
    content.className = 'page-enter min-h-screen bg-background p-gutter'
    content.innerHTML = `
      <div class="max-w-7xl mx-auto space-y-stack-lg">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="font-beVietnamPro text-headline-md text-on-surface">إدارة الوكلاء</h1>
            <p class="text-body-md text-text-secondary mt-1">قائمة تجار المواد والوكلاء والكفالات</p>
          </div>
          <button class="h-[48px] bg-primary text-on-primary font-ibmPlexSans font-body-lg text-body-lg rounded-lg shadow-sm hover:shadow-lg hover:-translate-y-[1px] transition-all duration-200 flex items-center justify-center gap-2 px-6" id="new-dealer-btn">
            <span class="material-symbols-outlined text-[20px]">add</span>
            وكيل جديد
          </button>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="bg-surface-container-lowest rounded-xl shadow-md border border-surface-subtle p-5">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <span class="material-symbols-outlined">people</span>
              </div>
              <div>
                <p class="text-text-tertiary font-label-sm">عدد الوكلاء</p>
                <p class="text-on-surface font-headline-md font-semibold" id="stat-total">0</p>
              </div>
            </div>
          </div>
          <div class="bg-surface-container-lowest rounded-xl shadow-md border border-surface-subtle p-5">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-success/10 text-success flex items-center justify-center">
                <span class="material-symbols-outlined">verified</span>
              </div>
              <div>
                <p class="text-text-tertiary font-label-sm">النشطين</p>
                <p class="text-on-surface font-headline-md font-semibold" id="stat-active">0</p>
              </div>
            </div>
          </div>
          <div class="bg-surface-container-lowest rounded-xl shadow-md border border-surface-subtle p-5">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-info/10 text-info flex items-center justify-center">
                <span class="material-symbols-outlined">shield_moon</span>
              </div>
              <div>
                <p class="text-text-tertiary font-label-sm">إجمالي الكفالات</p>
                <p class="text-on-surface font-headline-md font-semibold" id="stat-warranties">0</p>
              </div>
            </div>
          </div>
        </div>

        <div class="glass-panel rounded-xl shadow-lg border border-border p-card-padding">
          <div class="relative">
            <span class="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline">search</span>
            <input class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg pr-10 pl-4 font-ibmPlexSans font-body-md text-body-md text-on-surface placeholder:text-outline-variant focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow duration-200" placeholder="بحث بالاسم أو الشركة أو الهاتف..." id="search-input"/>
          </div>
        </div>
        <div class="bg-surface-container-lowest rounded-xl shadow-md border border-surface-subtle overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="bg-surface-subtle border-b border-outline-variant/10">
                  <th class="px-4 py-4 text-right font-label-sm text-label-sm text-text-tertiary uppercase">الاسم</th>
                  <th class="px-4 py-4 text-right font-label-sm text-label-sm text-text-tertiary uppercase">الشركة</th>
                  <th class="px-4 py-4 text-right font-label-sm text-label-sm text-text-tertiary uppercase">الموبايل</th>
                  <th class="px-4 py-4 text-right font-label-sm text-label-sm text-text-tertiary uppercase">الكفالات</th>
                  <th class="px-4 py-4 text-right font-label-sm text-label-sm text-text-tertiary uppercase">إجراءات</th>
                </tr>
              </thead>
              <tbody id="table-tbody">
                <tr><td colspan="5" class="px-6 py-8 text-center text-text-secondary"><div class="skeleton-shimmer h-4 rounded w-32 mx-auto"></div></td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `
    this.loadData(content)

    const searchInput = content.querySelector('#search-input') as HTMLInputElement
    searchInput?.addEventListener('input', () => {
      const term = searchInput.value.trim().toLowerCase()
      this.renderRows(content, this.items.filter(d =>
        (d.name || '').toLowerCase().includes(term) ||
        (d.companyName || '').toLowerCase().includes(term) ||
        (d.phone || '').includes(term)
      ))
    })

    content.querySelector('#new-dealer-btn')?.addEventListener('click', () => this.openModal(content))
    return layout.render(content)
  }

  private openModal(content: HTMLElement) {
    let modal = content.querySelector('#dealer-modal') as HTMLElement
    if (!modal) {
      modal = document.createElement('div')
      modal.id = 'dealer-modal'
      modal.className = 'fixed inset-0 bg-black/50 z-50 hidden items-center justify-center'
      modal.innerHTML = `
        <div class="bg-surface-container-lowest rounded-xl shadow-2xl border border-border w-full max-w-md p-6 m-4 max-h-[90vh] overflow-y-auto">
          <h3 class="font-headline-md text-on-surface font-semibold mb-4">وكيل جديد</h3>
          <input id="dealer-name" class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-body-md text-on-surface mb-3" placeholder="اسم الوكيل *" required />
          <input id="dealer-company" class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-body-md text-on-surface mb-3" placeholder="اسم الشركة *" />
          <input id="dealer-phone" type="tel" pattern="^09[0-9]{8}$" title="09XXXXXXXX" class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-body-md text-on-surface mb-3" placeholder="رقم الهاتف *" />
          <input id="dealer-password" type="password" class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-body-md text-on-surface mb-3" placeholder="كلمة المرور *" />
          <input id="dealer-address" class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-body-md text-on-surface mb-4" placeholder="العنوان" />
          <div class="flex justify-end gap-2">
            <button id="dealer-cancel" class="h-10 px-4 rounded-lg font-body-md text-text-secondary hover:bg-surface-subtle transition-colors">إلغاء</button>
            <button id="dealer-save" class="h-10 px-4 bg-primary text-white rounded-lg font-body-md hover:bg-primary-dark transition-colors">حفظ</button>
          </div>
        </div>
      `
      content.appendChild(modal)
      modal.querySelector('#dealer-cancel')?.addEventListener('click', () => { modal!.classList.add('hidden'); modal!.classList.remove('flex') })
      modal.querySelector('#dealer-save')?.addEventListener('click', async () => {
        const name = (modal!.querySelector('#dealer-name') as HTMLInputElement)?.value.trim()
        const companyName = (modal!.querySelector('#dealer-company') as HTMLInputElement)?.value.trim()
        const phone = (modal!.querySelector('#dealer-phone') as HTMLInputElement)?.value.trim()
        const password = (modal!.querySelector('#dealer-password') as HTMLInputElement)?.value
        const address = (modal!.querySelector('#dealer-address') as HTMLInputElement)?.value.trim()
        if (!name) { ;(window as any).toast?.show?.({ message: 'اسم الوكيل مطلوب', type: 'warning' }); return }
        if (!companyName) { ;(window as any).toast?.show?.({ message: 'اسم الشركة مطلوب', type: 'warning' }); return }
        if (!phone) { ;(window as any).toast?.show?.({ message: 'رقم الهاتف مطلوب', type: 'warning' }); return }
        if (!password) { ;(window as any).toast?.show?.({ message: 'كلمة المرور مطلوبة', type: 'warning' }); return }
        if (!isPhone(phone)) { ;(window as any).toast?.show?.({ message: 'رقم الهاتف غير صالح', type: 'warning' }); return }
        try {
          const res: any = await this.api.post('/api/dealers', { name, companyName, phone, password, address: address || undefined, tenantId: 'default' })
          if (res.success || res.id) {
            modal!.classList.add('hidden'); modal!.classList.remove('flex')
            modal!.querySelectorAll('input').forEach(i => i.value = '')
            this.loadData(content)
          } else { ;(window as any).toast?.show?.({ message: res.message || 'فشل الإنشاء', type: 'error' }) }
        } catch { ;(window as any).toast?.show?.({ message: 'حدث خطأ في الاتصال', type: 'error' }) }
      })
    }
    modal.classList.remove('hidden')
    modal.classList.add('flex')
  }

  private async loadData(el: HTMLElement) {
    try {
      const res = await this.api.get<any>('/api/dealers')
      if (res.success && res.data) {
        this.items = Array.isArray(res.data) ? res.data : res.data.data || []
        this.renderStats(el)
        this.renderRows(el, this.items)
      } else {
        el.querySelector('#table-tbody')!.innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-error font-body-md">لا توجد بيانات</td></tr>'
      }
    } catch {
      el.querySelector('#table-tbody')!.innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-error font-body-md">حدث خطأ في الاتصال</td></tr>'
    }
  }

  private renderStats(el: HTMLElement) {
    const total = this.items.length
    const active = this.items.filter(i => i.isActive !== false && i.status !== 'INACTIVE').length
    const warranties = this.items.reduce((sum: number, i: any) => sum + (i.warrantyCount || i._count?.dealerWarranties || 0), 0)
    el.querySelector('#stat-total')!.textContent = String(total)
    el.querySelector('#stat-active')!.textContent = String(active)
    el.querySelector('#stat-warranties')!.textContent = String(warranties)
  }

  private renderRows(el: HTMLElement, items: any[]) {
    const tbody = el.querySelector('#table-tbody')!
    if (items.length === 0) { tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-text-secondary font-body-md">لا توجد بيانات</td></tr>'; return }
    tbody.innerHTML = items.map((item: any) => `
      <tr class="border-b border-outline-variant/10 hover:bg-surface-container-low/50 transition-colors">
        <td class="px-4 py-4 font-body-md text-on-surface">${item.name || '-'}</td>
        <td class="px-4 py-4 font-body-md text-text-secondary">${item.companyName || '-'}</td>
        <td class="px-4 py-4 font-body-md text-on-surface" dir="ltr">${item.phone || '-'}</td>
        <td class="px-4 py-4 font-body-md text-on-surface text-center">${item.warrantyCount ?? item._count?.dealerWarranties ?? '-'}</td>
        <td class="px-4 py-4">
          <div class="flex items-center gap-1">
            <button class="w-8 h-8 rounded-lg hover:bg-surface-container flex items-center justify-center text-text-tertiary hover:text-info transition-colors" title="عرض التفاصيل" data-action="view" data-id="${item.id}">
              <span class="material-symbols-outlined text-[18px]">visibility</span>
            </button>
            <button class="w-8 h-8 rounded-lg hover:bg-surface-container flex items-center justify-center text-text-tertiary hover:text-primary transition-colors" title="تعديل" data-action="edit" data-id="${item.id}">
              <span class="material-symbols-outlined text-[18px]">edit</span>
            </button>
            <button class="w-8 h-8 rounded-lg hover:bg-surface-container flex items-center justify-center text-text-tertiary hover:text-error transition-colors" title="حذف" data-action="delete" data-id="${item.id}">
              <span class="material-symbols-outlined text-[18px]">delete</span>
            </button>
          </div>
        </td>
      </tr>
    `).join('')
    tbody.querySelectorAll('[data-action="view"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id')
        if (id) this.router.navigate(`/dealers/${id}`)
      })
    })
    tbody.querySelectorAll('[data-action="edit"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id')
        const dealer = this.items.find((d: any) => d.id === id)
        if (id && dealer) this.openEditModal(el, id, dealer)
      })
    })
    tbody.querySelectorAll('[data-action="delete"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id')
        if (id) this.openDeleteModal(el, id)
      })
    })
  }

  private openEditModal(content: HTMLElement, id: string, dealer: any) {
    let modal = content.querySelector('#edit-dealer-modal') as HTMLElement
    if (!modal) {
      modal = document.createElement('div')
      modal.id = 'edit-dealer-modal'
      modal.className = 'fixed inset-0 bg-black/50 z-50 hidden items-center justify-center'
      modal.innerHTML = `
        <div class="bg-surface-container-lowest rounded-xl shadow-2xl border border-border w-full max-w-md p-6 m-4 max-h-[90vh] overflow-y-auto">
          <h3 class="font-headline-md text-on-surface font-semibold mb-4">تعديل وكيل</h3>
          <input id="edit-dealer-name" class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-body-md text-on-surface mb-3" placeholder="اسم الوكيل *" required />
          <input id="edit-dealer-company" class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-body-md text-on-surface mb-3" placeholder="اسم الشركة *" />
          <input id="edit-dealer-phone" type="tel" pattern="^09[0-9]{8}$" title="09XXXXXXXX" class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-body-md text-on-surface mb-3" placeholder="رقم الهاتف *" />
          <input id="edit-dealer-address" class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-body-md text-on-surface mb-4" placeholder="العنوان" />
          <div class="flex justify-end gap-2">
            <button id="edit-dealer-cancel" class="h-10 px-4 rounded-lg font-body-md text-text-secondary hover:bg-surface-subtle transition-colors">إلغاء</button>
            <button id="edit-dealer-save" class="h-10 px-4 bg-primary text-white rounded-lg font-body-md hover:bg-primary-dark transition-colors">حفظ</button>
          </div>
        </div>
      `
      content.appendChild(modal)
    }

    const nameIn = modal.querySelector('#edit-dealer-name') as HTMLInputElement
    const companyIn = modal.querySelector('#edit-dealer-company') as HTMLInputElement
    const phoneIn = modal.querySelector('#edit-dealer-phone') as HTMLInputElement
    const addressIn = modal.querySelector('#edit-dealer-address') as HTMLInputElement

    nameIn.value = dealer.name || ''
    companyIn.value = dealer.companyName || ''
    phoneIn.value = dealer.phone || ''
    addressIn.value = dealer.address || ''

    modal.classList.remove('hidden')
    modal.classList.add('flex')

    const close = () => {
      modal!.classList.add('hidden')
      modal!.classList.remove('flex')
    }

    modal.querySelector('#edit-dealer-cancel')?.addEventListener('click', close)
    modal.querySelector('#edit-dealer-save')?.addEventListener('click', async () => {
      const name = nameIn.value.trim()
      const companyName = companyIn.value.trim()
      const phone = phoneIn.value.trim()
      const address = addressIn.value.trim()
      if (!name) { ;(window as any).toast?.show?.({ message: 'اسم الوكيل مطلوب', type: 'warning' }); return }
      if (!companyName) { ;(window as any).toast?.show?.({ message: 'اسم الشركة مطلوب', type: 'warning' }); return }
      if (!phone) { ;(window as any).toast?.show?.({ message: 'رقم الهاتف مطلوب', type: 'warning' }); return }
      if (!isPhone(phone)) { ;(window as any).toast?.show?.({ message: 'رقم الهاتف غير صالح', type: 'warning' }); return }
      try {
        const res: any = await this.api.put(`/api/dealers/${id}`, { name, companyName, phone, address: address || undefined })
        if (res.success || res.dealer) {
          close()
          this.loadData(content)
        } else { ;(window as any).toast?.show?.({ message: res.message || 'فشل التحديث', type: 'error' }) }
      } catch { ;(window as any).toast?.show?.({ message: 'حدث خطأ في الاتصال', type: 'error' }) }
    })
  }

  private openDeleteModal(content: HTMLElement, id: string) {
    let modal = content.querySelector('#delete-dealer-modal') as HTMLElement
    if (!modal) {
      modal = document.createElement('div')
      modal.id = 'delete-dealer-modal'
      modal.className = 'fixed inset-0 bg-black/50 z-50 hidden items-center justify-center'
      modal.innerHTML = `
        <div class="bg-surface-container-lowest rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4 border border-border">
          <div class="flex flex-col items-center text-center gap-4">
            <div class="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center">
              <span class="material-symbols-outlined text-[32px] text-error">warning</span>
            </div>
            <h3 class="font-headline-md text-lg text-on-surface font-semibold">تأكيد الحذف</h3>
            <p class="font-body-md text-text-secondary">هل أنت متأكد من حذف هذا الوكيل نهائياً؟<br><span class="text-error text-sm">(لا يمكن التراجع عن هذا الإجراء)</span></p>
            <div class="flex gap-3 w-full">
              <button id="delete-dealer-cancel" class="flex-1 h-[48px] bg-surface-subtle text-on-surface font-body-lg rounded-lg border border-border hover:bg-surface-container-low transition-colors">إلغاء</button>
              <button id="delete-dealer-confirm" class="flex-1 h-[48px] bg-error text-on-error font-body-lg rounded-lg shadow-sm hover:shadow-lg transition-all">حذف</button>
            </div>
          </div>
        </div>
      `
      content.appendChild(modal)
    }

    modal.classList.remove('hidden')
    modal.classList.add('flex')

    const close = () => {
      modal!.classList.add('hidden')
      modal!.classList.remove('flex')
    }

    modal.querySelector('#delete-dealer-cancel')?.addEventListener('click', close)
    modal.querySelector('#delete-dealer-confirm')?.addEventListener('click', async () => {
      try {
        const res: any = await this.api.delete(`/api/dealers/${id}`)
        if (res.success || res.message) {
          close()
          this.loadData(content)
        } else { ;(window as any).toast?.show?.({ message: res.message || 'فشل الحذف', type: 'error' }) }
      } catch { ;(window as any).toast?.show?.({ message: 'حدث خطأ في الاتصال', type: 'error' }) }
    })
  }
}
