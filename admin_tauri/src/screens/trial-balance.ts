import { AuthService } from '../services/auth'
import { ApiClient } from '../api/client'
import { Router } from '../router'
import { AppLayout } from '../components/layout'

export class TrialBalanceScreen {
  constructor(private auth: AuthService, private api: ApiClient, private router: Router) {}
  render(): HTMLElement {
    const layout = new AppLayout(this.auth, this.router, 'ميزان المراجعة', 'scale', this.api)
    const c = document.createElement('div')
    c.className = 'page-enter min-h-screen bg-background p-gutter'
    c.innerHTML = `
      <div class="max-w-7xl mx-auto space-y-stack-lg">
        <div>
          <h1 class="font-beVietnamPro text-headline-md text-on-surface">ميزان المراجعة</h1>
          <p class="text-body-md text-text-secondary mt-1">أرصدة الحسابات من القيود المرحلة ضمن الفترة المحددة.</p>
        </div>
        <section class="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-4">
          <label class="text-label-sm text-text-secondary">من تاريخ
            <input id="tb-from" type="date" class="mt-1 block min-h-[44px] rounded-lg border border-border bg-surface-subtle px-3 text-on-surface" />
          </label>
          <label class="text-label-sm text-text-secondary">إلى تاريخ
            <input id="tb-to" type="date" class="mt-1 block min-h-[44px] rounded-lg border border-border bg-surface-subtle px-3 text-on-surface" />
          </label>
          <button id="tb-refresh" type="button" class="min-h-[44px] rounded-lg bg-primary px-5 font-semibold text-white">تحديث الميزان</button>
          <label class="mr-auto inline-flex min-h-[44px] items-center gap-2 text-body-sm text-text-secondary">
            <input id="tb-show-zero" type="checkbox" class="h-5 w-5 accent-primary" />
            إظهار الحسابات بدون حركة
          </label>
        </section>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="bg-surface-container-lowest p-card-padding rounded-xl shadow-md hover-lift border border-surface-subtle relative overflow-hidden">
            <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary-fixed"></div>
            <p class="font-label-sm text-text-tertiary mb-1">إجمالي المدين</p>
            <h3 id="tb-debit" class="text-financial-data text-headline-lg text-on-surface"><div class="skeleton-shimmer h-8 rounded w-24"></div></h3>
          </div>
          <div class="bg-surface-container-lowest p-card-padding rounded-xl shadow-md hover-lift border border-surface-subtle relative overflow-hidden">
            <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-secondary to-secondary-container"></div>
            <p class="font-label-sm text-text-tertiary mb-1">إجمالي الدائن</p>
            <h3 id="tb-credit" class="text-financial-data text-headline-lg text-on-surface"><div class="skeleton-shimmer h-8 rounded w-24"></div></h3>
          </div>
          <div class="bg-surface-container-lowest p-card-padding rounded-xl shadow-md hover-lift border border-surface-subtle relative overflow-hidden">
            <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-tertiary to-tertiary-fixed"></div>
            <p class="font-label-sm text-text-tertiary mb-1">الفرق بين المدين والدائن</p>
            <h3 id="tb-balance" class="text-financial-data text-headline-lg text-on-surface"><div class="skeleton-shimmer h-8 rounded w-24"></div></h3>
            <p id="tb-status" class="mt-1 text-body-sm text-text-secondary"></p>
          </div>
        </div>
        <div class="bg-surface-container-lowest rounded-xl shadow-md border border-surface-subtle overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="bg-surface-subtle border-b border-outline-variant/10">
                  <th class="px-6 py-4 text-right font-label-sm text-label-sm text-text-tertiary uppercase">الرمز</th>
                  <th class="px-6 py-4 text-right font-label-sm text-label-sm text-text-tertiary uppercase">الحساب</th>
                  <th class="px-6 py-4 text-right font-label-sm text-label-sm text-text-tertiary uppercase">المدين</th>
                  <th class="px-6 py-4 text-right font-label-sm text-label-sm text-text-tertiary uppercase">الدائن</th>
                  <th class="px-6 py-4 text-right font-label-sm text-label-sm text-text-tertiary uppercase">الرصيد</th>
                </tr>
              </thead>
              <tbody id="tb-tbody">
                <tr><td colspan="5" class="px-6 py-8 text-center text-text-secondary font-body-md">جاري التحميل...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>`
    this.loadData(c)
    c.querySelector('#tb-refresh')?.addEventListener('click', () => this.loadData(c))
    c.querySelector('#tb-show-zero')?.addEventListener('change', () => this.loadData(c))
    return layout.render(c)
  }

  private async loadData(c: HTMLElement) {
    try {
      const fromInput = c.querySelector('#tb-from') as HTMLInputElement
      const toInput = c.querySelector('#tb-to') as HTMLInputElement
      const now = new Date()
      if (!fromInput.value) fromInput.value = `${now.getFullYear()}-01-01`
      if (!toInput.value) toInput.value = now.toISOString().slice(0, 10)
      const params = new URLSearchParams({
        fromDate: `${fromInput.value}T00:00:00.000Z`,
        toDate: `${toInput.value}T23:59:59.999Z`,
        currency: 'SYP',
      })
      const res: any = await this.api.get(`/api/reports/trial-balance?${params.toString()}`, false)
      if (res.success === false) throw new Error(res.message || 'تعذر تحميل ميزان المراجعة')
      const data = res.data || {}
      const items = Array.isArray(data) ? data : data.accounts || data.items || []
      const totalDebit = data.totalDebit ?? items.reduce((sum: number, i: any) => sum + (Number(i.debit) || 0), 0)
      const totalCredit = data.totalCredit ?? items.reduce((sum: number, i: any) => sum + (Number(i.credit) || 0), 0)

      const debitEl = c.querySelector('#tb-debit')
      const creditEl = c.querySelector('#tb-credit')
      const balanceEl = c.querySelector('#tb-balance')
      if (debitEl) debitEl.textContent = Number(totalDebit).toLocaleString('ar-SA') + ' ل.س'
      if (creditEl) creditEl.textContent = Number(totalCredit).toLocaleString('ar-SA') + ' ل.س'
      if (balanceEl) balanceEl.textContent = Number(data.difference ?? totalDebit - totalCredit).toLocaleString('ar-SA') + ' ل.س'
      const statusEl = c.querySelector('#tb-status')
      if (statusEl) {
        statusEl.textContent = data.isBalanced === false ? 'غير متوازن — راجع القيود' : 'متوازن'
        statusEl.className = `mt-1 text-body-sm ${data.isBalanced === false ? 'text-error' : 'text-success'}`
      }

      const tbody = c.querySelector('#tb-tbody')!
      const visibleItems = (c.querySelector('#tb-show-zero') as HTMLInputElement).checked
        ? items
        : items.filter((item: any) => Number(item.debitTotal ?? item.debit ?? 0) !== 0 || Number(item.creditTotal ?? item.credit ?? 0) !== 0 || Number(item.balance || 0) !== 0)
      if (visibleItems.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-text-secondary font-body-md">لا توجد بيانات</td></tr>'
        return
      }
      tbody.innerHTML = visibleItems.map((i: any) => `
        <tr class="border-b border-outline-variant/10 hover:bg-surface-container-low/50 transition-colors">
          <td class="px-6 py-4 font-body-md text-on-surface font-semibold" dir="ltr">${i.accountCode || i.code || '-'}</td>
          <td class="px-6 py-4 font-body-md text-on-surface">${i.accountNameAr || i.nameAr || i.accountName || i.name || '-'}</td>
          <td class="px-6 py-4 font-body-md text-financial-data">${Number(i.debitTotal ?? i.debit ?? 0).toLocaleString('ar-SY')} ل.س</td>
          <td class="px-6 py-4 font-body-md text-financial-data">${Number(i.creditTotal ?? i.credit ?? 0).toLocaleString('ar-SY')} ل.س</td>
          <td class="px-6 py-4 font-body-md text-financial-data font-semibold">${Number(i.balance || 0).toLocaleString('ar-SY')} ${i.balanceType === 'CREDIT' ? 'دائن' : 'مدين'}</td>
        </tr>
      `).join('')
    } catch (error: any) {
      c.querySelector('#tb-debit')!.textContent = '—'
      c.querySelector('#tb-credit')!.textContent = '—'
      c.querySelector('#tb-balance')!.textContent = '—'
      c.querySelector('#tb-status')!.textContent = error.message || 'فشل تحميل البيانات'
      c.querySelector('#tb-status')!.className = 'mt-1 text-body-sm text-error'
      c.querySelector('#tb-tbody')!.innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-error font-body-md">فشل تحميل البيانات</td></tr>'
    }
  }
}
