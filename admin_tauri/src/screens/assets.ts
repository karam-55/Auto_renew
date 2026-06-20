import { AuthService } from '../services/auth'
import { ApiClient } from '../api/client'
import { Router } from '../router'
import { AppLayout } from '../components/layout'

export class AssetsScreen {
  private auth: AuthService
  private api: ApiClient
  private router: Router

  constructor(auth: AuthService, api: ApiClient, router: Router) {
    this.auth = auth
    this.api = api
    this.router = router
  }

  render(): HTMLElement {
    const layout = new AppLayout(this.auth, this.router, 'الأصول والاستهلاك', 'assets', this.api)
    const content = document.createElement('div')
    content.className = 'page-enter min-h-screen bg-background p-gutter'
    content.innerHTML = `
      <div class="max-w-7xl mx-auto space-y-stack-lg">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="font-beVietnamPro text-headline-md text-on-surface">الأصول والاستهلاك</h1>
            <p class="text-body-md text-text-secondary mt-1">إدارة الأصول وحساب الاستهلاك الشهري</p>
          </div>
        </div>

        <div class="bg-surface-container-lowest rounded-xl shadow-md border border-surface-subtle p-card-padding">
          <h2 class="font-headline-sm text-on-surface mb-4">الأصول</h2>
          <div class="overflow-x-auto">
            <table class="w-full text-right">
              <thead>
                <tr class="border-b border-surface-subtle">
                  <th class="px-4 py-3 font-label-lg text-text-tertiary">الاسم</th>
                  <th class="px-4 py-3 font-label-lg text-text-tertiary">الفئة</th>
                  <th class="px-4 py-3 font-label-lg text-text-tertiary">تكلفة الشراء</th>
                  <th class="px-4 py-3 font-label-lg text-text-tertiary">الاستهلاك الشهري</th>
                  <th class="px-4 py-3 font-label-lg text-text-tertiary">الاستهلاك التراكمي</th>
                  <th class="px-4 py-3 font-label-lg text-text-tertiary">الحالة</th>
                </tr>
              </thead>
              <tbody id="assets-tbody">
                <tr><td colspan="6" class="px-4 py-8 text-center text-text-secondary font-body-md">جاري التحميل...</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="bg-surface-container-lowest rounded-xl shadow-md border border-surface-subtle p-card-padding">
          <h2 class="font-headline-sm text-on-surface mb-4">فئات الأصول</h2>
          <div class="overflow-x-auto">
            <table class="w-full text-right">
              <thead>
                <tr class="border-b border-surface-subtle">
                  <th class="px-4 py-3 font-label-lg text-text-tertiary">الاسم</th>
                  <th class="px-4 py-3 font-label-lg text-text-tertiary">طريقة الاستهلاك</th>
                  <th class="px-4 py-3 font-label-lg text-text-tertiary">العمر الافتراضي (سنوات)</th>
                </tr>
              </thead>
              <tbody id="assets-categories-tbody">
                <tr><td colspan="3" class="px-4 py-8 text-center text-text-secondary font-body-md">جاري التحميل...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `
    this.loadAssets(content)
    this.loadCategories(content)
    return layout.render(content)
  }

  private async loadAssets(el: HTMLElement) {
    try {
      const res = await this.api.get<any>('/api/assets')
      const tbody = el.querySelector('#assets-tbody')!
      if (res.success && res.data && res.data.length > 0) {
        tbody.innerHTML = res.data.map((a: any) => `
          <tr class="border-b border-surface-subtle/50 hover:bg-surface-subtle/30 transition-colors">
            <td class="px-4 py-3 font-body-md text-on-surface">${a.name}</td>
            <td class="px-4 py-3 font-body-md text-text-secondary">${a.categoryName || '-'}</td>
            <td class="px-4 py-3 font-body-md text-text-secondary">${(a.purchaseCost || 0).toLocaleString('ar-SA')} ل.س</td>
            <td class="px-4 py-3 font-body-md text-financial-data">${(a.monthlyDepreciation || 0).toLocaleString('ar-SA')} ل.س</td>
            <td class="px-4 py-3 font-body-md text-text-secondary">${(a.accumulatedDepreciation || 0).toLocaleString('ar-SA')} ل.س</td>
            <td class="px-4 py-3">
              <span class="px-2 py-1 rounded-full text-xs font-label-sm ${a.isActive ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}">
                ${a.isActive ? 'نشط' : 'معطل'}
              </span>
            </td>
          </tr>
        `).join('')
      } else {
        tbody.innerHTML = '<tr><td colspan="6" class="px-4 py-8 text-center text-text-secondary font-body-md">لا توجد أصول</td></tr>'
      }
    } catch {
      el.querySelector('#assets-tbody')!.innerHTML = '<tr><td colspan="6" class="px-4 py-8 text-center text-error font-body-md">حدث خطأ</td></tr>'
    }
  }

  private async loadCategories(el: HTMLElement) {
    try {
      const res = await this.api.get<any>('/api/assets/categories')
      const tbody = el.querySelector('#assets-categories-tbody')!
      if (res.success && res.data && res.data.length > 0) {
        tbody.innerHTML = res.data.map((c: any) => `
          <tr class="border-b border-surface-subtle/50 hover:bg-surface-subtle/30 transition-colors">
            <td class="px-4 py-3 font-body-md text-on-surface">${c.name}</td>
            <td class="px-4 py-3 font-body-md text-text-secondary">${this.translateMethod(c.depreciationMethod)}</td>
            <td class="px-4 py-3 font-body-md text-text-secondary">${c.usefulLifeYears}</td>
          </tr>
        `).join('')
      } else {
        tbody.innerHTML = '<tr><td colspan="3" class="px-4 py-8 text-center text-text-secondary font-body-md">لا توجد فئات</td></tr>'
      }
    } catch {
      el.querySelector('#assets-categories-tbody')!.innerHTML = '<tr><td colspan="3" class="px-4 py-8 text-center text-error font-body-md">حدث خطأ</td></tr>'
    }
  }

  private translateMethod(method: string): string {
    const map: Record<string, string> = {
      STRAIGHT_LINE: 'خط مستقيم',
      DECLINING_BALANCE: 'الرصيد المتناقص',
      UNITS_OF_PRODUCTION: 'وحدات الإنتاج'
    }
    return map[method] || method
  }
}
