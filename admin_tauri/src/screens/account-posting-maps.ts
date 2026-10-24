import { AuthService } from '../services/auth'
import { ApiClient } from '../api/client'
import { Router } from '../router'
import { AppLayout } from '../components/layout'

const TYPE_LABELS: Record<string, string> = {
  ASSET: 'أصول',
  LIABILITY: 'التزامات',
  EQUITY: 'حقوق ملكية',
  REVENUE: 'إيرادات',
  COGS: 'تكاليف خدمات ومبيعات',
  EXPENSE: 'مصروفات',
}

function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]!)
}

interface AccountOption {
  id: string
  code: string
  nameAr: string
  accountType: string
  isActive: boolean
  children?: AccountOption[]
}

interface PostingMap {
  mappingKey: string
  labelAr: string
  accountType: string
  fallbackCode: string
  accountId: string | null
  accountCode: string | null
  accountName: string | null
  isActive: boolean
}

export class AccountPostingMapsScreen {
  constructor(private auth: AuthService, private api: ApiClient, private router: Router) {}

  render(): HTMLElement {
    const layout = new AppLayout(this.auth, this.router, 'ربط الحسابات', 'account_tree', this.api)
    const content = document.createElement('div')
    content.className = 'page-enter min-h-screen bg-background p-gutter'
    content.innerHTML = `
      <div class="max-w-7xl mx-auto space-y-stack-lg">
        <div class="flex items-center justify-between gap-4">
          <div>
            <h1 class="font-beVietnamPro text-headline-md text-on-surface">ربط الحسابات التلقائية</h1>
            <p class="text-body-md text-text-secondary mt-1">اختيار حساب الحركة لكل عملية. القيود المنشورة السابقة لا تتغير عند تعديل الربط.</p>
          </div>
          <button id="refresh-maps" class="h-10 px-4 rounded-lg border border-border bg-surface-subtle text-on-surface hover:bg-surface-container-low">تحديث</button>
        </div>
        <div class="rounded-xl border border-warning/30 bg-warning/5 p-4 text-sm text-on-surface">
          اختر حسابات حركة فرعية (بدون حسابات أب). إذا كان الحساب عليه قيود سابقة، تغيير هذا الربط يطبق على الحركات الجديدة فقط.
        </div>
        <div class="bg-surface-container-lowest rounded-xl shadow-md border border-surface-subtle overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-right">
              <thead>
                <tr class="bg-surface-subtle border-b border-outline-variant/10">
                  <th class="px-4 py-3 font-label-sm text-text-tertiary">نوع الحركة</th>
                  <th class="px-4 py-3 font-label-sm text-text-tertiary">نوع الحساب المطلوب</th>
                  <th class="px-4 py-3 font-label-sm text-text-tertiary">الحساب الحالي</th>
                  <th class="px-4 py-3 font-label-sm text-text-tertiary">تغيير الربط</th>
                  <th class="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody id="posting-maps-body">
                <tr><td colspan="5" class="px-4 py-8 text-center text-text-secondary">جاري تحميل ربط الحسابات...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `

    content.querySelector('#refresh-maps')?.addEventListener('click', () => this.load(content))
    this.load(content)
    return layout.render(content)
  }

  private async load(content: HTMLElement) {
    const tbody = content.querySelector('#posting-maps-body') as HTMLElement
    tbody.innerHTML = '<tr><td colspan="5" class="px-4 py-8 text-center text-text-secondary">جاري تحميل ربط الحسابات...</td></tr>'
    try {
      const [mapsResponse, accountsResponse] = await Promise.all([
        this.api.get<any>('/api/accounts/posting-maps', false),
        this.api.get<any>('/api/accounting/accounts/tree', false),
      ])
      if (mapsResponse.success === false || accountsResponse.success === false) {
        throw new Error(mapsResponse.message || accountsResponse.message || 'تعذر تحميل الحسابات')
      }
      const maps: PostingMap[] = Array.isArray(mapsResponse.data) ? mapsResponse.data : []
      const accountTree: AccountOption[] = Array.isArray(accountsResponse.data)
        ? accountsResponse.data
        : (accountsResponse.data?.data || [])
      const flat = this.flatten(accountTree)
      this.renderRows(content, maps, flat)
    } catch (error: any) {
      tbody.innerHTML = `<tr><td colspan="5" class="px-4 py-8 text-center text-error">${escapeHtml(error.message || 'تعذر تحميل ربط الحسابات')}</td></tr>`
    }
  }

  private flatten(accounts: AccountOption[]): AccountOption[] {
    return accounts.flatMap((account) => [account, ...this.flatten(account.children || [])])
  }

  private renderRows(content: HTMLElement, maps: PostingMap[], accounts: AccountOption[]) {
    const tbody = content.querySelector('#posting-maps-body') as HTMLElement
    if (maps.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="px-4 py-8 text-center text-text-secondary">ما في ربط افتراضي. جهّز دليل الحسابات أولاً من معالج الإعداد.</td></tr>'
      return
    }

    const leaves = accounts.filter((account) => account.isActive !== false && !(account.children?.length))
    tbody.innerHTML = maps.map((mapping) => {
      const compatible = leaves.filter((account) => account.accountType === mapping.accountType)
      const currentCode = mapping.accountCode || mapping.fallbackCode
      const selectedAccountId = mapping.accountId ||
        compatible.find((account) => account.code === mapping.fallbackCode)?.id ||
        ''
      return `
        <tr class="border-b border-surface-subtle/70">
          <td class="px-4 py-3 font-body-md text-on-surface">${escapeHtml(mapping.labelAr)}</td>
          <td class="px-4 py-3 text-sm text-text-secondary">${escapeHtml(TYPE_LABELS[mapping.accountType] || mapping.accountType)}</td>
          <td class="px-4 py-3 text-sm text-text-secondary" dir="ltr">${escapeHtml(currentCode)}${mapping.accountName ? ` · ${escapeHtml(mapping.accountName)}` : ' · غير مهيأ'}</td>
          <td class="px-4 py-3">
            <select data-account-map="${escapeHtml(mapping.mappingKey)}" class="w-full min-w-64 h-10 rounded-lg border border-border bg-surface-subtle px-3 text-on-surface">
              <option value="">اختر الحساب</option>
              ${compatible.map((account) => `
                <option value="${escapeHtml(account.id)}" ${selectedAccountId === account.id ? 'selected' : ''}>
                  ${escapeHtml(account.code)} — ${escapeHtml(account.nameAr)}
                </option>
              `).join('')}
            </select>
          </td>
          <td class="px-4 py-3 text-left">
            <button data-save-map="${escapeHtml(mapping.mappingKey)}" class="h-9 px-3 rounded-lg bg-primary text-white text-sm">حفظ</button>
          </td>
        </tr>
      `
    }).join('')

    tbody.querySelectorAll<HTMLButtonElement>('[data-save-map]').forEach((button) => {
      button.addEventListener('click', async () => {
        const mappingKey = button.dataset.saveMap!
        const select = Array.from(tbody.querySelectorAll<HTMLSelectElement>('select[data-account-map]'))
          .find((item) => item.dataset.accountMap === mappingKey)
        if (!select?.value) {
          ;(window as any).toast?.show?.({ message: 'اختر حساباً قبل الحفظ', type: 'warning' })
          return
        }
        button.disabled = true
        try {
          const response = await this.api.put<any>(`/api/accounts/posting-maps/${encodeURIComponent(mappingKey)}`, {
            accountId: select.value,
          })
          if (response.success === false) throw new Error(response.message || 'تعذر حفظ الربط')
          ;(window as any).toast?.show?.({ message: 'تم تحديث ربط الحساب للحركات الجديدة', type: 'success' })
          await this.load(content)
        } catch (error: any) {
          ;(window as any).toast?.show?.({ message: error.message || 'تعذر حفظ الربط', type: 'error' })
        } finally {
          button.disabled = false
        }
      })
    })
  }
}
