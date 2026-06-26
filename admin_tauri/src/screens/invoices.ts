import { AuthService } from '../services/auth'
import { ApiClient } from '../api/client'
import { Router } from '../router'
import { AppLayout } from '../components/layout'
import { emptyTableRow, exportToCSV } from '../utils/dom-helpers'

export class InvoicesScreen {
  private invoices: any[] = []

  constructor(private auth: AuthService, private api: ApiClient, private router: Router) {}

  render(): HTMLElement {
    const layout = new AppLayout(this.auth, this.router, 'الفواتير', 'receipt_long', this.api)
    const content = document.createElement('div')
    content.className = 'page-enter max-w-[1600px] mx-auto'
    content.innerHTML = `
      <div class="space-y-stack-lg">
        <div class="flex items-center justify-between page-enter">
          <div>
            <h1 class="font-beVietnamPro text-headline-md text-on-surface">إدارة الفواتير</h1>
            <p class="text-body-md text-on-surface-variant mt-1">متابعة الفواتير والمدفوعات</p>
          </div>
          <button class="h-12 btn-primary-gradient text-white font-body-md rounded-xl shadow-lg shadow-primary/25 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 px-6" id="new-invoice-btn">
            <span class="material-symbols-outlined text-[20px]">add</span>
            فاتورة جديدة
          </button>
        </div>
        <div class="glass-card rounded-2xl p-card-padding stagger-entry stagger-entry-1">
          <div class="flex flex-col sm:flex-row gap-4 items-center">
            <div class="relative flex-1 w-full">
              <span class="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
              <input class="w-full h-12 bg-white/50 border border-glass-border rounded-xl pr-10 pl-4 font-body-md text-on-surface placeholder:text-on-surface-variant input-glow transition-all" placeholder="بحث برقم الفاتورة أو العميل..." id="invoice-search"/>
            </div>
            <select class="h-12 bg-white/50 border border-glass-border rounded-xl pr-4 pl-10 font-body-md text-on-surface input-glow transition-all w-full sm:w-48 appearance-none cursor-pointer" style="background-image: url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2716%27 height=%2716%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%23737685%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Cpath d=%27M6 9l6 6 6-6%27/%3E%3C/svg%3E'); background-repeat: no-repeat; background-position: left 0.75rem center; background-size: 1rem;" id="status-filter">
              <option value="">كل الحالات</option>
              <option value="DRAFT">مسودة</option>
              <option value="ISSUED">مصدرة</option>
              <option value="PENDING">معلقة</option>
              <option value="UNPAID">غير مدفوعة</option>
              <option value="PARTIALLY_PAID">جزئية</option>
              <option value="PAID">مدفوعة</option>
              <option value="OVERDUE">متأخرة</option>
              <option value="CANCELLED">ملغية</option>
              <option value="VOID">باطلة</option>
            </select>
            <button class="h-12 px-4 bg-primary/10 text-primary font-body-md rounded-xl border border-primary/20 hover:bg-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 w-full sm:w-auto justify-center" id="refresh-invoices">
              <span class="material-symbols-outlined text-[20px]">sync</span>
              تحديث
            </button>
            <button class="h-12 px-4 bg-surface-container-high text-on-surface font-body-md rounded-xl border border-border hover:bg-surface-container-highest hover:scale-105 active:scale-95 transition-all flex items-center gap-2 w-full sm:w-auto justify-center" id="export-invoices-btn">
              <span class="material-symbols-outlined text-[20px]" aria-hidden="true">download</span>
              تصدير
            </button>
          </div>
        </div>
        <div class="glass-card rounded-2xl overflow-hidden stagger-entry stagger-entry-2">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="bg-white/40 border-b border-glass-border">
                  <th class="px-6 py-4 text-right font-label-sm text-on-surface-variant uppercase">رقم الفاتورة</th>
                  <th class="px-6 py-4 text-right font-label-sm text-on-surface-variant uppercase">العميل</th>
                  <th class="px-6 py-4 text-right font-label-sm text-on-surface-variant uppercase">التاريخ</th>
                  <th class="px-6 py-4 text-right font-label-sm text-on-surface-variant uppercase">المجموع</th>
                  <th class="px-6 py-4 text-right font-label-sm text-on-surface-variant uppercase">الحالة</th>
                  <th class="px-6 py-4 text-right font-label-sm text-on-surface-variant uppercase">إجراءات</th>
                </tr>
              </thead>
              <tbody id="invoices-tbody">
                <tr><td colspan="6" class="px-6 py-8 text-center text-on-surface-variant"><div class="skeleton-shimmer h-4 rounded w-32 mx-auto"></div></td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Smart FAB -->
      <button class="fab-glass pulse-glow touch-safe" id="invoices-fab" title="فاتورة جديدة" aria-label="إنشاء فاتورة جديدة">
        <span class="material-symbols-outlined text-[28px]" style="font-variation-settings: 'FILL' 1" aria-hidden="true">add</span>
      </button>
    `
    this.loadInvoices(content)
    content.querySelector('#new-invoice-btn')?.addEventListener('click', () => this.showInvoiceTypeModal())
    content.querySelector('#invoices-fab')?.addEventListener('click', () => this.showInvoiceTypeModal())
    content.querySelector('#refresh-invoices')?.addEventListener('click', () => {
      this.api.clearCache()
      const tbody = content.querySelector('#invoices-tbody')!
      tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-8 text-center text-on-surface-variant"><div class="skeleton-shimmer h-4 rounded w-32 mx-auto"></div></td></tr>'
      this.loadInvoices(content)
    })
    content.querySelector('#export-invoices-btn')?.addEventListener('click', () => {
      const data = this.invoices.map((i: any) => ({
        رقم_الفاتورة: i.invoiceNumber || i.id?.slice(0, 8) || '',
        العميل: i.customer?.fullName || '-',
        التاريخ: i.invoiceDate ? new Date(i.invoiceDate).toLocaleDateString('ar-SA') : (i.createdAt ? new Date(i.createdAt).toLocaleDateString('ar-SA') : '-'),
        المبلغ: i.totalAmount ?? i.total ?? 0,
        الحالة: i.status,
        المدفوع: i.paidAmount ?? 0,
        المتبقي: (i.totalAmount ?? i.total ?? 0) - (i.paidAmount ?? 0),
      }))
      exportToCSV('invoices.csv', data)
    })
    return layout.render(content)
  }

  private async loadInvoices(el: HTMLElement) {
    try {
      const res = await this.api.get<any>('/api/invoices')
      const tbody = el.querySelector('#invoices-tbody')!
      if (res.success && res.data) {
        const invoices = Array.isArray(res.data) ? res.data : res.data.data || []
        this.invoices = invoices
        if (invoices.length === 0) { tbody.innerHTML = emptyTableRow(6, { icon: 'receipt_long', title: 'لا توجد فواتير', description: 'يمكنك إنشاء فاتورة جديدة من زر الإضافة' }); return }
        tbody.innerHTML = invoices.map((i: any) => `
          <tr class="border-b border-glass-border hover:bg-white/40 hover:translate-y-[-2px] hover:shadow-sm transition-all duration-300 group">
            <td class="px-6 py-4"><span class="inline-flex items-center px-2 py-1 rounded-lg bg-surface-container text-financial-data text-on-surface text-sm">${i.invoiceNumber || i.id?.slice(0,8)}</span></td>
            <td class="px-6 py-4 font-body-md text-on-surface font-semibold">${i.customer?.fullName || '-'}</td>
            <td class="px-6 py-4 font-body-md text-on-surface-variant">${i.invoiceDate ? new Date(i.invoiceDate).toLocaleDateString('ar-SA') : (i.createdAt ? new Date(i.createdAt).toLocaleDateString('ar-SA') : '-')}</td>
            <td class="px-6 py-4 text-financial-data text-on-surface font-semibold">${this.fmt(i.totalSYP || 0)} ل.س</td>
            <td class="px-6 py-4">${this.statusBadge(i.status)}</td>
            <td class="px-6 py-4">
              <div class="flex items-center gap-2">
                <button class="touch-safe w-8 h-8 rounded-lg hover:bg-primary-container/10 flex items-center justify-center text-on-surface-variant hover:text-primary hover:scale-110 transition-all" data-action="view" data-id="${i.id}" title="عرض" aria-label="عرض تفاصيل الفاتورة">
                  <span class="material-symbols-outlined text-[18px]" aria-hidden="true">visibility</span>
                </button>
                <button class="touch-safe w-8 h-8 rounded-lg hover:bg-tertiary/10 flex items-center justify-center text-on-surface-variant hover:text-tertiary hover:scale-110 transition-all" title="دفع" aria-label="تسجيل دفع الفاتورة" data-action="pay" data-id="${i.id}">
                  <span class="material-symbols-outlined text-[18px]" aria-hidden="true">payments</span>
                </button>
                ${i.status !== 'CANCELLED' && i.status !== 'VOID' ? `<button class="touch-safe w-8 h-8 rounded-lg hover:bg-error/10 flex items-center justify-center text-on-surface-variant hover:text-error hover:scale-110 transition-all" title="إلغاء" aria-label="إلغاء الفاتورة" data-action="cancel" data-id="${i.id}">
                  <span class="material-symbols-outlined text-[18px]" aria-hidden="true">cancel</span>
                </button>` : ''}
                <button class="touch-safe w-8 h-8 rounded-lg hover:bg-error/10 flex items-center justify-center text-on-surface-variant hover:text-error hover:scale-110 transition-all" title="حذف" aria-label="حذف الفاتورة" data-action="delete" data-id="${i.id}">
                  <span class="material-symbols-outlined text-[18px]" aria-hidden="true">delete</span>
                </button>
              </div>
            </td>
          </tr>
        `).join('')
        tbody.querySelectorAll('[data-action="view"]').forEach(btn => {
          btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id')
            if (id) this.router.navigate(`/invoices/${id}`)
          })
        })
        tbody.querySelectorAll('[data-action="pay"]').forEach(btn => {
          btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id')
            if (id) this.router.navigate(`/payments/new?invoiceId=${id}`)
          })
        })
        tbody.querySelectorAll('[data-action="cancel"]').forEach(btn => {
          btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id')
            if (id) this.cancelInvoice(el, id)
          })
        })
        tbody.querySelectorAll('[data-action="delete"]').forEach(btn => {
          btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id')
            if (id) this.deleteInvoice(el, id)
          })
        })
      }
    } catch { el.querySelector('#invoices-tbody')!.innerHTML = '<tr><td colspan="6" class="px-6 py-12 text-center text-error font-body-md"><span class="material-symbols-outlined text-4xl mb-2">error</span><br/>حدث خطأ</td></tr>' }
  }

  private statusBadge(s: string): string {
    const map: Record<string, {label:string;cls:string;glow:string}> = {
      DRAFT: {label:'مسودة', cls:'bg-surface-container-high text-text-secondary', glow:'rgba(115,118,133,0.4)'},
      ISSUED: {label:'مصدرة', cls:'bg-info/10 text-info', glow:'rgba(8,145,178,0.4)'},
      PENDING: {label:'معلقة', cls:'bg-warning/10 text-warning', glow:'rgba(217,119,6,0.4)'},
      UNPAID: {label:'غير مدفوعة', cls:'bg-error/10 text-error', glow:'rgba(186,26,26,0.4)'},
      PARTIALLY_PAID: {label:'جزئية', cls:'bg-warning/10 text-warning', glow:'rgba(217,119,6,0.4)'},
      PAID: {label:'مدفوعة', cls:'bg-success/10 text-success', glow:'rgba(5,150,105,0.4)'},
      OVERDUE: {label:'متأخرة', cls:'bg-tertiary/10 text-tertiary', glow:'rgba(117,31,0,0.4)'},
      CANCELLED: {label:'ملغية', cls:'bg-surface-container-high text-text-secondary', glow:'rgba(115,118,133,0.4)'},
      VOID: {label:'باطلة', cls:'bg-surface-container-high text-text-secondary', glow:'rgba(115,118,133,0.4)'},
      REFUNDED: {label:'مسترجعة', cls:'bg-secondary/10 text-secondary', glow:'rgba(113,42,226,0.4)'}
    }
    const m = map[s] || {label:s, cls:'bg-surface-container-high text-text-secondary', glow:'rgba(115,118,133,0.4)'}
    return `<span class="inline-flex items-center px-3 py-1 rounded-full font-label-sm text-label-sm ${m.cls} badge-neon" style="text-shadow:0 0 8px ${m.glow}">${m.label}</span>`
  }

  private async cancelInvoice(el: HTMLElement, id: string) {
    const confirmed = window.confirm('هل أنت متأكد من إلغاء هذه الفاتورة؟')
    if (!confirmed) return
    try {
      const res = await this.api.patch<any>(`/api/invoices/${id}/cancel`, {})
      if (res.success) {
        ;(window as any).toast?.show?.({ message: 'تم إلغاء الفاتورة بنجاح', type: 'success' })
        this.api.clearCache()
        this.loadInvoices(el)
      } else {
        throw new Error(res.message || 'فشل إلغاء الفاتورة')
      }
    } catch (err: any) {
      ;(window as any).toast?.show?.({ message: err.message || 'حدث خطأ أثناء إلغاء الفاتورة', type: 'error' })
    }
  }

  private async deleteInvoice(el: HTMLElement, id: string) {
    const confirmed = window.confirm('هل أنت متأكد من حذف هذه الفاتورة نهائياً؟')
    if (!confirmed) return
    try {
      const res = await this.api.delete<any>(`/api/invoices/${id}`)
      if (res.success) {
        ;(window as any).toast?.show?.({ message: 'تم حذف الفاتورة بنجاح', type: 'success' })
        this.api.clearCache()
        this.loadInvoices(el)
      } else {
        throw new Error(res.message || 'فشل حذف الفاتورة')
      }
    } catch (err: any) {
      ;(window as any).toast?.show?.({ message: err.message || 'حدث خطأ أثناء حذف الفاتورة', type: 'error' })
    }
  }
  private fmt(n: number) { return new Intl.NumberFormat('ar-SA',{minimumFractionDigits:2}).format(n) }

  private showInvoiceTypeModal() {
    const overlay = document.createElement('div')
    overlay.className = 'fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4'
    overlay.setAttribute('role', 'dialog')
    overlay.setAttribute('aria-modal', 'true')
    overlay.innerHTML = `
      <div class="glass-card rounded-2xl shadow-2xl border border-glass-border max-w-md w-full p-6 space-y-6 animate-in fade-in zoom-in duration-200">
        <div class="flex justify-between items-center">
          <h2 class="font-headline-md text-xl font-semibold text-on-surface font-beVietnamPro">إنشاء فاتورة جديدة</h2>
          <button class="w-10 h-10 rounded-full hover:bg-white/50 flex items-center justify-center text-on-surface-variant hover:text-primary hover:rotate-90 transition-all" id="modal-close">
            <span class="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        <div class="space-y-3">
          <button class="w-full p-5 border border-glass-border rounded-xl hover:border-primary hover:bg-primary-container/10 hover:translate-y-[-2px] transition-all text-right group" id="modal-manual">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-xl bg-primary-container/10 text-primary flex items-center justify-center group-hover:scale-110 transition-all">
                <span class="material-symbols-outlined text-[24px]">receipt_long</span>
              </div>
              <div class="flex-1">
                <h3 class="font-body-lg text-on-surface font-semibold group-hover:text-primary transition-colors">فاتورة عامة</h3>
                <p class="text-sm text-on-surface-variant mt-1">اختيار الخدمات يدوياً دون حجز مسبق</p>
              </div>
              <span class="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">arrow_back</span>
            </div>
          </button>
          <button class="w-full p-5 border border-glass-border rounded-xl hover:border-tertiary hover:bg-tertiary/10 hover:translate-y-[-2px] transition-all text-right group" id="modal-booking">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-xl bg-tertiary/10 text-tertiary flex items-center justify-center group-hover:scale-110 transition-all">
                <span class="material-symbols-outlined text-[24px]">event_note</span>
              </div>
              <div class="flex-1">
                <h3 class="font-body-lg text-on-surface font-semibold group-hover:text-tertiary transition-colors">فاتورة من حجز</h3>
                <p class="text-sm text-on-surface-variant mt-1">إنشاء فاتورة من حجز موجود للعميل</p>
              </div>
              <span class="material-symbols-outlined text-on-surface-variant group-hover:text-tertiary transition-colors">arrow_back</span>
            </div>
          </button>
        </div>
      </div>
    `
    document.body.appendChild(overlay)

    const closeModal = () => overlay.remove()
    overlay.querySelector('#modal-close')?.addEventListener('click', closeModal)
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal()
    })
    overlay.querySelector('#modal-manual')?.addEventListener('click', () => {
      closeModal()
      this.router.navigate('/invoices/new')
    })
    overlay.querySelector('#modal-booking')?.addEventListener('click', () => {
      closeModal()
      this.router.navigate('/invoices/new?type=booking')
    })
  }
}
