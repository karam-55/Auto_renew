import { AuthService } from '../services/auth'
import { ApiClient } from '../api/client'
import { Router } from '../router'
import { AppLayout } from '../components/layout'

const TYPE_LABELS: Record<string, string> = {
  ASSET: 'أصول',
  LIABILITY: 'التزامات',
  EQUITY: 'حقوق ملكية',
  REVENUE: 'إيرادات',
  COGS: 'تكلفة البضاعة المباعة',
  EXPENSE: 'مصروفات',
}

type Currency = 'SYP' | 'USD'

const CURRENCY_LABELS: Record<Currency, string> = { SYP: 'ل.س', USD: '$' }

interface AccountNode {
  id: string
  code: string
  nameAr: string
  nameEn?: string
  accountType: string
  balanceSYP: number
  balanceUSD: number
  parentId?: string | null
  children: AccountNode[]
  level?: number
}

const esc = (value: string): string =>
  value.replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch] as string))

const amountText = (value: number): string => {
  const body = Math.abs(value).toLocaleString('ar-SA', { maximumFractionDigits: 2 })
  return value < 0 ? `−${body}` : body
}

const amountTone = (value: number): string => {
  if (value > 0) return 'text-success'
  if (value < 0) return 'text-error'
  return 'text-text-tertiary'
}

const signChip = (label: string, value: number): string => {
  const tone = value > 0 ? 'bg-success/10 text-success' : value < 0 ? 'bg-error/10 text-error' : 'bg-surface-subtle text-text-tertiary'
  const word = value > 0 ? 'موجب' : value < 0 ? 'سالب' : 'صفر'
  return `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-label-sm text-label-sm ${tone}"><span dir="ltr">${label}</span> ${word}</span>`
}

const DEBIT_NORMAL_TYPES = ['ASSET', 'COGS', 'EXPENSE']


const todayIso = (): string => new Date().toLocaleDateString('en-CA')

export class ChartOfAccountsScreen {
  private accounts: AccountNode[] = []
  private allFlat: AccountNode[] = []
  private currentPage = 1
  private itemsPerPage = 15
  private editingId: string | null = null
  private balanceAccount: AccountNode | null = null

  constructor(private auth: AuthService, private api: ApiClient, private router: Router) {}

  render(): HTMLElement {
    const layout = new AppLayout(this.auth, this.router, 'دليل الحسابات', 'account_tree', this.api)
    const c = document.createElement('div')
    c.className = 'page-enter min-h-screen bg-background p-gutter'
    c.innerHTML = [
      '<div class="max-w-7xl mx-auto space-y-stack-lg">',
      '  <div class="flex items-center justify-between">',
      '    <div>',
      '      <h1 class="font-beVietnamPro text-headline-md text-on-surface">دليل الحسابات</h1>',
      '      <p class="text-body-sm text-text-secondary mt-1">الأرصدة محسوبة من القيود المرحّلة: <span class="text-success font-semibold">موجب</span> = رصيد طبيعي لجهة الحساب · <span class="text-error font-semibold">سالب</span> = رصيد عكسي</p>',
      '    </div>',
      '    <button id="btn-add-account" class="h-10 px-4 bg-primary text-white rounded-lg font-body-md flex items-center gap-2 hover:bg-primary-dark transition-colors">',
      '      <span class="material-symbols-outlined text-[18px]">add</span>',
      '      إضافة حساب',
      '    </button>',
      '  </div>',
      '  <div class="glass-panel rounded-xl shadow-lg border border-border p-card-padding">',
      '    <div class="relative">',
      '      <span class="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline">search</span>',
      '      <input id="search-input" class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg pr-10 pl-4 font-ibmPlexSans font-body-md text-body-md text-on-surface placeholder:text-outline-variant focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow duration-200" placeholder="بحث بالاسم أو الرمز..."/>',
      '    </div>',
      '  </div>',
      '  <div class="bg-surface-container-lowest rounded-xl shadow-md border border-surface-subtle overflow-hidden">',
      '    <div class="overflow-x-auto">',
      '      <table class="w-full">',
      '        <thead>',
      '          <tr class="bg-surface-subtle border-b border-outline-variant/10">',
      '            <th class="px-6 py-4 text-right font-label-sm text-label-sm text-text-tertiary uppercase">الرمز</th>',
      '            <th class="px-6 py-4 text-right font-label-sm text-label-sm text-text-tertiary uppercase">اسم الحساب</th>',
      '            <th class="px-6 py-4 text-right font-label-sm text-label-sm text-text-tertiary uppercase">النوع</th>',
      '            <th class="px-6 py-4 text-right font-label-sm text-label-sm text-text-tertiary uppercase">الرصيد (ل.س)</th>',
      '            <th class="px-6 py-4 text-right font-label-sm text-label-sm text-text-tertiary uppercase">الرصيد ($)</th>',
      '            <th class="px-6 py-4 text-right font-label-sm text-label-sm text-text-tertiary uppercase">الإشارة</th>',
      '            <th class="px-6 py-4 text-center font-label-sm text-label-sm text-text-tertiary uppercase">إجراءات</th>',
      '          </tr>',
      '        </thead>',
      '        <tbody id="table-tbody">',
      '          <tr><td colspan="7" class="px-6 py-8 text-center text-text-secondary"><div class="skeleton-shimmer h-4 rounded w-32 mx-auto"></div></td></tr>',
      '        </tbody>',
      '      </table>',
      '    </div>',
      '    <div class="border-t border-outline-variant/10 px-6 py-4 flex items-center justify-between bg-surface-subtle/50">',
      '      <div id="pagination-info" class="text-body-sm text-text-secondary font-ibmPlexSans"></div>',
      '      <div id="pagination-controls" class="flex items-center gap-1"></div>',
      '    </div>',
      '  </div>',
      '</div>',
      '<div id="account-modal" class="fixed inset-0 bg-black/50 z-50 hidden items-center justify-center" role="dialog" aria-modal="true">',
      '  <div class="bg-surface rounded-xl shadow-2xl border border-border w-full max-w-lg p-6 m-4">',
      '    <h2 id="modal-title" class="font-headline-sm text-on-surface mb-4">إضافة حساب جديد</h2>',
      '    <div class="space-y-4">',
      '      <div>',
      '        <label class="block font-label-sm text-text-secondary mb-1">الرمز *</label>',
      '        <input id="acc-code" class="w-full h-10 bg-surface-subtle border border-border rounded-lg px-3 font-body-md text-on-surface" dir="ltr" required/>',
      '      </div>',
      '      <div>',
      '        <label class="block font-label-sm text-text-secondary mb-1">الاسم (عربي) *</label>',
      '        <input id="acc-name" class="w-full h-10 bg-surface-subtle border border-border rounded-lg px-3 font-body-md text-on-surface" required/>',
      '      </div>',
      '      <div>',
      '        <label class="block font-label-sm text-text-secondary mb-1">الاسم (إنجليزي)</label>',
      '        <input id="modal-nameEn" class="w-full h-10 bg-surface-subtle border border-border rounded-lg px-3 font-body-md text-on-surface" dir="ltr"/>',
      '      </div>',
      '      <div>',
      '        <label class="block font-label-sm text-text-secondary mb-1">النوع</label>',
      '        <select id="acc-type" class="w-full h-10 bg-surface-subtle border border-border rounded-lg px-3 font-body-md text-on-surface">',
      '          <option value="ASSET">أصول</option>',
      '          <option value="LIABILITY">التزامات</option>',
      '          <option value="EQUITY">حقوق ملكية</option>',
      '          <option value="REVENUE">إيرادات</option>',
      '          <option value="EXPENSE">مصروفات</option>',
      '          <option value="COGS">تكلفة البضاعة المباعة</option>',
      '        </select>',
      '      </div>',
      '      <div>',
      '        <label class="block font-label-sm text-text-secondary mb-1">الحساب الأب (اختياري)</label>',
      '        <select id="modal-parent" class="w-full h-10 bg-surface-subtle border border-border rounded-lg px-3 font-body-md text-on-surface">',
      '          <option value="">— بدون —</option>',
      '        </select>',
      '      </div>',
      '      <p class="text-body-sm text-text-tertiary">الرصيد الافتتاحي يُضاف بعد إنشاء الحساب من زر «تعديل الرصيد»، فيُسجَّل كقيد محاسبي.</p>',
      '    </div>',
      '    <div class="flex justify-end gap-2 mt-6">',
      '      <button id="modal-cancel" class="h-10 px-4 rounded-lg font-body-md text-text-secondary hover:bg-surface-subtle transition-colors">إلغاء</button>',
      '      <button id="acc-save" class="h-10 px-4 bg-primary text-white rounded-lg font-body-md hover:bg-primary-dark transition-colors">حفظ</button>',
      '    </div>',
      '  </div>',
      '</div>',
      '<div id="balance-modal" class="fixed inset-0 bg-black/50 z-50 hidden items-center justify-center" role="dialog" aria-modal="true">',
      '  <div class="bg-surface rounded-xl shadow-2xl border border-border w-full max-w-md p-6 m-4">',
      '    <h2 class="font-headline-sm text-on-surface mb-1">تعديل رصيد الحساب</h2>',
      '    <p id="balance-account-name" class="text-text-secondary font-body-md"></p>',
      '    <p id="balance-current" class="font-body-md font-bold mt-1 mb-4"></p>',
      '    <div class="space-y-4">',
      '      <div class="grid grid-cols-2 gap-3">',
      '        <div>',
      '          <label class="block font-label-sm text-text-secondary mb-1">العملة</label>',
      '          <select id="balance-currency" class="w-full h-10 bg-surface-subtle border border-border rounded-lg px-3 font-body-md text-on-surface">',
      '            <option value="SYP">ليرة سورية جديدة (ل.س)</option>',
      '            <option value="USD">دولار أمريكي ($)</option>',
      '          </select>',
      '        </div>',
      '        <div>',
      '          <label class="block font-label-sm text-text-secondary mb-1">نوع التعديل</label>',
      '          <select id="balance-operation" class="w-full h-10 bg-surface-subtle border border-border rounded-lg px-3 font-body-md text-on-surface">',
      '            <option value="ADD">زيادة الرصيد</option>',
      '            <option value="SUBTRACT">تخفيض الرصيد</option>',
      '            <option value="SET">تعيين الرصيد إلى</option>',
      '          </select>',
      '        </div>',
      '      </div>',
      '      <div>',
      '        <label id="balance-amount-label" class="block font-label-sm text-text-secondary mb-1">المبلغ</label>',
      '        <input id="balance-amount" type="number" step="0.01" class="w-full h-10 bg-surface-subtle border border-border rounded-lg px-3 font-body-md text-on-surface" dir="ltr"/>',
      '      </div>',
      '      <div class="grid grid-cols-2 gap-3">',
      '        <div>',
      '          <label class="block font-label-sm text-text-secondary mb-1">تاريخ القيد</label>',
      '          <input id="balance-date" type="date" class="w-full h-10 bg-surface-subtle border border-border rounded-lg px-3 font-body-md text-on-surface" dir="ltr"/>',
      '        </div>',
      '        <div>',
      '          <label class="block font-label-sm text-text-secondary mb-1">البيان (اختياري)</label>',
      '          <input id="balance-notes" class="w-full h-10 bg-surface-subtle border border-border rounded-lg px-3 font-body-md text-on-surface"/>',
      '        </div>',
      '      </div>',
      '      <p class="text-body-sm text-text-tertiary">يُسجَّل قيد مرحّل مقابل حساب «الأرصدة الافتتاحية»، ويظهر فوراً في الميزانية وقائمة الدخل.</p>',
      '    </div>',
      '    <div class="flex justify-end gap-2 mt-6">',
      '      <button id="balance-cancel" class="h-10 px-4 rounded-lg font-body-md text-text-secondary hover:bg-surface-subtle transition-colors">إلغاء</button>',
      '      <button id="balance-save" class="h-10 px-4 bg-primary text-white rounded-lg font-body-md hover:bg-primary-dark transition-colors">حفظ التعديل</button>',
      '    </div>',
      '  </div>',
      '</div>',
    ].join('\n')

    this.loadData(c)
    this.attachListeners(c)
    return layout.render(c)
  }

  private attachListeners(c: HTMLElement) {
    const search = c.querySelector('#search-input') as HTMLInputElement
    search?.addEventListener('input', () => this.renderTable(c, search.value.trim()))

    // Add account button
    c.querySelector('#btn-add-account')?.addEventListener('click', () => this.openModal(c, null))

    // Modal cancel
    c.querySelector('#modal-cancel')?.addEventListener('click', () => this.closeModal(c))
    c.querySelector('#acc-save')?.addEventListener('click', () => this.saveAccount(c))

    // Balance modal
    c.querySelector('#balance-cancel')?.addEventListener('click', () => this.closeBalanceModal(c))
    c.querySelector('#balance-save')?.addEventListener('click', () => this.saveBalance(c))
    c.querySelector('#balance-currency')?.addEventListener('change', () => this.refreshBalanceForm(c))
    c.querySelector('#balance-operation')?.addEventListener('change', () => this.refreshBalanceForm(c))
  }

  private flattenTree(nodes: AccountNode[], level = 0): AccountNode[] {
    const flat: AccountNode[] = []
    for (const node of nodes) {
      flat.push({ ...node, level })
      if (node.children?.length) {
        flat.push(...this.flattenTree(node.children, level + 1))
      }
    }
    return flat
  }

  private async loadData(c: HTMLElement) {
    try {
      const res = await this.api.get<any>('/api/accounting/accounts/tree?includeInactive=true', false)
      const tbody = c.querySelector('#table-tbody')!
      if (res.success && res.data) {
        this.accounts = Array.isArray(res.data) ? res.data : res.data.data || []
        this.allFlat = this.flattenTree(this.accounts)
        this.renderTable(c)
        this.populateParentSelect(c)
      } else {
        tbody.innerHTML = '<tr><td colspan="7" class="px-6 py-8 text-center text-text-secondary font-body-md">لا توجد بيانات</td></tr>'
      }
    } catch (err: any) {
      const tbody = c.querySelector('#table-tbody')
      if (tbody) tbody.innerHTML = '<tr><td colspan="7" class="px-6 py-8 text-center text-error font-body-md">حدث خطأ: ' + esc(String(err?.message || err)) + '</td></tr>'
    }
  }

  private renderTable(c: HTMLElement, search = '') {
    const tbody = c.querySelector('#table-tbody')!
    let items = this.allFlat
    if (search) {
      const q = search.toLowerCase()
      items = items.filter(a => (a.code?.toLowerCase().includes(q) || a.nameAr?.toLowerCase().includes(q)))
      this.currentPage = 1
    }
    if (items.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="px-6 py-8 text-center text-text-secondary font-body-md">لا توجد بيانات</td></tr>'
      this.renderPagination(c, 0, 0)
      return
    }

    const totalPages = Math.ceil(items.length / this.itemsPerPage)
    const start = (this.currentPage - 1) * this.itemsPerPage
    const pageItems = items.slice(start, start + this.itemsPerPage)

    tbody.innerHTML = ''
    for (const item of pageItems) {
      tbody.appendChild(this.buildRow(c, item))
    }

    this.renderPagination(c, items.length, totalPages)
  }

  private buildRow(c: HTMLElement, item: AccountNode): HTMLTableRowElement {
    const tr = document.createElement('tr')
    tr.className = 'border-b border-outline-variant/10 hover:bg-surface-container-low/50 transition-colors'
    tr.setAttribute('data-id', item.id)
    const isParent = (item.children?.length || 0) > 0
    const indent = (item.level || 0) * 24

    tr.innerHTML = `
      <!-- Code cell -->
      <td class="px-6 py-4 font-body-md text-on-surface" dir="ltr">${esc(item.code || '-')}</td>
      <!-- Name cell -->
      <td class="px-6 py-4 font-body-md text-on-surface"><div style="padding-right:${indent}px" class="${isParent ? 'font-semibold' : ''}">${esc(item.nameAr || '-')}</div></td>
      <!-- Type cell -->
      <td class="px-6 py-4 font-body-md text-text-secondary">${esc(TYPE_LABELS[item.accountType] || item.accountType || '-')}</td>
      <!-- Balance cell -->
      <td class="px-6 py-4 text-financial-data font-body-md ${amountTone(item.balanceSYP)}" dir="ltr">${amountText(item.balanceSYP)}</td>
      <td class="px-6 py-4 text-financial-data font-body-md ${amountTone(item.balanceUSD)}" dir="ltr">${amountText(item.balanceUSD)}</td>
      <td class="px-6 py-4"><div class="flex items-center gap-2">${signChip('ل.س', item.balanceSYP)}${signChip('$', item.balanceUSD)}</div></td>
      <!-- Actions cell -->
      <td class="px-6 py-4">
        <div class="flex items-center justify-center gap-1">
          <button class="action-edit touch-safe w-8 h-8 rounded-lg hover:bg-primary/10 text-primary flex items-center justify-center" title="تعديل" aria-label="تعديل الحساب">
            <span class="material-symbols-outlined text-[18px]" aria-hidden="true">edit</span>
          </button>
          ${isParent ? '' : '<button class="action-balance touch-safe w-8 h-8 rounded-lg hover:bg-tertiary/10 text-tertiary flex items-center justify-center" title="تعديل الرصيد" aria-label="تعديل رصيد الحساب"><span class="material-symbols-outlined text-[18px]" aria-hidden="true">payments</span></button>'}
          <button class="action-delete touch-safe w-8 h-8 rounded-lg hover:bg-error/10 text-error flex items-center justify-center" title="حذف" aria-label="حذف الحساب">
            <span class="material-symbols-outlined text-[18px]" aria-hidden="true">delete</span>
          </button>
        </div>
      </td>`

    // Attach row actions
    tr.querySelector('.action-edit')?.addEventListener('click', () => this.openModal(c, item))
    tr.querySelector('.action-balance')?.addEventListener('click', () => this.openBalanceModal(c, item))
    tr.querySelector('.action-delete')?.addEventListener('click', () => this.deleteAccount(c, item))
    return tr
  }

  private renderPagination(c: HTMLElement, totalItems: number, totalPages: number) {
    const infoEl = c.querySelector('#pagination-info') as HTMLElement
    const controlsEl = c.querySelector('#pagination-controls') as HTMLElement

    if (totalItems === 0) {
      infoEl.textContent = ''
      controlsEl.innerHTML = ''
      return
    }

    const start = (this.currentPage - 1) * this.itemsPerPage + 1
    const end = Math.min(this.currentPage * this.itemsPerPage, totalItems)
    infoEl.textContent = 'عرض ' + start + ' - ' + end + ' من ' + totalItems

    const buttons: string[] = []

    // Previous
    buttons.push('<button data-page="prev" class="touch-safe w-8 h-8 rounded-lg flex items-center justify-center font-body-sm ' + (this.currentPage === 1 ? 'text-text-tertiary cursor-not-allowed' : 'text-on-surface hover:bg-surface-subtle') + '" ' + (this.currentPage === 1 ? 'disabled' : '') + ' aria-label="الصفحة السابقة"><span class="material-symbols-outlined text-[18px]" aria-hidden="true">chevron_right</span></button>')

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
      const active = i === this.currentPage
      buttons.push('<button data-page="' + i + '" class="touch-safe w-8 h-8 rounded-lg flex items-center justify-center font-body-sm transition-colors ' + (active ? 'bg-primary text-white' : 'text-on-surface hover:bg-surface-subtle') + '" aria-label="الصفحة ' + i + '"' + (active ? ' aria-current="page"' : '') + '>' + i + '</button>')
    }

    // Next
    buttons.push('<button data-page="next" class="touch-safe w-8 h-8 rounded-lg flex items-center justify-center font-body-sm ' + (this.currentPage === totalPages ? 'text-text-tertiary cursor-not-allowed' : 'text-on-surface hover:bg-surface-subtle') + '" ' + (this.currentPage === totalPages ? 'disabled' : '') + ' aria-label="الصفحة التالية"><span class="material-symbols-outlined text-[18px]" aria-hidden="true">chevron_left</span></button>')

    controlsEl.innerHTML = buttons.join('')

    // Attach pagination listeners
    controlsEl.querySelectorAll('button').forEach(btn => {
      const page = btn.getAttribute('data-page')
      btn.addEventListener('click', () => {
        if (page === 'prev') {
          if (this.currentPage > 1) { this.currentPage--; this.renderTable(c) }
        } else if (page === 'next') {
          if (this.currentPage < totalPages) { this.currentPage++; this.renderTable(c) }
        } else if (page) {
          this.currentPage = parseInt(page)
          this.renderTable(c)
        }
      })
    })
  }

  private populateParentSelect(c: HTMLElement) {
    const select = c.querySelector('#modal-parent') as HTMLSelectElement
    if (!select) return
    select.innerHTML = '<option value="">— بدون —</option>'
    for (const acc of this.allFlat) {
      select.innerHTML += '<option value="' + acc.id + '">' + esc(acc.code + ' — ' + acc.nameAr) + '</option>'
    }
  }

  private openModal(c: HTMLElement, account: AccountNode | null) {
    this.editingId = account?.id || null
    const modal = c.querySelector('#account-modal') as HTMLElement
    const title = c.querySelector('#modal-title') as HTMLElement
    title.textContent = account ? 'تعديل حساب' : 'إضافة حساب جديد'

    ;(c.querySelector('#acc-code') as HTMLInputElement).value = account?.code || ''
    ;(c.querySelector('#acc-name') as HTMLInputElement).value = account?.nameAr || ''
    ;(c.querySelector('#modal-nameEn') as HTMLInputElement).value = account?.nameEn || ''
    ;(c.querySelector('#acc-type') as HTMLSelectElement).value = account?.accountType || 'ASSET'
    ;(c.querySelector('#modal-parent') as HTMLSelectElement).value = account?.parentId || ''

    modal.classList.remove('hidden')
    modal.classList.add('flex')
  }

  private closeModal(c: HTMLElement) {
    const modal = c.querySelector('#account-modal') as HTMLElement
    modal.classList.add('hidden')
    modal.classList.remove('flex')
    this.editingId = null
  }

  private async saveAccount(c: HTMLElement) {
    const code = (c.querySelector('#acc-code') as HTMLInputElement).value.trim()
    const nameAr = (c.querySelector('#acc-name') as HTMLInputElement).value.trim()
    const nameEn = (c.querySelector('#modal-nameEn') as HTMLInputElement).value.trim()
    const accountType = (c.querySelector('#acc-type') as HTMLSelectElement).value
    const parentId = (c.querySelector('#modal-parent') as HTMLSelectElement).value || null

    if (!code || !nameAr) { ;(window as any).toast?.show?.({ message: 'الرمز والاسم مطلوبان', type: 'warning' }); return }

    try {
      const body = { code, nameAr, nameEn, accountType, parentId }
      const res = this.editingId
        ? await this.api.put<any>(`/api/accounts/${this.editingId}`, body)
        : await this.api.post<any>('/api/accounts', body)
      if (!res.success) { ;(window as any).toast?.show?.({ message: res.message || 'تعذر حفظ الحساب', type: 'error' }); return }
      this.closeModal(c)
      await this.loadData(c)
    } catch (err: any) {
      ;(window as any).toast?.show?.({ message: err.message || 'حدث خطأ', type: 'error' })
    }
  }

  private balanceCurrency(c: HTMLElement): Currency {
    return (c.querySelector('#balance-currency') as HTMLSelectElement).value === 'USD' ? 'USD' : 'SYP'
  }

  private refreshBalanceForm(c: HTMLElement) {
    const account = this.balanceAccount
    if (!account) return
    const currency = this.balanceCurrency(c)
    const value = currency === 'USD' ? account.balanceUSD : account.balanceSYP
    const normalSide = DEBIT_NORMAL_TYPES.includes(account.accountType) ? 'مدين' : 'دائن'
    const operation = (c.querySelector('#balance-operation') as HTMLSelectElement).value
    ;(c.querySelector('#balance-current') as HTMLElement).innerHTML =
      `الرصيد الحالي: <span dir="ltr" class="${value < 0 ? 'text-error' : 'text-on-surface'}">${amountText(value)}</span> ${CURRENCY_LABELS[currency]} <span class="text-text-tertiary font-normal">(طبيعة الحساب: ${normalSide})</span>`
    ;(c.querySelector('#balance-amount-label') as HTMLElement).textContent =
      operation === 'SET'
        ? `الرصيد المطلوب (${CURRENCY_LABELS[currency]})`
        : `المبلغ (${CURRENCY_LABELS[currency]})`
  }

  private openBalanceModal(c: HTMLElement, account: AccountNode) {
    this.balanceAccount = account
    const modal = c.querySelector('#balance-modal') as HTMLElement
    ;(c.querySelector('#balance-account-name') as HTMLElement).textContent = `${account.code} — ${account.nameAr}`
    ;(c.querySelector('#balance-currency') as HTMLSelectElement).value = 'SYP'
    ;(c.querySelector('#balance-operation') as HTMLSelectElement).value = 'ADD'
    ;(c.querySelector('#balance-amount') as HTMLInputElement).value = ''
    ;(c.querySelector('#balance-date') as HTMLInputElement).value = todayIso()
    ;(c.querySelector('#balance-notes') as HTMLInputElement).value = ''
    this.refreshBalanceForm(c)
    modal.classList.remove('hidden')
    modal.classList.add('flex')
  }

  private closeBalanceModal(c: HTMLElement) {
    const modal = c.querySelector('#balance-modal') as HTMLElement
    modal.classList.add('hidden')
    modal.classList.remove('flex')
    this.balanceAccount = null
  }

  private async saveBalance(c: HTMLElement) {
    const account = this.balanceAccount
    if (!account) return
    const currency = this.balanceCurrency(c)
    const mode = (c.querySelector('#balance-operation') as HTMLSelectElement).value
    const amount = parseFloat((c.querySelector('#balance-amount') as HTMLInputElement).value)
    const entryDate = (c.querySelector('#balance-date') as HTMLInputElement).value
    const notes = (c.querySelector('#balance-notes') as HTMLInputElement).value.trim()

    if (!Number.isFinite(amount) || (mode !== 'SET' && amount <= 0)) {
      ;(window as any).toast?.show?.({ message: 'أدخل مبلغاً صحيحاً أكبر من صفر', type: 'warning' })
      return
    }

    try {
      const res = await this.api.post<any>(`/api/accounts/${account.id}/balance-adjustments`, {
        currency,
        mode,
        amount,
        entryDate: entryDate || undefined,
        notes: notes || undefined,
      })
      if (!res.success) { ;(window as any).toast?.show?.({ message: res.message || 'تعذر تعديل الرصيد', type: 'error' }); return }
      ;(window as any).toast?.show?.({ message: 'تم تسجيل قيد تعديل الرصيد', type: 'success' })
      this.closeBalanceModal(c)
      await this.loadData(c)
    } catch (err: any) {
      ;(window as any).toast?.show?.({ message: err.message || 'حدث خطأ', type: 'error' })
    }
  }

  private async deleteAccount(c: HTMLElement, account: AccountNode) {
    if (!confirm(`حذف الحساب "${account.nameAr}"؟`)) return
    try {
      const res = await this.api.delete<any>(`/api/accounts/${account.id}`)
      if (!res.success) { ;(window as any).toast?.show?.({ message: res.message || 'تعذر حذف الحساب', type: 'error' }); return }
      await this.loadData(c)
    } catch (err: any) {
      ;(window as any).toast?.show?.({ message: err.message || 'حدث خطأ', type: 'error' })
    }
  }
}
