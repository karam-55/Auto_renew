import { AuthService } from '../services/auth'
import { ApiClient } from '../api/client'
import { Router } from '../router'
import { AppLayout } from '../components/layout'

export class BookingsScreen {
  private allBookings: any[] = []
  private filteredBookings: any[] = []
  private currentPage = 1
  private readonly pageSize = 20

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
            <button class="h-12 px-4 bg-primary/10 text-primary font-body-md rounded-xl border border-primary/20 hover:bg-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 w-full md:w-auto justify-center" id="refresh-bookings">
              <span class="material-symbols-outlined text-[20px]">sync</span>
              تحديث
            </button>
          </div>
        </div>
        <!-- Bulk Actions Bar -->
        <div id="bulk-actions" class="hidden glass-card border border-error/20 rounded-2xl p-4 stagger-entry overflow-hidden" style="min-height: 72px">
          <div id="bulk-normal" class="flex items-center justify-between transition-all duration-300 ease-out">
            <span class="text-body-md text-error font-semibold" id="bulk-count">0 محدد</span>
            <button class="h-10 px-4 bg-error text-white font-body-md rounded-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 shadow-lg shadow-error/20" id="bulk-delete-btn">
              <span class="material-symbols-outlined text-[18px]">delete</span>
              حذف المحدد
            </button>
          </div>
          <div id="bulk-confirm" class="hidden flex items-center justify-between opacity-0 scale-95 transition-all duration-300 ease-out">
            <span class="flex items-center gap-2 text-error font-semibold">
              <span class="material-symbols-outlined">warning</span>
              <span id="bulk-confirm-text">حذف 0 حجز؟</span>
            </span>
            <div class="flex items-center gap-2">
              <button class="h-10 px-4 bg-error text-white font-body-md rounded-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-1 shadow-lg shadow-error/20" id="bulk-confirm-yes">
                <span class="material-symbols-outlined text-[18px]">check</span>
                نعم
              </button>
              <button class="h-10 px-4 glass-card text-on-surface font-body-md rounded-xl border border-glass-border hover:bg-white/80 transition-all flex items-center gap-1" id="bulk-confirm-no">
                <span class="material-symbols-outlined text-[18px]">close</span>
                لا
              </button>
            </div>
          </div>
        </div>
        <!-- Table -->
        <div class="glass-card rounded-2xl overflow-hidden stagger-entry stagger-entry-2">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="bg-white/40 border-b border-glass-border">
                  <th class="px-3 py-4 text-right w-10" scope="col">
                    <input type="checkbox" class="w-4 h-4 rounded border-glass-border text-primary focus:ring-primary" id="select-all" aria-label="تحديد الكل" />
                  </th>
                  <th class="px-6 py-4 text-right font-label-sm text-on-surface-variant uppercase" scope="col">رقم الطلب</th>
                  <th class="px-6 py-4 text-right font-label-sm text-on-surface-variant uppercase" scope="col">العميل</th>
                  <th class="px-6 py-4 text-right font-label-sm text-on-surface-variant uppercase" scope="col">المركبة</th>
                  <th class="px-6 py-4 text-right font-label-sm text-on-surface-variant uppercase" scope="col">الخدمة</th>
                  <th class="px-6 py-4 text-right font-label-sm text-on-surface-variant uppercase" scope="col">الحالة</th>
                  <th class="px-6 py-4 text-right font-label-sm text-on-surface-variant uppercase" scope="col">التاريخ</th>
                  <th class="px-6 py-4 text-right font-label-sm text-on-surface-variant uppercase" scope="col">إجراءات</th>
                </tr>
              </thead>
              <tbody id="bookings-tbody">
                ${[1,2,3,4,5].map(() => `
                  <tr class="border-b border-glass-border/30">
                    <td class="px-3 py-4"><div class="skeleton w-4 h-4 rounded"></div></td>
                    <td class="px-6 py-4"><div class="skeleton skeleton-text w-20"></div></td>
                    <td class="px-6 py-4"><div class="skeleton skeleton-text w-24"></div></td>
                    <td class="px-6 py-4"><div class="skeleton skeleton-text w-20"></div></td>
                    <td class="px-6 py-4"><div class="skeleton skeleton-text w-28"></div></td>
                    <td class="px-6 py-4"><div class="skeleton skeleton-text w-16"></div></td>
                    <td class="px-6 py-4"><div class="skeleton skeleton-text w-20"></div></td>
                    <td class="px-6 py-4"><div class="skeleton skeleton-text w-12"></div></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
        <!-- Pagination -->
        <div class="flex items-center justify-between px-4 py-3 glass-card rounded-2xl stagger-entry stagger-entry-3" id="pagination-bar">
          <span class="text-sm text-on-surface-variant" id="pagination-info">عرض 0 من 0</span>
          <div class="flex items-center gap-2">
            <button class="w-10 h-10 rounded-xl bg-white/50 border border-glass-border flex items-center justify-center text-on-surface hover:bg-white/80 disabled:opacity-40 transition-all" id="pagination-prev" disabled>
              <span class="material-symbols-outlined">chevron_right</span>
            </button>
            <span class="text-sm font-medium text-on-surface min-w-[3rem] text-center" id="pagination-page">1</span>
            <button class="w-10 h-10 rounded-xl bg-white/50 border border-glass-border flex items-center justify-center text-on-surface hover:bg-white/80 disabled:opacity-40 transition-all" id="pagination-next" disabled>
              <span class="material-symbols-outlined">chevron_left</span>
            </button>
          </div>
        </div>
        <!-- Delete Confirmation Modal -->
        <div id="delete-modal" class="fixed inset-0 z-50 backdrop-blur-sm flex items-center justify-center hidden">
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
    this.loadBookings(content, (bookings) => {
      this.allBookings = bookings
      this.applyFilters(content)
    })

    content.querySelector('#new-booking-btn')?.addEventListener('click', () => this.router.navigate('/bookings/new'))
    content.querySelector('#existing-booking-btn')?.addEventListener('click', () => this.router.navigate('/bookings/existing'))
    content.querySelector('#bookings-fab')?.addEventListener('click', () => this.router.navigate('/bookings/new'))
    content.querySelector('#booking-search')?.addEventListener('input', () => this.applyFilters(content))
    content.querySelector('#status-filter')?.addEventListener('change', () => this.applyFilters(content))
    content.querySelector('#clear-filters')?.addEventListener('click', () => {
      const searchInput = content.querySelector('#booking-search') as HTMLInputElement
      const statusSelect = content.querySelector('#status-filter') as HTMLSelectElement
      if (searchInput) searchInput.value = ''
      if (statusSelect) statusSelect.value = ''
      this.applyFilters(content)
    })
    content.querySelector('#refresh-bookings')?.addEventListener('click', () => {
      this.api.clearCache()
      const tbody = content.querySelector('#bookings-tbody')!
      tbody.innerHTML = `
        ${[1,2,3,4,5].map(() => `
          <tr class="border-b border-glass-border/30">
            <td class="px-3 py-4"><div class="skeleton w-4 h-4 rounded"></div></td>
            <td class="px-6 py-4"><div class="skeleton skeleton-text w-20"></div></td>
            <td class="px-6 py-4"><div class="skeleton skeleton-text w-24"></div></td>
            <td class="px-6 py-4"><div class="skeleton skeleton-text w-20"></div></td>
            <td class="px-6 py-4"><div class="skeleton skeleton-text w-28"></div></td>
            <td class="px-6 py-4"><div class="skeleton skeleton-text w-16"></div></td>
            <td class="px-6 py-4"><div class="skeleton skeleton-text w-20"></div></td>
            <td class="px-6 py-4"><div class="skeleton skeleton-text w-12"></div></td>
          </tr>
        `).join('')}
      `
      this.currentPage = 1
      this.loadBookings(content, (bookings) => {
        this.allBookings = bookings
        this.applyFilters(content)
      })
    })
    content.querySelector('#pagination-prev')?.addEventListener('click', () => {
      if (this.currentPage > 1) { this.currentPage--; this.renderPage(content) }
    })
    content.querySelector('#pagination-next')?.addEventListener('click', () => {
      const maxPage = Math.ceil(this.filteredBookings.length / this.pageSize)
      if (this.currentPage < maxPage) { this.currentPage++; this.renderPage(content) }
    })
    // Bulk delete inline confirmation
    content.querySelector('#bulk-delete-btn')?.addEventListener('click', () => {
      if (this.selectedIds.size > 0) {
        this._showBulkConfirm(content, this.selectedIds.size)
      }
    })
    content.querySelector('#bulk-confirm-yes')?.addEventListener('click', () => {
      this.executeDelete(content, Array.from(this.selectedIds))
      this._hideBulkConfirm(content)
    })
    content.querySelector('#bulk-confirm-no')?.addEventListener('click', () => {
      this._hideBulkConfirm(content)
    })
    // Event delegation on tbody for checkboxes and row actions (performance fix)
    const tbody = content.querySelector('#bookings-tbody') as HTMLElement
    if (tbody) {
      tbody.addEventListener('change', (e) => {
        const target = e.target as HTMLElement
        if (target.classList.contains('row-checkbox')) {
          const id = target.getAttribute('data-id')!
          const cb = target as HTMLInputElement
          if (cb.checked) this.selectedIds.add(id)
          else this.selectedIds.delete(id)
          this.updateBulkActions(content)
        }
      })
      tbody.addEventListener('click', (e) => {
        const target = (e.target as HTMLElement).closest('button') as HTMLButtonElement | null
        if (!target) return
        const id = target.getAttribute('data-id')
        if (!id) return
        const action = target.getAttribute('data-action')
        if (action === 'view' || action === 'edit') this.router.navigate(`/bookings/ticket/${id}`)
        else if (action === 'print') this.router.navigate(`/bookings/print/${id}`)
        else if (action === 'delete') this.openDeleteModal(content, [id])
      })
    }
    // Select-all delegation
    const selectAll = content.querySelector('#select-all') as HTMLInputElement
    if (selectAll) {
      selectAll.addEventListener('change', () => {
        const checked = selectAll.checked
        tbody?.querySelectorAll('.row-checkbox').forEach((cb: any) => {
          const id = cb.getAttribute('data-id')
          cb.checked = checked
          if (checked) this.selectedIds.add(id)
          else this.selectedIds.delete(id)
        })
        this.updateBulkActions(content)
      })
    }
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
    // Use DocumentFragment for faster DOM insertion than innerHTML string
    const fragment = document.createDocumentFragment()
    bookings.forEach((b: any) => {
      const serviceName = b.services?.[0]?.name || '-'
      const bookingDate = b.scheduledDate || b.date
      const isSelected = this.selectedIds.has(b.id)
      const tr = document.createElement('tr')
      tr.className = 'border-b border-glass-border hover:bg-white/40 hover:translate-y-[-2px] hover:shadow-sm transition-all duration-300 group'
      tr.setAttribute('data-booking-row', '')
      tr.setAttribute('data-id', b.id)
      tr.innerHTML = `
        <td class="px-3 py-4">
          <input type="checkbox" class="row-checkbox w-4 h-4 rounded border-glass-border text-primary focus:ring-primary" data-id="${b.id}" ${isSelected ? 'checked' : ''} />
        </td>
        <td class="px-6 py-4"><span class="inline-flex items-center px-2 py-1 rounded-lg bg-surface-container text-financial-data text-on-surface text-sm">#${b.id?.slice(0, 8) || '---'}</span></td>
        <td class="px-6 py-4 font-body-md text-on-surface font-semibold">${b.customer?.fullName || '-'}</td>
        <td class="px-6 py-4 font-body-md text-on-surface">${b.vehicle?.licensePlate || '-'}</td>
        <td class="px-6 py-4 font-body-md text-on-surface-variant">${serviceName}</td>
        <td class="px-6 py-4">${this.statusBadge(b.status)}</td>
        <td class="px-6 py-4 font-body-md text-on-surface-variant">${bookingDate ? new Date(bookingDate).toLocaleDateString('ar-SA') : '-'}</td>
        <td class="px-6 py-4">
          <div class="flex items-center gap-2">
            <button class="touch-safe w-8 h-8 rounded-lg hover:bg-primary-container/10 flex items-center justify-center text-on-surface-variant hover:text-primary hover:scale-110 transition-all" title="عرض" aria-label="عرض تفاصيل الحجز" data-action="view" data-id="${b.id}">
              <span class="material-symbols-outlined text-[18px]" aria-hidden="true">visibility</span>
            </button>
            <button class="touch-safe w-8 h-8 rounded-lg hover:bg-secondary-container/10 flex items-center justify-center text-on-surface-variant hover:text-secondary hover:scale-110 transition-all" title="عرض التذكرة" aria-label="عرض تذكرة الحجز" data-action="print" data-id="${b.id}">
              <span class="material-symbols-outlined text-[18px]" aria-hidden="true">receipt_long</span>
            </button>
            <button class="touch-safe w-8 h-8 rounded-lg hover:bg-info/10 flex items-center justify-center text-on-surface-variant hover:text-info hover:scale-110 transition-all" title="تعديل" aria-label="تعديل الحجز" data-action="edit" data-id="${b.id}">
              <span class="material-symbols-outlined text-[18px]" aria-hidden="true">edit</span>
            </button>
            <button class="touch-safe w-8 h-8 rounded-lg hover:bg-error/10 flex items-center justify-center text-on-surface-variant hover:text-error hover:scale-110 transition-all" title="حذف" aria-label="حذف الحجز" data-action="delete" data-id="${b.id}">
              <span class="material-symbols-outlined text-[18px]" aria-hidden="true">delete</span>
            </button>
          </div>
        </td>
      `
      fragment.appendChild(tr)
    })
    tbody.innerHTML = ''
    tbody.appendChild(fragment)
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
    this._hideBulkConfirm(el)
  }

  private _showBulkConfirm(el: HTMLElement, count: number) {
    const normal = el.querySelector('#bulk-normal') as HTMLElement
    const confirm = el.querySelector('#bulk-confirm') as HTMLElement
    const text = el.querySelector('#bulk-confirm-text') as HTMLElement
    if (normal && confirm) {
      normal.classList.add('hidden')
      confirm.classList.remove('hidden')
      requestAnimationFrame(() => {
        confirm.classList.remove('opacity-0', 'scale-95')
        confirm.classList.add('opacity-100', 'scale-100')
      })
    }
    if (text) text.textContent = `حذف ${count} حجز؟`
  }

  private _hideBulkConfirm(el: HTMLElement) {
    const normal = el.querySelector('#bulk-normal') as HTMLElement
    const confirm = el.querySelector('#bulk-confirm') as HTMLElement
    if (normal && confirm) {
      confirm.classList.add('opacity-0', 'scale-95')
      confirm.classList.remove('opacity-100', 'scale-100')
      setTimeout(() => {
        confirm.classList.add('hidden')
        normal.classList.remove('hidden')
      }, 300)
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
      // Clear API cache so next fetch gets fresh data from server
      this.api.clearCache()
      // Re-fetch
      const tbody = el.querySelector('#bookings-tbody')!
      tbody.innerHTML = `
        ${[1,2,3,4,5].map(() => `
          <tr class="border-b border-glass-border/30">
            <td class="px-3 py-4"><div class="skeleton w-4 h-4 rounded"></div></td>
            <td class="px-6 py-4"><div class="skeleton skeleton-text w-20"></div></td>
            <td class="px-6 py-4"><div class="skeleton skeleton-text w-24"></div></td>
            <td class="px-6 py-4"><div class="skeleton skeleton-text w-20"></div></td>
            <td class="px-6 py-4"><div class="skeleton skeleton-text w-28"></div></td>
            <td class="px-6 py-4"><div class="skeleton skeleton-text w-16"></div></td>
            <td class="px-6 py-4"><div class="skeleton skeleton-text w-20"></div></td>
            <td class="px-6 py-4"><div class="skeleton skeleton-text w-12"></div></td>
          </tr>
        `).join('')}
      `
      this.loadBookings(el, (bookings) => {
        this.allBookings = bookings
        this.applyFilters(el)
      })
    } catch (err: any) {
      ;(window as any).toast?.show?.({ message: err.message || 'حدث خطأ أثناء الحذف', type: 'error' })
    }
  }

  private applyFilters(el: HTMLElement) {
    const searchInput = el.querySelector('#booking-search') as HTMLInputElement
    const statusSelect = el.querySelector('#status-filter') as HTMLSelectElement
    const searchTerm = searchInput?.value?.trim().toLowerCase() || ''
    const statusFilter = statusSelect?.value || ''

    let filtered = this.allBookings
    if (statusFilter) {
      filtered = filtered.filter((b: any) => b.status === statusFilter)
    }
    if (searchTerm) {
      filtered = filtered.filter((b: any) => {
        const customerName = (b.customer?.fullName || '').toLowerCase()
        const phone = (b.customer?.phone || '').toLowerCase()
        const plate = (b.vehicle?.licensePlate || '').toLowerCase()
        const idShort = (b.id || '').slice(0, 8).toLowerCase()
        return customerName.includes(searchTerm) || phone.includes(searchTerm) || plate.includes(searchTerm) || idShort.includes(searchTerm)
      })
    }
    this.filteredBookings = filtered
    this.currentPage = 1
    this.renderPage(el)
  }

  private renderPage(el: HTMLElement) {
    const start = (this.currentPage - 1) * this.pageSize
    const end = start + this.pageSize
    const pageData = this.filteredBookings.slice(start, end)
    this.renderBookings(el, pageData)
    this._updatePagination(el, this.currentPage, this.pageSize, this.filteredBookings.length)
  }

  private _updatePagination(el: HTMLElement, page: number, pageSize: number, total: number) {
    const infoEl = el.querySelector('#pagination-info') as HTMLElement
    const pageEl = el.querySelector('#pagination-page') as HTMLElement
    const prevBtn = el.querySelector('#pagination-prev') as HTMLButtonElement
    const nextBtn = el.querySelector('#pagination-next') as HTMLButtonElement
    const maxPage = Math.ceil(total / pageSize) || 1
    const start = total === 0 ? 0 : (page - 1) * pageSize + 1
    const end = Math.min(page * pageSize, total)
    if (infoEl) infoEl.textContent = `عرض ${start}-${end} من ${total}`
    if (pageEl) pageEl.textContent = `${page} / ${maxPage}`
    if (prevBtn) prevBtn.disabled = page <= 1
    if (nextBtn) nextBtn.disabled = page >= maxPage
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
