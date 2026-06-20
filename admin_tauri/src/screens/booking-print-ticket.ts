import { AuthService } from '../services/auth'
import { ApiClient } from '../api/client'
import { Router } from '../router'

export class BookingPrintTicketScreen {
  private api: ApiClient
  private router: Router
  private bookingId: string

  constructor(_auth: AuthService, api: ApiClient, router: Router, bookingId: string) {
    this.api = api
    this.router = router
    this.bookingId = bookingId
  }

  render(): HTMLElement {
    const el = document.createElement('div')
    el.className = 'page-enter min-h-screen bg-surface-contrast pb-stack-lg'
    el.innerHTML = `
      <style>
        @media print {
          @page { size: A4 portrait; margin: 8mm; }
          html, body { background: white !important; margin: 0 !important; padding: 0 !important; height: auto !important; overflow: visible !important; }
          * { page-break-inside: avoid !important; }
          .print-container, .print-inner { page-break-inside: avoid !important; page-break-after: avoid !important; }
          .no-print { display: none !important; }
          .print-container {
            box-shadow: none !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            max-width: none !important;
            border: 1px solid #E2E8F0 !important;
          }
          .print-inner { padding: 8px !important; }
          .print-header { padding-bottom: 4px !important; margin-bottom: 4px !important; }
          .print-grid { gap: 4px !important; margin-bottom: 4px !important; }
          .print-card { padding: 6px !important; }
          .print-card .space-y-3 { gap: 2px !important; }
          .print-card .mb-4 { margin-bottom: 2px !important; }
          .print-services { margin-bottom: 2px !important; }
          .print-status { gap: 4px !important; margin-bottom: 4px !important; }
          .print-status > div { padding: 4px !important; }
          .print-footer { margin-top: 2px !important; padding-top: 2px !important; flex-direction: row !important; align-items: center !important; }
          .print-text-xl { font-size: 16px !important; line-height: 1.2 !important; }
          .print-text-lg { font-size: 13px !important; line-height: 1.2 !important; }
          .print-text-md { font-size: 11px !important; line-height: 1.2 !important; }
          .print-text-sm { font-size: 10px !important; line-height: 1.2 !important; }
          .print-qr { width: 56px !important; height: 56px !important; }
          .print-hide-pattern { background: none !important; }
          .ticket-pattern { background: none !important; }
        }
        .ticket-pattern {
          background-image: radial-gradient(#E2E8F0 1px, transparent 1px);
          background-size: 20px 20px;
        }
        #qrcode img, #qrcode canvas { margin: 0 auto; }
      </style>

      <!-- Actions (Hidden on Print) -->
      <div class="flex justify-between items-center mb-6 p-gutter no-print max-w-3xl mx-auto">
        <h1 class="font-headline-lg text-on-surface">تفاصيل الحجز</h1>
        <div class="flex gap-3">
          <button class="flex items-center gap-2 bg-surface border border-outline px-4 py-2 rounded-lg text-on-surface hover:bg-surface-container-low transition-colors shadow-sm" onclick="window.print()">
            <span class="material-symbols-outlined text-primary">print</span>
            <span class="font-label-sm">طباعة</span>
          </button>
          <button class="flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors shadow-sm" id="back-btn">
            <span class="material-symbols-outlined">arrow_forward</span>
            <span class="font-label-sm">رجوع</span>
          </button>
        </div>
      </div>

      <!-- Ticket Canvas -->
      <div class="max-w-3xl mx-auto px-gutter">
        <div class="bg-surface rounded-xl shadow-lg print-container relative overflow-hidden print-border ticket-pattern print-hide-pattern">
          <!-- Header Decorative Strip -->
          <div class="h-2 w-full bg-primary absolute top-0 left-0 right-0"></div>

          <div class="p-8 md:p-10 relative bg-surface/95 backdrop-blur-sm print-inner">
            <!-- Ticket Header -->
            <div class="flex justify-between items-start border-b border-outline/20 pb-4 mb-4 print-header">
              <div>
                <div class="flex items-center gap-3 mb-2">
                  <span class="material-symbols-outlined text-primary text-[28px]">confirmation_number</span>
                  <h2 class="font-headline-lg text-primary print-text-xl">تذكرة الحجز</h2>
                </div>
                <p class="font-body-md text-text-secondary mt-1">AUTO_Renew لخدمات السيارات المتميزة</p>
              </div>
              <div class="text-left">
                <div class="font-label-sm text-text-secondary uppercase mb-1">رقم الحجز</div>
                <div class="font-financial-data text-headline-md text-on-surface print-text-lg" id="pt-booking-id">---</div>
              </div>
            </div>

            <!-- Core Information Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 print-grid">
              <!-- Customer Info -->
              <div class="bg-surface-subtle p-4 rounded-lg border border-outline/10 shadow-sm print-card">
                <div class="flex items-center gap-2 mb-4">
                  <span class="material-symbols-outlined text-primary">person</span>
                  <h3 class="font-headline-md text-on-surface print-text-md">بيانات العميل</h3>
                </div>
                <div class="space-y-3">
                  <div>
                    <span class="font-label-sm text-text-secondary block mb-1">الاسم</span>
                    <span class="font-body-lg text-on-surface font-semibold print-text-md" id="pt-customer-name">---</span>
                  </div>
                  <div>
                    <span class="font-label-sm text-text-secondary block mb-1">تاريخ الحجز</span>
                    <span class="font-body-lg text-on-surface font-semibold print-text-md" id="pt-booking-date">---</span>
                  </div>
                  <div>
                    <span class="font-label-sm text-text-secondary block mb-1">الوقت</span>
                    <span class="font-body-lg text-on-surface font-semibold print-text-md" id="pt-booking-time">---</span>
                  </div>
                </div>
              </div>

              <!-- Vehicle Info -->
              <div class="bg-surface-subtle p-4 rounded-lg border border-outline/10 shadow-sm print-card">
                <div class="flex items-center gap-2 mb-4">
                  <span class="material-symbols-outlined text-primary">directions_car</span>
                  <h3 class="font-headline-md text-on-surface print-text-md">بيانات المركبة</h3>
                </div>
                <div class="space-y-3">
                  <div>
                    <span class="font-label-sm text-text-secondary block mb-1">المركبة</span>
                    <span class="font-body-lg text-on-surface font-semibold print-text-md" id="pt-vehicle-name">---</span>
                  </div>
                  <div>
                    <span class="font-label-sm text-text-secondary block mb-1">اللوحة</span>
                    <span class="font-financial-data text-body-lg text-on-surface font-semibold bg-white px-3 py-1 rounded border border-outline inline-block print-text-md" id="pt-vehicle-plate">---</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Services List -->
            <div class="mb-4 print-services">
              <h3 class="font-headline-md text-on-surface mb-4 flex items-center gap-2 print-text-md">
                <span class="material-symbols-outlined text-primary">build_circle</span>
                الخدمات المطلوبة
              </h3>
              <div class="bg-surface border border-outline/20 rounded-lg overflow-hidden">
                <table class="w-full text-right">
                  <thead class="bg-surface-subtle border-b border-outline/20">
                    <tr>
                      <th class="py-3 px-4 font-label-sm text-text-secondary">#</th>
                      <th class="py-3 px-4 font-label-sm text-text-secondary w-3/4">الخدمة</th>
                      <th class="py-3 px-4 font-label-sm text-text-secondary text-center">الحالة</th>
                    </tr>
                  </thead>
                  <tbody class="font-body-md" id="pt-services-tbody">
                    <tr><td colspan="3" class="py-8 px-4 text-center text-text-secondary">جاري التحميل...</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Booking Status Row -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 print-status">
              <div class="bg-surface-subtle p-3 rounded-lg border border-outline/10">
                <span class="font-label-sm text-text-secondary block mb-1">حالة الحجز</span>
                <span class="font-body-lg text-on-surface font-semibold print-text-md" id="pt-booking-status">---</span>
              </div>
              <div class="bg-surface-subtle p-3 rounded-lg border border-outline/10">
                <span class="font-label-sm text-text-secondary block mb-1">الأولوية</span>
                <span class="font-body-lg text-on-surface font-semibold print-text-md" id="pt-booking-priority">---</span>
              </div>
              <div class="bg-surface-subtle p-3 rounded-lg border border-outline/10">
                <span class="font-label-sm text-text-secondary block mb-1">ملاحظات</span>
                <span class="font-body-lg text-on-surface font-semibold truncate print-text-sm" id="pt-booking-notes">---</span>
              </div>
            </div>

            <!-- Footer / QR -->
            <div class="mt-4 pt-4 border-t border-outline/20 flex flex-col md:flex-row justify-between items-center gap-4 print-footer">
              <div class="text-center md:text-right">
                <p class="font-body-md text-text-secondary mb-2 print-text-sm">يرجى إبراز هذه التذكرة عند وصولك للمركز.</p>
                <p class="font-label-sm text-text-tertiary print-text-sm">للاستفسارات: +963900000000</p>
              </div>
              <div class="flex flex-col items-center">
                <div class="bg-white p-2 rounded-lg border border-outline shadow-sm mb-2">
                  <div id="qrcode" class="w-24 h-24 flex items-center justify-center print-qr">
                    <span class="text-xs text-text-secondary">جاري التحميل...</span>
                  </div>
                </div>
                <span class="font-label-sm text-text-secondary">امسح لتتبع الحالة</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `

    el.querySelector('#back-btn')?.addEventListener('click', () => {
      this.router.navigate('/bookings')
    })

    this.loadQrLibrary(() => this.loadData(el))
    return el
  }

  private loadQrLibrary(callback: () => void) {
    if ((window as any).QRCode) { callback(); return }
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js'
    script.onload = callback
    script.onerror = callback
    document.head.appendChild(script)
  }

  private async loadData(el: HTMLElement) {
    try {
      const res = await this.api.get<any>(`/api/bookings/${this.bookingId}`)
      if (!res.success || !res.data) { this.showError(el, 'لا توجد بيانات لهذا الحجز'); return }

      const b = res.data
      const setText = (id: string, val: string) => {
        const e = el.querySelector('#' + id)
        if (e) e.textContent = val
      }

      setText('pt-booking-id', b.id?.slice(0, 8).toUpperCase() || '---')
      setText('pt-customer-name', b.customer?.fullName || b.customer?.name || b.customerName || '-')
      setText('pt-booking-date', b.scheduledDate ? new Date(b.scheduledDate).toLocaleDateString('ar-SA') : '-')
      setText('pt-booking-time', b.scheduledTime || '-')
      setText('pt-vehicle-name', `${b.vehicle?.make || ''} ${b.vehicle?.model || ''}`.trim() || '-')
      setText('pt-vehicle-plate', b.vehicle?.licensePlate || b.plateNumber || '-')
      setText('pt-booking-status', this.statusLabel(b.status))
      setText('pt-booking-priority', b.priority === 'URGENT' ? 'عاجل' : b.priority === 'HIGH' ? 'عالي' : b.priority === 'LOW' ? 'منخفض' : 'عادي')
      setText('pt-booking-notes', b.notes || 'لا توجد ملاحظات')

      // Services table
      const tbody = el.querySelector('#pt-services-tbody') as HTMLElement
      if (tbody) {
        const svcs = b.services || b.bookingServices?.map((bs: any) => bs.service) || []
        if (svcs.length > 0) {
          tbody.innerHTML = svcs.map((s: any, i: number) => `
            <tr class="border-b border-outline/10">
              <td class="py-4 px-4 text-text-tertiary">${i + 1}</td>
              <td class="py-4 px-4 font-semibold">${s.name || 'خدمة'}</td>
              <td class="py-4 px-4 text-center">
                <span class="bg-surface-container text-on-surface-variant px-3 py-1 rounded-full font-label-sm">مجدول</span>
              </td>
            </tr>
          `).join('')
        } else {
          tbody.innerHTML = '<tr><td colspan="3" class="py-8 px-4 text-center text-text-secondary">لا توجد خدمات محددة</td></tr>'
        }
      }

      // QR Code
      const publicToken = b.publicToken || b.public_token || ''
      const baseDomain = window.location.port === '1420' ? 'http://178.105.209.59' : window.location.origin
      const qrUrl = publicToken
        ? `${baseDomain}/customer/?token=${publicToken}`
        : window.location.href

      const qrContainer = el.querySelector('#qrcode') as HTMLElement
      if (qrContainer && (window as any).QRCode) {
        qrContainer.innerHTML = ''
        new (window as any).QRCode(qrContainer, {
          text: qrUrl,
          width: 96,
          height: 96,
          colorDark: '#1e293b',
          colorLight: '#ffffff',
          correctLevel: (window as any).QRCode.CorrectLevel.M,
        })
      } else if (qrContainer) {
        qrContainer.innerHTML = '<p class="text-xs text-text-secondary text-center">QR</p>'
      }
    } catch {
      this.showError(el, 'حدث خطأ أثناء تحميل البيانات')
    }
  }

  private showError(el: HTMLElement, message: string) {
    const container = el.querySelector('.print-container') as HTMLElement
    if (container) {
      container.innerHTML = `<div class="p-12 text-center text-error font-body-md">${message}</div>`
    }
  }

  private statusLabel(status: string): string {
    const map: Record<string, string> = {
      PENDING: 'قيد الانتظار',
      CONFIRMED: 'مؤكد',
      IN_PROGRESS: 'قيد العمل',
      WAITING_PARTS: 'بانتظار المواد',
      READY: 'جاهز',
      COMPLETED: 'مكتمل',
      CANCELLED: 'ملغي',
    }
    return map[status] || status || '-'
  }
}
