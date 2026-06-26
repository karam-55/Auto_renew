import { AuthService } from '../services/auth'
import { ApiClient } from '../api/client'
import { Router } from '../router'
import { AppLayout } from '../components/layout'

export class WarehousesScreen {
  private auth: AuthService
  private api: ApiClient
  private router: Router

  constructor(auth: AuthService, api: ApiClient, router: Router) {
    this.auth = auth
    this.api = api
    this.router = router
  }

  render(): HTMLElement {
    const layout = new AppLayout(this.auth, this.router, 'إدارة المستودعات', 'warehouse', this.api)
    const content = document.createElement('div')
    content.className = 'page-enter min-h-screen bg-background p-gutter'
    content.innerHTML = `
      <div class="max-w-7xl mx-auto space-y-stack-lg">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="font-beVietnamPro text-headline-md text-on-surface">إدارة المستودعات</h1>
            <p class="text-body-md text-text-secondary mt-1">مستودعات ومخازن المواد</p>
          </div>
          <button class="h-[48px] bg-primary text-on-primary font-ibmPlexSans font-body-lg text-body-lg rounded-lg shadow-sm hover:shadow-lg hover:-translate-y-[1px] transition-all duration-200 flex items-center justify-center gap-2 px-6" id="new-warehouse-btn">
            <span class="material-symbols-outlined text-[20px]">add</span>
            مستودع جديد
          </button>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="warehouses-grid">
          <div class="col-span-full flex items-center justify-center py-12">
            <div class="skeleton-shimmer h-4 rounded w-32"></div>
          </div>
        </div>
      </div>
    `
    this.loadData(content)
    content.querySelector('#new-warehouse-btn')?.addEventListener('click', () => {
      this.showAddModal(content)
    })
    return layout.render(content)
  }

  private showAddModal(el: HTMLElement) {
    const existing = el.querySelector('#warehouse-modal')
    if (existing) existing.remove()
    const modal = document.createElement('div')
    modal.id = 'warehouse-modal'
    modal.className = 'fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm'
    modal.innerHTML = `
      <div class="bg-surface-container-lowest rounded-xl shadow-2xl border border-border w-full max-w-sm mx-4 p-6 space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="font-headline-md text-on-surface font-bold">مستودع جديد</h2>
          <button class="touch-safe w-8 h-8 rounded-full flex items-center justify-center text-text-tertiary hover:text-error transition-colors" id="wh-modal-close" aria-label="إغلاق نافذة المستودع"><span class="material-symbols-outlined" aria-hidden="true">close</span></button>
        </div>
        <div class="space-y-3">
          <div>
            <label class="block font-label-sm text-text-tertiary mb-1">الاسم *</label>
            <input id="wh-name" class="w-full h-10 bg-surface-subtle border border-outline-variant/20 rounded-lg px-3 text-sm text-on-surface outline-none focus:border-primary" required />
          </div>
          <div>
            <label class="block font-label-sm text-text-tertiary mb-1">العنوان</label>
            <input id="wh-address" class="w-full h-10 bg-surface-subtle border border-outline-variant/20 rounded-lg px-3 text-sm text-on-surface outline-none focus:border-primary" />
          </div>
          <div>
            <label class="block font-label-sm text-text-tertiary mb-1">السعة</label>
            <input id="wh-capacity" type="number" class="w-full h-10 bg-surface-subtle border border-outline-variant/20 rounded-lg px-3 text-sm text-on-surface outline-none focus:border-primary" value="0" />
          </div>
        </div>
        <div class="flex justify-end gap-3 pt-2">
          <button class="px-4 py-2 bg-surface-subtle text-on-surface rounded-lg text-sm font-medium border border-border" id="wh-modal-cancel">إلغاء</button>
          <button class="px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-medium" id="wh-save-btn">حفظ</button>
        </div>
      </div>
    `
    el.appendChild(modal)
    const close = () => modal.remove()
    modal.querySelector('#wh-modal-close')?.addEventListener('click', close)
    modal.querySelector('#wh-modal-cancel')?.addEventListener('click', close)
    modal.addEventListener('click', (e) => { if (e.target === modal) close() })
    modal.querySelector('#wh-save-btn')?.addEventListener('click', async () => {
      const name = (modal.querySelector('#wh-name') as HTMLInputElement)?.value?.trim() || ''
      if (!name) { ;(window as any).toast?.show?.({ message: 'الاسم مطلوب', type: 'warning' }); return }
      const btn = modal.querySelector('#wh-save-btn') as HTMLButtonElement
      btn.disabled = true; btn.textContent = 'جاري...'
      try {
        const res = await this.api.post('/api/warehouses', {
          name,
          address: (modal.querySelector('#wh-address') as HTMLInputElement)?.value?.trim() || undefined,
          capacity: parseInt((modal.querySelector('#wh-capacity') as HTMLInputElement)?.value || '0') || 0,
        })
        if (res.success) {
          close()
          ;(window as any).toast?.show?.({ message: 'تم إنشاء المستودع بنجاح', type: 'success' })
          this.loadData(el)
        } else {
          ;(window as any).toast?.show?.({ message: res.message || 'فشل الإنشاء', type: 'error' })
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
      const res = await this.api.get<any>('/api/warehouses')
      const grid = el.querySelector('#warehouses-grid')!
      if (res.success && res.data) {
        const items = Array.isArray(res.data) ? res.data : res.data.data || []
        if (items.length === 0) { grid.innerHTML = '<div class="col-span-full text-center py-12 text-text-secondary font-body-md">لا توجد مستودعات</div>'; return }
        const colors = ['primary', 'secondary', 'tertiary', 'info', 'warning']
        grid.innerHTML = items.map((item: any, i: number) => {
          const color = colors[i % colors.length]
          return `
            <div class="bg-surface-container-lowest p-card-padding rounded-xl shadow-md hover:shadow-lg border border-surface-subtle hover:-translate-y-1 transition-all duration-300 group">
              <div class="flex items-start gap-4 mb-4">
                <div class="w-12 h-12 rounded-xl bg-${color}/5 text-${color} flex items-center justify-center transition-colors group-hover:bg-${color}/10">
                  <span class="material-symbols-outlined text-[24px]" style="font-variation-settings: 'FILL' 1;">warehouse</span>
                </div>
                <div class="flex-1">
                  <h3 class="font-headline-md text-lg text-on-surface font-semibold group-hover:text-primary transition-colors">${item.name || '-'}</h3>
                  <p class="text-text-secondary font-body-md text-sm">${item.address || '-'}</p>
                </div>
              </div>
              <div class="flex items-center justify-between p-3 bg-surface-subtle rounded-lg">
                <span class="font-label-sm text-text-tertiary">السعة</span>
                <span class="text-financial-data text-on-surface">${(item.capacity || 0).toLocaleString('ar-SA')}</span>
              </div>
            </div>
          `
        }).join('')
      }
    } catch { el.querySelector('#warehouses-grid')!.innerHTML = '<div class="col-span-full text-center py-12 text-error font-body-md">حدث خطأ</div>' }
  }
}
