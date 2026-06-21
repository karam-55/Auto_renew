import { AuthService } from '../services/auth'
import { ApiClient } from '../api/client'
import { Router } from '../router'
import { AppLayout } from '../components/layout'

export class InvoiceDetailScreen {
  private auth: AuthService
  private api: ApiClient
  private router: Router
  private invoiceId: string
  private invoiceData: any = null

  constructor(auth: AuthService, api: ApiClient, router: Router, invoiceId: string) {
    this.auth = auth
    this.api = api
    this.router = router
    this.invoiceId = invoiceId
  }

  render(): HTMLElement {
    const layout = new AppLayout(this.auth, this.router, 'تفاصيل الفاتورة', 'receipt_long', this.api)
    const content = document.createElement('div')
    content.className = 'page-enter max-w-3xl mx-auto'
    content.innerHTML = `
      <div class="space-y-stack-lg">
        <div class="flex items-center justify-between page-enter">
          <div>
            <h1 class="font-beVietnamPro text-headline-md text-on-surface">تفاصيل الفاتورة</h1>
            <p class="text-body-md text-on-surface-variant mt-1">رقم الفاتورة: #${this.invoiceId.slice(0, 8)}</p>
          </div>
          <div class="flex items-center gap-2">
            <button class="h-12 px-4 btn-tertiary-gradient text-white font-body-md rounded-xl shadow-lg shadow-tertiary/25 hover:scale-105 active:scale-95 transition-all flex items-center gap-2" id="print-btn">
              <span class="material-symbols-outlined text-[20px]">print</span>
              طباعة
            </button>
            <button class="h-12 px-4 bg-error/10 text-error font-body-md rounded-xl border border-error/20 hover:bg-error/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 hidden" id="cancel-btn">
              <span class="material-symbols-outlined text-[20px]">cancel</span>
              إلغاء الفاتورة
            </button>
            <button class="h-12 px-4 glass-card text-on-surface font-body-md rounded-xl border border-glass-border hover:bg-white/80 transition-all flex items-center gap-2" id="back-btn">
              <span class="material-symbols-outlined text-[20px]">arrow_forward</span>
              رجوع
            </button>
          </div>
        </div>
        <div id="invoice-detail-card" class="glass-card rounded-2xl p-card-padding stagger-entry stagger-entry-1">
          <div class="skeleton-shimmer h-4 rounded w-32"></div>
        </div>
      </div>
    `
    content.querySelector('#back-btn')?.addEventListener('click', () => {
      this.router.navigate('/invoices')
    })
    content.querySelector('#print-btn')?.addEventListener('click', () => {
      this.router.navigate(`/invoices/print/${this.invoiceId}`)
    })
    content.querySelector('#cancel-btn')?.addEventListener('click', () => {
      this.cancelInvoice(content)
    })
    content.addEventListener('click', (e) => {
      const btn = (e.target as HTMLElement).closest('#apply-discount-btn')
      if (btn) this.applyDiscount(content)
    })
    this.loadInvoice(content)
    return layout.render(content)
  }

  private async applyDiscount(el: HTMLElement) {
    const discountType = (el.querySelector('#discount-type') as HTMLSelectElement)?.value as 'FIXED' | 'PERCENTAGE'
    const discountValue = parseFloat((el.querySelector('#discount-value') as HTMLInputElement)?.value || '0')
    if (!discountValue || discountValue < 0) { ;(window as any).toast?.show?.({ message: 'قيمة الخصم غير صحيحة', type: 'warning' }); return }
    const subtotal = this.invoiceData?.subtotalSYP || 0
    if (discountType === 'FIXED' && discountValue > subtotal) {
      ;(window as any).toast?.show?.({ message: 'قيمة الخصم لا يمكن أن تتجاوز المجموع الفرعي', type: 'warning' }); return
    }
    if (discountType === 'PERCENTAGE' && discountValue > 100) {
      ;(window as any).toast?.show?.({ message: 'نسبة الخصم لا يمكن أن تتجاوز 100%', type: 'warning' }); return
    }

    const payload: any = {
      discountType,
      ...(discountType === 'PERCENTAGE' ? { discountPercent: discountValue } : { discountSYP: discountValue }),
    }

    const btn = el.querySelector('#apply-discount-btn') as HTMLButtonElement
    if (btn) { btn.disabled = true; btn.innerHTML = `<span class="material-symbols-outlined text-[20px] animate-spin">sync</span> جاري التطبيق...` }

    try {
      const res = await this.api.put<any>(`/api/invoices/${this.invoiceId}`, payload)
      if (res.success) {
        ;(window as any).toast?.show?.({ message: 'تم تطبيق الخصم بنجاح', type: 'success' })
        this.loadInvoice(el)
      } else {
        ;(window as any).toast?.show?.({ message: res.message || 'فشل تطبيق الخصم', type: 'error' })
      }
    } catch (err: any) {
      ;(window as any).toast?.show?.({ message: 'حدث خطأ: ' + (err.message || 'فشل الاتصال'), type: 'error' })
    } finally {
      if (btn) { btn.disabled = false; btn.innerHTML = `<span class="material-symbols-outlined text-[20px]">discount</span> تطبيق الخصم` }
    }
  }

  private async cancelInvoice(el: HTMLElement) {
    if (!confirm('هل أنت متأكد من إلغاء هذه الفاتورة؟ سيتم استبعادها من الإيرادات.')) return
    try {
      const res = await this.api.post<any>(`/api/invoices/${this.invoiceId}/cancel`, {})
      if (res.success) {
        ;(window as any).toast?.show?.({ message: 'تم إلغاء الفاتورة', type: 'success' })
        this.loadInvoice(el)
      } else {
        ;(window as any).toast?.show?.({ message: res.message || 'فشل إلغاء الفاتورة', type: 'error' })
      }
    } catch (err: any) {
      ;(window as any).toast?.show?.({ message: 'حدث خطأ: ' + (err.message || 'فشل الاتصال'), type: 'error' })
    }
  }

  private async loadInvoice(el: HTMLElement) {
    try {
      const res = await this.api.get<any>(`/api/invoices/${this.invoiceId}`)
      const card = el.querySelector('#invoice-detail-card')!
      if (res.success && res.data) {
        const inv = res.data
        this.invoiceData = inv
        const statusMap: Record<string, {cls: string; label: string; glow: string}> = {
          PAID: { cls: 'bg-success/10 text-success', label: 'مدفوعة', glow: 'rgba(5,150,105,0.4)' },
          PARTIALLY_PAID: { cls: 'bg-warning/10 text-warning', label: 'مدفوعة جزئياً', glow: 'rgba(217,119,6,0.4)' },
          OVERDUE: { cls: 'bg-error/10 text-error', label: 'متأخرة', glow: 'rgba(186,26,26,0.4)' },
          CANCELLED: { cls: 'bg-surface-container-high text-on-surface-variant', label: 'ملغية', glow: 'rgba(115,118,133,0.4)' },
          DRAFT: { cls: 'bg-surface-container-high text-on-surface-variant', label: 'مسودة', glow: 'rgba(115,118,133,0.4)' },
          ISSUED: { cls: 'bg-primary/10 text-primary', label: 'مُصدرة', glow: 'rgba(0,74,198,0.4)' },
          SENT: { cls: 'bg-primary/10 text-primary', label: 'مرسلة', glow: 'rgba(0,74,198,0.4)' },
        }
        const s = statusMap[inv.status] || { cls: 'bg-surface-container-high text-on-surface-variant', label: inv.status || 'معلقة', glow: 'rgba(115,118,133,0.4)' }
        const cancelBtn = el.querySelector('#cancel-btn') as HTMLButtonElement
        if (cancelBtn) {
          const canCancel = inv.status !== 'PAID' && inv.status !== 'CANCELLED' && inv.status !== 'PARTIALLY_PAID'
          cancelBtn.classList.toggle('hidden', !canCancel)
        }
        card.innerHTML = `
          <div class="flex justify-between items-start mb-6">
            <div>
              <h2 class="font-headline-md text-xl font-semibold text-on-surface">فاتورة #${inv.invoiceNumber || inv.id?.slice(0, 8)}</h2>
              <p class="text-on-surface-variant mt-1 font-body-md">${inv.customer?.fullName || '-'}</p>
            </div>
            <span class="inline-flex items-center px-3 py-1 rounded-full font-label-sm text-label-sm ${s.cls} badge-neon" style="text-shadow:0 0 8px ${s.glow}">${s.label}</span>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div class="glass-card rounded-xl p-4 border-t-4 border-primary">
              <p class="font-label-sm text-label-sm text-on-surface-variant">المجموع الفرعي</p>
              <p class="text-financial-data text-on-surface mt-1 font-bold">${inv.subtotalSYP?.toLocaleString('ar-SA') || 0} ل.س</p>
            </div>
            <div class="glass-card rounded-xl p-4 border-t-4 border-secondary">
              <p class="font-label-sm text-label-sm text-on-surface-variant">الضريبة</p>
              <p class="text-financial-data text-on-surface mt-1 font-bold">${inv.taxSYP?.toLocaleString('ar-SA') || 0} ل.س</p>
            </div>
            <div class="glass-card rounded-xl p-4 border-t-4 border-info">
              <p class="font-label-sm text-label-sm text-on-surface-variant">الخصم</p>
              <p class="text-financial-data text-on-surface mt-1 font-bold">
                ${inv.discountType === 'PERCENTAGE' && inv.discountPercent ? inv.discountPercent + '%' : ''}
                ${inv.discountSYP?.toLocaleString('ar-SA') || 0} ل.س
              </p>
            </div>
            <div class="glass-card rounded-xl p-4 border-t-4 border-primary">
              <p class="font-label-sm text-label-sm text-on-surface-variant">الإجمالي</p>
              <p class="text-financial-data text-primary mt-1 font-bold">${inv.totalSYP?.toLocaleString('ar-SA') || 0} ل.س</p>
            </div>
            <div class="glass-card rounded-xl p-4 border-t-4 border-tertiary">
              <p class="font-label-sm text-label-sm text-on-surface-variant">المدفوع</p>
              <p class="text-financial-data text-tertiary mt-1 font-bold">${inv.paidSYP?.toLocaleString('ar-SA') || 0} ل.س</p>
            </div>
            <div class="glass-card rounded-xl p-4 border-t-4 border-error">
              <p class="font-label-sm text-label-sm text-on-surface-variant">المتبقي</p>
              <p class="text-financial-data ${(inv.totalSYP || 0) - (inv.paidSYP || 0) > 0 ? 'text-error' : 'text-success'} mt-1 font-bold">${((inv.totalSYP || 0) - (inv.paidSYP || 0)).toLocaleString('ar-SA')} ل.س</p>
            </div>
          </div>

          ${inv.status === 'DRAFT' || inv.status === 'ISSUED' ? `
          <div class="border-t border-border pt-6">
            <h3 class="font-headline-md text-lg text-on-surface font-semibold mb-4">تطبيق خصم</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label class="block font-label-sm text-label-sm text-text-tertiary mb-2">نوع الخصم</label>
                <select id="discount-type" class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-ibmPlexSans font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow appearance-none" style="background-image: url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2716%27 height=%2716%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%23475569%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Cpath d=%27M6 9l6 6 6-6%27/%3E%3C/svg%3E'); background-repeat: no-repeat; background-position: left 0.75rem center; background-size: 1rem;">
                  <option value="FIXED" ${inv.discountType === 'FIXED' ? 'selected' : ''}>مبلغ ثابت</option>
                  <option value="PERCENTAGE" ${inv.discountType === 'PERCENTAGE' ? 'selected' : ''}>نسبة مئوية</option>
                </select>
              </div>
              <div>
                <label class="block font-label-sm text-label-sm text-text-tertiary mb-2">قيمة الخصم</label>
                <input type="number" id="discount-value" class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-ibmPlexSans font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow" placeholder="0.00" value="${inv.discountType === 'PERCENTAGE' && inv.discountPercent ? inv.discountPercent : inv.discountSYP || ''}" />
              </div>
              <div>
                <button id="apply-discount-btn" class="w-full h-[48px] bg-gradient-to-r from-primary to-primary-container text-on-primary font-ibmPlexSans font-body-lg rounded-full shadow-md hover:shadow-xl hover:-translate-y-[2px] active:translate-y-0 active:shadow-sm transition-all duration-200 flex items-center justify-center gap-2 border border-primary/20">
                  <span class="material-symbols-outlined text-[20px]">discount</span>
                  <span class="font-semibold">تطبيق الخصم</span>
                </button>
              </div>
            </div>
          </div>
          ` : ''}
        `
      } else {
        card.innerHTML = '<p class="text-error font-body-md">لا توجد بيانات</p>'
      }
    } catch {
      el.querySelector('#invoice-detail-card')!.innerHTML = '<p class="text-error font-body-md">حدث خطأ أثناء تحميل الفاتورة</p>'
    }
  }
}
