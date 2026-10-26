import { AuthService } from '../services/auth'
import { ApiClient } from '../api/client'
import { Router } from '../router'
import { AppLayout } from '../components/layout'
import { loadExchangeRate } from '../utils/currency'

interface PoLine {
  id: string
  partId: string
  quantity: number
  unitCost: number
  unitCostUSD: number | null
  totalCost: number
  totalCostUSD: number | null
  receivedQuantity: number
  part?: { id: string; partNumber?: string; name: string }
}

interface PurchaseOrder {
  id: string
  orderNumber: string
  supplierId: string
  supplier?: { id: string; name: string }
  orderDate: string
  status: string
  total: number
  totalUSD: number | null
  notes?: string | null
  items?: PoLine[]
}

interface SupplierOption { id: string; name: string }
interface PartOption { id: string; name: string; partNumber?: string; baseUnitName?: string }

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'معلقة',
  APPROVED: 'معتمدة',
  RECEIVED: 'مستلمة',
  CANCELLED: 'ملغاة',
}

const STATUS_TONES: Record<string, string> = {
  PENDING: 'bg-warning/10 text-warning',
  APPROVED: 'bg-tertiary/10 text-tertiary',
  RECEIVED: 'bg-primary/10 text-primary',
  CANCELLED: 'bg-error/10 text-error',
}

const esc = (value: string): string =>
  value.replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch] as string))

const money = (value: number | null | undefined, currency: 'SYP' | 'USD'): string => {
  if (value == null) return '-'
  if (currency === 'USD') return `$${Number(value).toLocaleString('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  return `${Number(value).toLocaleString('ar-SA', { maximumFractionDigits: 2 })} ل.س`
}

const dateOnly = (value: string | undefined): string => (value ? String(value).split('T')[0] : '-')
const todayIso = (): string => new Date().toLocaleDateString('en-CA')
const unpack = <T>(value: any): T[] => (Array.isArray(value) ? value : Array.isArray(value?.data) ? value.data : [])

export class PurchaseOrdersScreen {
  private rate = 0
  private suppliers: SupplierOption[] = []
  private parts: PartOption[] = []
  private status = ''
  private search = ''
  private order: PurchaseOrder | null = null
  private headerOrderId: string | null = null
  private lineOrderId: string | null = null
  private lineEditing: PoLine | null = null

  constructor(private auth: AuthService, private api: ApiClient, private router: Router) {}

  render(): HTMLElement {
    const layout = new AppLayout(this.auth, this.router, 'أوامر الشراء', 'shopping_cart', this.api)
    const c = document.createElement('div')
    c.className = 'page-enter min-h-screen bg-background p-gutter'
    c.innerHTML = `
      <div class="max-w-7xl mx-auto space-y-stack-lg">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 class="font-beVietnamPro text-headline-md text-on-surface">أوامر الشراء</h1>
            <p class="text-body-sm text-text-secondary mt-1">الاستلام يُدخل البضاعة للمخزون ويسجّل الدين للمورد تلقائياً في المحاسبة</p>
          </div>
          <button id="po-new" class="h-10 px-4 bg-primary text-white rounded-lg font-body-md flex items-center gap-2 hover:bg-primary-dark transition-colors">
            <span class="material-symbols-outlined text-[18px]" aria-hidden="true">add</span>
            أمر شراء جديد
          </button>
        </div>
        <div class="glass-panel rounded-xl shadow-lg border border-border p-card-padding grid grid-cols-1 md:grid-cols-3 gap-3">
          <input id="po-search" class="md:col-span-2 w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-body-md text-on-surface" placeholder="بحث برقم الطلب أو اسم المورد..."/>
          <select id="po-status" class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-3 font-body-md text-on-surface">
            <option value="">كل الحالات</option>
            <option value="PENDING">معلقة</option>
            <option value="APPROVED">معتمدة</option>
            <option value="RECEIVED">مستلمة</option>
            <option value="CANCELLED">ملغاة</option>
          </select>
        </div>
        <div class="bg-surface-container-lowest rounded-xl shadow-md border border-surface-subtle overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="bg-surface-subtle border-b border-outline-variant/10">
                  <th class="px-6 py-4 text-right font-label-sm text-label-sm text-text-tertiary">رقم الطلب</th>
                  <th class="px-6 py-4 text-right font-label-sm text-label-sm text-text-tertiary">المورد</th>
                  <th class="px-6 py-4 text-right font-label-sm text-label-sm text-text-tertiary">التاريخ</th>
                  <th class="px-6 py-4 text-right font-label-sm text-label-sm text-text-tertiary">الإجمالي</th>
                  <th class="px-6 py-4 text-right font-label-sm text-label-sm text-text-tertiary">الحالة</th>
                  <th class="px-6 py-4 text-center font-label-sm text-label-sm text-text-tertiary">إجراءات</th>
                </tr>
              </thead>
              <tbody id="po-tbody">
                <tr><td colspan="6" class="px-6 py-8 text-center text-text-secondary"><div class="skeleton-shimmer h-4 rounded w-32 mx-auto"></div></td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div id="po-detail-modal" class="fixed inset-0 bg-black/50 z-50 hidden items-center justify-center" role="dialog" aria-modal="true">
        <div class="bg-surface rounded-xl shadow-2xl border border-border w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 m-4" id="po-detail-body"></div>
      </div>
      <div id="po-header-modal" class="fixed inset-0 bg-black/50 z-50 hidden items-center justify-center" role="dialog" aria-modal="true">
        <div class="bg-surface rounded-xl shadow-2xl border border-border w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 m-4">
          <h2 id="po-header-title" class="font-headline-sm text-on-surface mb-4">أمر شراء جديد</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="md:col-span-1">
              <label class="block font-label-sm text-text-secondary mb-1">المورد *</label>
              <select id="po-supplier" class="w-full h-10 bg-surface-subtle border border-border rounded-lg px-3 font-body-md text-on-surface"></select>
            </div>
            <div>
              <label class="block font-label-sm text-text-secondary mb-1">تاريخ الطلب</label>
              <input id="po-date" type="date" class="w-full h-10 bg-surface-subtle border border-border rounded-lg px-3 font-body-md text-on-surface" dir="ltr"/>
            </div>
            <div>
              <label class="block font-label-sm text-text-secondary mb-1">ملاحظات</label>
              <input id="po-notes" class="w-full h-10 bg-surface-subtle border border-border rounded-lg px-3 font-body-md text-on-surface"/>
            </div>
          </div>
          <div id="po-items-section" class="mt-6">
            <div class="flex items-center justify-between mb-2">
              <h3 class="font-label-sm text-text-secondary">بنود الطلب (الكميات بالوحدة الأساسية، والتكلفة لكل وحدة)</h3>
              <button id="po-add-item" class="h-9 px-3 rounded-lg border border-border text-on-surface font-body-sm hover:bg-surface-subtle">إضافة بند</button>
            </div>
            <div id="po-items" class="space-y-2"></div>
          </div>
          <div class="flex justify-end gap-2 mt-6">
            <button id="po-header-cancel" class="h-10 px-4 rounded-lg font-body-md text-text-secondary hover:bg-surface-subtle">إلغاء</button>
            <button id="po-header-save" class="h-10 px-4 bg-primary text-white rounded-lg font-body-md hover:bg-primary-dark">حفظ</button>
          </div>
        </div>
      </div>
      <div id="po-line-modal" class="fixed inset-0 bg-black/50 z-50 hidden items-center justify-center" role="dialog" aria-modal="true">
        <div class="bg-surface rounded-xl shadow-2xl border border-border w-full max-w-md p-6 m-4">
          <h2 id="po-line-title" class="font-headline-sm text-on-surface mb-4">بند جديد</h2>
          <div class="space-y-3">
            <div>
              <label class="block font-label-sm text-text-secondary mb-1">المادة *</label>
              <select id="po-line-part" class="w-full h-10 bg-surface-subtle border border-border rounded-lg px-3 font-body-md text-on-surface"></select>
            </div>
            <div>
              <label id="po-line-qty-label" class="block font-label-sm text-text-secondary mb-1">الكمية (بالوحدة الأساسية) *</label>
              <input id="po-line-qty" type="number" min="0" step="0.001" class="w-full h-10 bg-surface-subtle border border-border rounded-lg px-3 font-body-md text-on-surface" dir="ltr"/>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-label-sm text-text-secondary mb-1">تكلفة الوحدة (ل.س)</label>
                <input id="po-line-syp" type="number" min="0" step="1" class="w-full h-10 bg-surface-subtle border border-border rounded-lg px-3 font-body-md text-on-surface" dir="ltr"/>
              </div>
              <div>
                <label class="block font-label-sm text-text-secondary mb-1">تكلفة الوحدة ($)</label>
                <input id="po-line-usd" type="number" min="0" step="0.01" class="w-full h-10 bg-surface-subtle border border-border rounded-lg px-3 font-body-md text-on-surface" dir="ltr"/>
              </div>
            </div>
            <p class="text-body-sm text-text-tertiary">أدخل التكلفة بإحدى العملتين والأخرى تُحسب تلقائياً بسعر الصرف المعتمد.</p>
          </div>
          <div class="flex justify-end gap-2 mt-6">
            <button id="po-line-cancel" class="h-10 px-4 rounded-lg font-body-md text-text-secondary hover:bg-surface-subtle">إلغاء</button>
            <button id="po-line-save" class="h-10 px-4 bg-primary text-white rounded-lg font-body-md hover:bg-primary-dark">حفظ البند</button>
          </div>
        </div>
      </div>`

    c.querySelector('#po-new')?.addEventListener('click', () => this.openHeaderModal(c, null))
    c.querySelector('#po-search')?.addEventListener('input', (e) => {
      this.search = (e.target as HTMLInputElement).value.trim()
      void this.loadList(c)
    })
    c.querySelector('#po-status')?.addEventListener('change', (e) => {
      this.status = (e.target as HTMLSelectElement).value
      void this.loadList(c)
    })
    c.querySelector('#po-header-cancel')?.addEventListener('click', () => this.hide(c, '#po-header-modal'))
    c.querySelector('#po-header-save')?.addEventListener('click', () => void this.saveHeader(c))
    c.querySelector('#po-add-item')?.addEventListener('click', () => this.addItemRow(c))
    c.querySelector('#po-line-cancel')?.addEventListener('click', () => this.hide(c, '#po-line-modal'))
    c.querySelector('#po-line-save')?.addEventListener('click', () => void this.saveLine(c))
    this.bindCostPair(c.querySelector('#po-line-syp') as HTMLInputElement, c.querySelector('#po-line-usd') as HTMLInputElement)

    void this.loadReferences(c)
    void this.loadList(c)
    return layout.render(c)
  }

  private show(c: HTMLElement, selector: string) {
    const el = c.querySelector(selector) as HTMLElement
    el.classList.remove('hidden')
    el.classList.add('flex')
  }

  private hide(c: HTMLElement, selector: string) {
    const el = c.querySelector(selector) as HTMLElement
    el.classList.add('hidden')
    el.classList.remove('flex')
  }

  private toast(message: string, type: 'success' | 'error' | 'warning') {
    ;(window as any).toast?.show?.({ message, type })
  }

  private bindCostPair(syp: HTMLInputElement | null, usd: HTMLInputElement | null) {
    if (!syp || !usd) return
    syp.addEventListener('input', () => {
      const value = parseFloat(syp.value)
      usd.value = Number.isFinite(value) && this.rate > 0 ? String(Math.round((value / this.rate) * 100) / 100) : ''
    })
    usd.addEventListener('input', () => {
      const value = parseFloat(usd.value)
      syp.value = Number.isFinite(value) && this.rate > 0 ? String(Math.round(value * this.rate)) : ''
    })
  }

  private async loadReferences(c: HTMLElement) {
    try {
      this.rate = await loadExchangeRate(this.api)
    } catch {
      this.rate = 0
    }
    try {
      this.suppliers = await this.fetchAll<SupplierOption>('/api/suppliers')
    } catch {
      this.suppliers = []
    }
    try {
      this.parts = await this.fetchAll<PartOption>('/api/parts')
    } catch {
      this.parts = []
    }
    const supplierSelect = c.querySelector('#po-supplier') as HTMLSelectElement | null
    if (supplierSelect) {
      supplierSelect.innerHTML = '<option value="">اختر المورد...</option>' +
        this.suppliers.map((s) => `<option value="${esc(s.id)}">${esc(s.name)}</option>`).join('')
    }
    const partSelect = c.querySelector('#po-line-part') as HTMLSelectElement | null
    if (partSelect) {
      partSelect.innerHTML = '<option value="">اختر المادة...</option>' + this.partOptions()
    }
  }

  private async fetchAll<T extends { id: string }>(basePath: string): Promise<T[]> {
    const byId = new Map<string, T>()
    const separator = basePath.includes('?') ? '&' : '?'
    for (let page = 1; page <= 20; page++) {
      const res = await this.api.get<any>(`${basePath}${separator}page=${page}&limit=100`, false)
      if (res.success === false) break
      const rows = unpack<T>(res.data)
      const before = byId.size
      rows.forEach((row) => byId.set(row.id, row))
      if (rows.length === 0 || byId.size === before) break
    }
    return Array.from(byId.values())
  }

  private partOptions(): string {
    return this.parts.map((p) => `<option value="${esc(p.id)}">${esc((p.partNumber ? p.partNumber + ' — ' : '') + p.name)}${p.baseUnitName ? ' (' + esc(p.baseUnitName) + ')' : ''}</option>`).join('')
  }

  private async loadList(c: HTMLElement) {
    const tbody = c.querySelector('#po-tbody') as HTMLElement
    try {
      const params = new URLSearchParams({ page: '1', limit: '100' })
      if (this.status) params.set('status', this.status)
      if (this.search) params.set('search', this.search)
      const res = await this.api.get<any>(`/api/purchase-orders?${params.toString()}`, false)
      if (!res.success) {
        tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-8 text-center text-error font-body-md">${esc(res.message || 'تعذر تحميل الأوامر')}</td></tr>`
        return
      }
      const rows = unpack<PurchaseOrder>(res.data)
      if (rows.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-8 text-center text-text-secondary font-body-md">لا توجد أوامر شراء</td></tr>'
        return
      }
      tbody.innerHTML = rows.map((po) => `
        <tr class="border-b border-outline-variant/10 hover:bg-surface-container-low/50 transition-colors">
          <td class="px-6 py-4 font-body-md text-on-surface" dir="ltr">${esc(po.orderNumber || po.id.slice(0, 8))}</td>
          <td class="px-6 py-4 font-body-md text-on-surface">${esc(po.supplier?.name || '-')}</td>
          <td class="px-6 py-4 font-body-md text-text-secondary">${dateOnly(po.orderDate)}</td>
          <td class="px-6 py-4 font-body-md text-on-surface" dir="ltr">${money(po.total, 'SYP')}<br><span class="text-text-tertiary text-body-sm">${money(po.totalUSD, 'USD')}</span></td>
          <td class="px-6 py-4"><span class="inline-flex items-center px-3 py-1 rounded-full font-label-sm text-label-sm ${STATUS_TONES[po.status] || 'bg-surface-subtle text-text-tertiary'}">${STATUS_LABELS[po.status] || esc(po.status)}</span></td>
          <td class="px-6 py-4 text-center"><button class="po-open h-9 px-3 rounded-lg border border-border text-on-surface font-body-sm hover:bg-surface-subtle" data-id="${esc(po.id)}">عرض</button></td>
        </tr>`).join('')
      tbody.querySelectorAll<HTMLButtonElement>('.po-open').forEach((btn) => {
        btn.addEventListener('click', () => void this.openDetail(c, btn.dataset.id as string))
      })
    } catch {
      tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-8 text-center text-error font-body-md">حدث خطأ أثناء تحميل الأوامر</td></tr>'
    }
  }

  private async fetchOrder(id: string): Promise<PurchaseOrder | null> {
    const res = await this.api.get<any>(`/api/purchase-orders/${encodeURIComponent(id)}`, false)
    if (!res.success) {
      this.toast(res.message || 'تعذر تحميل أمر الشراء', 'error')
      return null
    }
    return (res.data?.purchaseOrder ?? res.data) as PurchaseOrder
  }

  private async openDetail(c: HTMLElement, id: string) {
    const order = await this.fetchOrder(id)
    if (!order) return
    this.order = order
    this.renderDetail(c)
    this.show(c, '#po-detail-modal')
  }

  private renderDetail(c: HTMLElement) {
    const order = this.order
    const body = c.querySelector('#po-detail-body') as HTMLElement
    if (!order || !body) return
    const pending = order.status === 'PENDING'
    const approved = order.status === 'APPROVED'
    const lines = order.items || []
    const lineRows = lines.length
      ? lines.map((line) => `
        <tr class="border-b border-outline-variant/10">
          <td class="px-3 py-2 font-body-md text-on-surface">${esc(line.part?.name || line.partId)}</td>
          <td class="px-3 py-2 font-body-md text-on-surface" dir="ltr">${Number(line.quantity).toLocaleString('ar-SA')}</td>
          <td class="px-3 py-2 font-body-md text-on-surface" dir="ltr">${Number(line.receivedQuantity).toLocaleString('ar-SA')}</td>
          <td class="px-3 py-2 font-body-md text-on-surface" dir="ltr">${money(line.unitCost, 'SYP')}<br><span class="text-text-tertiary text-body-sm">${money(line.unitCostUSD, 'USD')}</span></td>
          <td class="px-3 py-2 font-body-md text-on-surface" dir="ltr">${money(line.totalCost, 'SYP')}<br><span class="text-text-tertiary text-body-sm">${money(line.totalCostUSD, 'USD')}</span></td>
          <td class="px-3 py-2 text-center">${pending ? `
            <button class="po-line-edit h-8 px-2 rounded-lg border border-border text-on-surface text-body-sm" data-line="${esc(line.id)}">تعديل</button>
            <button class="po-line-remove h-8 px-2 rounded-lg text-error text-body-sm" data-line="${esc(line.id)}">حذف</button>` : ''}
          </td>
        </tr>`).join('')
      : '<tr><td colspan="6" class="px-3 py-6 text-center text-text-secondary">لا توجد بنود</td></tr>'

    const actions = [
      pending ? '<button data-action="edit-header" class="po-action h-10 px-4 rounded-lg border border-border text-on-surface">تعديل البيانات</button>' : '',
      pending ? '<button data-action="add-line" class="po-action h-10 px-4 rounded-lg border border-border text-on-surface">إضافة بند</button>' : '',
      pending ? '<button data-action="approve" class="po-action h-10 px-4 rounded-lg bg-tertiary text-white">اعتماد الطلب</button>' : '',
      approved ? '<button data-action="receive" class="po-action h-10 px-4 rounded-lg bg-primary text-white">استلام البضاعة</button>' : '',
      pending || approved ? '<button data-action="cancel" class="po-action h-10 px-4 rounded-lg border border-error text-error">إلغاء الطلب</button>' : '',
      pending ? '<button data-action="delete" class="po-action h-10 px-4 rounded-lg text-error">حذف الطلب</button>' : '',
    ].join('')

    body.innerHTML = `
      <div class="flex items-start justify-between gap-4 mb-4">
        <div>
          <h2 class="font-headline-sm text-on-surface" dir="ltr">${esc(order.orderNumber || '')}</h2>
          <p class="text-body-md text-text-secondary mt-1">${esc(order.supplier?.name || '-')} · ${dateOnly(order.orderDate)}</p>
          ${order.notes ? `<p class="text-body-sm text-text-tertiary mt-1">${esc(order.notes)}</p>` : ''}
        </div>
        <div class="text-left">
          <span class="inline-flex items-center px-3 py-1 rounded-full font-label-sm text-label-sm ${STATUS_TONES[order.status] || ''}">${STATUS_LABELS[order.status] || esc(order.status)}</span>
          <button id="po-detail-close" class="block mt-3 h-9 px-3 rounded-lg text-text-secondary hover:bg-surface-subtle">إغلاق</button>
        </div>
      </div>
      <div class="overflow-x-auto border border-border rounded-lg">
        <table class="w-full">
          <thead>
            <tr class="bg-surface-subtle border-b border-outline-variant/10">
              <th class="px-3 py-2 text-right font-label-sm text-text-tertiary">المادة</th>
              <th class="px-3 py-2 text-right font-label-sm text-text-tertiary">الكمية</th>
              <th class="px-3 py-2 text-right font-label-sm text-text-tertiary">المستلم</th>
              <th class="px-3 py-2 text-right font-label-sm text-text-tertiary">تكلفة الوحدة</th>
              <th class="px-3 py-2 text-right font-label-sm text-text-tertiary">الإجمالي</th>
              <th class="px-3 py-2 text-center font-label-sm text-text-tertiary">${pending ? 'إجراءات' : ''}</th>
            </tr>
          </thead>
          <tbody>${lineRows}</tbody>
          <tfoot>
            <tr class="bg-surface-subtle">
              <td colspan="4" class="px-3 py-2 text-left font-semibold text-on-surface">الإجمالي</td>
              <td class="px-3 py-2 font-semibold text-on-surface" dir="ltr">${money(order.total, 'SYP')}<br><span class="text-text-tertiary text-body-sm">${money(order.totalUSD, 'USD')}</span></td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div class="flex flex-wrap gap-2 justify-end mt-6">${actions}</div>
      ${order.status === 'RECEIVED' || order.status === 'CANCELLED' ? '<p class="text-body-sm text-text-tertiary mt-3">هذا الأمر مغلق ولا يمكن تعديله.</p>' : ''}`

    body.querySelector('#po-detail-close')?.addEventListener('click', () => this.hide(c, '#po-detail-modal'))
    body.querySelectorAll<HTMLButtonElement>('.po-action').forEach((btn) => {
      btn.addEventListener('click', () => void this.runAction(c, btn.dataset.action as string))
    })
    body.querySelectorAll<HTMLButtonElement>('.po-line-edit').forEach((btn) => {
      btn.addEventListener('click', () => this.openLineModal(c, order.id, lines.find((l) => l.id === btn.dataset.line) || null))
    })
    body.querySelectorAll<HTMLButtonElement>('.po-line-remove').forEach((btn) => {
      btn.addEventListener('click', () => void this.removeLine(c, order.id, btn.dataset.line as string))
    })
  }

  private async refreshDetail(c: HTMLElement, id: string) {
    const order = await this.fetchOrder(id)
    if (order) {
      this.order = order
      this.renderDetail(c)
    }
    await this.loadList(c)
  }

  private async runAction(c: HTMLElement, action: string) {
    const order = this.order
    if (!order) return
    if (action === 'edit-header') return this.openHeaderModal(c, order)
    if (action === 'add-line') return this.openLineModal(c, order.id, null)
    if (action === 'delete') {
      if (!confirm(`حذف أمر الشراء ${order.orderNumber}؟`)) return
      const res = await this.api.delete<any>(`/api/purchase-orders/${order.id}`)
      if (!res.success) return this.toast(res.message || 'تعذر حذف الطلب', 'error')
      this.hide(c, '#po-detail-modal')
      this.toast('تم حذف أمر الشراء', 'success')
      return this.loadList(c)
    }
    const messages: Record<string, { path: string; confirmText?: string; done: string }> = {
      approve: { path: 'approve', done: 'تم اعتماد أمر الشراء' },
      receive: {
        path: 'receive',
        confirmText: 'سيتم إدخال البضاعة للمخزون بأسعار الاستلام، وتسجيل الدين على المورد في المحاسبة. متابعة؟',
        done: 'تم استلام البضاعة وتسجيل القيود',
      },
      cancel: { path: 'cancel', confirmText: `إلغاء أمر الشراء ${order.orderNumber}؟`, done: 'تم إلغاء أمر الشراء' },
    }
    const spec = messages[action]
    if (!spec) return
    if (spec.confirmText && !confirm(spec.confirmText)) return
    const res = await this.api.post<any>(`/api/purchase-orders/${order.id}/${spec.path}`, {})
    if (!res.success) return this.toast(res.message || 'تعذر تنفيذ الإجراء', 'error')
    this.toast(spec.done, 'success')
    await this.refreshDetail(c, order.id)
  }

  private async removeLine(c: HTMLElement, orderId: string, lineId: string) {
    if (!confirm('حذف هذا البند من الطلب؟')) return
    const res = await this.api.delete<any>(`/api/purchase-orders/${orderId}/lines/${lineId}`)
    if (!res.success) return this.toast(res.message || 'تعذر حذف البند', 'error')
    await this.refreshDetail(c, orderId)
  }

  private openHeaderModal(c: HTMLElement, order: PurchaseOrder | null) {
    this.headerOrderId = order?.id || null
    ;(c.querySelector('#po-header-title') as HTMLElement).textContent = order ? `تعديل ${order.orderNumber}` : 'أمر شراء جديد'
    ;(c.querySelector('#po-supplier') as HTMLSelectElement).value = order?.supplierId || ''
    ;(c.querySelector('#po-date') as HTMLInputElement).value = order ? dateOnly(order.orderDate) : todayIso()
    ;(c.querySelector('#po-notes') as HTMLInputElement).value = order?.notes || ''
    const itemsSection = c.querySelector('#po-items-section') as HTMLElement
    itemsSection.classList.toggle('hidden', !!order)
    const items = c.querySelector('#po-items') as HTMLElement
    items.innerHTML = ''
    if (!order) this.addItemRow(c)
    this.show(c, '#po-header-modal')
  }

  private addItemRow(c: HTMLElement) {
    const container = c.querySelector('#po-items') as HTMLElement
    const row = document.createElement('div')
    row.className = 'po-item-row grid grid-cols-12 gap-2 items-end'
    row.innerHTML = `
      <div class="col-span-5">
        <label class="block text-body-sm text-text-secondary mb-1">المادة</label>
        <select class="po-item-part w-full h-10 bg-surface-subtle border border-border rounded-lg px-2 font-body-md text-on-surface">${'<option value="">اختر المادة...</option>' + this.partOptions()}</select>
      </div>
      <div class="col-span-2">
        <label class="block text-body-sm text-text-secondary mb-1">الكمية</label>
        <input class="po-item-qty w-full h-10 bg-surface-subtle border border-border rounded-lg px-2 font-body-md text-on-surface" type="number" min="0" step="0.001" dir="ltr"/>
      </div>
      <div class="col-span-2">
        <label class="block text-body-sm text-text-secondary mb-1">سعر الوحدة (ل.س)</label>
        <input class="po-item-syp w-full h-10 bg-surface-subtle border border-border rounded-lg px-2 font-body-md text-on-surface" type="number" min="0" step="1" dir="ltr"/>
      </div>
      <div class="col-span-2">
        <label class="block text-body-sm text-text-secondary mb-1">سعر الوحدة ($)</label>
        <input class="po-item-usd w-full h-10 bg-surface-subtle border border-border rounded-lg px-2 font-body-md text-on-surface" type="number" min="0" step="0.01" dir="ltr"/>
      </div>
      <div class="col-span-1">
        <button type="button" class="po-item-remove w-10 h-10 rounded-lg text-error hover:bg-error/10" aria-label="حذف البند">×</button>
      </div>`
    row.querySelector('.po-item-remove')?.addEventListener('click', () => row.remove())
    this.bindCostPair(row.querySelector('.po-item-syp') as HTMLInputElement, row.querySelector('.po-item-usd') as HTMLInputElement)
    container.appendChild(row)
  }

  private async saveHeader(c: HTMLElement) {
    const supplierId = (c.querySelector('#po-supplier') as HTMLSelectElement).value
    const orderDateRaw = (c.querySelector('#po-date') as HTMLInputElement).value
    const orderDate = orderDateRaw ? new Date(orderDateRaw).toISOString() : undefined
    const notes = (c.querySelector('#po-notes') as HTMLInputElement).value.trim()
    if (!supplierId) return this.toast('اختر المورد', 'warning')

    if (this.headerOrderId) {
      const res = await this.api.put<any>(`/api/purchase-orders/${this.headerOrderId}`, { supplierId, orderDate, notes })
      if (!res.success) return this.toast(res.message || 'تعذر حفظ التعديل', 'error')
      this.hide(c, '#po-header-modal')
      this.toast('تم حفظ بيانات أمر الشراء', 'success')
      return this.refreshDetail(c, this.headerOrderId)
    }

    const rows = Array.from(c.querySelectorAll<HTMLElement>('.po-item-row'))
    const items: Array<Record<string, unknown>> = []
    for (const row of rows) {
      const partId = (row.querySelector('.po-item-part') as HTMLSelectElement).value
      const quantity = parseFloat((row.querySelector('.po-item-qty') as HTMLInputElement).value)
      const syp = (row.querySelector('.po-item-syp') as HTMLInputElement).value
      const usd = (row.querySelector('.po-item-usd') as HTMLInputElement).value
      if (!partId) return this.toast('اختر المادة لكل بند', 'warning')
      if (!Number.isFinite(quantity) || quantity <= 0) return this.toast('أدخل كمية صحيحة لكل بند', 'warning')
      if (syp === '' && usd === '') return this.toast('أدخل تكلفة الوحدة لكل بند', 'warning')
      items.push(syp !== '' ? { partId, quantity, unitCost: parseFloat(syp) } : { partId, quantity, unitCostUSD: parseFloat(usd) })
    }
    if (items.length === 0) return this.toast('أضف بنداً واحداً على الأقل', 'warning')

    const res = await this.api.post<any>('/api/purchase-orders', { supplierId, orderDate, notes: notes || undefined, items })
    if (!res.success) return this.toast(res.message || 'تعذر إنشاء أمر الشراء', 'error')
    this.hide(c, '#po-header-modal')
    this.toast('تم إنشاء أمر الشراء', 'success')
    await this.loadList(c)
  }

  private openLineModal(c: HTMLElement, orderId: string, line: PoLine | null) {
    this.lineOrderId = orderId
    this.lineEditing = line
    ;(c.querySelector('#po-line-title') as HTMLElement).textContent = line ? 'تعديل بند' : 'بند جديد'
    const partSelect = c.querySelector('#po-line-part') as HTMLSelectElement
    partSelect.value = line?.partId || ''
    partSelect.disabled = !!line
    ;(c.querySelector('#po-line-qty') as HTMLInputElement).value = line ? String(line.quantity) : ''
    ;(c.querySelector('#po-line-syp') as HTMLInputElement).value = line ? String(line.unitCost) : ''
    ;(c.querySelector('#po-line-usd') as HTMLInputElement).value = line?.unitCostUSD != null ? String(line.unitCostUSD) : ''
    this.show(c, '#po-line-modal')
  }

  private async saveLine(c: HTMLElement) {
    const orderId = this.lineOrderId
    if (!orderId) return
    const partId = (c.querySelector('#po-line-part') as HTMLSelectElement).value
    const quantity = parseFloat((c.querySelector('#po-line-qty') as HTMLInputElement).value)
    const syp = (c.querySelector('#po-line-syp') as HTMLInputElement).value
    const usd = (c.querySelector('#po-line-usd') as HTMLInputElement).value
    if (!this.lineEditing && !partId) return this.toast('اختر المادة', 'warning')
    if (!Number.isFinite(quantity) || quantity <= 0) return this.toast('أدخل كمية صحيحة', 'warning')
    if (syp === '' && usd === '') return this.toast('أدخل تكلفة الوحدة', 'warning')
    const cost = syp !== '' ? { unitCost: parseFloat(syp) } : { unitCostUSD: parseFloat(usd) }

    const res = this.lineEditing
      ? await this.api.put<any>(`/api/purchase-orders/${orderId}/lines/${this.lineEditing.id}`, { quantity, ...cost })
      : await this.api.post<any>(`/api/purchase-orders/${orderId}/lines`, { partId, quantity, ...cost })
    if (!res.success) return this.toast(res.message || 'تعذر حفظ البند', 'error')
    this.hide(c, '#po-line-modal')
    this.toast('تم حفظ البند', 'success')
    await this.refreshDetail(c, orderId)
  }
}
