import { AuthService } from '../services/auth'
import { ApiClient } from '../api/client'
import { Router } from '../router'
import { AppLayout } from '../components/layout'

export class AccountingScreen {
  constructor(private auth: AuthService, private api: ApiClient, private router: Router) {}
  render(): HTMLElement {
    const layout = new AppLayout(this.auth, this.router, 'المحاسبة', 'account_balance_wallet', this.api)
    const c = document.createElement('div')
    c.className = 'page-enter min-h-screen bg-background p-gutter'
    c.innerHTML = `
      <div class="max-w-7xl mx-auto space-y-stack-lg">
        <div>
          <h1 class="font-beVietnamPro text-headline-md text-on-surface">المحاسبة المالية</h1>
          <p class="text-body-md text-text-secondary mt-1">إدارة الحسابات والقيود والتقارير المالية</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          ${this.navCard('شجرة الحسابات', 'account_tree', 'إدارة وهيكلة دليل الحسابات', '/accounting/chart-of-accounts', 'primary')}
          ${this.navCard('القيود اليومية', 'receipt', 'تسجيل ومراجعة القيود المحاسبية', '/accounting/journal-entries', 'secondary')}
          ${this.navCard('دفتر الأستاذ', 'menu_book', 'استعراض حركات الحسابات التفصيلية', '/accounting/general-ledger', 'info')}
          ${this.navCard('ميزان المراجعة', 'scale', 'التحقق من توازن الحسابات', '/accounting/trial-balance', 'tertiary')}
          ${this.navCard('الميزانية العمومية', 'balance', 'تقرير الأصول والخصوم وحقوق الملكية', '/accounting/balance-sheet', 'primary')}
          ${this.navCard('قائمة الدخل', 'trending_up', 'تقرير الإيرادات والمصروفات والأرباح', '/accounting/income-statement', 'secondary')}
          ${this.navCard('التدفقات النقدية', 'payments', 'تحليل حركات النقد الداخلة والخارجة', '/accounting/cash-flow', 'info')}
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

  private navCard(title: string, icon: string, desc: string, route: string, color: string): string {
    const colorMap: Record<string, string> = {
      primary: 'bg-primary/5 text-primary hover:bg-primary/10 border-primary/20',
      secondary: 'bg-secondary/5 text-secondary hover:bg-secondary/10 border-secondary/20',
      tertiary: 'bg-tertiary/5 text-tertiary hover:bg-tertiary/10 border-tertiary/20',
      info: 'bg-info/5 text-info hover:bg-info/10 border-info/20',
    }
    const cls = colorMap[color] || colorMap.primary
    return `
      <div class="bg-surface-container-lowest p-card-padding rounded-xl shadow-md hover:shadow-lg border border-surface-subtle hover:-translate-y-1 transition-all duration-300 cursor-pointer group" data-route="${route}">
        <div class="flex items-start gap-4">
          <div class="w-12 h-12 rounded-xl ${cls} flex items-center justify-center shrink-0 transition-colors">
            <span class="material-symbols-outlined text-[24px]" style="font-variation-settings: 'FILL' 1;">${icon}</span>
          </div>
          <div class="flex-1">
            <h3 class="font-headline-md text-lg text-on-surface font-semibold mb-1 group-hover:text-primary transition-colors">${title}</h3>
            <p class="text-text-secondary font-body-md text-sm">${desc}</p>
          </div>
          <span class="material-symbols-outlined text-text-tertiary group-hover:text-primary transition-colors">arrow_back</span>
        </div>
      </div>
    `
  }
}
