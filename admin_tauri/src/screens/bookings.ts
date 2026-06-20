import { AuthService } from '../services/auth'
import { ApiClient } from '../api/client'
import { Router } from '../router'
import { AppLayout } from '../components/layout'

export class BookingsScreen {
  constructor(private auth: AuthService, private api: ApiClient, private router: Router) {}

  render(): HTMLElement {
    const layout = new AppLayout(this.auth, this.router, 'الحجوزات', 'calendar_month', this.api)
    const content = document.createElement('div')
    content.className = 'page-enter max-w-[1600px] mx-auto'
    content.innerHTML = `
      <div class="space-y-stack-lg">
        <!-- Page Header -->
        <div class="flex items-center justify-between page-enter">
          <div>
            <h1 class="font-beVietnamPro text-headline-md text-on-surface">إدارة الحجوزات</h1>
            <p class="text-body-md text-on-surface-variant mt-1">متابعة وإدارة جميع حجوزات الصيانة والإصلاح</p>
          </div>
          <div class="flex items-center gap-3">
            <button class="h-12 glass-card text-on-surface font-body-md rounded-xl border border-glass-border hover:bg-white/80 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 px-5" id="existing-booking-btn">
              <span class="material-symbols-outlined text-[20px]">person_search</span>
              حجز لعميل مسبق
            </button>
            <button class="h-12 btn-primary-gradient text-white font-body-md rounded-xl shadow-lg shadow-primary/25 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 px-6" id="new-booking-btn">
              <span class="material-symbols-outlined text-[20px]">add</span>
              حجز لعميل جديد
            </button>
          </div>
        </div>
        <!-- Filters -->
        <div class="glass-card rounded-2xl p-card-padding stagger-entry stagger-entry-1">
          <div class="flex flex-col md:flex-row gap-4 items-center">
            <div class="relative flex-1 w-full">
              <span class="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
              <input class="w-full h-12 bg-white/50 border border-glass-border rounded-xl pr-10 pl-4 font-body-md text-on-surface placeholder:text-on-surface-variant input-glow transition-all" type="text" placeholder="بحث: اسم، موبايل، لوحة، رقم طلب..." id="booking-search" />
            </div>
            <select class="h-12 bg-white/50 border border-glass-border rounded-xl pr-4 pl-10 font-body-md text-on-surface input-glow transition-all w-full md:w-48 appearance-none cursor-pointer" style="background-image: url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2716%27 height=%2716%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%23737685%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Cpath d=%27M6 9l6 6 6-6%27/%3E%3C/svg%3E'); background-repeat: no-repeat; background-position: left 0.75rem center; background-size: 1rem;" id="status-filter">
              <option value="">كل الحالات</option>
              <option value="PENDING">قيد الانتظار</option>
              <option value="CONFIRMED">مؤكد</option>
              <option value="IN_PROGRESS">قيد العمل</option>
              <option value="WAITING_PARTS">بانتظار المواد</option>
              <option value="READY">جاهز</option>
              <option value="COMPLETED">مكتمل</option>
              <option value="CANCELLED">ملغي</option>
            </select>
            <button class="h-12 px-4 bg-white/50 text-on-surface font-body-md rounded-xl border border-glass-border hover:bg-white/80 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 w-full md:w-auto justify-center" id="clear-filters">
              <span class="material-symbols-outlined text-[20px]">refresh</span>
              مسح
            </button>
          </div>
        </div>
        <!-- Bulk Actions Bar -->
        <div id="bulk-actions" class="hidden flex items-center justify-between glass-card border border-error/20 rounded-2xl p-4 stagger-entry">
          <span class="text-body-md text-error font-semibold" id="bulk-count">0 محدد</span>
          <button class="h-10 px-4 bg-error text-white font-body-md rounded-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 shadow-lg shadow-error/20" id="bulk-delete-btn">
            <span class="material-symbols-outlined text-[18px]">delete</span>
            حذف المحدد
          </button>
        </div>
        <!-- Table -->
        <div class="glass-card rounded-2xl overflow-hidden stagger-entry stagger-entry-2">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="bg-white/40 border-b border-glass-border">
                  <th class="px-3 py-4 text-right w-10">
                    <input type="checkbox" class="w-4 h-4 rounded border-glass-border text-primary focus:ring-primary" id="select-all" />
                  </th>
                  <th class="px-6 py-4 text-right font-label-sm text-on-surface-variant uppercase">رقم الطلب</th>
                  <th class="px-6 py-4 text-right font-label-sm text-on-surface-variant uppercase">العميل</th>
                  <th class="px-6 py-4 text-right font-label-sm text-on-surface-variant uppercase">المركبة</th>
                  <th class="px-6 py-4 text-right font-label-sm text-on-surface-variant uppercase">الخدمة</th>
                  <th class="px-6 py-4 text-right font-label-sm text-on-surface-variant uppercase">الحالة</th>
                  <th class="px-6 py-4 text-right font-label-sm text-on-surface-variant uppercase">التاريخ</th>
                  <th class="px-6 py-4 text-right font-label-sm text-on-surface-variant uppercase">إجراءات</th>
                </tr>
              </thead>
              <tbody id="bookings-tbody">
                <tr><td colspan="8" class="px-6 py-8 text-center text-on-surface-variant">
                  <div class="skeleton-shimmer h-4 rounded w-32 mx-auto"></div>
                </td></tr>
              </tbody>
            </table>
          </div>
        </div>
        <!-- Delete Confirmation Modal -->
        <div id="delete-modal" class="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center hidden">
          <div class="glass-card rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 border border-glass-border">
            <div class="flex flex-col items-center text-center gap-4">
              <div class="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center pulse-soft">
                <span class="material-symbols-outlined text-[32px] text-error">warning</span>
              </div>
              <h3 class="font-headline-md text-lg text-on-surface font-semibold" id="delete-modal-title">تأكيد الحذف</h3>
              <p class="text-body-md text-on-surface-variant" id="delete-modal-message">هل أنت متأكد من حذف هذا الحجز؟</p>
              <div class="flex gap-3 w-full">
                <button class="flex-1 h-12 glass-card text-on-surface font-body-md rounded-xl border border-glass-border hover:bg-white/80 transition-all" id="delete-modal-cancel">إلغاء</button>
                <button class="flex-1 h-12 bg-error text-white font-body-md rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-error/20" id="delete-modal-confirm">حذف</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Smart FAB -->
      <button class="fab-glass pulse-glow" id="bookings-fab" title="حجز جديد">
        <span class="material-symbols-outlined text-[28px]" style="font-variation-settings: 'FILL' 1">add</span>
      </button>
    `
    let allBookings: any[] = []

    const filterAndRender = () => {
      const searchInput = content.querySelector('#booking-search') as HTMLInputElement
      const statusSelect = content.querySelector('#status-filter') as HTMLSelectElement
      const searchTerm = searchInput?.value?.trim().toLowerCase() || ''
      const statusFilter = statusSelect?.value || ''

      let filtered = allBookings
      if (statusFilter) {
        filtered = filtered.filter((b: any) => b.status === statusFilter)
      }
      if (searchTerm) {
        filtered = filtered.filter((b: any) => {
          const customerName = (b.customer?.fullName || b.customer?.name || b.customerName || '').toLowerCase()
          const phone = (b.customer?.phone || '').toLowerCase()
          const plate = (b.vehicle?.licensePlate || b.plateNumber || '').toLowerCase()
          const idShort = (b.id || '').slice(0, 8).toLowerCase()
          return customerName.includes(searchTerm) || phone.includes(searchTerm) || plate.includes(searchTerm) || idShort.includes(searchTerm)
        })
      }
      this.renderBookings(content, filtered)
    }

    this.loadBookings(content, (bookings) => {
      allBookings = bookings
      filterAndRender()
    })

    content.querySelector('#new-booking-btn')?.addEventListener('click', () => this.router.navigate('/bookings/new'))
    content.querySelector('#existing-booking-btn')?.addEventListener('click', () => this.router.navigate('/bookings/existing'))
    content.querySelector('#bookings-fab')?.addEventListener('click', () => this.router.navigate('/bookings/new'))
    content.querySelector('#booking-search')?.addEventListener('input', filterAndRender)
    content.querySelector('#status-filter')?.addEventListener('change', filterAndRender)
    content.querySelector('#clear-filters')?.addEventListener('click', () => {
      const searchInput = content.querySelector('#booking-search') as HTMLInputElement
      const statusSelect = content.querySelector('#status-filter') as HTMLSelectElement
      if (searchInput) searchInput.value = ''
      if (statusSelect) statusSelect.value = ''
      filterAndRender()
    })
    // Bulk delete
    content.querySelector('#bulk-delete-btn')?.addEventListener('click', () => {
      if (this.selectedIds.size > 0) {
        this.openDeleteModal(content, Array.from(this.selectedIds))
      }
    })
    return layout.render(content)
  }

  private async loadBookings(el: HTMLElement, callback?: (bookings: any[]) => void) {
    try {
      const res = await this.api.get<any>('/api/bookings')
      const tbody = el.querySelector('#bookings-tbody')!
      if (res.success && res.data) {
        const bookings = Array.isArray(res.data) ? res.data : res.data.data || []
        if (callback) {
          callback(bookings)
          return
        }
        this.renderBookings(el, bookings)
      } else {
        tbody.innerHTML = `<tr><td colspan="8" class="px-6 py-12 text-center text-on-surface-variant font-body-md"><span class="material-symbols-outlined text-4xl mb-2 opacity-50">calendar_month</span><br/>لا توجد حجوزات</td></tr>`
      }
    } catch {
      const tbody = el.querySelector('#bookings-tbody')!
      tbody.innerHTML = `<tr><td colspan="8" class="px-6 py-12 text-center text-error font-body-md"><span class="material-symbols-outlined text-4xl mb-2">error</span><br/>حدث خطأ أثناء التحميل</td></tr>`
    }
  }

  private selectedIds = new Set<string>()

  private renderBookings(el: HTMLElement, bookings: any[]) {
    const tbody = el.querySelector('#bookings-tbody')!
    const selectAll = el.querySelector('#select-all') as HTMLInputElement
    if (bookings.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" class="px-6 py-12 text-center text-on-surface-variant font-body-md"><span class="material-symbols-outlined text-4xl mb-2 opacity-50">calendar_month</span><br/>لا توجد حجوزات</td></tr>`
      this.updateBulkActions(el)
      if (selectAll) selectAll.checked = false
      return
    }
    tbody.innerHTML = bookings.map((b: any) => {
      const serviceName = b.services?.[0]?.name || b.bookingServices?.[0]?.service?.name || b.serviceName || '-'
      const bookingDate = b.scheduledDate || b.date
      const isSelected = this.selectedIds.has(b.id)
      return `
      <tr class="border-b border-glass-border hover:bg-white/40 hover:translate-y-[-2px] hover:shadow-sm transition-all duration-300 group" data-booking-row data-id="${b.id}">
        <td class="px-3 py-4">
          <input type="checkbox" class="row-checkbox w-4 h-4 rounded border-glass-border text-primary focus:ring-primary" data-id="${b.id}" ${isSelected ? 'checked' : ''} />
        </td>
        <td class="px-6 py-4"><span class="inline-flex items-center px-2 py-1 rounded-lg bg-surface-container text-financial-data text-on-surface text-sm">#${b.id?.slice(0, 8) || '---'}</span></td>
        <td class="px-6 py-4 font-body-md text-on-surface font-semibold">${b.customer?.fullName || b.customer?.name || b.customerName || '-'}</td>
        <td class="px-6 py-4 font-body-md text-on-surface">${b.vehicle?.licensePlate || b.plateNumber || '-'}</td>
        <td class="px-6 py-4 font-body-md text-on-surface-variant">${serviceName}</td>
        <td class="px-6 py-4">${this.statusBadge(b.status)}</td>
        <td class="px-6 py-4 font-body-md text-on-surface-variant">${bookingDate ? new Date(bookingDate).toLocaleDateString('ar-SA') : '-'}</td>
        <td class="px-6 py-4">
          <div class="flex items-center gap-2">
            <button class="w-8 h-8 rounded-lg hover:bg-primary-container/10 flex items-center justify-center text-on-surface-variant hover:text-primary hover:scale-110 transition-all" title="عرض" data-action="view" data-id="${b.id}">
              <span class="material-symbols-outlined text-[18px]">visibility</span>
            </button>
            <button class="w-8 h-8 rounded-lg hover:bg-secondary-container/10 flex items-center justify-center text-on-surface-variant hover:text-secondary hover:scale-110 transition-all" title="عرض التذكرة" data-action="print" data-id="${b.id}">
              <span class="material-symbols-outlined text-[18px]">receipt_long</span>
            </button>
            <button class="w-8 h-8 rounded-lg hover:bg-info/10 flex items-center justify-center text-on-surface-variant hover:text-info hover:scale-110 transition-all" title="تعديل" data-action="edit" data-id="${b.id}">
              <span class="material-symbols-outlined text-[18px]">edit</span>
            </button>
            <button class="w-8 h-8 rounded-lg hover:bg-error/10 flex items-center justify-center text-on-surface-variant hover:text-error hover:scale-110 transition-all" title="حذف" data-action="delete" data-id="${b.id}">
              <span class="material-symbols-outlined text-[18px]">delete</span>
            </button>
          </div>
        </td>
      </tr>
    `}).join('')

    // Row checkboxes
    tbody.querySelectorAll('.row-checkbox').forEach((cb: any) => {
      cb.addEventListener('change', () => {
        const id = cb.getAttribute('data-id')
        if (cb.checked) {
          this.selectedIds.add(id)
        } else {
          this.selectedIds.delete(id)
        }
        this.updateBulkActions(el)
      })
    })

    // Select all
    if (selectAll) {
      selectAll.addEventListener('change', () => {
        const checked = selectAll.checked
        tbody.querySelectorAll('.row-checkbox').forEach((cb: any) => {
          const id = cb.getAttribute('data-id')
          cb.checked = checked
          if (checked) {
            this.selectedIds.add(id)
          } else {
            this.selectedIds.delete(id)
          }
        })
        this.updateBulkActions(el)
      })
    }

    // View/edit/delete actions
    tbody.querySelectorAll('[data-action="view"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id')
        if (id) this.router.navigate(`/bookings/ticket/${id}`)
      })
    })
    tbody.querySelectorAll('[data-action="edit"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id')
        if (id) this.router.navigate(`/bookings/ticket/${id}`)
      })
    })
    tbody.querySelectorAll('[data-action="print"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id')
        if (id) this.router.navigate(`/bookings/print/${id}`)
      })
    })
    tbody.querySelectorAll('[data-action="delete"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id')
        if (id) this.openDeleteModal(el, [id])
      })
    })
  }

  private updateBulkActions(el: HTMLElement) {
    const bar = el.querySelector('#bulk-actions') as HTMLElement
    const countEl = el.querySelector('#bulk-count') as HTMLElement
    if (!bar || !countEl) return
    if (this.selectedIds.size > 0) {
      bar.classList.remove('hidden')
      countEl.textContent = `${this.selectedIds.size} حجز محدد`
    } else {
      bar.classList.add('hidden')
    }
  }

  private openDeleteModal(el: HTMLElement, ids: string[]) {
    const modal = el.querySelector('#delete-modal') as HTMLElement
    const title = el.querySelector('#delete-modal-title') as HTMLElement
    const message = el.querySelector('#delete-modal-message') as HTMLElement
    const confirmBtn = el.querySelector('#delete-modal-confirm') as HTMLElement
    const cancelBtn = el.querySelector('#delete-modal-cancel') as HTMLElement
    if (!modal || !title || !message || !confirmBtn || !cancelBtn) return

    if (ids.length === 1) {
      title.textContent = 'تأكيد حذف الحجز'
      message.textContent = 'هل أنت متأكد من حذف هذا الحجز؟'
    } else {
      title.textContent = 'تأكيد حذف متعدد'
      message.textContent = `هل أنت متأكد من حذف ${ids.length} حجز؟`
    }

    modal.classList.remove('hidden')

    const doCancel = () => modal.classList.add('hidden')
    const doConfirm = () => {
      modal.classList.add('hidden')
      this.executeDelete(el, ids)
    }

    cancelBtn.onclick = doCancel
    confirmBtn.onclick = doConfirm
  }

  private async executeDelete(el: HTMLElement, ids: string[]) {
    try {
      const promises = ids.map(id => this.api.delete(`/api/bookings/${id}`))
      const results = await Promise.all(promises)
      const failed = results.filter(r => !r.success)
      if (failed.length > 0) {
        throw new Error(`فشل حذف ${failed.length} حجز`)
      }
      // Clear selection and reload
      ids.forEach(id => this.selectedIds.delete(id))
      this.updateBulkActions(el)
      // Re-fetch
      const tbody = el.querySelector('#bookings-tbody')!
      tbody.innerHTML = `<tr><td colspan="8" class="px-6 py-8 text-center text-text-secondary"><div class="skeleton-shimmer h-4 rounded w-32 mx-auto"></div></td></tr>`
      this.loadBookings(el, (bookings) => {
        const searchInput = el.querySelector('#booking-search') as HTMLInputElement
        const statusSelect = el.querySelector('#status-filter') as HTMLSelectElement
        let filtered = bookings
        if (statusSelect?.value) {
          filtered = filtered.filter((b: any) => b.status === statusSelect.value)
        }
        if (searchInput?.value) {
          const term = searchInput.value.trim().toLowerCase()
          filtered = filtered.filter((b: any) => {
            const customerName = (b.customer?.fullName || b.customer?.name || b.customerName || '').toLowerCase()
            const phone = (b.customer?.phone || '').toLowerCase()
            const plate = (b.vehicle?.licensePlate || b.plateNumber || '').toLowerCase()
            const idShort = (b.id || '').slice(0, 8).toLowerCase()
            return customerName.includes(term) || phone.includes(term) || plate.includes(term) || idShort.includes(term)
          })
        }
        this.renderBookings(el, filtered)
      })
    } catch (err: any) {
      alert(err.message || 'حدث خطأ أثناء الحذف')
    }
  }

  private statusBadge(status: string): string {
    const map: Record<string, { label: string; cls: string; glow: string }> = {
      PENDING: { label: 'قيد الانتظار', cls: 'bg-warning/10 text-warning', glow: 'rgba(217,119,6,0.4)' },
      CONFIRMED: { label: 'مؤكد', cls: 'bg-primary-container/15 text-primary', glow: 'rgba(0,74,198,0.4)' },
      IN_PROGRESS: { label: 'قيد العمل', cls: 'bg-secondary/10 text-secondary', glow: 'rgba(113,42,226,0.4)' },
      WAITING_PARTS: { label: 'بانتظار المواد', cls: 'bg-info/10 text-info', glow: 'rgba(8,145,178,0.4)' },
      READY: { label: 'جاهز', cls: 'bg-tertiary/10 text-tertiary', glow: 'rgba(117,31,0,0.4)' },
      COMPLETED: { label: 'مكتمل', cls: 'bg-success/10 text-success', glow: 'rgba(5,150,105,0.4)' },
      CANCELLED: { label: 'ملغي', cls: 'bg-error/10 text-error', glow: 'rgba(186,26,26,0.4)' },
    }
    const s = map[status] || { label: status, cls: 'bg-surface-container-high text-text-secondary', glow: 'rgba(0,0,0,0.1)' }
    return `<span class="inline-flex items-center px-3 py-1 rounded-full font-label-sm text-label-sm ${s.cls} badge-neon" style="text-shadow:0 0 8px ${s.glow}">${s.label}</span>`
  }
}
