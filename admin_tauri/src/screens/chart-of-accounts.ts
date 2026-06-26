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

export class ChartOfAccountsScreen {
  private accounts: AccountNode[] = []
  private allFlat: AccountNode[] = []
  private currentPage = 1
  private itemsPerPage = 15

  constructor(private auth: AuthService, private api: ApiClient, private router: Router) {}

  render(): HTMLElement {
    const layout = new AppLayout(this.auth, this.router, 'شجرة الحسابات', 'account_tree', this.api)
    const c = document.createElement('div')
    c.className = 'page-enter min-h-screen bg-background p-gutter'
    c.innerHTML = [
      '<div class="max-w-7xl mx-auto space-y-stack-lg">',
      '  <div class="flex items-center justify-between">',
      '    <h1 class="font-beVietnamPro text-headline-md text-on-surface">شجرة الحسابات</h1>',
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
      '            <th class="px-6 py-4 text-center font-label-sm text-label-sm text-text-tertiary uppercase">إجراءات</th>',
      '          </tr>',
      '        </thead>',
      '        <tbody id="table-tbody">',
      '          <tr><td colspan="5" class="px-6 py-8 text-center text-text-secondary"><div class="skeleton-shimmer h-4 rounded w-32 mx-auto"></div></td></tr>',
      '        </tbody>',
      '      </table>',
      '    </div>',
      '    <div class="border-t border-outline-variant/10 px-6 py-4 flex items-center justify-between bg-surface-subtle/50">',
      '      <div id="pagination-info" class="text-body-sm text-text-secondary font-ibmPlexSans"></div>',
      '      <div id="pagination-controls" class="flex items-center gap-1"></div>',
      '    </div>',
      '  </div>',
      '</div>',
      '<div id="account-modal" class="fixed inset-0 bg-black/50 z-50 hidden items-center justify-center">',
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
      '      <div>',
      '        <label class="block font-label-sm text-text-secondary mb-1">الرصيد الافتتاحي (ل.س)</label>',
      '        <input id="modal-balance" type="number" class="w-full h-10 bg-surface-subtle border border-border rounded-lg px-3 font-body-md text-on-surface" dir="ltr" value="0"/>',
      '      </div>',
      '    </div>',
      '    <div class="flex justify-end gap-2 mt-6">',
      '      <button id="modal-cancel" class="h-10 px-4 rounded-lg font-body-md text-text-secondary hover:bg-surface-subtle transition-colors">إلغاء</button>',
      '      <button id="acc-save" class="h-10 px-4 bg-primary text-white rounded-lg font-body-md hover:bg-primary-dark transition-colors">حفظ</button>',
      '    </div>',
      '  </div>',
      '</div>',
      '<div id="balance-modal" class="fixed inset-0 bg-black/50 z-50 hidden items-center justify-center">',
      '  <div class="bg-surface rounded-xl shadow-2xl border border-border w-full max-w-sm p-6 m-4">',
      '    <h2 class="font-headline-sm text-on-surface mb-4">تعديل الرصيد</h2>',
      '    <p id="balance-account-name" class="text-text-secondary font-body-md mb-2"></p>',
      '    <p id="balance-current" class="text-primary font-body-md mb-4 font-bold"></p>',
      '    <div class="space-y-4">',
      '      <div>',
      '        <label class="block font-label-sm text-text-secondary mb-1">نوع العملية</label>',
      '        <select id="balance-operation" class="w-full h-10 bg-surface-subtle border border-border rounded-lg px-3 font-body-md text-on-surface">',
      '          <option value="add">إضافة (+)</option>',
      '          <option value="subtract">خصم (-)</option>',
      '        </select>',
      '      </div>',
      '      <div>',
      '        <label class="block font-label-sm text-text-secondary mb-1">المبلغ (ل.س)</label>',
      '        <input id="balance-amount" type="number" min="0" step="0.01" class="w-full h-10 bg-surface-subtle border border-border rounded-lg px-3 font-body-md text-on-surface" dir="ltr"/>',
      '      </div>',
      '    </div>',
      '    <div class="flex justify-end gap-2 mt-6">',
      '      <button id="balance-cancel" class="h-10 px-4 rounded-lg font-body-md text-text-secondary hover:bg-surface-subtle transition-colors">إلغاء</button>',
      '      <button id="balance-save" class="h-10 px-4 bg-primary text-white rounded-lg font-body-md hover:bg-primary-dark transition-colors">حفظ</button>',
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
      const res = await this.api.get<any>('/api/accounting/accounts/tree')
      const tbody = c.querySelector('#table-tbody')!
      if (res.success && res.data) {
        this.accounts = Array.isArray(res.data) ? res.data : res.data.data || []
        this.allFlat = this.flattenTree(this.accounts)
        this.renderTable(c)
        this.populateParentSelect(c)
      } else {
        tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-text-secondary font-body-md">لا توجد بيانات</td></tr>'
      }
    } catch (err: any) {
      const tbody = c.querySelector('#table-tbody')
      if (tbody) tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-error font-body-md">حدث خطأ: ' + err.message + '</td></tr>'
    }
  }

  private renderTable(c: HTMLElement, search = '') {
    const tbody = c.querySelector('#table-tbody')!
    let items = this.allFlat
    if (search) {
      const q = search.toLowerCase()
      items = items.filter(a => (a.code?.toLowerCase().includes(q) || a.nameAr?.toLowerCase().includes(q)))
      this.currentPage = 1 // Reset to page 1 on search
    }
    if (items.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-text-secondary font-body-md">لا توجد بيانات</td></tr>'
      this.renderPagination(c, 0, 0)
      return
    }

    const totalPages = Math.ceil(items.length / this.itemsPerPage)
    const start = (this.currentPage - 1) * this.itemsPerPage
    const pageItems = items.slice(start, start + this.itemsPerPage)

    tbody.innerHTML = ''
    for (const item of pageItems) {
      const indent = (item.level || 0) * 24
      const balance = Number(item.balanceSYP || 0).toLocaleString('ar-SA')
      const tr = document.createElement('tr')
      tr.className = 'border-b border-outline-variant/10 hover:bg-surface-container-low/50 transition-colors'
      tr.setAttribute('data-id', item.id)

      // Code cell
      const tdCode = document.createElement('td')
      tdCode.className = 'px-6 py-4 font-body-md text-on-surface'
      tdCode.setAttribute('dir', 'ltr')
      tdCode.textContent = item.code || '-'
      tr.appendChild(tdCode)

      // Name cell
      const tdName = document.createElement('td')
      tdName.className = 'px-6 py-4 font-body-md text-on-surface'
      const nameDiv = document.createElement('div')
      nameDiv.style.paddingRight = indent + 'px'
      nameDiv.textContent = item.nameAr || '-'
      tdName.appendChild(nameDiv)
      tr.appendChild(tdName)

      // Type cell
      const tdType = document.createElement('td')
      tdType.className = 'px-6 py-4 font-body-md text-text-secondary'
      tdType.textContent = TYPE_LABELS[item.accountType] || item.accountType || '-'
      tr.appendChild(tdType)

      // Balance cell
      const tdBalance = document.createElement('td')
      tdBalance.className = 'px-6 py-4 text-financial-data text-on-surface'
      tdBalance.setAttribute('dir', 'ltr')
      tdBalance.textContent = balance
      tr.appendChild(tdBalance)

      // Actions cell
      const tdActions = document.createElement('td')
      tdActions.className = 'px-6 py-4'
      const actionsDiv = document.createElement('div')
      actionsDiv.className = 'flex items-center justify-center gap-1'

      const editBtn = document.createElement('button')
      editBtn.className = 'action-edit touch-safe w-8 h-8 rounded-lg hover:bg-primary/10 text-primary flex items-center justify-center'
      editBtn.title = 'تعديل'
      editBtn.setAttribute('aria-label', 'تعديل الحساب')
      const editIcon = document.createElement('span')
      editIcon.className = 'material-symbols-outlined text-[18px]'
      editIcon.setAttribute('aria-hidden', 'true')
      editIcon.textContent = 'edit'
      editBtn.appendChild(editIcon)
      actionsDiv.appendChild(editBtn)

      const balanceBtn = document.createElement('button')
      balanceBtn.className = 'action-balance touch-safe w-8 h-8 rounded-lg hover:bg-tertiary/10 text-tertiary flex items-center justify-center'
      balanceBtn.title = 'إضافة رصيد'
      balanceBtn.setAttribute('aria-label', 'تعديل رصيد الحساب')
      const balanceIcon = document.createElement('span')
      balanceIcon.className = 'material-symbols-outlined text-[18px]'
      balanceIcon.setAttribute('aria-hidden', 'true')
      balanceIcon.textContent = 'payments'
      balanceBtn.appendChild(balanceIcon)
      actionsDiv.appendChild(balanceBtn)

      const deleteBtn = document.createElement('button')
      deleteBtn.className = 'action-delete touch-safe w-8 h-8 rounded-lg hover:bg-error/10 text-error flex items-center justify-center'
      deleteBtn.title = 'حذف'
      deleteBtn.setAttribute('aria-label', 'حذف الحساب')
      const deleteIcon = document.createElement('span')
      deleteIcon.className = 'material-symbols-outlined text-[18px]'
      deleteIcon.setAttribute('aria-hidden', 'true')
      deleteIcon.textContent = 'delete'
      deleteBtn.appendChild(deleteIcon)
      actionsDiv.appendChild(deleteBtn)

      tdActions.appendChild(actionsDiv)
      tr.appendChild(tdActions)

      tbody.appendChild(tr)
    }

    // Attach row actions
    tbody.querySelectorAll('.action-edit').forEach((btn, i) => {
      btn.addEventListener('click', () => this.openModal(c, pageItems[i]))
    })
    tbody.querySelectorAll('.action-balance').forEach((btn, i) => {
      btn.addEventListener('click', () => this.openBalanceModal(c, pageItems[i]))
    })
    tbody.querySelectorAll('.action-delete').forEach((btn, i) => {
      btn.addEventListener('click', () => this.deleteAccount(c, pageItems[i]))
    })

    this.renderPagination(c, items.length, totalPages)
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
      buttons.push('<button data-page="' + i + '" class="w-8 h-8 rounded-lg flex items-center justify-center font-body-sm transition-colors ' + (active ? 'bg-primary text-white' : 'text-on-surface hover:bg-surface-subtle') + '">' + i + '</button>')
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
      const label = acc.code + ' — ' + acc.nameAr
      select.innerHTML += '<option value="' + acc.id + '">' + label + '</option>'
    }
  }

  private editingId: string | null = null
  private balanceAccountId: string | null = null

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
    ;(c.querySelector('#modal-balance') as HTMLInputElement).value = String(account?.balanceSYP || 0)

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
    const parentId = (c.querySelector('#modal-parent') as HTMLSelectElement).value || undefined
    const balanceSYP = parseFloat((c.querySelector('#modal-balance') as HTMLInputElement).value) || 0

    if (!code || !nameAr) { ;(window as any).toast?.show?.({ message: 'الرمز والاسم مطلوبان', type: 'warning' }); return }

    try {
      if (this.editingId) {
        await this.api.put(`/api/accounts/${this.editingId}`, { code, nameAr, nameEn, accountType, parentId, balanceSYP, balanceUSD: 0 })
      } else {
        await this.api.post('/api/accounting/accounts', { code, nameAr, nameEn, parentId, accountType, balanceSYP, balanceUSD: 0 })
      }
      this.closeModal(c)
      await this.loadData(c)
    } catch (err: any) {
      ;(window as any).toast?.show?.({ message: err.message || 'حدث خطأ', type: 'error' })
    }
  }

  private openBalanceModal(c: HTMLElement, account: AccountNode) {
    this.balanceAccountId = account.id
    const modal = c.querySelector('#balance-modal') as HTMLElement
    ;(c.querySelector('#balance-account-name') as HTMLElement).textContent = `${account.code} — ${account.nameAr}`
    ;(c.querySelector('#balance-current') as HTMLElement).textContent = `الرصيد الحالي: ${Number(account.balanceSYP || 0).toLocaleString('ar-SA')} ل.س`
    ;(c.querySelector('#balance-operation') as HTMLSelectElement).value = 'add'
    ;(c.querySelector('#balance-amount') as HTMLInputElement).value = ''
    modal.classList.remove('hidden')
    modal.classList.add('flex')
  }

  private closeBalanceModal(c: HTMLElement) {
    const modal = c.querySelector('#balance-modal') as HTMLElement
    modal.classList.add('hidden')
    modal.classList.remove('flex')
    this.balanceAccountId = null
  }

  private async saveBalance(c: HTMLElement) {
    const amount = parseFloat((c.querySelector('#balance-amount') as HTMLInputElement).value)
    const operation = (c.querySelector('#balance-operation') as HTMLSelectElement).value
    if (!this.balanceAccountId || isNaN(amount) || amount < 0) { ;(window as any).toast?.show?.({ message: 'المبلغ مطلوب ويجب أن يكون موجباً', type: 'warning' }); return }

    try {
      // Find account and update balance
      const account = this.allFlat.find(a => a.id === this.balanceAccountId)
      if (!account) return
      const currentBalance = Number(account.balanceSYP) || 0
      const delta = operation === 'subtract' ? -amount : amount
      const newBalance = currentBalance + delta
      const res = await this.api.put(`/api/accounts/${this.balanceAccountId}`, { balanceSYP: newBalance })
      if (!res.success) { ;(window as any).toast?.show?.({ message: res.message || 'فشل تحديث الرصيد', type: 'error' }); return }
      this.closeBalanceModal(c)
      await this.loadData(c)
    } catch (err: any) {
      ;(window as any).toast?.show?.({ message: err.message || 'حدث خطأ', type: 'error' })
    }
  }

  private async deleteAccount(c: HTMLElement, account: AccountNode) {
    if (!confirm(`حذف الحساب "${account.nameAr}"؟`)) return
    try {
      await this.api.delete(`/api/accounts/${account.id}`)
      await this.loadData(c)
    } catch (err: any) {
      ;(window as any).toast?.show?.({ message: err.message || 'حدث خطأ', type: 'error' })
    }
  }
}
