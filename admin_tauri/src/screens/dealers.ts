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
          <input id="dealer-phone" type="tel" pattern="^09[0-9]{8}$" title="09XXXXXXXX" class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-body-md text-on-surface mb-3" placeholder="رقم الهاتف" />
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
        const address = (modal!.querySelector('#dealer-address') as HTMLInputElement)?.value.trim()
        if (!name) { ;(window as any).toast?.show?.({ message: 'اسم الوكيل مطلوب', type: 'warning' }); return }
        if (!companyName) { ;(window as any).toast?.show?.({ message: 'اسم الشركة مطلوب', type: 'warning' }); return }
        if (phone && !isPhone(phone)) { ;(window as any).toast?.show?.({ message: 'رقم الهاتف غير صالح', type: 'warning' }); return }
        try {
          const res: any = await this.api.post('/api/dealers', { name, companyName, phone: phone || undefined, address: address || undefined, tenantId: 'default' })
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
        el.querySelector('#table-tbody')!.innerHTML = '<tr><td colspan="7" class="px-6 py-8 text-center text-error font-body-md">لا توجد بيانات</td></tr>'
      }
    } catch {
      el.querySelector('#table-tbody')!.innerHTML = '<tr><td colspan="7" class="px-6 py-8 text-center text-error font-body-md">حدث خطأ في الاتصال</td></tr>'
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
  }
}
