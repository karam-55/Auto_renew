import { AuthService } from '../services/auth'
import { ApiClient } from '../api/client'
import { Router } from '../router'
import { AppLayout } from '../components/layout'

export class ReportsScreen {
  constructor(private auth: AuthService, private api: ApiClient, private router: Router) {}
  render(): HTMLElement {
    const layout = new AppLayout(this.auth, this.router, 'التقارير', 'analytics', this.api)
    const c = document.createElement('div')
    c.className = 'page-enter min-h-screen bg-background p-gutter'
    c.innerHTML = `
      <div class="max-w-7xl mx-auto space-y-stack-lg">
        <div>
          <h1 class="font-beVietnamPro text-headline-md text-on-surface">مركز التقارير</h1>
          <p class="text-body-md text-text-secondary mt-1">جميع التقارير والتحليلات المتاحة</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          ${this.reportCard('الإيرادات', 'bar_chart', 'تقرير الإيرادات اليومية والشهرية', 'primary', '/reports/revenue')}
          ${this.reportCard('الأرباح والخسائر', 'pie_chart', 'قائمة الدخل التفصيلية', 'secondary', '/accounting/income-statement')}
          ${this.reportCard('المخزون', 'stacked_bar_chart', 'تقرير حركة المخزون والتكلفة', 'tertiary', '/reports/inventory')}
          ${this.reportCard('العملاء', 'groups', 'تحليل سلوك العملاء والولاء', 'info', '/reports/customers')}
          ${this.reportCard('الحجوزات', 'trending_up', 'تحليل أداء الحجوزات', 'warning', '/reports/bookings')}
          ${this.reportCard('الميزانية العمومية', 'account_balance_wallet', 'الأصول والالتزامات وحقوق الملكية', 'primary', '/accounting/balance-sheet')}
        </div>
      </div>
    `
    c.querySelectorAll('[data-route]').forEach(el => {
      el.addEventListener('click', () => {
        const route = el.getAttribute('data-route')
        if (route) this.router.navigate(route)
      })
    })
    return layout.render(c)
  }

  private reportCard(title: string, icon: string, desc: string, color: string, route?: string): string {
    const colorMap: Record<string, string> = {
      primary: 'bg-primary/5 text-primary hover:bg-primary/10',
      secondary: 'bg-secondary/5 text-secondary hover:bg-secondary/10',
      tertiary: 'bg-tertiary/5 text-tertiary hover:bg-tertiary/10',
      info: 'bg-info/5 text-info hover:bg-info/10',
      warning: 'bg-warning/5 text-warning hover:bg-warning/10',
    }
    const cls = colorMap[color] || colorMap.primary
    return `
      <div class="bg-surface-container-lowest p-card-padding rounded-xl shadow-md hover:shadow-lg border border-surface-subtle hover:-translate-y-1 transition-all duration-300 cursor-pointer group" ${route ? `data-route="${route}"` : ''}>
        <div class="flex items-start gap-4 mb-4">
          <div class="w-12 h-12 rounded-xl ${cls} flex items-center justify-center shrink-0 transition-colors">
            <span class="material-symbols-outlined text-[24px]" style="font-variation-settings: 'FILL' 1;">${icon}</span>
          </div>
        </div>
        <h3 class="font-headline-md text-lg text-on-surface font-semibold mb-2 group-hover:text-primary transition-colors">${title}</h3>
        <p class="text-text-secondary font-body-md text-sm">${desc}</p>
      </div>
    `
  }
}
