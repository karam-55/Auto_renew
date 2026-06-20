import { AuthService } from '../services/auth'
import { ApiClient } from '../api/client'
import { Router } from '../router'
import { AppLayout } from '../components/layout'

export class PaymentScreen {
  private auth: AuthService
  private api: ApiClient
  private router: Router
  private invoiceId: string | null = null

  constructor(auth: AuthService, api: ApiClient, router: Router, invoiceId?: string) {
    this.auth = auth
    this.api = api
    this.router = router
    this.invoiceId = invoiceId || null
  }

  render(): HTMLElement {
    const layout = new AppLayout(this.auth, this.router, 'تسجيل دفعة', 'payments', this.api)
    const content = document.createElement('div')
    content.className = 'page-enter min-h-screen bg-background p-gutter'
    content.innerHTML = `
      <div class="max-w-xl mx-auto space-y-stack-lg">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="font-beVietnamPro text-headline-md text-on-surface">تسجيل دفعة</h1>
            <p class="text-body-md text-text-secondary mt-1">تسجيل دفعة جديدة للفاتورة</p>
          </div>
          <button class="h-[48px] px-4 bg-surface-subtle text-on-surface font-ibmPlexSans font-body-lg rounded-lg border border-border hover:bg-surface-container-low transition-colors flex items-center gap-2" id="back-btn">
            <span class="material-symbols-outlined text-[20px]">arrow_forward</span>
            رجوع
          </button>
        </div>
        <div id="invoice-card" class="bg-surface-container-lowest rounded-xl shadow-md border border-surface-subtle p-card-padding">
          <div class="skeleton-shimmer h-4 rounded w-32"></div>
        </div>
        <div class="bg-surface-container-lowest rounded-xl shadow-md border border-surface-subtle p-card-padding">
          <h3 class="font-headline-md text-lg text-on-surface font-semibold mb-4">بيانات الدفعة</h3>
          <div class="space-y-4">
            <div>
              <label class="block font-label-sm text-label-sm text-text-tertiary mb-2">المبلغ (ل.س)</label>
              <input type="number" id="pay-amount" class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-ibmPlexSans font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow" placeholder="0.00" />
            </div>
            <div>
              <label class="block font-label-sm text-label-sm text-text-tertiary mb-2">تاريخ الدفع</label>
              <input type="date" id="pay-date" class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-ibmPlexSans font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow" />
            </div>
            <div>
              <label class="block font-label-sm text-label-sm text-text-tertiary mb-2">طريقة الدفع</label>
              <select id="pay-method" class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-ibmPlexSans font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow appearance-none" style="background-image: url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2716%27 height=%2716%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%23475569%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Cpath d=%27M6 9l6 6 6-6%27/%3E%3C/svg%3E'); background-repeat: no-repeat; background-position: left 0.75rem center; background-size: 1rem;">
                <option value="CASH">نقدي</option>
                <option value="CREDIT_CARD">بطاقة ائتمان</option>
                <option value="BANK_TRANSFER">تحويل بنكي</option>
                <option value="CHEQUE">شيك</option>
                <option value="ELECTRONIC">دفع إلكتروني</option>
              </select>
            </div>
            <div>
              <label class="block font-label-sm text-label-sm text-text-tertiary mb-2">ملاحظات</label>
              <textarea id="pay-notes" rows="2" class="w-full bg-surface-subtle border border-border rounded-lg p-4 font-ibmPlexSans font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow resize-none" placeholder="ملاحظات اختيارية..."></textarea>
            </div>
            <div class="flex items-center gap-3 pt-2">
              <button id="save-btn" class="flex-1 h-[48px] bg-primary text-on-primary font-ibmPlexSans font-body-lg rounded-lg shadow-sm hover:shadow-lg hover:-translate-y-[1px] transition-all duration-200 flex items-center justify-center gap-2">
                <span class="material-symbols-outlined text-[20px]">save</span>
                حفظ الدفعة
              </button>
              <button id="print-btn" class="hidden h-[48px] px-4 bg-tertiary text-on-tertiary font-ibmPlexSans font-body-lg rounded-lg shadow-sm hover:shadow-lg hover:-translate-y-[1px] transition-all duration-200 flex items-center justify-center gap-2">
                <span class="material-symbols-outlined text-[20px]">print</span>
                طباعة الفاتورة
              </button>
            </div>
          </div>
        </div>
      </div>
    `
    content.querySelector('#back-btn')?.addEventListener('click', () => {
      this.router.navigate('/invoices')
    })
    content.querySelector('#save-btn')?.addEventListener('click', () => this.savePayment(content))
    content.querySelector('#print-btn')?.addEventListener('click', () => {
      if (this.invoiceId) this.router.navigate(`/invoices/print/${this.invoiceId}`)
    })
    // Set default date
    const dateInput = content.querySelector('#pay-date') as HTMLInputElement
    if (dateInput) dateInput.value = new Date().toISOString().split('T')[0]
    if (this.invoiceId) {
      this.loadInvoice(content, this.invoiceId)
    } else {
      const card = content.querySelector('#invoice-card')!
      card.innerHTML = '<p class="text-error font-body-md">لم يتم تحديد فاتورة</p>'
    }
    return layout.render(content)
  }

  private async loadInvoice(el: HTMLElement, invoiceId: string) {
    try {
      const res = await this.api.get<any>(`/api/invoices/${invoiceId}`)
      const card = el.querySelector('#invoice-card')!
      if (res.success && res.data) {
        const inv = res.data
        const remaining = (inv.totalSYP || 0) - (inv.paidSYP || 0)
        card.innerHTML = `
          <div class="flex justify-between items-start mb-4">
            <div>
              <h2 class="font-headline-md text-xl font-semibold text-on-surface">فاتورة #${inv.invoiceNumber || inv.id?.slice(0,8)}</h2>
              <p class="text-text-secondary mt-1 font-body-md">${inv.customer?.fullName || inv.customer?.name || '-'}</p>
            </div>
            <span class="inline-flex items-center px-3 py-1 rounded-full font-label-sm text-label-sm ${inv.status === 'PAID' ? 'bg-tertiary/10 text-tertiary' : inv.status === 'PARTIALLY_PAID' ? 'bg-warning/10 text-warning' : 'bg-error/10 text-error'}">${inv.status === 'PAID' ? 'مدفوعة' : inv.status === 'PARTIALLY_PAID' ? 'جزئية' : 'غير مدفوعة'}</span>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="bg-surface-subtle rounded-lg p-4">
              <p class="font-label-sm text-label-sm text-text-tertiary">الإجمالي</p>
              <p class="text-financial-data text-on-surface mt-1">${(inv.totalSYP || 0).toLocaleString('ar-SA')} ل.س</p>
            </div>
            <div class="bg-surface-subtle rounded-lg p-4">
              <p class="font-label-sm text-label-sm text-text-tertiary">المتبقي</p>
              <p class="text-financial-data ${remaining > 0 ? 'text-error' : 'text-tertiary'} mt-1">${remaining.toLocaleString('ar-SA')} ل.س</p>
            </div>
          </div>
        `
        // Pre-fill amount with remaining
        const amountInput = el.querySelector('#pay-amount') as HTMLInputElement
        if (amountInput && remaining > 0) amountInput.value = String(remaining)
      } else {
        card.innerHTML = '<p class="text-error font-body-md">لا توجد بيانات للفاتورة</p>'
      }
    } catch {
      el.querySelector('#invoice-card')!.innerHTML = '<p class="text-error font-body-md">حدث خطأ أثناء تحميل الفاتورة</p>'
    }
  }

  private async savePayment(el: HTMLElement) {
    if (!this.invoiceId) { alert('لم يتم تحديد فاتورة'); return }
    const amount = parseFloat((el.querySelector('#pay-amount') as HTMLInputElement)?.value || '0')
    const dateVal = (el.querySelector('#pay-date') as HTMLInputElement)?.value
    const method = (el.querySelector('#pay-method') as HTMLSelectElement)?.value
    const notes = (el.querySelector('#pay-notes') as HTMLTextAreaElement)?.value

    if (!amount || amount <= 0) { alert('يرجى إدخال مبلغ صحيح'); return }
    if (!dateVal) { alert('يرجى اختيار تاريخ الدفع'); return }

    const payload = {
      invoiceId: this.invoiceId,
      amountSYP: amount,
      paymentDate: new Date(dateVal).toISOString(),
      paymentMethod: method,
      notes: notes || undefined,
    }

    const saveBtn = el.querySelector('#save-btn') as HTMLButtonElement
    const printBtn = el.querySelector('#print-btn') as HTMLButtonElement
    if (saveBtn) {
      saveBtn.disabled = true
      saveBtn.innerHTML = `<span class="material-symbols-outlined text-[20px] animate-spin">sync</span> جاري الحفظ...`
    }

    try {
      const res = await this.api.post<any>('/api/payments', payload)
      if (res.success) {
        alert('تم تسجيل الدفعة بنجاح')
        // Show print button after successful payment
        if (printBtn) printBtn.classList.remove('hidden')
        // Update invoice card
        this.loadInvoice(el, this.invoiceId!)
      } else {
        alert(res.message || 'فشل تسجيل الدفعة')
      }
    } catch (err: any) {
      alert('حدث خطأ: ' + (err.message || 'فشل الاتصال'))
    } finally {
      if (saveBtn) {
        saveBtn.disabled = false
        saveBtn.innerHTML = `<span class="material-symbols-outlined text-[20px]">save</span> حفظ الدفعة`
      }
    }
  }
}
