import { AuthService } from '../services/auth'
import { ApiClient } from '../api/client'
import { Router } from '../router'
import { AppLayout } from '../components/layout'

export class GeneralLedgerScreen {
  constructor(private auth: AuthService, private api: ApiClient, private router: Router) {}
  render(): HTMLElement {
    const layout = new AppLayout(this.auth, this.router, 'دفتر الأستاذ', 'menu_book', this.api)
    const c = document.createElement('div')
    c.className = 'page-enter min-h-screen bg-background p-gutter'
    c.innerHTML = `
      <div class="max-w-7xl mx-auto space-y-stack-lg">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="font-beVietnamPro text-headline-md text-on-surface">دفتر الأستاذ</h1>
          </div>
        </div>
        <div class="glass-panel rounded-xl shadow-lg border border-border p-card-padding">
          <div class="relative">
            <span class="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline">search</span>
            <input class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg pr-10 pl-4 font-ibmPlexSans font-body-md text-body-md text-on-surface placeholder:text-outline-variant focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow duration-200" placeholder="بحث بالحساب..." id="search-input"/>
          </div>
        </div>
        <div class="bg-surface-container-lowest rounded-xl shadow-md border border-surface-subtle overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="bg-surface-subtle border-b border-outline-variant/10">
                  <th class="px-6 py-4 text-right font-label-sm text-label-sm text-text-tertiary uppercase">التاريخ</th><th class="px-6 py-4 text-right font-label-sm text-label-sm text-text-tertiary uppercase">الحساب</th><th class="px-6 py-4 text-right font-label-sm text-label-sm text-text-tertiary uppercase">المرجع</th><th class="px-6 py-4 text-right font-label-sm text-label-sm text-text-tertiary uppercase">مدين</th><th class="px-6 py-4 text-right font-label-sm text-label-sm text-text-tertiary uppercase">دائن</th><th class="px-6 py-4 text-right font-label-sm text-label-sm text-text-tertiary uppercase">الرصيد</th>
                </tr>
              </thead>
              <tbody id="table-tbody">
                <tr><td colspan="6" class="px-6 py-8 text-center text-text-secondary"><div class="skeleton-shimmer h-4 rounded w-32 mx-auto"></div></td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>`
    this.loadData(c)
    return layout.render(c)
  }
  private async loadData(el: HTMLElement) {
    const tbody = el.querySelector('#table-tbody')!
    // Show skeleton rows immediately
    tbody.innerHTML = Array(5).fill(`<tr><td colspan="6" class="px-6 py-3"><div class="skeleton-shimmer h-8 rounded w-full"></div></td></tr>`).join('')
    
    try {
      // Add limit to reduce load time
      const res = await this.api.get<any>('/api/general-ledger?limit=50')
      if (res.success && res.data) {
        const items = Array.isArray(res.data) ? res.data : res.data.data || []
        if (items.length === 0) { tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-8 text-center text-text-secondary font-body-md">لا توجد بيانات</td></tr>'; return }
        tbody.innerHTML = items.map((item: any) => `
          <tr class="border-b border-outline-variant/10 hover:bg-surface-container-low/50 transition-colors">
            <td class="px-6 py-4 font-body-md text-on-surface">${item.date?.split('T')[0] || '-'}</td>
            <td class="px-6 py-4 font-body-md text-on-surface">${item.account?.name || item.accountName || '-'}</td>
            <td class="px-6 py-4 font-body-md text-on-surface" dir="ltr">${item.reference || item.journalEntryId?.slice(0,8) || '-'}</td>
            <td class="px-6 py-4 text-financial-data text-on-surface" dir="ltr">${item.debit?.toLocaleString('ar-SA') || '0'}</td>
            <td class="px-6 py-4 text-financial-data text-on-surface" dir="ltr">${item.credit?.toLocaleString('ar-SA') || '0'}</td>
            <td class="px-6 py-4 text-financial-data text-primary" dir="ltr">${(item.runningBalance || item.balance || 0).toLocaleString('ar-SA')}</td>
          </tr>
        `).join('')
      }
    } catch { tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-8 text-center text-error font-body-md">حدث خطأ</td></tr>' }
  }
}
