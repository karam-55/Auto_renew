import { AuthService } from '../services/auth'
import { ApiClient } from '../api/client'
import { Router } from '../router'
import { AppLayout } from '../components/layout'

export class CashFlowScreen {
  constructor(private auth: AuthService, private api: ApiClient, private router: Router) {}
  render(): HTMLElement {
    const layout = new AppLayout(this.auth, this.router, 'التدفقات النقدية', 'payments', this.api)
    const c = document.createElement('div')
    c.className = 'page-enter min-h-screen bg-background p-gutter'
    c.innerHTML = `
      <div class="max-w-7xl mx-auto space-y-stack-lg">
        <div>
          <h1 class="font-beVietnamPro text-headline-md text-on-surface">التدفقات النقدية</h1>
          <p class="text-body-md text-text-secondary mt-1">تقرير مالي تفصيلي</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="bg-surface-container-lowest p-card-padding rounded-xl shadow-md hover-lift border border-surface-subtle relative overflow-hidden">
            <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary-fixed"></div>
            <p class="font-label-sm text-text-tertiary mb-1">إجمالي المدين</p>
            <h3 class="text-financial-data text-headline-lg text-on-surface">0</h3>
          </div>
          <div class="bg-surface-container-lowest p-card-padding rounded-xl shadow-md hover-lift border border-surface-subtle relative overflow-hidden">
            <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-secondary to-secondary-container"></div>
            <p class="font-label-sm text-text-tertiary mb-1">إجمالي الدائن</p>
            <h3 class="text-financial-data text-headline-lg text-on-surface">0</h3>
          </div>
          <div class="bg-surface-container-lowest p-card-padding rounded-xl shadow-md hover-lift border border-surface-subtle relative overflow-hidden">
            <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-tertiary to-tertiary-fixed"></div>
            <p class="font-label-sm text-text-tertiary mb-1">الرصيد</p>
            <h3 class="text-financial-data text-headline-lg text-on-surface">0</h3>
          </div>
        </div>
        <div class="bg-surface-container-lowest rounded-xl shadow-md border border-surface-subtle overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="bg-surface-subtle border-b border-outline-variant/10">
                  <th class="px-6 py-4 text-right font-label-sm text-label-sm text-text-tertiary uppercase">البيان</th>
                  <th class="px-6 py-4 text-right font-label-sm text-label-sm text-text-tertiary uppercase">المدين</th>
                  <th class="px-6 py-4 text-right font-label-sm text-label-sm text-text-tertiary uppercase">الدائن</th>
                </tr>
              </thead>
              <tbody>
                <tr><td colspan="3" class="px-6 py-8 text-center text-text-secondary font-body-md">لا توجد بيانات</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>`
    return layout.render(c)
  }
}
