import { AuthService } from '../services/auth'
import { ApiClient } from '../api/client'
import { Router } from '../router'
import { AppLayout } from '../components/layout'

export class CostCentersScreen {
  private auth: AuthService
  private api: ApiClient
  private router: Router

  constructor(auth: AuthService, api: ApiClient, router: Router) {
    this.auth = auth
    this.api = api
    this.router = router
  }

  render(): HTMLElement {
    const layout = new AppLayout(this.auth, this.router, 'مراكز التكلفة', 'cost-centers', this.api)
    const content = document.createElement('div')
    content.className = 'page-enter min-h-screen bg-background p-gutter'
    content.innerHTML = `
      <div class="max-w-7xl mx-auto space-y-stack-lg">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="font-beVietnamPro text-headline-md text-on-surface">مراكز التكلفة</h1>
            <p class="text-body-md text-text-secondary mt-1">إدارة مراكز التكلفة وتوزيع Overhead</p>
          </div>
          <div class="flex gap-3">
            <button class="h-[48px] bg-secondary text-on-secondary font-ibmPlexSans font-body-lg text-body-lg rounded-lg shadow-sm hover:shadow-lg hover:-translate-y-[1px] transition-all duration-200 flex items-center justify-center gap-2 px-6" id="init-defaults-btn">
              <span class="material-symbols-outlined text-[20px]">restart_alt</span>
              تهيئة افتراضية
            </button>
            <button class="h-[48px] bg-primary text-on-primary font-ibmPlexSans font-body-lg text-body-lg rounded-lg shadow-sm hover:shadow-lg hover:-translate-y-[1px] transition-all duration-200 flex items-center justify-center gap-2 px-6" id="refresh-rates-btn">
              <span class="material-symbols-outlined text-[20px]">calculate</span>
              معدلات Overhead
            </button>
          </div>
        </div>

        <div class="bg-surface-container-lowest rounded-xl shadow-md border border-surface-subtle p-card-padding">
          <h2 class="font-headline-sm text-on-surface mb-4">قائمة المراكز</h2>
          <div class="overflow-x-auto">
            <table class="w-full text-right">
              <thead>
                <tr class="border-b border-surface-subtle">
                  <th class="px-4 py-3 font-label-lg text-text-tertiary">الاسم</th>
                  <th class="px-4 py-3 font-label-lg text-text-tertiary">النوع</th>
                  <th class="px-4 py-3 font-label-lg text-text-tertiary">محرك التكلفة</th>
                  <th class="px-4 py-3 font-label-lg text-text-tertiary">الكمية</th>
                  <th class="px-4 py-3 font-label-lg text-text-tertiary">الميزانية الشهرية</th>
                  <th class="px-4 py-3 font-label-lg text-text-tertiary">الحالة</th>
                </tr>
              </thead>
              <tbody id="centers-tbody">
                <tr><td colspan="6" class="px-4 py-8 text-center text-text-secondary font-body-md">جاري التحميل...</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="bg-surface-container-lowest rounded-xl shadow-md border border-surface-subtle p-card-padding" id="rates-section" style="display:none">
          <h2 class="font-headline-sm text-on-surface mb-4">معدلات Overhead</h2>
          <div class="overflow-x-auto">
            <table class="w-full text-right">
              <thead>
                <tr class="border-b border-surface-subtle">
                  <th class="px-4 py-3 font-label-lg text-text-tertiary">المركز</th>
                  <th class="px-4 py-3 font-label-lg text-text-tertiary">محرك التكلفة</th>
                  <th class="px-4 py-3 font-label-lg text-text-tertiary">الكمية</th>
                  <th class="px-4 py-3 font-label-lg text-text-tertiary">الميزانية</th>
                  <th class="px-4 py-3 font-label-lg text-text-tertiary">موزع من مشترك</th>
                  <th class="px-4 py-3 font-label-lg text-text-tertiary">إجمالي الميزانية</th>
                  <th class="px-4 py-3 font-label-lg text-text-tertiary">المعدل</th>
                </tr>
              </thead>
              <tbody id="rates-tbody"></tbody>
            </table>
          </div>
        </div>
      </div>
    `
    this.loadCenters(content)
    content.querySelector('#init-defaults-btn')?.addEventListener('click', () => this.initDefaults(content))
    content.querySelector('#refresh-rates-btn')?.addEventListener('click', () => this.loadRates(content))
    return layout.render(content)
  }

  private async loadCenters(el: HTMLElement) {
    try {
      const res = await this.api.get<any>('/api/cost-centers')
      const tbody = el.querySelector('#centers-tbody')!
      if (res.success && res.data && res.data.length > 0) {
        tbody.innerHTML = res.data.map((c: any) => `
          <tr class="border-b border-surface-subtle/50 hover:bg-surface-subtle/30 transition-colors">
            <td class="px-4 py-3 font-body-md text-on-surface">${c.name}</td>
            <td class="px-4 py-3 font-body-md text-text-secondary">${this.translateType(c.type)}</td>
            <td class="px-4 py-3 font-body-md text-text-secondary">${this.translateDriver(c.costDriver)}</td>
            <td class="px-4 py-3 font-body-md text-text-secondary">${c.driverQuantity}</td>
            <td class="px-4 py-3 font-body-md text-financial-data">${(c.monthlyBudget || 0).toLocaleString('ar-SA')} ل.س</td>
            <td class="px-4 py-3">
              <span class="px-2 py-1 rounded-full text-xs font-label-sm ${c.isActive ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}">
                ${c.isActive ? 'نشط' : 'معطل'}
              </span>
            </td>
          </tr>
        `).join('')
      } else {
        tbody.innerHTML = '<tr><td colspan="6" class="px-4 py-8 text-center text-text-secondary font-body-md">لا توجد مراكز. اضغط "تهيئة افتراضية"</td></tr>'
      }
    } catch {
      el.querySelector('#centers-tbody')!.innerHTML = '<tr><td colspan="6" class="px-4 py-8 text-center text-error font-body-md">حدث خطأ</td></tr>'
    }
  }

  private async initDefaults(el: HTMLElement) {
    try {
      const res = await this.api.post<any>('/api/cost-centers/initialize', {})
      if (res.success) {
        ;(window as any).toast?.show?.({ message: 'تمت التهيئة بنجاح!', type: 'success' })
        this.loadCenters(el)
      }
    } catch (e: any) {
      ;(window as any).toast?.show?.({ message: e.message || 'فشل التهيئة', type: 'error' })
    }
  }

  private async loadRates(el: HTMLElement) {
    try {
      const res = await this.api.get<any>('/api/cost-centers/overhead-rates/all')
      const section = el.querySelector('#rates-section') as HTMLElement
      const tbody = el.querySelector('#rates-tbody')!
      if (res.success && res.data && res.data.length > 0) {
        section.style.display = 'block'
        tbody.innerHTML = res.data.map((r: any) => `
          <tr class="border-b border-surface-subtle/50 hover:bg-surface-subtle/30 transition-colors">
            <td class="px-4 py-3 font-body-md text-on-surface">${r.costCenterName}</td>
            <td class="px-4 py-3 font-body-md text-text-secondary">${this.translateDriver(r.costDriver)}</td>
            <td class="px-4 py-3 font-body-md text-text-secondary">${r.driverQuantity}</td>
            <td class="px-4 py-3 font-body-md text-text-secondary">${(r.monthlyBudget || 0).toLocaleString('ar-SA')}</td>
            <td class="px-4 py-3 font-body-md text-text-secondary">${(r.allocatedFromShared || 0).toLocaleString('ar-SA')}</td>
            <td class="px-4 py-3 font-body-md text-financial-data">${(r.totalBudget || 0).toLocaleString('ar-SA')}</td>
            <td class="px-4 py-3 font-body-md text-primary font-bold">${(r.rate || 0).toLocaleString('ar-SA')} ${r.rateUnit}</td>
          </tr>
        `).join('')
      }
    } catch {
      ;(window as any).toast?.show?.({ message: 'خطأ في تحميل المعدلات', type: 'error' })
    }
  }

  private translateType(type: string): string {
    const map: Record<string, string> = {
      WORKSHOP: 'ورشة', WAREHOUSE: 'مستودع', CAR_WASH: 'غسيل',
      RECEPTION: 'استقبال', ADMIN: 'إدارة', SHARED: 'مشترك'
    }
    return map[type] || type
  }

  private translateDriver(driver: string): string {
    const map: Record<string, string> = {
      LABOR_HOURS: 'ساعات عمل', MATERIAL_MOVES: 'حركات مخزن',
      SERVICE_COUNT: 'عدد خدمات', INVOICE_COUNT: 'عدد فواتير',
      FIXED: 'ثابت', REVENUE_ALLOCATION: 'توزيع إيرادات'
    }
    return map[driver] || driver
  }
}
