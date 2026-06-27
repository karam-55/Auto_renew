import { AuthService } from '../services/auth'
import { ApiClient } from '../api/client'
import { Router } from '../router'
import { AppLayout } from '../components/layout'
import { canAccess } from '../utils/role-permissions'

interface ReportCardDef {
  title: string
  icon: string
  desc: string
  color: string
  route: string
  category: string
}

const REPORT_CARDS: ReportCardDef[] = [
  { title: 'الإيرادات', icon: 'bar_chart', desc: 'تقرير الإيرادات اليومية والشهرية', color: 'primary', route: '/reports/revenue', category: 'المالية' },
  { title: 'الأرباح والخسائر', icon: 'pie_chart', desc: 'قائمة الدخل التفصيلية', color: 'secondary', route: '/accounting/income-statement', category: 'المالية' },
  { title: 'المخزون', icon: 'stacked_bar_chart', desc: 'تقرير حركة المخزون والتكلفة', color: 'tertiary', route: '/reports/inventory', category: 'المخزون' },
  { title: 'العملاء', icon: 'groups', desc: 'تحليل سلوك العملاء والولاء', color: 'info', route: '/reports/customers', category: 'العملاء' },
  { title: 'الحجوزات', icon: 'trending_up', desc: 'تحليل أداء الحجوزات', color: 'warning', route: '/reports/bookings', category: 'العمليات' },
  { title: 'الميزانية العمومية', icon: 'account_balance_wallet', desc: 'الأصول والالتزامات وحقوق الملكية', color: 'primary', route: '/accounting/balance-sheet', category: 'المالية' },
  { title: 'ميزان المراجعة', icon: 'scale', desc: 'أرصدة الحسابات في فترة محددة', color: 'secondary', route: '/accounting/trial-balance', category: 'المالية' },
  { title: 'التدفقات النقدية', icon: 'payments', desc: 'تقرير التدفقات النقدية', color: 'tertiary', route: '/accounting/cash-flow', category: 'المالية' },
  { title: 'دفتر الأستاذ', icon: 'menu_book', desc: 'قيود الأستاذ العام', color: 'info', route: '/accounting/general-ledger', category: 'المالية' },
  { title: 'القيود اليومية', icon: 'receipt', desc: 'سجل القيود المحاسبية', color: 'warning', route: '/accounting/journal-entries', category: 'المالية' },
  { title: 'التحليلات', icon: 'insights', desc: 'لوحة التحليلات المتقدمة', color: 'primary', route: '/analytics', category: 'التحليلات' },
]

export class ReportsScreen {
  constructor(private auth: AuthService, private api: ApiClient, private router: Router) {}
  render(): HTMLElement {
    const layout = new AppLayout(this.auth, this.router, 'التقارير', 'analytics', this.api)
    const userRole = this.auth.getUser()?.role
    const visibleReports = userRole ? REPORT_CARDS.filter(r => canAccess(userRole, r.route)) : REPORT_CARDS
    const categories = [...new Set(visibleReports.map(r => r.category))]
    const c = document.createElement('div')
    c.className = 'page-enter min-h-screen bg-background p-gutter'
    c.innerHTML = `
      <div class="max-w-7xl mx-auto space-y-stack-lg">
        <div>
          <h1 class="font-beVietnamPro text-headline-md text-on-surface">مركز التقارير</h1>
          <p class="text-body-md text-text-secondary mt-1">جميع التقارير والتحليلات المتاحة (${visibleReports.length})</p>
        </div>
        ${categories.map(cat => `
          <div>
            <h2 class="font-headline-md text-lg text-on-surface font-semibold mb-4 flex items-center gap-2">
              <span class="w-1 h-6 rounded-full bg-primary"></span>
              ${cat}
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              ${visibleReports.filter(r => r.category === cat).map(r => this.reportCard(r)).join('')}
            </div>
          </div>
        `).join('')}
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

  private reportCard(r: ReportCardDef): string {
    const colorMap: Record<string, string> = {
      primary: 'bg-primary/5 text-primary hover:bg-primary/10',
      secondary: 'bg-secondary/5 text-secondary hover:bg-secondary/10',
      tertiary: 'bg-tertiary/5 text-tertiary hover:bg-tertiary/10',
      info: 'bg-info/5 text-info hover:bg-info/10',
      warning: 'bg-warning/5 text-warning hover:bg-warning/10',
    }
    const cls = colorMap[r.color] || colorMap.primary
    return `
      <div class="bg-surface-container-lowest p-card-padding rounded-xl shadow-md hover:shadow-lg border border-surface-subtle hover:-translate-y-1 transition-all duration-300 cursor-pointer group" data-route="${r.route}">
        <div class="flex items-start gap-4 mb-4">
          <div class="w-12 h-12 rounded-xl ${cls} flex items-center justify-center shrink-0 transition-colors">
            <span class="material-symbols-outlined text-[24px]" style="font-variation-settings: 'FILL' 1;">${r.icon}</span>
          </div>
        </div>
        <h3 class="font-headline-md text-lg text-on-surface font-semibold mb-2 group-hover:text-primary transition-colors">${r.title}</h3>
        <p class="text-text-secondary font-body-md text-sm">${r.desc}</p>
      </div>
    `
  }
}
