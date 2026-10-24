import { AuthService } from '../services/auth'
import { ApiClient } from '../api/client'
import { Router } from '../router'
import { AppLayout } from '../components/layout'

function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]!)
}

function formatSYP(value: unknown): string {
  return `${new Intl.NumberFormat('ar-SY', { maximumFractionDigits: 2 }).format(Number(value || 0))} ل.س`
}

function supplierActivityReference(value: unknown): string {
  const reference = String(value || '').trim()
  if (!reference || /^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(reference)) return '—'
  if (/^INTAKE:/i.test(reference)) return 'استلام مخزون'
  if (/^GRN:/i.test(reference)) return `سند استلام ${reference.slice(4)}`
  if (/^PO:/i.test(reference)) return `طلب شراء ${reference.slice(3)}`
  if (/^SP[-_:]/i.test(reference)) return `سند دفع ${reference.slice(3)}`
  if (/^INV[-_]/i.test(reference)) return `فاتورة ${reference.replace(/^INV[-_]/i, '').replace(/-/g, '/')}`
  return reference
}

function supplierArabicDescription(value: unknown): string {
  const description = String(value || '').trim()
  if (!description) return 'حركة على حساب المورد'
  if (/[\u0600-\u06ff]/.test(description)) return description
  if (/supplier payable settlement/i.test(description)) return 'تسوية ذمم المورد'
  if (/supplier payment via cash/i.test(description)) return 'دفعة للمورد نقداً'
  if (/supplier payment via bank/i.test(description)) return 'دفعة للمورد من البنك'
  if (/payable to supplier/i.test(description)) return 'مبلغ مستحق للمورد'
  if (/grn payable/i.test(description)) return 'ذمم مستحقة عن استلام بضاعة'
  if (/purchase order/i.test(description)) return 'شراء بضاعة بموجب طلب شراء'
  return 'حركة على حساب المورد'
}

export class SuppliersScreen {
  private auth: AuthService
  private api: ApiClient
  private router: Router

  constructor(auth: AuthService, api: ApiClient, router: Router) {
    this.auth = auth
    this.api = api
    this.router = router
  }

  render(): HTMLElement {
    const layout = new AppLayout(this.auth, this.router, 'إدارة الموردين', 'local_shipping', this.api)
    const content = document.createElement('div')
    content.className = 'page-enter min-h-screen bg-background p-gutter'
    content.innerHTML = `
      <div class="max-w-7xl mx-auto space-y-stack-lg">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="font-beVietnamPro text-headline-md text-on-surface">إدارة الموردين</h1>
            <p class="text-body-md text-text-secondary mt-1">قائمة الموردين وتواصل معهم</p>
          </div>
          <button class="h-[48px] bg-primary text-on-primary font-ibmPlexSans font-body-lg text-body-lg rounded-lg shadow-sm hover:shadow-lg hover:-translate-y-[1px] transition-all duration-200 flex items-center justify-center gap-2 px-6" id="new-supplier-btn">
            <span class="material-symbols-outlined text-[20px]">add</span>
            مورد جديد
          </button>
        </div>
        <div class="glass-panel rounded-xl shadow-lg border border-border p-card-padding">
          <div class="relative">
            <span class="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline">search</span>
            <input class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg pr-10 pl-4 font-ibmPlexSans font-body-md text-body-md text-on-surface placeholder:text-outline-variant focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow duration-200" placeholder="بحث بالاسم..." id="search-input"/>
          </div>
        </div>
        <div class="bg-surface-container-lowest rounded-xl shadow-md border border-surface-subtle overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="bg-surface-subtle border-b border-outline-variant/10">
                  <th class="px-6 py-4 text-right font-label-sm text-label-sm text-text-tertiary uppercase">الاسم</th>
                  <th class="px-6 py-4 text-right font-label-sm text-label-sm text-text-tertiary uppercase">الموبايل</th>
                  <th class="px-6 py-4 text-right font-label-sm text-label-sm text-text-tertiary uppercase">العنوان</th>
                  <th class="px-6 py-4 text-right font-label-sm text-label-sm text-text-tertiary uppercase">الحالة</th>
                  <th class="px-6 py-4 text-right font-label-sm text-label-sm text-text-tertiary uppercase">الرصيد المستحق</th>
                  <th class="px-6 py-4 text-right font-label-sm text-label-sm text-text-tertiary uppercase">الحساب</th>
                </tr>
              </thead>
              <tbody id="table-tbody">
                <tr><td colspan="6" class="px-6 py-8 text-center text-text-secondary"><div class="skeleton-shimmer h-4 rounded w-32 mx-auto"></div></td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `
    this.loadData(content)
    content.querySelector('#new-supplier-btn')?.addEventListener('click', () => {
      this.showAddModal(content)
    })
    return layout.render(content)
  }

  private showAddModal(el: HTMLElement) {
    const existing = el.querySelector('#supplier-modal')
    if (existing) existing.remove()
    const modal = document.createElement('div')
    modal.id = 'supplier-modal'
    modal.className = 'fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm'
    modal.setAttribute('role', 'dialog')
    modal.setAttribute('aria-modal', 'true')
    modal.innerHTML = `
      <div class="bg-surface-container-lowest rounded-xl shadow-2xl border border-border w-full max-w-sm mx-4 p-6 space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="font-headline-md text-on-surface font-bold">مورد جديد</h2>
          <button class="touch-safe w-8 h-8 rounded-full flex items-center justify-center text-text-tertiary hover:text-error transition-colors" id="sup-modal-close" aria-label="إغلاق نافذة المورد"><span class="material-symbols-outlined" aria-hidden="true">close</span></button>
        </div>
        <div class="space-y-3">
          <div>
            <label class="block font-label-sm text-text-tertiary mb-1">الاسم *</label>
            <input id="sup-name" class="w-full h-10 bg-surface-subtle border border-outline-variant/20 rounded-lg px-3 text-sm text-on-surface outline-none focus:border-primary" required />
          </div>
          <div>
            <label class="block font-label-sm text-text-tertiary mb-1">الموبايل *</label>
            <input id="sup-phone" type="tel" required class="w-full h-10 bg-surface-subtle border border-outline-variant/20 rounded-lg px-3 text-sm text-on-surface outline-none focus:border-primary" />
          </div>
          <div>
            <label class="block font-label-sm text-text-tertiary mb-1">العنوان</label>
            <input id="sup-address" class="w-full h-10 bg-surface-subtle border border-outline-variant/20 rounded-lg px-3 text-sm text-on-surface outline-none focus:border-primary" />
          </div>
        </div>
        <div class="flex justify-end gap-3 pt-2">
          <button class="px-4 py-2 bg-surface-subtle text-on-surface rounded-lg text-sm font-medium border border-border" id="sup-modal-cancel">إلغاء</button>
          <button class="px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-medium" id="sup-save-btn">حفظ</button>
        </div>
      </div>
    `
    el.appendChild(modal)
    const close = () => modal.remove()
    modal.querySelector('#sup-modal-close')?.addEventListener('click', close)
    modal.querySelector('#sup-modal-cancel')?.addEventListener('click', close)
    modal.addEventListener('click', (e) => { if (e.target === modal) close() })
    modal.querySelector('#sup-save-btn')?.addEventListener('click', async () => {
      const name = (modal.querySelector('#sup-name') as HTMLInputElement)?.value?.trim() || ''
      const phone = (modal.querySelector('#sup-phone') as HTMLInputElement)?.value?.trim() || ''
      if (!name) { ;(window as any).toast?.show?.({ message: 'الاسم مطلوب', type: 'warning' }); return }
      if (!phone) { ;(window as any).toast?.show?.({ message: 'رقم الموبايل مطلوب للمورد', type: 'warning' }); return }
      const btn = modal.querySelector('#sup-save-btn') as HTMLButtonElement
      btn.disabled = true; btn.textContent = 'جاري...'
      try {
        const res = await this.api.post('/api/suppliers', {
          name,
          phone,
          address: (modal.querySelector('#sup-address') as HTMLInputElement)?.value?.trim() || undefined,
        })
        if (res.success) {
          close()
          ;(window as any).toast?.show?.({ message: 'تم إضافة المورد بنجاح', type: 'success' })
          this.loadData(el)
        } else {
          ;(window as any).toast?.show?.({ message: res.message || 'فشل الحفظ', type: 'error' })
          btn.disabled = false; btn.textContent = 'حفظ'
        }
      } catch {
        ;(window as any).toast?.show?.({ message: 'حدث خطأ في الاتصال', type: 'error' })
        btn.disabled = false; btn.textContent = 'حفظ'
      }
    })
  }

  private async loadData(el: HTMLElement) {
    try {
      const res = await this.api.get<any>('/api/suppliers')
      const tbody = el.querySelector('#table-tbody')!
      if (res.success && res.data) {
        const items = Array.isArray(res.data) ? res.data : res.data.data || []
        if (items.length === 0) { tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-8 text-center text-text-secondary font-body-md">لا توجد بيانات</td></tr>'; return }
        tbody.innerHTML = items.map((item: any) => `
          <tr class="border-b border-outline-variant/10 hover:bg-surface-container-low/50 transition-colors">
            <td class="px-6 py-4 font-body-md text-on-surface">${escapeHtml(item.name || '-')}</td>
            <td class="px-6 py-4 font-body-md text-on-surface" dir="ltr">${escapeHtml(item.phone || '-')}</td>
            <td class="px-6 py-4 font-body-md text-text-secondary">${escapeHtml(item.address || '-')}</td>
            <td class="px-6 py-4"><span class="inline-flex items-center px-3 py-1 rounded-full font-label-sm text-label-sm bg-tertiary/10 text-tertiary">نشط</span></td>
            <td class="px-6 py-4 font-semibold ${Number(item.balance || 0) > 0 ? 'text-warning' : 'text-success'}">
              <div>${formatSYP(Math.abs(Number(item.balance || 0)))}</div>
              <div class="mt-1 text-xs font-normal text-text-secondary">${Number(item.balance || 0) > 0 ? 'مستحق علينا' : Number(item.balance || 0) < 0 ? 'رصيد دائن للمورد' : 'لا توجد ذمم مستحقة'}</div>
            </td>
            <td class="px-6 py-4">
              <div class="flex gap-2">
                <button data-supplier-pay="${escapeHtml(item.id)}" class="px-3 py-1.5 rounded-lg bg-primary text-white text-sm">تسجيل دفعة</button>
                <button data-supplier-statement="${escapeHtml(item.id)}" class="px-3 py-1.5 rounded-lg border border-border text-on-surface text-sm">كشف الحساب</button>
              </div>
            </td>
          </tr>
        `).join('')
        tbody.querySelectorAll<HTMLButtonElement>('[data-supplier-pay]').forEach((button) => {
          button.addEventListener('click', () => {
            const supplier = items.find((item: any) => item.id === button.dataset.supplierPay)
            if (supplier) this.showPaymentModal(el, supplier)
          })
        })
        tbody.querySelectorAll<HTMLButtonElement>('[data-supplier-statement]').forEach((button) => {
          button.addEventListener('click', () => {
            const supplier = items.find((item: any) => item.id === button.dataset.supplierStatement)
            if (supplier) this.showStatement(el, supplier)
          })
        })
      }
    } catch { el.querySelector('#table-tbody')!.innerHTML = '<tr><td colspan="6" class="px-6 py-8 text-center text-error font-body-md">حدث خطأ</td></tr>' }
  }

  private showPaymentModal(parent: HTMLElement, supplier: any) {
    const idempotencyKey = crypto.randomUUID()
    const modal = document.createElement('div')
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'
    modal.innerHTML = `
      <div class="w-full max-w-md rounded-2xl border border-border bg-surface-container-lowest p-6 shadow-2xl">
        <h2 class="font-headline-md text-xl text-on-surface">تسجيل دفعة للمورد</h2>
        <p class="mt-1 text-sm text-text-secondary">${escapeHtml(supplier.name)}</p>
        <div class="mt-4 grid grid-cols-1 gap-3">
          <label class="text-sm text-text-secondary">المبلغ
            <input id="supplier-payment-amount" type="number" min="0.01" step="0.01" class="mt-1 h-11 w-full rounded-lg border border-border bg-surface-subtle px-3 text-on-surface" />
          </label>
          <label class="text-sm text-text-secondary">العملة
            <select id="supplier-payment-currency" class="mt-1 h-11 w-full rounded-lg border border-border bg-surface-subtle px-3 text-on-surface">
              <option value="SYP">ليرة سورية</option><option value="USD">دولار</option>
            </select>
          </label>
          <label class="text-sm text-text-secondary">طريقة الدفع
            <select id="supplier-payment-method" class="mt-1 h-11 w-full rounded-lg border border-border bg-surface-subtle px-3 text-on-surface">
              <option value="CASH">صندوق</option><option value="BANK">بنك</option>
            </select>
          </label>
          <label class="text-sm text-text-secondary">التاريخ
            <input id="supplier-payment-date" type="date" value="${new Date().toISOString().slice(0, 10)}" class="mt-1 h-11 w-full rounded-lg border border-border bg-surface-subtle px-3 text-on-surface" />
          </label>
          <label class="text-sm text-text-secondary">مرجع / ملاحظة
            <input id="supplier-payment-reference" class="mt-1 h-11 w-full rounded-lg border border-border bg-surface-subtle px-3 text-on-surface" />
          </label>
        </div>
        <div class="mt-5 flex justify-end gap-2">
          <button data-cancel class="h-10 rounded-lg border border-border px-4 text-on-surface">إلغاء</button>
          <button data-save class="h-10 rounded-lg bg-primary px-5 text-white">حفظ الدفعة</button>
        </div>
      </div>
    `
    const close = () => modal.remove()
    modal.querySelector('[data-cancel]')?.addEventListener('click', close)
    modal.addEventListener('click', (event) => { if (event.target === modal) close() })
    modal.querySelector('[data-save]')?.addEventListener('click', async (event) => {
      const button = event.currentTarget as HTMLButtonElement
      const amount = parseFloat((modal.querySelector('#supplier-payment-amount') as HTMLInputElement).value)
      if (!Number.isFinite(amount) || amount <= 0) {
        ;(window as any).toast?.show?.({ message: 'أدخل مبلغاً صحيحاً', type: 'warning' })
        return
      }
      button.disabled = true
      try {
        const response = await this.api.post<any>('/api/supplier-payments', {
          supplierId: supplier.id,
          amount,
          currency: (modal.querySelector('#supplier-payment-currency') as HTMLSelectElement).value,
          paymentMethod: (modal.querySelector('#supplier-payment-method') as HTMLSelectElement).value,
          paymentDate: (modal.querySelector('#supplier-payment-date') as HTMLInputElement).value,
          reference: (modal.querySelector('#supplier-payment-reference') as HTMLInputElement).value.trim() || undefined,
          idempotencyKey,
        })
        if (response.success === false) throw new Error(response.message || 'تعذر تسجيل الدفعة')
        close()
        ;(window as any).toast?.show?.({ message: 'تم تسجيل الدفعة وقيدها في الحسابات', type: 'success' })
        this.api.clearCache()
        this.loadData(parent)
      } catch (error: any) {
        ;(window as any).toast?.show?.({ message: error.message || 'تعذر تسجيل الدفعة', type: 'error' })
      } finally {
        button.disabled = false
      }
    })
    parent.appendChild(modal)
  }

  private async showStatement(parent: HTMLElement, supplier: any) {
    try {
      const response = await this.api.get<any>(`/api/supplier-payments/suppliers/${supplier.id}/statement`, false)
      if (response.success === false) throw new Error(response.message || 'تعذر تحميل كشف الحساب')
      const statement = response.data
      const modal = document.createElement('div')
      modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'
      const supplierBalance = Number(statement.supplier?.balance ?? supplier.balance ?? 0)
      modal.innerHTML = `
        <section role="dialog" aria-modal="true" aria-labelledby="supplier-statement-title" class="w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-surface-container-lowest p-4 sm:p-6 shadow-2xl">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 id="supplier-statement-title" class="font-headline-md text-xl text-on-surface">حركة وحساب المورد</h2>
              <p class="mt-1 text-sm text-text-secondary">${escapeHtml(supplier.name)}${supplier.phone ? ` · ${escapeHtml(supplier.phone)}` : ''}</p>
            </div>
            <button data-close class="min-h-[44px] rounded-lg border border-border px-4 text-on-surface">إغلاق</button>
          </div>
          <div class="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <article class="rounded-xl border border-border bg-surface p-4">
              <p class="text-sm text-text-secondary">المستحق للمورد</p>
              <p class="mt-2 text-xl font-bold ${supplierBalance > 0 ? 'text-warning' : 'text-success'}">${formatSYP(Math.abs(supplierBalance))}</p>
              <p class="mt-1 text-xs text-text-tertiary">${supplierBalance > 0 ? 'ذمم علينا' : supplierBalance < 0 ? 'رصيد دائن للمورد' : 'الحساب مسدد'}</p>
            </article>
            <article class="rounded-xl border border-border bg-surface p-4">
              <p class="text-sm text-text-secondary">حركات الشراء والاستلام</p>
              <p class="mt-2 text-xl font-bold text-on-surface">${(statement.activity || []).filter((item: any) => item.kind !== 'PAYMENT').length.toLocaleString('ar-SY')}</p>
              <p class="mt-1 text-xs text-text-tertiary">مواد وكميات تم استلامها من المورد</p>
            </article>
            <article class="rounded-xl border border-border bg-surface p-4">
              <p class="text-sm text-text-secondary">الدفعات المسجلة</p>
              <p class="mt-2 text-xl font-bold text-on-surface">${(statement.activity || []).filter((item: any) => item.kind === 'PAYMENT').length.toLocaleString('ar-SY')}</p>
              <p class="mt-1 text-xs text-text-tertiary">دفعات مخفضة من رصيد الذمم</p>
            </article>
          </div>

          <section class="mt-5 overflow-hidden rounded-xl border border-border">
            <div class="border-b border-border bg-surface-subtle px-4 py-3">
              <h3 class="font-semibold text-on-surface">المواد التي استلمناها والدفعات للمورد</h3>
              <p class="mt-1 text-sm text-text-secondary">كل استلام يظهر باسم المادة والكمية والتكلفة، وكل دفعة تخصم من الذمم.</p>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full min-w-[780px] text-right">
                <thead><tr class="bg-surface-subtle/50 text-sm text-text-secondary">
                  <th class="px-4 py-3">التاريخ</th><th class="px-4 py-3">نوع الحركة</th><th class="px-4 py-3">التفاصيل</th><th class="px-4 py-3">الكمية</th><th class="px-4 py-3">المرجع</th><th class="px-4 py-3">القيمة</th>
                </tr></thead>
                <tbody>${(statement.activity || []).length ? (statement.activity || []).map((item: any) => {
                  const date = item.date ? new Date(item.date).toLocaleDateString('ar-SY') : '—'
                  const isPayment = item.kind === 'PAYMENT'
                  const quantity = item.quantity == null ? '—' : `${new Intl.NumberFormat('ar-SY', { maximumFractionDigits: 3 }).format(Number(item.quantity))} ${escapeHtml(item.unitName || '')}`
                  return `<tr class="border-t border-border/70">
                    <td class="whitespace-nowrap px-4 py-3 text-sm">${escapeHtml(date)}</td>
                    <td class="px-4 py-3"><span class="rounded-full px-3 py-1 text-xs font-semibold ${isPayment ? 'bg-primary/10 text-primary' : item.kind === 'RETURN' ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'}">${isPayment ? 'دفعة' : item.kind === 'RETURN' ? 'مرتجع' : item.kind === 'DIRECT_PURCHASE' ? 'شراء مباشر' : 'شراء / استلام مخزون'}</span></td>
                    <td class="px-4 py-3 text-sm text-on-surface">${escapeHtml(item.description || 'حركة مورد')}${item.warehouseName ? `<div class="mt-1 text-xs text-text-tertiary">المستودع: ${escapeHtml(item.warehouseName)}</div>` : ''}</td>
                    <td class="whitespace-nowrap px-4 py-3 text-sm">${quantity}</td>
                    <td class="px-4 py-3 text-sm text-text-secondary">${escapeHtml(supplierActivityReference(item.reference))}</td>
                    <td class="whitespace-nowrap px-4 py-3 text-sm font-semibold">${formatSYP(item.amountSYP)}${item.amountUSD != null ? `<div class="text-xs font-normal text-text-tertiary" dir="ltr">$ ${Number(item.amountUSD).toLocaleString('en-US', { maximumFractionDigits: 2 })}</div>` : ''}</td>
                  </tr>`
                }).join('') : '<tr><td colspan="6" class="px-4 py-10 text-center text-text-secondary">لا توجد مشتريات أو دفعات مسجلة لهذا المورد بعد.</td></tr>'}</tbody>
              </table>
            </div>
          </section>

          <details class="mt-5 overflow-hidden rounded-xl border border-border">
            <summary class="cursor-pointer bg-surface-subtle px-4 py-3 font-semibold text-on-surface">تفاصيل الذمم المحاسبية (مدين / دائن)</summary>
            <div class="overflow-x-auto">
              <table class="w-full min-w-[700px] text-right">
                <thead class="bg-surface-subtle/50"><tr><th class="px-3 py-2">التاريخ</th><th class="px-3 py-2">الاستحقاق</th><th class="px-3 py-2">المرجع</th><th class="px-3 py-2">البيان</th><th class="px-3 py-2">مدين</th><th class="px-3 py-2">دائن</th><th class="px-3 py-2">الرصيد</th></tr></thead>
                <tbody>${(statement.transactions || []).map((line: any) => `
                  <tr class="border-t border-border/60">
                    <td class="px-3 py-2">${new Date(line.date).toLocaleDateString('ar-SY')}</td>
                    <td class="px-3 py-2">${line.dueDate ? new Date(line.dueDate).toLocaleDateString('ar-SY') : '—'}</td>
                    <td class="px-3 py-2">${escapeHtml(supplierActivityReference(line.reference))}</td>
                    <td class="px-3 py-2">${escapeHtml(supplierArabicDescription(line.description))}</td>
                    <td class="px-3 py-2">${formatSYP(line.debitSYP)}</td>
                    <td class="px-3 py-2">${formatSYP(line.creditSYP)}</td>
                    <td class="px-3 py-2">${formatSYP(line.balanceSYP)}</td>
                  </tr>`).join('')}
                </tbody>
              </table>
            </div>
            <div class="flex flex-wrap justify-end gap-x-6 gap-y-2 border-t border-border p-4 text-sm font-semibold text-on-surface">
              <span>رصيد الأستاذ: ${formatSYP(statement.closingBalanceSYP)}</span>
              <span>رصيد المورد الحالي: ${formatSYP(supplierBalance)}</span>
            </div>
          </details>
        </section>
      `
      modal.querySelector('[data-close]')?.addEventListener('click', () => modal.remove())
      modal.addEventListener('click', (event) => { if (event.target === modal) modal.remove() })
      parent.appendChild(modal)
    } catch (error: any) {
      ;(window as any).toast?.show?.({ message: error.message || 'تعذر تحميل كشف الحساب', type: 'error' })
    }
  }
}
