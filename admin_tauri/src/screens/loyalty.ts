import { AuthService } from '../services/auth'
import { ApiClient } from '../api/client'
import { Router } from '../router'
import { AppLayout } from '../components/layout'

export class LoyaltyScreen {
  private auth: AuthService
  private api: ApiClient
  private router: Router

  constructor(auth: AuthService, api: ApiClient, router: Router) {
    this.auth = auth
    this.api = api
    this.router = router
  }

  render(): HTMLElement {
    const layout = new AppLayout(this.auth, this.router, 'برنامج الولاء', 'loyalty', this.api)
    const content = document.createElement('div')
    content.className = 'page-enter min-h-screen bg-background p-gutter'
    content.innerHTML = `
      <div class="max-w-7xl mx-auto space-y-stack-lg">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="font-beVietnamPro text-headline-md text-on-surface">برنامج الولاء</h1>
            <p class="text-body-md text-text-secondary mt-1">نقاط ومكافآت العملاء</p>
          </div>
          <button class="h-[48px] bg-primary text-on-primary font-ibmPlexSans font-body-lg text-body-lg rounded-lg shadow-sm hover:shadow-lg hover:-translate-y-[1px] transition-all duration-200 flex items-center justify-center gap-2 px-6" id="add-points-btn">
            <span class="material-symbols-outlined text-[20px]">add</span>
            إضافة نقاط
          </button>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="bg-surface-container-lowest p-card-padding rounded-xl shadow-md hover-lift border border-surface-subtle relative overflow-hidden">
            <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary-fixed"></div>
            <p class="font-label-sm text-text-tertiary mb-1">إجمالي النقاط الموزعة</p>
            <h3 class="text-financial-data text-headline-lg text-on-surface" id="loyalty-total-points">...</h3>
          </div>
          <div class="bg-surface-container-lowest p-card-padding rounded-xl shadow-md hover-lift border border-surface-subtle relative overflow-hidden">
            <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-secondary to-secondary-container"></div>
            <p class="font-label-sm text-text-tertiary mb-1">العملاء المشاركون</p>
            <h3 class="text-financial-data text-headline-lg text-on-surface" id="loyalty-customers">...</h3>
          </div>
          <div class="bg-surface-container-lowest p-card-padding rounded-xl shadow-md hover-lift border border-surface-subtle relative overflow-hidden">
            <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-tertiary to-tertiary-fixed"></div>
            <p class="font-label-sm text-text-tertiary mb-1">المكافآت المستبدلة</p>
            <h3 class="text-financial-data text-headline-lg text-on-surface" id="loyalty-redeemed">...</h3>
          </div>
        </div>
        <div class="glass-panel rounded-xl shadow-lg border border-border p-card-padding">
          <div class="relative">
            <span class="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline">search</span>
            <input class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg pr-10 pl-4 font-ibmPlexSans font-body-md text-body-md text-on-surface placeholder:text-outline-variant focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow duration-200" placeholder="بحث بالعميل..." id="search-input"/>
          </div>
        </div>
        <div class="bg-surface-container-lowest rounded-xl shadow-md border border-surface-subtle overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="bg-surface-subtle border-b border-outline-variant/10">
                  <th class="px-6 py-4 text-right font-label-sm text-label-sm text-text-tertiary uppercase">العميل</th>
                  <th class="px-6 py-4 text-right font-label-sm text-label-sm text-text-tertiary uppercase">النقاط</th>
                  <th class="px-6 py-4 text-right font-label-sm text-label-sm text-text-tertiary uppercase">آخر نشاط</th>
                  <th class="px-6 py-4 text-right font-label-sm text-label-sm text-text-tertiary uppercase">الحالة</th>
                </tr>
              </thead>
              <tbody id="table-tbody">
                <tr><td colspan="4" class="px-6 py-8 text-center text-text-secondary"><div class="skeleton-shimmer h-4 rounded w-32 mx-auto"></div></td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `
    this.loadData(content)
    content.querySelector('#add-points-btn')?.addEventListener('click', () => {
      let modal = content.querySelector('#loyalty-modal') as HTMLElement
      if (!modal) {
        modal = document.createElement('div')
        modal.id = 'loyalty-modal'
        modal.className = 'fixed inset-0 bg-black/50 z-50 hidden items-center justify-center'
        modal.setAttribute('role', 'dialog')
        modal.setAttribute('aria-modal', 'true')
        modal.innerHTML = `
          <div class="bg-surface-container-lowest rounded-xl shadow-2xl border border-border w-full max-w-sm p-6 m-4">
            <h3 class="font-headline-md text-on-surface font-semibold mb-4">إضافة نقاط ولاء</h3>
            <input id="loyalty-customer" class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-body-md text-on-surface mb-3" placeholder="اسم العميل أو رقم الموبايل" />
            <input id="loyalty-points" type="number" class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-body-md text-on-surface mb-4" placeholder="عدد النقاط" min="1" />
            <div class="flex justify-end gap-2">
              <button id="loyalty-cancel" class="h-10 px-4 rounded-lg font-body-md text-text-secondary hover:bg-surface-subtle transition-colors">إلغاء</button>
              <button id="loyalty-save" class="h-10 px-4 bg-primary text-white rounded-lg font-body-md hover:bg-primary-dark transition-colors">حفظ</button>
            </div>
          </div>
        `
        content.appendChild(modal)
        modal.querySelector('#loyalty-cancel')?.addEventListener('click', () => { modal!.classList.add('hidden'); modal!.classList.remove('flex') })
        modal.querySelector('#loyalty-save')?.addEventListener('click', async () => {
          const customer = (modal!.querySelector('#loyalty-customer') as HTMLInputElement)?.value.trim()
          const points = parseInt((modal!.querySelector('#loyalty-points') as HTMLInputElement)?.value || '0')
          if (!customer) { ;(window as any).toast?.show?.({ message: 'يرجى إدخال اسم العميل', type: 'warning' }); return }
          if (isNaN(points) || points <= 0) { ;(window as any).toast?.show?.({ message: 'النقاط يجب أن تكون أكبر من صفر', type: 'warning' }); return }
          try {
            const res: any = await this.api.post('/api/loyalty/add-points', { customerQuery: customer, points })
            if (res.success) {
              modal!.classList.add('hidden'); modal!.classList.remove('flex')
              ;(modal!.querySelector('#loyalty-customer') as HTMLInputElement).value = ''
              ;(modal!.querySelector('#loyalty-points') as HTMLInputElement).value = ''
              this.loadData(content)
              ;(window as any).toast?.show?.({ message: `تم إضافة ${points} نقطة بنجاح`, type: 'success' })
            } else {
              ;(window as any).toast?.show?.({ message: res.message || 'فشل الإضافة', type: 'error' })
            }
          } catch { ;(window as any).toast?.show?.({ message: 'حدث خطأ في الاتصال', type: 'error' }) }
        })
      }
      modal.classList.remove('hidden')
      modal.classList.add('flex')
    })
    return layout.render(content)
  }

  private async loadData(el: HTMLElement) {
    try {
      const res = await this.api.get<any>('/api/loyalty')
      const setText = (id: string, val: string) => {
        const e = el.querySelector('#' + id)
        if (e) e.textContent = val
      }
      if (res.success && res.data) {
        const data = res.data
        const items = Array.isArray(data) ? data : data.data || []
        const summary = data.summary || {}
        setText('loyalty-total-points', (summary.totalPoints || 0).toLocaleString('ar-SA'))
        setText('loyalty-customers', (summary.totalCustomers || items.length || 0).toLocaleString('ar-SA'))
        setText('loyalty-redeemed', (summary.totalRedeemed || 0).toLocaleString('ar-SA'))
        const tbody = el.querySelector('#table-tbody')!
        if (items.length === 0) { tbody.innerHTML = '<tr><td colspan="4" class="px-6 py-8 text-center text-text-secondary font-body-md">لا توجد بيانات</td></tr>'; return }
        tbody.innerHTML = items.map((item: any) => `
          <tr class="border-b border-outline-variant/10 hover:bg-surface-container-low/50 transition-colors">
            <td class="px-6 py-4 font-body-md text-on-surface">${item.customerName || item.customer?.fullName || item.customer?.name || '-'}</td>
            <td class="px-6 py-4 text-financial-data text-primary">${item.points || 0}</td>
            <td class="px-6 py-4 font-body-md text-text-secondary">${item.lastActivity || '-'}</td>
            <td class="px-6 py-4"><span class="inline-flex items-center px-3 py-1 rounded-full font-label-sm text-label-sm bg-tertiary/10 text-tertiary">نشط</span></td>
          </tr>
        `).join('')
      }
    } catch { 
      el.querySelector('#table-tbody')!.innerHTML = '<tr><td colspan="4" class="px-6 py-8 text-center text-error font-body-md">حدث خطأ</td></tr>'
      el.querySelector('#loyalty-total-points')!.textContent = '0'
      el.querySelector('#loyalty-customers')!.textContent = '0'
      el.querySelector('#loyalty-redeemed')!.textContent = '0'
    }
  }
}
