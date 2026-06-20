import { AuthService } from '../services/auth'
import { ApiClient } from '../api/client'
import { Router } from '../router'

export class InvoicePrintScreen {
  private api: ApiClient
  private router: Router
  private invoiceId: string

  constructor(_auth: AuthService, api: ApiClient, router: Router, invoiceId: string) {
    this.api = api
    this.router = router
    this.invoiceId = invoiceId
  }

  render(): HTMLElement {
    const el = document.createElement('div')
    el.className = 'min-h-screen bg-white'
    el.innerHTML = `
      <div class="max-w-[210mm] mx-auto p-8" id="invoice-print-container">
        <div class="flex items-center justify-between mb-6 print:hidden">
          <button id="back-btn" class="h-[40px] px-4 bg-surface-subtle text-on-surface font-ibmPlexSans font-body-md rounded-lg border border-border hover:bg-surface-container-low transition-colors flex items-center gap-2">
            <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
            رجوع
          </button>
          <button id="print-btn" class="h-[40px] px-4 bg-primary text-on-primary font-ibmPlexSans font-body-md rounded-lg shadow-sm hover:shadow-md transition-all flex items-center gap-2">
            <span class="material-symbols-outlined text-[18px]">print</span>
            طباعة
          </button>
        </div>
        <div id="invoice-content">
          <div class="skeleton-shimmer h-4 rounded w-32"></div>
        </div>
      </div>
    `
    el.querySelector('#back-btn')?.addEventListener('click', () => {
      this.router.navigate('/invoices')
    })
    el.querySelector('#print-btn')?.addEventListener('click', () => {
      window.print()
    })
    this.loadInvoice(el)
    return el
  }

  private async loadInvoice(el: HTMLElement) {
    try {
      const res = await this.api.get<any>(`/api/invoices/${this.invoiceId}`)
      const content = el.querySelector('#invoice-content')!
      if (res.success && res.data) {
        const inv = res.data
        const services = inv.items?.filter((it: any) => it.serviceId).map((it: any) => it) || []
        const materials = inv.items?.filter((it: any) => it.partId || it.materialId).map((it: any) => it) || []
        const statusText = inv.status === 'PAID' ? 'مدفوعة' : inv.status === 'PARTIALLY_PAID' ? 'جزئية' : inv.status === 'CANCELLED' ? 'ملغية' : 'غير مدفوعة'
        const statusColor = inv.status === 'PAID' ? '#16a34a' : inv.status === 'PARTIALLY_PAID' ? '#d97706' : inv.status === 'CANCELLED' ? '#6b7280' : '#dc2626'

        content.innerHTML = `
          <style>
            @media print {
              body { margin: 0; padding: 0; }
              .print-hidden { display: none !important; }
              .invoice-page { box-shadow: none !important; border: none !important; }
            }
          </style>
          <div class="invoice-page border border-gray-300 rounded-lg p-8 bg-white">
            <!-- Header -->
            <div class="flex justify-between items-start border-b-2 border-gray-800 pb-4 mb-4">
              <div>
                <h1 class="text-2xl font-bold text-gray-900">فاتورة ضريبية مبسطة</h1>
                <p class="text-sm text-gray-600 mt-1">مركز الصيانة والخدمات</p>
              </div>
              <div class="text-left" dir="ltr">
                <p class="text-lg font-bold text-gray-900">#${inv.invoiceNumber || inv.id?.slice(0,8)}</p>
                <p class="text-sm text-gray-600">${new Date(inv.createdAt || inv.invoiceDate).toLocaleDateString('ar-SA')}</p>
                <span class="inline-block mt-1 px-3 py-0.5 rounded-full text-sm font-medium" style="background:${statusColor}15;color:${statusColor};border:1px solid ${statusColor}40">${statusText}</span>
              </div>
            </div>

            <!-- Customer Info -->
            <div class="grid grid-cols-2 gap-4 mb-4 bg-gray-50 rounded-lg p-4">
              <div>
                <p class="text-xs text-gray-500 font-bold mb-1">العميل</p>
                <p class="text-base font-semibold text-gray-900">${inv.customer?.fullName || inv.customer?.name || inv.customerName || '-'}</p>
                <p class="text-sm text-gray-600">${inv.customer?.phone || '-'}</p>
              </div>
              <div>
                <p class="text-xs text-gray-500 font-bold mb-1">المركبة</p>
                <p class="text-base font-semibold text-gray-900">${inv.vehicle?.licensePlate || inv.vehicle?.plateNumber || '-'}</p>
                <p class="text-sm text-gray-600">${inv.vehicle?.make || ''} ${inv.vehicle?.model || ''}</p>
              </div>
            </div>

            <!-- Services Table -->
            ${services.length > 0 ? `
            <div class="mb-4">
              <h3 class="text-sm font-bold text-gray-800 mb-2 border-r-4 border-blue-600 pr-2">الخدمات</h3>
              <table class="w-full text-sm border-collapse">
                <thead>
                  <tr class="bg-gray-100 border-b border-gray-300">
                    <th class="text-right py-2 px-2 font-bold text-gray-700 w-8">#</th>
                    <th class="text-right py-2 px-2 font-bold text-gray-700">البيان</th>
                    <th class="text-right py-2 px-2 font-bold text-gray-700">السعر</th>
                    <th class="text-right py-2 px-2 font-bold text-gray-700">الضريبة</th>
                    <th class="text-right py-2 px-2 font-bold text-gray-700">الإجمالي</th>
                  </tr>
                </thead>
                <tbody>
                  ${services.map((s: any, i: number) => `
                  <tr class="border-b border-gray-200">
                    <td class="py-2 px-2 text-gray-600">${i + 1}</td>
                    <td class="py-2 px-2 text-gray-900">${s.description || s.name || 'خدمة'}</td>
                    <td class="py-2 px-2 text-gray-900">${(s.unitPriceSYP || s.priceSYP || 0).toLocaleString('ar-SA')}</td>
                    <td class="py-2 px-2 text-gray-900">${(s.taxSYP || 0).toLocaleString('ar-SA')}</td>
                    <td class="py-2 px-2 font-bold text-gray-900">${((s.unitPriceSYP || s.priceSYP || 0) + (s.taxSYP || 0)).toLocaleString('ar-SA')}</td>
                  </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
            ` : ''}

            <!-- Materials Table -->
            ${materials.length > 0 ? `
            <div class="mb-4">
              <h3 class="text-sm font-bold text-gray-800 mb-2 border-r-4 border-green-600 pr-2">المواد والقطع</h3>
              <table class="w-full text-sm border-collapse">
                <thead>
                  <tr class="bg-gray-100 border-b border-gray-300">
                    <th class="text-right py-2 px-2 font-bold text-gray-700 w-8">#</th>
                    <th class="text-right py-2 px-2 font-bold text-gray-700">البيان</th>
                    <th class="text-right py-2 px-2 font-bold text-gray-700">الكمية</th>
                    <th class="text-right py-2 px-2 font-bold text-gray-700">السعر</th>
                    <th class="text-right py-2 px-2 font-bold text-gray-700">الإجمالي</th>
                  </tr>
                </thead>
                <tbody>
                  ${materials.map((m: any, i: number) => `
                  <tr class="border-b border-gray-200">
                    <td class="py-2 px-2 text-gray-600">${i + 1}</td>
                    <td class="py-2 px-2 text-gray-900">${m.description || m.name || 'مادة'}</td>
                    <td class="py-2 px-2 text-gray-900">${m.quantity || 1}</td>
                    <td class="py-2 px-2 text-gray-900">${(m.unitPriceSYP || m.priceSYP || 0).toLocaleString('ar-SA')}</td>
                    <td class="py-2 px-2 font-bold text-gray-900">${((m.quantity || 1) * (m.unitPriceSYP || m.priceSYP || 0)).toLocaleString('ar-SA')}</td>
                  </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
            ` : ''}

            <!-- Warranty Section -->
            ${services.some((s: any) => s.service?.warrantyDays || s.warrantyDays) ? `
            <div class="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 class="text-sm font-bold text-blue-900 mb-2 flex items-center gap-2">
                <span class="material-symbols-outlined text-[16px]">verified</span>
                تفاصيل الكفالة
              </h3>
              <ul class="text-sm text-blue-800 space-y-1">
                ${services.filter((s: any) => (s.service?.warrantyDays || s.warrantyDays)).map((s: any) => `
                  <li>• ${s.description || s.name || 'خدمة'}: كفالة ${s.service?.warrantyDays || s.warrantyDays} يوم</li>
                `).join('')}
              </ul>
            </div>
            ` : ''}

            <!-- Totals -->
            <div class="border-t-2 border-gray-800 pt-4">
              <div class="flex justify-between py-1 text-sm">
                <span class="text-gray-600">المجموع الفرعي</span>
                <span class="font-medium text-gray-900">${(inv.subtotalSYP || 0).toLocaleString('ar-SA')} ل.س</span>
              </div>
              <div class="flex justify-between py-1 text-sm">
                <span class="text-gray-600">الضريبة</span>
                <span class="font-medium text-gray-900">${(inv.taxSYP || 0).toLocaleString('ar-SA')} ل.س</span>
              </div>
              ${inv.discountSYP > 0 ? `
              <div class="flex justify-between py-1 text-sm">
                <span class="text-gray-600">الخصم ${inv.discountType === 'PERCENTAGE' && inv.discountPercent ? '(' + inv.discountPercent + '%)' : ''}</span>
                <span class="font-medium text-gray-900">-${(inv.discountSYP || 0).toLocaleString('ar-SA')} ل.س</span>
              </div>
              ` : ''}
              <div class="flex justify-between py-2 mt-2 border-t border-gray-300 text-lg font-bold">
                <span class="text-gray-900">الإجمالي</span>
                <span class="text-gray-900">${(inv.totalSYP || 0).toLocaleString('ar-SA')} ل.س</span>
              </div>
              ${inv.paidSYP > 0 ? `
              <div class="flex justify-between py-1 text-sm">
                <span class="text-gray-600">المدفوع</span>
                <span class="font-medium text-green-700">${(inv.paidSYP || 0).toLocaleString('ar-SA')} ل.س</span>
              </div>
              <div class="flex justify-between py-1 text-sm">
                <span class="text-gray-600">المتبقي</span>
                <span class="font-medium ${(inv.totalSYP - inv.paidSYP) > 0 ? 'text-red-700' : 'text-green-700'}">${((inv.totalSYP || 0) - (inv.paidSYP || 0)).toLocaleString('ar-SA')} ل.س</span>
              </div>
              ` : ''}
            </div>

            <!-- Footer -->
            <div class="mt-8 pt-4 border-t border-gray-300 text-center text-xs text-gray-500">
              <p>شكراً لثقتكم بنا — للاستفسار: 09XXXXXXXX</p>
              <p class="mt-1">${new Date().toLocaleDateString('ar-SA')}</p>
            </div>
          </div>
        `
      } else {
        content.innerHTML = '<p class="text-error font-body-md">لا توجد بيانات للفاتورة</p>'
      }
    } catch {
      el.querySelector('#invoice-content')!.innerHTML = '<p class="text-error font-body-md">حدث خطأ أثناء تحميل الفاتورة</p>'
    }
  }
}
