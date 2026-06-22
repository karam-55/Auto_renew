import { AuthService } from '../services/auth'
import { ApiClient } from '../api/client'
import { Router } from '../router'
import { AppLayout } from '../components/layout'

export class DealerDetailScreen {
  constructor(
    private auth: AuthService,
    private api: ApiClient,
    private router: Router,
    private dealerId: string
  ) {}

  render(): HTMLElement {
    const layout = new AppLayout(this.auth, this.router, 'تفاصيل الوكيل', 'business_center', this.api)
    const c = document.createElement('div')
    c.className = 'page-enter min-h-screen bg-background p-gutter'
    c.innerHTML = `
      <div class="max-w-4xl mx-auto space-y-stack-lg">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="font-beVietnamPro text-headline-md text-on-surface">تفاصيل الوكيل</h1>
            <p class="text-body-md text-text-secondary mt-1">بيانات الوكيل والكفالات المسجلة</p>
          </div>
          <button class="h-[48px] px-4 bg-surface-subtle text-on-surface font-ibmPlexSans font-body-lg rounded-lg border border-border hover:bg-surface-container-low transition-colors flex items-center gap-2" id="back-btn">
            <span class="material-symbols-outlined text-[20px]">arrow_forward</span>
            رجوع
          </button>
        </div>

        <div id="dealer-card" class="bg-surface-container-lowest rounded-xl shadow-md border border-surface-subtle overflow-hidden">
          <div class="p-6 border-b border-outline-variant/10 bg-surface-subtle flex items-center gap-4">
            <div class="w-14 h-14 rounded-full bg-primary-fixed text-primary flex items-center justify-center">
              <span class="material-symbols-outlined text-[28px]">store</span>
            </div>
            <div>
              <h3 class="font-headline-md text-lg text-on-surface font-semibold" id="dealer-name">...</h3>
              <p class="text-text-secondary font-body-md" id="dealer-company">...</p>
            </div>
          </div>
          <div class="p-6 space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><p class="font-label-sm text-text-tertiary mb-1">رقم الهاتف</p><p class="font-body-md text-on-surface font-semibold" dir="ltr" id="dealer-phone">...</p></div>
              <div><p class="font-label-sm text-text-tertiary mb-1">العنوان</p><p class="font-body-md text-on-surface font-semibold" id="dealer-address">...</p></div>
              <div><p class="font-label-sm text-text-tertiary mb-1">الحالة</p><p class="font-body-md text-on-surface font-semibold" id="dealer-status">...</p></div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div class="bg-surface-container-lowest rounded-xl shadow-md border border-surface-subtle p-5">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center"><span class="material-symbols-outlined">people</span></div>
              <div><p class="text-text-tertiary font-label-sm">العملاء</p><p class="text-on-surface font-headline-md font-semibold" id="stat-customers">0</p></div>
            </div>
          </div>
          <div class="bg-surface-container-lowest rounded-xl shadow-md border border-surface-subtle p-5">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-info/10 text-info flex items-center justify-center"><span class="material-symbols-outlined">shield_moon</span></div>
              <div><p class="text-text-tertiary font-label-sm">الكفالات</p><p class="text-on-surface font-headline-md font-semibold" id="stat-warranties">0</p></div>
            </div>
          </div>
          <div class="bg-surface-container-lowest rounded-xl shadow-md border border-surface-subtle p-5">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-success/10 text-success flex items-center justify-center"><span class="material-symbols-outlined">payments</span></div>
              <div><p class="text-text-tertiary font-label-sm">إجمالي المدفوع (ل.س)</p><p class="text-on-surface font-headline-md font-semibold" id="stat-amount-syp">0</p></div>
            </div>
          </div>
          <div class="bg-surface-container-lowest rounded-xl shadow-md border border-surface-subtle p-5">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-accent/10 text-accent flex items-center justify-center"><span class="material-symbols-outlined">attach_money</span></div>
              <div><p class="text-text-tertiary font-label-sm">إجمالي المدفوع ($)</p><p class="text-on-surface font-headline-md font-semibold" id="stat-amount-usd">0</p></div>
            </div>
          </div>
        </div>

        <div class="bg-surface-container-lowest rounded-xl shadow-md border border-surface-subtle p-card-padding">
          <h3 class="font-headline-md text-lg text-on-surface font-semibold mb-4 flex items-center gap-2">
            <span class="material-symbols-outlined text-primary">shield_moon</span>
            الكفالات المسجلة
          </h3>
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="bg-surface-subtle border-b border-outline-variant/10">
                  <th class="px-4 py-3 text-right font-label-sm text-label-sm text-text-tertiary">العميل</th>
                  <th class="px-4 py-3 text-right font-label-sm text-label-sm text-text-tertiary">المركبة</th>
                  <th class="px-4 py-3 text-right font-label-sm text-label-sm text-text-tertiary">اللوحة</th>
                  <th class="px-4 py-3 text-right font-label-sm text-label-sm text-text-tertiary">المدة</th>
                  <th class="px-4 py-3 text-right font-label-sm text-label-sm text-text-tertiary">المبلغ</th>
                  <th class="px-4 py-3 text-right font-label-sm text-label-sm text-text-tertiary">التاريخ</th>
                </tr>
              </thead>
              <tbody id="warranties-tbody">
                <tr><td colspan="6" class="px-6 py-8 text-center text-text-secondary"><div class="skeleton-shimmer h-4 rounded w-32 mx-auto"></div></td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="bg-surface-container-lowest rounded-xl shadow-md border border-surface-subtle p-card-padding">
          <h3 class="font-headline-md text-lg text-on-surface font-semibold mb-4 flex items-center gap-2">
            <span class="material-symbols-outlined text-primary">people</span>
            العملاء المسجلين
          </h3>
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="bg-surface-subtle border-b border-outline-variant/10">
                  <th class="px-4 py-3 text-right font-label-sm text-label-sm text-text-tertiary">الاسم</th>
                  <th class="px-4 py-3 text-right font-label-sm text-label-sm text-text-tertiary">الهاتف</th>
                  <th class="px-4 py-3 text-right font-label-sm text-label-sm text-text-tertiary">عدد الكفالات</th>
                  <th class="px-4 py-3 text-right font-label-sm text-label-sm text-text-tertiary">آخر كفالة</th>
                </tr>
              </thead>
              <tbody id="customers-tbody">
                <tr><td colspan="4" class="px-6 py-8 text-center text-text-secondary"><div class="skeleton-shimmer h-4 rounded w-32 mx-auto"></div></td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `
    c.querySelector('#back-btn')?.addEventListener('click', () => this.router.navigate('/dealers'))
    this.loadData(c)
    return layout.render(c)
  }

  private async loadData(el: HTMLElement) {
    try {
      const [dealerRes, warrantiesRes, statsRes] = await Promise.all([
        this.api.get<any>(`/api/dealers/${this.dealerId}`),
        this.api.get<any>(`/api/dealers/${this.dealerId}/warranties`),
        this.api.get<any>(`/api/dealers/${this.dealerId}/stats`),
      ])

      if (dealerRes.success && dealerRes.data) {
        const d = dealerRes.data
        el.querySelector('#dealer-name')!.textContent = d.name || '-'
        el.querySelector('#dealer-company')!.textContent = d.companyName || '-'
        el.querySelector('#dealer-phone')!.textContent = d.phone || '-'
        el.querySelector('#dealer-address')!.textContent = d.address || '-'
        el.querySelector('#dealer-status')!.textContent = d.status === 'ACTIVE' ? 'نشط' : d.status || '-'
      }

      const warranties = warrantiesRes.success && Array.isArray(warrantiesRes.data) ? warrantiesRes.data :
                         warrantiesRes.success && warrantiesRes.data?.data ? warrantiesRes.data.data : []

      // FIX: Use Number() to ensure numeric addition, not string concatenation
      const totalSYP = warranties.reduce((sum: number, w: any) => sum + ((w.currency || 'SYP') === 'SYP' ? Number(w.amountPaid) || 0 : 0), 0)
      const totalUSD = warranties.reduce((sum: number, w: any) => sum + (w.currency === 'USD' ? Number(w.amountPaid) || 0 : 0), 0)

      // Aggregate customers from warranties
      const customerMap = new Map<string, any>()
      warranties.forEach((w: any) => {
        const key = w.customerPhone || w.customerName
        if (!customerMap.has(key)) {
          customerMap.set(key, { name: w.customerName, phone: w.customerPhone, count: 0, lastDate: w.startDate })
        }
        const c = customerMap.get(key)
        c.count++
        if (new Date(w.startDate) > new Date(c.lastDate)) c.lastDate = w.startDate
      })
      const customers = Array.from(customerMap.values())

      // Use stats endpoint if available, fallback to calculated values
      const stats = statsRes.success && statsRes.data ? statsRes.data : null
      el.querySelector('#stat-customers')!.textContent = String(stats?.totalCustomers ?? customers.length)
      el.querySelector('#stat-warranties')!.textContent = String(stats?.totalWarranties ?? warranties.length)
      el.querySelector('#stat-amount-syp')!.textContent = Number(stats?.totalRevenueSYP ?? totalSYP).toLocaleString('ar-SY') + ' ل.س'
      el.querySelector('#stat-amount-usd')!.textContent = Number(stats?.totalRevenueUSD ?? totalUSD).toLocaleString('en-US') + ' $'

      const wTbody = el.querySelector('#warranties-tbody')!
      if (warranties.length === 0) {
        wTbody.innerHTML = '<tr><td colspan="6" class="px-6 py-8 text-center text-text-secondary font-body-md">لا توجد كفالات</td></tr>'
      } else {
        wTbody.innerHTML = warranties.map((w: any) => `
          <tr class="border-b border-outline-variant/10 hover:bg-surface-container-low/50 transition-colors">
            <td class="px-4 py-3 font-body-md text-on-surface">${w.customerName || '-'}</td>
            <td class="px-4 py-3 font-body-md text-on-surface">${w.manufacturer || ''} ${w.vehicleModel || ''}</td>
            <td class="px-4 py-3 font-body-md text-on-surface" dir="ltr">${w.plateNumber || '-'}</td>
            <td class="px-4 py-3 font-body-md text-on-surface">${w.durationMonths || '-'} شهر</td>
            <td class="px-4 py-3 font-body-md text-on-surface">${(Number(w.amountPaid) || 0).toLocaleString('ar-SY')} ${w.currency === 'USD' ? '$' : 'ل.س'}</td>
            <td class="px-4 py-3 font-body-md text-text-secondary">${w.startDate ? new Date(w.startDate).toLocaleDateString('ar-SY') : '-'}</td>
          </tr>
        `).join('')
      }

      const cTbody = el.querySelector('#customers-tbody')!
      if (customers.length === 0) {
        cTbody.innerHTML = '<tr><td colspan="4" class="px-6 py-8 text-center text-text-secondary font-body-md">لا يوجد عملاء</td></tr>'
      } else {
        cTbody.innerHTML = customers.map((c: any) => `
          <tr class="border-b border-outline-variant/10 hover:bg-surface-container-low/50 transition-colors">
            <td class="px-4 py-3 font-body-md text-on-surface">${c.name || '-'}</td>
            <td class="px-4 py-3 font-body-md text-on-surface" dir="ltr">${c.phone || '-'}</td>
            <td class="px-4 py-3 font-body-md text-on-surface text-center">${c.count}</td>
            <td class="px-4 py-3 font-body-md text-text-secondary">${c.lastDate ? new Date(c.lastDate).toLocaleDateString('ar-SY') : '-'}</td>
          </tr>
        `).join('')
      }
    } catch {
      el.querySelector('#warranties-tbody')!.innerHTML = '<tr><td colspan="6" class="px-6 py-8 text-center text-error font-body-md">حدث خطأ في تحميل البيانات</td></tr>'
      el.querySelector('#customers-tbody')!.innerHTML = '<tr><td colspan="4" class="px-6 py-8 text-center text-error font-body-md">حدث خطأ في تحميل البيانات</td></tr>'
    }
  }
}
