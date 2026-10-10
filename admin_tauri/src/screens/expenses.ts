import { AuthService } from '../services/auth'
import { ApiClient } from '../api/client'
import { Router } from '../router'
import { AppLayout } from '../components/layout'
import { fmtUsd } from '../utils/currency'

const CATEGORIES: { value: string; label: string; hint?: string }[] = [
  { value: 'JOB_PURCHASE', label: 'مشتريات مهمة (قطع/مواد لزبون)', hint: 'تكلفة قطع اشتريتها لمهمة معينة — تُحسب ضمن تكلفة الزبون' },
  { value: 'SUPPLIES', label: 'محارم ومستلزمات', hint: 'مستلزمات مكتبية وتشغيلية' },
  { value: 'BUFFET', label: 'بوفيه', hint: 'مشروبات وطعام للفريق' },
  { value: 'UTILITIES', label: 'كهرباء وماء' },
  { value: 'INTERNET', label: 'إنترنت واتصالات' },
  { value: 'RENT', label: 'إيجار' },
  { value: 'MAINTENANCE', label: 'صيانة معدات وأجهزة' },
  { value: 'EQUIPMENT', label: 'شراء معدات/آلة جديدة', hint: 'يُسجَّل كأصل ثابت (1230) وليس مصروفاً' },
  { value: 'TRANSPORTATION', label: 'نقل ووقود' },
  { value: 'MARKETING', label: 'تسويق وإعلان' },
  { value: 'SALARIES', label: 'رواتب' },
  { value: 'OTHER', label: 'أخرى' },
]

export class ExpensesScreen {
  constructor(private auth: AuthService, private api: ApiClient, private router: Router) {}

  render(): HTMLElement {
    const layout = new AppLayout(this.auth, this.router, 'المصاريف', 'payments', this.api)
    const content = document.createElement('div')
    content.className = 'page-enter max-w-[1200px] mx-auto'
    content.innerHTML = `
      <div class="space-y-stack-lg">
        <div class="flex items-center justify-between page-enter">
          <div>
            <h1 class="font-beVietnamPro text-headline-md text-on-surface">المصاريف</h1>
            <p class="text-body-md text-on-surface-variant mt-1">تسجيل المصاريف العامة ومشتريات المهمات — يُنشأ قيد محاسبي تلقائياً</p>
          </div>
          <button class="h-12 btn-primary-gradient text-white font-body-md rounded-xl shadow-lg shadow-primary/25 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 px-6" id="new-expense-btn">
            <span class="material-symbols-outlined text-[20px]">add</span>
            مصروف جديد
          </button>
        </div>

        <div class="glass-card rounded-2xl p-card-padding stagger-entry stagger-entry-1">
          <div class="flex flex-col sm:flex-row gap-4 items-center mb-4">
            <select id="category-filter" class="h-12 bg-white/50 border border-glass-border rounded-xl pr-4 pl-10 font-body-md text-on-surface input-glow transition-all w-full sm:w-64 appearance-none cursor-pointer">
              <option value="">كل التصنيفات</option>
            </select>
            <input type="date" id="date-from" class="h-12 bg-white/50 border border-glass-border rounded-xl px-4 font-body-md text-on-surface input-glow transition-all" title="من تاريخ"/>
            <input type="date" id="date-to" class="h-12 bg-white/50 border border-glass-border rounded-xl px-4 font-body-md text-on-surface input-glow transition-all" title="إلى تاريخ"/>
            <button class="h-12 px-6 glass-card text-on-surface font-body-md rounded-xl border border-glass-border hover:bg-white/80 transition-all" id="filter-btn">تصفية</button>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-right">
              <thead>
                <tr class="border-b border-glass-border">
                  <th class="px-4 py-3 font-label-lg text-on-surface-variant">التاريخ</th>
                  <th class="px-4 py-3 font-label-lg text-on-surface-variant">التصنيف</th>
                  <th class="px-4 py-3 font-label-lg text-on-surface-variant">الوصف</th>
                  <th class="px-4 py-3 font-label-lg text-on-surface-variant">المبلغ</th>
                  <th class="px-4 py-3 font-label-lg text-on-surface-variant">الدفع</th>
                  <th class="px-4 py-3 font-label-lg text-on-surface-variant">الحجز</th>
                  <th class="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody id="expenses-tbody">
                <tr><td colspan="7" class="px-4 py-8 text-center text-on-surface-variant font-body-md">جاري التحميل...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div id="expense-modal" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 hidden items-center justify-center p-4">
        <div class="glass-card rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <h2 class="font-headline-md text-lg text-on-surface font-semibold mb-4">مصروف جديد</h2>
          <div class="space-y-4">
            <div>
              <label class="block font-label-sm text-label-sm text-on-surface-variant mb-2">التصنيف</label>
              <select id="exp-category" class="w-full h-12 bg-white/50 border border-glass-border rounded-xl px-4 font-body-md text-on-surface input-glow transition-all">
                <option value="JOB_PURCHASE">مشتريات مهمة (قطع/مواد لزبون)</option>
                <option value="SUPPLIES">محارم ومستلزمات</option>
                <option value="BUFFET">بوفيه</option>
                <option value="UTILITIES">كهرباء وماء</option>
                <option value="INTERNET">إنترنت واتصالات</option>
                <option value="RENT">إيجار</option>
                <option value="MAINTENANCE">صيانة معدات وأجهزة</option>
                <option value="EQUIPMENT">شراء معدات/آلة جديدة (أصل)</option>
                <option value="TRANSPORTATION">نقل ووقود</option>
                <option value="MARKETING">تسويق وإعلان</option>
                <option value="SALARIES">رواتب</option>
                <option value="OTHER">أخرى</option>
              </select>
              <p id="category-hint" class="text-label-sm text-on-surface-variant mt-1 hidden"></p>
            </div>
            <div>
              <label class="block font-label-sm text-label-sm text-on-surface-variant mb-2">الوصف</label>
              <input type="text" id="exp-description" class="w-full h-12 bg-white/50 border border-glass-border rounded-xl px-4 font-body-md text-on-surface input-glow transition-all" placeholder="مثال: فاتورة كهرباء شهر أكتوبر"/>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-label-sm text-label-sm text-on-surface-variant mb-2">المبلغ</label>
                <input type="number" step="0.01" min="0" id="exp-amount" class="w-full h-12 bg-white/50 border border-glass-border rounded-xl px-4 font-body-md text-on-surface input-glow transition-all" placeholder="0.00"/>
              </div>
              <div>
                <label class="block font-label-sm text-label-sm text-on-surface-variant mb-2">العملة المدفوعة</label>
                <select id="exp-currency" class="w-full h-12 bg-white/50 border border-glass-border rounded-xl px-4 font-body-md text-on-surface input-glow transition-all">
                  <option value="SYP">ليرة سورية (ل.س)</option>
                  <option value="USD">دولار ($)</option>
                </select>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-label-sm text-label-sm text-on-surface-variant mb-2">طريقة الدفع</label>
                <select id="exp-payment" class="w-full h-12 bg-white/50 border border-glass-border rounded-xl px-4 font-body-md text-on-surface input-glow transition-all">
                  <option value="CASH">كاش</option>
                  <option value="BANK">بنك / تحويل</option>
                </select>
              </div>
              <div>
                <label class="block font-label-sm text-label-sm text-on-surface-variant mb-2">التاريخ</label>
                <input type="date" id="exp-date" class="w-full h-12 bg-white/50 border border-glass-border rounded-xl px-4 font-body-md text-on-surface input-glow transition-all"/>
              </div>
            </div>
            <div id="booking-field" class="hidden">
              <label class="block font-label-sm text-label-sm text-on-surface-variant mb-2">معرّف الحجز (اختياري — يربط التكلفة بالمهمة)</label>
              <input type="text" id="exp-booking" class="w-full h-12 bg-white/50 border border-glass-border rounded-xl px-4 font-body-md text-on-surface input-glow transition-all" placeholder="معرّف الحجز (UUID)"/>
            </div>
            <div>
              <label class="block font-label-sm text-label-sm text-on-surface-variant mb-2">ملاحظات / مرجع</label>
              <input type="text" id="exp-notes" class="w-full h-12 bg-white/50 border border-glass-border rounded-xl px-4 font-body-md text-on-surface input-glow transition-all" placeholder="اختياري"/>
            </div>
            <div class="flex gap-3 pt-2">
              <button id="exp-save" class="flex-1 h-12 btn-primary-gradient text-white font-body-md rounded-xl shadow-lg shadow-primary/25 hover:scale-105 active:scale-95 transition-all">حفظ</button>
              <button id="exp-cancel" class="h-12 px-6 glass-card text-on-surface font-body-md rounded-xl border border-glass-border hover:bg-white/80 transition-all">إلغاء</button>
            </div>
          </div>
        </div>
      </div>
    `

    const modal = content.querySelector('#expense-modal') as HTMLElement
    const catSelect = content.querySelector('#exp-category') as HTMLSelectElement
    const catHint = content.querySelector('#category-hint') as HTMLElement
    const bookingField = content.querySelector('#booking-field') as HTMLElement
    const filterSelect = content.querySelector('#category-filter') as HTMLSelectElement
    const dateInput = content.querySelector('#exp-date') as HTMLInputElement
    dateInput.value = new Date().toISOString().split('T')[0]

    const hints: Record<string, string> = {
      JOB_PURCHASE: 'قطع/مواد اشتريتها لمهمة زبون — تُسجَّل كتكلفة مبيعات ويمكن ربطها بالحجز',
      EQUIPMENT: 'يُسجَّل كأصل ثابت (حساب 1230) وليس مصروفاً تشغيلياً',
    }
    const updateCategoryUI = () => {
      const v = catSelect.value
      catHint.textContent = hints[v] || ''
      catHint.classList.toggle('hidden', !hints[v])
      bookingField.classList.toggle('hidden', v !== 'JOB_PURCHASE')
    }
    catSelect.addEventListener('change', updateCategoryUI)
    updateCategoryUI()

    CATEGORIES.forEach(c => {
      const o = document.createElement('option')
      o.value = c.value
      o.textContent = c.label
      filterSelect.appendChild(o)
    })

    content.querySelector('#new-expense-btn')?.addEventListener('click', () => {
      modal.classList.remove('hidden'); modal.classList.add('flex')
    })
    content.querySelector('#exp-cancel')?.addEventListener('click', () => {
      modal.classList.add('hidden'); modal.classList.remove('flex')
    })
    modal.addEventListener('click', (e) => {
      if (e.target === modal) { modal.classList.add('hidden'); modal.classList.remove('flex') }
    })

    content.querySelector('#exp-save')?.addEventListener('click', async () => {
      const amount = parseFloat((content.querySelector('#exp-amount') as HTMLInputElement).value)
      const currency = (content.querySelector('#exp-currency') as HTMLSelectElement).value
      if (!amount || amount <= 0) {
        ;(window as any).toast?.show?.({ message: 'أدخل مبلغاً صحيحاً', type: 'warning' }); return
      }
      const desc = (content.querySelector('#exp-description') as HTMLInputElement).value.trim()
      if (!desc) {
        ;(window as any).toast?.show?.({ message: 'أدخل وصفاً', type: 'warning' }); return
      }
      const payload: any = {
        category: catSelect.value,
        description: desc,
        expenseDate: dateInput.value,
        paymentMethod: (content.querySelector('#exp-payment') as HTMLSelectElement).value,
        notes: (content.querySelector('#exp-notes') as HTMLInputElement).value || undefined,
        isRecurring: false,
      }
      if (currency === 'USD') payload.amountUSD = amount; else payload.amountSYP = amount
      const bid = (content.querySelector('#exp-booking') as HTMLInputElement).value.trim()
      if (bid) payload.bookingId = bid

      try {
        const res = await this.api.post<any>('/api/expenses', payload)
        if (res.success === false && res.message) throw new Error(res.message)
        ;(window as any).toast?.show?.({ message: 'تم تسجيل المصروف وقيده المحاسبي', type: 'success' })
        modal.classList.add('hidden'); modal.classList.remove('flex')
        this.api.clearCache()
        this.loadExpenses(content)
      } catch (err: any) {
        ;(window as any).toast?.show?.({ message: 'فشل الحفظ: ' + (err.message || ''), type: 'error' })
      }
    })

    content.querySelector('#filter-btn')?.addEventListener('click', () => this.loadExpenses(content))

    this.loadExpenses(content)
    return layout.render(content)
  }

  private async loadExpenses(el: HTMLElement) {
    const tbody = el.querySelector('#expenses-tbody')!
    const cat = (el.querySelector('#category-filter') as HTMLSelectElement)?.value
    const from = (el.querySelector('#date-from') as HTMLInputElement)?.value
    const to = (el.querySelector('#date-to') as HTMLInputElement)?.value
    let url = '/api/expenses?limit=200'
    if (cat) url += `&category=${encodeURIComponent(cat)}`
    if (from && to) url += `&startDate=${from}&endDate=${to}T23:59:59Z`
    try {
      const res = await this.api.get<any>(url)
      const rows: any[] = res.data || []
      if (rows.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="px-4 py-8 text-center text-on-surface-variant font-body-md">لا توجد مصاريف مسجلة</td></tr>'
        return
      }
      const catLabel = (v: string) => CATEGORIES.find(c => c.value === v)?.label || v
      tbody.innerHTML = rows.map((e: any) => `
        <tr class="border-b border-glass-border/50 hover:bg-white/40 transition-colors">
          <td class="px-4 py-3 font-body-md text-on-surface-variant">${(e.expenseDate || '').split('T')[0]}</td>
          <td class="px-4 py-3 font-body-md text-on-surface">${catLabel(e.category)}</td>
          <td class="px-4 py-3 font-body-md text-on-surface">${e.description}</td>
          <td class="px-4 py-3 font-body-md text-financial-data">${Number(e.amountSYP).toLocaleString('ar-SA')} ل.س${e.amountUSD ? ` · $${fmtUsd(Number(e.amountUSD))}` : ''}</td>
          <td class="px-4 py-3 font-body-md text-on-surface-variant">${e.paymentMethod === 'CASH' ? 'كاش' : 'بنك'}</td>
          <td class="px-4 py-3 font-body-md text-on-surface-variant">${e.bookingId ? `<span class="font-mono text-xs" title="${e.bookingId}">${e.bookingId.slice(0, 8)}…</span>` : '—'}</td>
          <td class="px-4 py-3">
            <button class="del-exp text-error hover:text-error/80 transition-colors" data-id="${e.id}" title="حذف (يعكس القيد)">
              <span class="material-symbols-outlined text-[18px]">delete</span>
            </button>
          </td>
        </tr>
      `).join('')
      tbody.querySelectorAll('.del-exp').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.getAttribute('data-id')!
          if (!confirm('حذف هذا المصروف؟ سيُعكَس قيده المحاسبي.')) return
          try {
            await this.api.delete<any>(`/api/expenses/${id}`)
            ;(window as any).toast?.show?.({ message: 'حُذف المصروف وعُكس قيده', type: 'success' })
            this.loadExpenses(el)
          } catch (err: any) {
            ;(window as any).toast?.show?.({ message: 'فشل الحذف: ' + (err.message || ''), type: 'error' })
          }
        })
      })
    } catch {
      tbody.innerHTML = '<tr><td colspan="7" class="px-4 py-8 text-center text-error font-body-md">حدث خطأ في التحميل</td></tr>'
    }
  }
}
