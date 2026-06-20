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
      this.router.navigate('/inventory/warehouses/new')
    })
    return layout.render(content)
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
