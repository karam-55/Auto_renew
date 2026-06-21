import { AuthService } from '../services/auth'
import { ApiClient } from '../api/client'
import { Router } from '../router'
import { AppLayout } from '../components/layout'

export class PurchaseOrdersScreen {
  constructor(private auth: AuthService, private api: ApiClient, private router: Router) {}
  render(): HTMLElement {
    const layout = new AppLayout(this.auth, this.router, 'أوامر الشراء', 'shopping_cart', this.api)
    const c = document.createElement('div')
    c.className = 'page-enter min-h-screen bg-background p-gutter'
    c.innerHTML = `
      <div class="max-w-7xl mx-auto space-y-stack-lg">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="font-beVietnamPro text-headline-md text-on-surface">أوامر الشراء</h1>
          </div>
        </div>
        <div class="glass-panel rounded-xl shadow-lg border border-border p-card-padding">
          <div class="relative">
            <span class="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline">search</span>
            <input class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg pr-10 pl-4 font-ibmPlexSans font-body-md text-body-md text-on-surface placeholder:text-outline-variant focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow duration-200" placeholder="بحث برقم الطلب..." id="search-input"/>
          </div>
        </div>
        <div class="bg-surface-container-lowest rounded-xl shadow-md border border-surface-subtle overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="bg-surface-subtle border-b border-outline-variant/10">
                  <th class="px-6 py-4 text-right font-label-sm text-label-sm text-text-tertiary uppercase">رقم الطلب</th><th class="px-6 py-4 text-right font-label-sm text-label-sm text-text-tertiary uppercase">المورد</th><th class="px-6 py-4 text-right font-label-sm text-label-sm text-text-tertiary uppercase">التاريخ</th><th class="px-6 py-4 text-right font-label-sm text-label-sm text-text-tertiary uppercase">الحالة</th>
                </tr>
              </thead>
              <tbody id="table-tbody">
                <tr><td colspan="4" class="px-6 py-8 text-center text-text-secondary"><div class="skeleton-shimmer h-4 rounded w-32 mx-auto"></div></td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>`
    this.loadData(c)
    return layout.render(c)
  }
  private async loadData(el: HTMLElement) {
    try {
      const res = await this.api.get<any>('/api/purchase-orders')
      const tbody = el.querySelector('#table-tbody')!
      if (res.success && res.data) {
        const items = Array.isArray(res.data) ? res.data : res.data.data || []
        if (items.length === 0) { tbody.innerHTML = '<tr><td colspan="4" class="px-6 py-8 text-center text-text-secondary font-body-md">لا توجد بيانات</td></tr>'; return }
        const statusMap: Record<string, string> = { DRAFT:'مسودة', PENDING:'معلقة', APPROVED:'معتمدة', RECEIVED:'مستلمة', CANCELLED:'ملغاة' }
        const statusCls: Record<string, string> = { DRAFT:'bg-text-tertiary/10 text-text-tertiary', PENDING:'bg-warning/10 text-warning', APPROVED:'bg-tertiary/10 text-tertiary', RECEIVED:'bg-primary/10 text-primary', CANCELLED:'bg-error/10 text-error' }
        tbody.innerHTML = items.map((item: any) => `
          <tr class="border-b border-outline-variant/10 hover:bg-surface-container-low/50 transition-colors">
            <td class="px-6 py-4 font-body-md text-on-surface" dir="ltr">${item.orderNumber || item.id?.slice(0,8) || '-'}</td>
            <td class="px-6 py-4 font-body-md text-on-surface">${item.supplier?.name || '-'}</td>
            <td class="px-6 py-4 font-body-md text-text-secondary">${item.orderDate?.split('T')[0] || '-'}</td>
            <td class="px-6 py-4"><span class="inline-flex items-center px-3 py-1 rounded-full font-label-sm text-label-sm ${statusCls[item.status] || statusCls.DRAFT}">${statusMap[item.status] || item.status || 'مسودة'}</span></td>
          </tr>
        `).join('')
      }
    } catch { el.querySelector('#table-tbody')!.innerHTML = '<tr><td colspan="4" class="px-6 py-8 text-center text-error font-body-md">حدث خطأ</td></tr>' }
  }
}
