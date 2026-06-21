import { AuthService } from '../services/auth'
import { ApiClient } from '../api/client'
import { Router } from '../router'
import { AppLayout } from '../components/layout'

export class SuppliersScreen {
  private auth: AuthService
  private api: ApiClient
  private router: Router

  constructor(auth: AuthService, api: ApiClient, router: Router) {
    this.auth = auth
    this.api = api
    this.router = router
  }

  render(): HTMLElement {
    const layout = new AppLayout(this.auth, this.router, 'إدارة الموردين', 'local_shipping', this.api)
    const content = document.createElement('div')
    content.className = 'page-enter min-h-screen bg-background p-gutter'
    content.innerHTML = `
      <div class="max-w-7xl mx-auto space-y-stack-lg">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="font-beVietnamPro text-headline-md text-on-surface">إدارة الموردين</h1>
            <p class="text-body-md text-text-secondary mt-1">قائمة الموردين وتواصل معهم</p>
          </div>
          <button class="h-[48px] bg-primary text-on-primary font-ibmPlexSans font-body-lg text-body-lg rounded-lg shadow-sm hover:shadow-lg hover:-translate-y-[1px] transition-all duration-200 flex items-center justify-center gap-2 px-6" id="new-supplier-btn">
            <span class="material-symbols-outlined text-[20px]">add</span>
            مورد جديد
          </button>
        </div>
        <div class="glass-panel rounded-xl shadow-lg border border-border p-card-padding">
          <div class="relative">
            <span class="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline">search</span>
            <input class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg pr-10 pl-4 font-ibmPlexSans font-body-md text-body-md text-on-surface placeholder:text-outline-variant focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow duration-200" placeholder="بحث بالاسم..." id="search-input"/>
          </div>
        </div>
        <div class="bg-surface-container-lowest rounded-xl shadow-md border border-surface-subtle overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="bg-surface-subtle border-b border-outline-variant/10">
                  <th class="px-6 py-4 text-right font-label-sm text-label-sm text-text-tertiary uppercase">الاسم</th>
                  <th class="px-6 py-4 text-right font-label-sm text-label-sm text-text-tertiary uppercase">الموبايل</th>
                  <th class="px-6 py-4 text-right font-label-sm text-label-sm text-text-tertiary uppercase">العنوان</th>
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
    content.querySelector('#new-supplier-btn')?.addEventListener('click', () => {
      this.showAddModal(content)
    })
    return layout.render(content)
  }

  private showAddModal(el: HTMLElement) {
    const existing = el.querySelector('#supplier-modal')
    if (existing) existing.remove()
    const modal = document.createElement('div')
    modal.id = 'supplier-modal'
    modal.className = 'fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm'
    modal.innerHTML = `
      <div class="bg-surface-container-lowest rounded-xl shadow-2xl border border-border w-full max-w-sm mx-4 p-6 space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="font-headline-md text-on-surface font-bold">مورد جديد</h2>
          <button class="text-text-tertiary hover:text-error transition-colors" id="sup-modal-close"><span class="material-symbols-outlined">close</span></button>
        </div>
        <div class="space-y-3">
          <div>
            <label class="block font-label-sm text-text-tertiary mb-1">الاسم *</label>
            <input id="sup-name" class="w-full h-10 bg-surface-subtle border border-outline-variant/20 rounded-lg px-3 text-sm text-on-surface outline-none focus:border-primary" required />
          </div>
          <div>
            <label class="block font-label-sm text-text-tertiary mb-1">الموبايل</label>
            <input id="sup-phone" class="w-full h-10 bg-surface-subtle border border-outline-variant/20 rounded-lg px-3 text-sm text-on-surface outline-none focus:border-primary" />
          </div>
          <div>
            <label class="block font-label-sm text-text-tertiary mb-1">العنوان</label>
            <input id="sup-address" class="w-full h-10 bg-surface-subtle border border-outline-variant/20 rounded-lg px-3 text-sm text-on-surface outline-none focus:border-primary" />
          </div>
        </div>
        <div class="flex justify-end gap-3 pt-2">
          <button class="px-4 py-2 bg-surface-subtle text-on-surface rounded-lg text-sm font-medium border border-border" id="sup-modal-cancel">إلغاء</button>
          <button class="px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-medium" id="sup-save-btn">حفظ</button>
        </div>
      </div>
    `
    el.appendChild(modal)
    const close = () => modal.remove()
    modal.querySelector('#sup-modal-close')?.addEventListener('click', close)
    modal.querySelector('#sup-modal-cancel')?.addEventListener('click', close)
    modal.addEventListener('click', (e) => { if (e.target === modal) close() })
    modal.querySelector('#sup-save-btn')?.addEventListener('click', async () => {
      const name = (modal.querySelector('#sup-name') as HTMLInputElement)?.value?.trim() || ''
      if (!name) { ;(window as any).toast?.show?.({ message: 'الاسم مطلوب', type: 'warning' }); return }
      const btn = modal.querySelector('#sup-save-btn') as HTMLButtonElement
      btn.disabled = true; btn.textContent = 'جاري...'
      try {
        const res = await this.api.post('/api/suppliers', {
          name,
          phone: (modal.querySelector('#sup-phone') as HTMLInputElement)?.value?.trim() || undefined,
          address: (modal.querySelector('#sup-address') as HTMLInputElement)?.value?.trim() || undefined,
        })
        if (res.success) {
          close()
          ;(window as any).toast?.show?.({ message: 'تم إضافة المورد بنجاح', type: 'success' })
          this.loadData(el)
        } else {
          ;(window as any).toast?.show?.({ message: res.message || 'فشل الحفظ', type: 'error' })
          btn.disabled = false; btn.textContent = 'حفظ'
        }
      } catch {
        ;(window as any).toast?.show?.({ message: 'حدث خطأ في الاتصال', type: 'error' })
        btn.disabled = false; btn.textContent = 'حفظ'
      }
    })
  }

  private async loadData(el: HTMLElement) {
    try {
      const res = await this.api.get<any>('/api/suppliers')
      const tbody = el.querySelector('#table-tbody')!
      if (res.success && res.data) {
        const items = Array.isArray(res.data) ? res.data : res.data.data || []
        if (items.length === 0) { tbody.innerHTML = '<tr><td colspan="4" class="px-6 py-8 text-center text-text-secondary font-body-md">لا توجد بيانات</td></tr>'; return }
        tbody.innerHTML = items.map((item: any) => `
          <tr class="border-b border-outline-variant/10 hover:bg-surface-container-low/50 transition-colors">
            <td class="px-6 py-4 font-body-md text-on-surface">${item.name || '-'}</td>
            <td class="px-6 py-4 font-body-md text-on-surface" dir="ltr">${item.phone || '-'}</td>
            <td class="px-6 py-4 font-body-md text-text-secondary">${item.address || '-'}</td>
            <td class="px-6 py-4"><span class="inline-flex items-center px-3 py-1 rounded-full font-label-sm text-label-sm bg-tertiary/10 text-tertiary">نشط</span></td>
          </tr>
        `).join('')
      }
    } catch { el.querySelector('#table-tbody')!.innerHTML = '<tr><td colspan="4" class="px-6 py-8 text-center text-error font-body-md">حدث خطأ</td></tr>' }
  }
}
