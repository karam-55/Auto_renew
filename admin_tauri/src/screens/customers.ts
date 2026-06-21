import { AuthService } from '../services/auth'
import { ApiClient } from '../api/client'
import { Router } from '../router'
import { AppLayout } from '../components/layout'
import { isPhone } from '../utils/validation'

export class CustomersScreen {
  constructor(private _auth: AuthService, private api: ApiClient, private router: Router) {}
  render(): HTMLElement {
    const layout = new AppLayout(this._auth, this.router, 'العملاء', 'group', this.api)
    const c = document.createElement('div')
    c.className = 'page-enter min-h-screen bg-background p-gutter'
    c.innerHTML = `
      <div class="max-w-7xl mx-auto space-y-stack-lg">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="font-beVietnamPro text-headline-md text-on-surface">إدارة العملاء</h1>
            <p class="text-body-md text-text-secondary mt-1">قاعدة بيانات العملاء والمركبات</p>
          </div>
          <div class="flex items-center gap-3">
            <button class="h-[48px] bg-surface-subtle text-on-surface font-ibmPlexSans font-body-lg text-body-lg rounded-lg border border-border hover:bg-surface-container-low transition-all duration-200 flex items-center justify-center gap-2 px-4" id="export-customers-btn">
              <span class="material-symbols-outlined text-[20px]">download</span>
              تصدير
            </button>
            <button class="h-[48px] bg-primary text-on-primary font-ibmPlexSans font-body-lg text-body-lg rounded-lg shadow-sm hover:shadow-lg hover:-translate-y-[1px] transition-all duration-200 flex items-center justify-center gap-2 px-6" id="new-customer-btn">
              <span class="material-symbols-outlined text-[20px]">add</span>
              عميل جديد
            </button>
          </div>
        </div>
        <!-- Filters -->
        <div class="glass-panel rounded-xl shadow-lg border border-border p-card-padding">
          <div class="flex flex-col md:flex-row gap-4 items-center">
            <div class="relative flex-1 w-full">
              <span class="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline">search</span>
              <input class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg pr-10 pl-4 font-ibmPlexSans font-body-md text-body-md text-on-surface placeholder:text-outline-variant focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow duration-200" type="text" placeholder="بحث بالاسم أو الموبايل..." id="customer-search" />
            </div>
            <select class="h-[48px] bg-surface-subtle border border-border rounded-lg pr-4 pl-10 font-ibmPlexSans font-body-md text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow duration-200 w-full md:w-48 appearance-none" style="background-image: url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2716%27 height=%2716%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%23475569%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Cpath d=%27M6 9l6 6 6-6%27/%3E%3C/svg%3E'); background-repeat: no-repeat; background-position: left 0.75rem center; background-size: 1rem;" id="status-filter">
              <option value="">كل الحالات</option>
              <option value="ACTIVE">نشط</option>
              <option value="INACTIVE">غير نشط</option>
            </select>
            <button class="h-[48px] px-4 bg-surface-subtle text-on-surface font-ibmPlexSans font-body-md text-body-md rounded-lg border border-border hover:bg-surface-container-low transition-colors flex items-center gap-2 w-full md:w-auto justify-center" id="clear-filters">
              <span class="material-symbols-outlined text-[20px]">refresh</span>
              مسح
            </button>
          </div>
        </div>
        <!-- Bulk actions bar -->
        <div id="bulk-bar" class="hidden bg-error/5 border border-error/20 rounded-xl p-4 flex items-center justify-between stagger-entry">
          <span class="font-ibmPlexSans font-body-md text-body-md text-error font-semibold" id="bulk-count">تم تحديد 0</span>
          <button class="h-[40px] px-4 bg-error text-on-error font-ibmPlexSans font-body-md text-body-md rounded-lg flex items-center gap-2 hover:shadow-lg hover:-translate-y-[1px] transition-all" id="bulk-delete-btn">
            <span class="material-symbols-outlined text-[18px]">delete</span>
            حذف المحدد
          </button>
        </div>
        <!-- Table -->
        <div class="bg-surface-container-lowest rounded-xl shadow-md border border-surface-subtle overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="bg-surface-subtle border-b border-outline-variant/10">
                  <th class="px-4 py-4 text-center font-label-sm text-label-sm text-text-tertiary uppercase" scope="col">
                    <input type="checkbox" class="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer" id="select-all" aria-label="تحديد الكل"/>
                  </th>
                  <th class="px-6 py-4 text-right font-label-sm text-label-sm text-text-tertiary uppercase" scope="col">الاسم</th>
                  <th class="px-6 py-4 text-right font-label-sm text-label-sm text-text-tertiary uppercase" scope="col">الموبايل</th>
                  <th class="px-6 py-4 text-right font-label-sm text-label-sm text-text-tertiary uppercase" scope="col">العنوان</th>
                  <th class="px-6 py-4 text-right font-label-sm text-label-sm text-text-tertiary uppercase" scope="col">المركبات</th>
                  <th class="px-6 py-4 text-right font-label-sm text-label-sm text-text-tertiary uppercase" scope="col">الحالة</th>
                  <th class="px-6 py-4 text-right font-label-sm text-label-sm text-text-tertiary uppercase" scope="col">إجراءات</th>
                </tr>
              </thead>
              <tbody id="customers-tbody">
                <tr><td colspan="7" class="px-6 py-8 text-center text-text-secondary"><div class="skeleton-shimmer h-4 rounded w-32 mx-auto"></div></td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <!-- Delete Confirmation Modal -->
      <div id="delete-modal" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 hidden items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="delete-modal-title">
        <div class="bg-surface-container-lowest rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4 border border-border">
          <div class="flex flex-col items-center text-center gap-4">
            <div class="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center" aria-hidden="true">
              <span class="material-symbols-outlined text-[32px] text-error">warning</span>
            </div>
            <h3 class="font-headline-md text-lg text-on-surface font-semibold" id="delete-modal-title">تأكيد الحذف</h3>
            <p class="font-ibmPlexSans font-body-md text-body-md text-text-secondary" id="delete-modal-message">هل أنت متأكد من حذف هذا العميل؟</p>
            <div class="flex gap-3 w-full">
              <button class="flex-1 h-[48px] bg-surface-subtle text-on-surface font-ibmPlexSans font-body-lg rounded-lg border border-border hover:bg-surface-container-low transition-colors" id="delete-modal-cancel">إلغاء</button>
              <button class="flex-1 h-[48px] bg-error text-on-error font-ibmPlexSans font-body-lg rounded-lg shadow-sm hover:shadow-lg transition-all" id="delete-modal-confirm">حذف</button>
            </div>
          </div>
        </div>
      </div>
      <!-- Create Modal -->
      <div id="create-modal" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 hidden items-start justify-center overflow-y-auto py-10 px-4" role="dialog" aria-modal="true" aria-labelledby="create-modal-title">
        <div class="bg-surface-container-lowest rounded-xl shadow-2xl border border-border w-full max-w-lg max-h-[85vh] overflow-y-auto">
          <div class="p-6 border-b border-outline-variant/10 bg-surface-subtle flex items-center justify-between">
            <h3 class="font-headline-md text-lg text-on-surface font-semibold" id="create-modal-title">عميل جديد</h3>
            <button id="close-create-modal" class="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-text-tertiary" aria-label="إغلاق">
              <span class="material-symbols-outlined" aria-hidden="true">close</span>
            </button>
          </div>
          <div class="p-6 space-y-4">
            <div>
              <label class="block font-label-sm text-label-sm text-text-tertiary mb-2">الاسم *</label>
              <input class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-ibmPlexSans font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow" id="customer-name" placeholder="اسم العميل" required />
            </div>
            <div>
              <label class="block font-label-sm text-label-sm text-text-tertiary mb-2">الموبايل *</label>
              <input class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-ibmPlexSans font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow" id="customer-phone" dir="ltr" placeholder="09XXXXXXXX" required type="tel" pattern="^09[0-9]{8}$" title="يجب أن يبدأ بـ 09 ويتبعه 8 أرقام" />
            </div>
            <div>
              <label class="block font-label-sm text-label-sm text-text-tertiary mb-2">العنوان</label>
              <input class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-ibmPlexSans font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow" id="customer-address" placeholder="عنوان العميل" />
            </div>
            <div>
              <label class="block font-label-sm text-label-sm text-text-tertiary mb-2">الحالة</label>
              <select class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-ibmPlexSans font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow cursor-pointer" id="customer-status">
                <option value="ACTIVE">نشط</option>
                <option value="INACTIVE">غير نشط</option>
              </select>
            </div>
          </div>
          <div class="p-6 border-t border-outline-variant/10 flex justify-end gap-3">
            <button class="h-[48px] px-6 bg-surface-subtle text-on-surface font-ibmPlexSans font-body-lg rounded-lg border border-border hover:bg-surface-container-low transition-colors" id="create-cancel">إلغاء</button>
            <button class="h-[48px] px-6 bg-primary text-on-primary font-ibmPlexSans font-body-lg rounded-lg shadow-sm hover:shadow-lg transition-all" id="save-customer-btn">حفظ</button>
          </div>
        </div>
      </div>
      <!-- Edit Modal -->
      <div id="edit-modal" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 hidden items-start justify-center overflow-y-auto py-10 px-4" role="dialog" aria-modal="true" aria-labelledby="edit-modal-title">
        <div class="bg-surface-container-lowest rounded-xl shadow-2xl border border-border w-full max-w-lg max-h-[85vh] overflow-y-auto">
          <div class="p-6 border-b border-outline-variant/10 bg-surface-subtle flex items-center justify-between">
            <h3 class="font-headline-md text-lg text-on-surface font-semibold" id="edit-modal-title">تعديل العميل</h3>
            <button id="close-edit-modal" class="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-text-tertiary" aria-label="إغلاق">
              <span class="material-symbols-outlined" aria-hidden="true">close</span>
            </button>
          </div>
          <div class="p-6 space-y-4">
            <div>
              <label class="block font-label-sm text-label-sm text-text-tertiary mb-2">الاسم *</label>
              <input class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-ibmPlexSans font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow" id="edit-name" placeholder="اسم العميل" required />
            </div>
            <div>
              <label class="block font-label-sm text-label-sm text-text-tertiary mb-2">الموبايل *</label>
              <input class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-ibmPlexSans font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow" id="edit-phone" dir="ltr" placeholder="09XXXXXXXX" required type="tel" pattern="^09[0-9]{8}$" title="يجب أن يبدأ بـ 09 ويتبعه 8 أرقام" />
            </div>
            <div>
              <label class="block font-label-sm text-label-sm text-text-tertiary mb-2">العنوان</label>
              <input class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-ibmPlexSans font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow" id="edit-address" placeholder="عنوان العميل" />
            </div>
            <div>
              <label class="block font-label-sm text-label-sm text-text-tertiary mb-2">الحالة</label>
              <select class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-ibmPlexSans font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow cursor-pointer" id="edit-status">
                <option value="ACTIVE">نشط</option>
                <option value="INACTIVE">غير نشط</option>
              </select>
            </div>
          </div>
          <div class="p-6 border-t border-outline-variant/10 flex justify-end gap-3">
            <button class="h-[48px] px-6 bg-surface-subtle text-on-surface font-ibmPlexSans font-body-lg rounded-lg border border-border hover:bg-surface-container-low transition-colors" id="edit-cancel">إلغاء</button>
            <button class="h-[48px] px-6 bg-primary text-on-primary font-ibmPlexSans font-body-lg rounded-lg shadow-sm hover:shadow-lg transition-all" id="edit-save">حفظ</button>
          </div>
        </div>
      </div>
    `

    let filterTerm = ''
    let filterStatus = ''

    const applyFilters = () => {
      let filtered = this.allCustomers
      if (filterTerm) {
        const term = filterTerm.toLowerCase()
        filtered = filtered.filter((c: any) =>
          (c.fullName || c.name || '').toLowerCase().includes(term) ||
          (c.phone || '').includes(term)
        )
      }
      if (filterStatus) {
        filtered = filtered.filter((c: any) => (c.status || 'ACTIVE') === filterStatus)
      }
      this.selectedIds.clear()
      this.updateBulkBar(c)
      if (filtered.length === 0) {
        const tbody = c.querySelector('#customers-tbody')!
        tbody.innerHTML = '<tr><td colspan="7" class="px-6 py-12 text-center text-text-secondary font-body-md"><span class="material-symbols-outlined text-4xl mb-2 opacity-50">group</span><br/>لا يوجد عملاء</td></tr>'
      } else {
        this.renderRows(c, filtered)
      }
    }

    c.querySelector('#new-customer-btn')?.addEventListener('click', () => this.openCreateModal(c))

    // Filters
    const searchInput = c.querySelector('#customer-search') as HTMLInputElement
    const statusSelect = c.querySelector('#status-filter') as HTMLSelectElement
    searchInput?.addEventListener('input', () => {
      filterTerm = searchInput.value.trim()
      applyFilters()
    })
    statusSelect?.addEventListener('change', () => {
      filterStatus = statusSelect.value
      applyFilters()
    })
    c.querySelector('#clear-filters')?.addEventListener('click', () => {
      filterTerm = ''
      filterStatus = ''
      if (searchInput) searchInput.value = ''
      if (statusSelect) statusSelect.value = ''
      applyFilters()
    })

    // Close modal buttons
    c.querySelector('#close-create-modal')?.addEventListener('click', () => {
      const modal = c.querySelector('#create-modal') as HTMLElement
      if (modal) { modal.classList.add('hidden'); modal.classList.remove('flex') }
    })
    c.querySelector('#close-edit-modal')?.addEventListener('click', () => {
      const modal = c.querySelector('#edit-modal') as HTMLElement
      if (modal) { modal.classList.add('hidden'); modal.classList.remove('flex') }
    })

    // Backdrop clicks
    const createModal = c.querySelector('#create-modal') as HTMLElement
    const editModal = c.querySelector('#edit-modal') as HTMLElement
    createModal?.addEventListener('click', (e) => {
      if (e.target === createModal) { createModal.classList.add('hidden'); createModal.classList.remove('flex') }
    })
    editModal?.addEventListener('click', (e) => {
      if (e.target === editModal) { editModal.classList.add('hidden'); editModal.classList.remove('flex') }
    })

    // Export
    c.querySelector('#export-customers-btn')?.addEventListener('click', () => {
      const data = this.allCustomers.map((c: any) => ({
        الاسم: c.fullName || c.name || '',
        الموبايل: c.phone || '',
        العنوان: c.address || '',
        المركبات: c.vehicleCount || c._count?.vehicles || 0,
        الحالة: c.status === 'ACTIVE' ? 'نشط' : 'غير نشط',
      }))
      const csv = [Object.keys(data[0] || {}).join(','), ...data.map((row: any) => Object.values(row).join(','))].join('\n')
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = 'customers.csv'
      link.click()
    })

    this.load(c, applyFilters)
    return layout.render(c)
  }

  private selectedIds = new Set<string>()
  private allCustomers: any[] = []

  private async load(el: HTMLElement, callback?: () => void) {
    try {
      const res = await this.api.get<any>('/api/customers')
      const tbody = el.querySelector('#customers-tbody')!
      if (res.success && res.data) {
        const items = Array.isArray(res.data) ? res.data : res.data.data || []
        this.allCustomers = items
        if (items.length === 0) { tbody.innerHTML = '<tr><td colspan="7" class="px-6 py-12 text-center text-text-secondary font-body-md"><span class="material-symbols-outlined text-4xl mb-2 opacity-50">group</span><br/>لا يوجد عملاء</td></tr>'; return }
        this.renderRows(el, items)
      }
      if (callback) callback()
    } catch { el.querySelector('#customers-tbody')!.innerHTML = '<tr><td colspan="7" class="px-6 py-12 text-center text-error font-body-md"><span class="material-symbols-outlined text-4xl mb-2">error</span><br/>حدث خطأ</td></tr>' }
  }

  private renderRows(el: HTMLElement, items: any[]) {
    const tbody = el.querySelector('#customers-tbody')!
    tbody.innerHTML = items.map((c: any) => `
      <tr class="border-b border-outline-variant/10 hover:bg-surface-container-low/50 transition-colors" data-cid="${c.id}">
        <td class="px-4 py-4 text-center">
          <input type="checkbox" class="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer row-check" data-id="${c.id}"/>
        </td>
        <td class="px-6 py-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
              <span class="material-symbols-outlined text-[18px]" style="font-variation-settings:'FILL' 1">person</span>
            </div>
            <span class="font-ibmPlexSans font-body-md text-body-md text-on-surface font-medium">${c.fullName || c.name || '-'}</span>
          </div>
        </td>
        <td class="px-6 py-4 font-ibmPlexSans font-body-md text-body-md text-on-surface font-mono" dir="ltr">${c.phone || '-'}</td>
        <td class="px-6 py-4 font-ibmPlexSans font-body-md text-body-md text-text-secondary">${c.address || '-'}</td>
        <td class="px-6 py-4 font-ibmPlexSans font-body-md text-body-md text-on-surface">${c.vehicleCount || c._count?.vehicles || 0}</td>
        <td class="px-6 py-4">${this.statusBadge(c.status || 'ACTIVE')}</td>
        <td class="px-6 py-4">
          <div class="flex items-center gap-2">
            <button class="w-8 h-8 rounded-lg hover:bg-surface-container flex items-center justify-center text-text-tertiary hover:text-info transition-colors" title="تعديل" data-action="edit" data-id="${c.id}">
              <span class="material-symbols-outlined text-[18px]">edit</span>
            </button>
            <button class="w-8 h-8 rounded-lg hover:bg-surface-container flex items-center justify-center text-text-tertiary hover:text-error transition-colors" title="حذف" data-action="delete" data-id="${c.id}">
              <span class="material-symbols-outlined text-[18px]">delete</span>
            </button>
          </div>
        </td>
      </tr>
    `).join('')

    // Checkbox handlers
    tbody.querySelectorAll('.row-check').forEach(chk => {
      chk.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement
        const id = target.getAttribute('data-id')!
        if (target.checked) this.selectedIds.add(id)
        else this.selectedIds.delete(id)
        this.updateBulkBar(el)
      })
    })

    // Select all
    const selectAll = el.querySelector('#select-all') as HTMLInputElement
    if (selectAll) {
      selectAll.checked = false
      selectAll.addEventListener('change', () => {
        const checks = tbody.querySelectorAll('.row-check') as NodeListOf<HTMLInputElement>
        checks.forEach(chk => {
          chk.checked = selectAll.checked
          const id = chk.getAttribute('data-id')!
          if (selectAll.checked) this.selectedIds.add(id)
          else this.selectedIds.delete(id)
        })
        this.updateBulkBar(el)
      })
    }

    // Edit handlers
    tbody.querySelectorAll('[data-action="edit"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id')
        const cust = this.allCustomers.find((c: any) => c.id === id)
        if (id && cust) this.openEditModal(el, id, cust)
      })
    })

    // Delete handlers
    tbody.querySelectorAll('[data-action="delete"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id')
        if (id) this.openDeleteModal(el, [id], 'عميل')
      })
    })
  }

  private updateBulkBar(el: HTMLElement) {
    const bar = el.querySelector('#bulk-bar') as HTMLElement
    const count = el.querySelector('#bulk-count') as HTMLElement
    if (!bar || !count) return
    if (this.selectedIds.size > 0) {
      bar.classList.remove('hidden')
      bar.classList.add('flex')
      count.textContent = `تم تحديد ${this.selectedIds.size}`
    } else {
      bar.classList.add('hidden')
      bar.classList.remove('flex')
    }

    const delBtn = el.querySelector('#bulk-delete-btn') as HTMLButtonElement
    if (delBtn) {
      delBtn.onclick = () => {
        if (this.selectedIds.size > 0) {
          this.openDeleteModal(el, Array.from(this.selectedIds), 'عميل')
        }
      }
    }
  }

  private openEditModal(el: HTMLElement, id: string, cust: any) {
    const modal = el.querySelector('#edit-modal') as HTMLElement
    const nameIn = el.querySelector('#edit-name') as HTMLInputElement
    const phoneIn = el.querySelector('#edit-phone') as HTMLInputElement
    const addrIn = el.querySelector('#edit-address') as HTMLInputElement
    const statusIn = el.querySelector('#edit-status') as HTMLSelectElement

    nameIn.value = cust.fullName || ''
    phoneIn.value = cust.phone || ''
    addrIn.value = cust.address || ''
    statusIn.value = cust.status || 'ACTIVE'

    modal.classList.remove('hidden')
    modal.classList.add('flex')

    const close = () => {
      modal.classList.add('hidden')
      modal.classList.remove('flex')
    }

    el.querySelector('#edit-cancel')?.addEventListener('click', close)
    el.querySelector('#edit-save')?.addEventListener('click', async () => {
      const fullName = nameIn.value.trim()
      const phone = phoneIn.value.trim()
      if (!fullName) {
        ;(window as any).toast?.show?.({ message: 'الاسم مطلوب', type: 'warning' })
        nameIn.focus()
        return
      }
      if (!isPhone(phone)) {
        ;(window as any).toast?.show?.({ message: 'رقم الموبايل يجب أن يبدأ بـ 09 ويتبعه 8 أرقام', type: 'warning' })
        phoneIn.focus()
        return
      }
      try {
        const res = await this.api.put(`/api/customers/${id}`, {
          fullName,
          phone,
          address: addrIn.value.trim(),
          status: statusIn.value,
        })
        if (res.success) {
          close()
          this.load(el)
        } else {
          ;(window as any).toast?.show?.({ message: res.message || 'فشل التحديث', type: 'error' })
        }
      } catch {
        ;(window as any).toast?.show?.({ message: 'حدث خطأ أثناء التحديث', type: 'error' })
      }
    })
  }

  private openDeleteModal(el: HTMLElement, ids: string[], entityName: string) {
    const modal = el.querySelector('#delete-modal') as HTMLElement
    const title = el.querySelector('#delete-modal-title') as HTMLElement
    const message = el.querySelector('#delete-modal-message') as HTMLElement
    const confirmBtn = el.querySelector('#delete-modal-confirm') as HTMLElement
    const cancelBtn = el.querySelector('#delete-modal-cancel') as HTMLElement
    if (!modal || !title || !message || !confirmBtn || !cancelBtn) return

    if (ids.length === 1) {
      title.textContent = `تأكيد حذف ${entityName}`
      message.textContent = `هل أنت متأكد من حذف هذا ${entityName}؟`
    } else {
      title.textContent = 'تأكيد حذف متعدد'
      message.textContent = `هل أنت متأكد من حذف ${ids.length} ${entityName}؟`
    }

    modal.classList.remove('hidden')
    modal.classList.add('flex')

    const doCancel = () => {
      modal.classList.add('hidden')
      modal.classList.remove('flex')
    }
    const doConfirm = () => {
      modal.classList.add('hidden')
      modal.classList.remove('flex')
      this.executeDelete(el, ids)
    }

    cancelBtn.onclick = doCancel
    confirmBtn.onclick = doConfirm
  }

  private async executeDelete(el: HTMLElement, ids: string[]) {
    try {
      const results = await Promise.all(ids.map(id => this.api.delete(`/api/customers/${id}`)))
      const failed = results.filter(r => !r.success)
      if (failed.length > 0) {
        const firstError = failed[0].message || (failed[0].data as any)?.error || 'فشل الحذف'
        throw new Error(firstError)
      }
      ids.forEach(id => this.selectedIds.delete(id))
      this.updateBulkBar(el)
      this.load(el)
    } catch (err: any) {
      ;(window as any).toast?.show?.({ message: err.message || 'حدث خطأ أثناء الحذف', type: 'error' })
    }
  }

  private statusBadge(s: string): string {
    const map: Record<string,{label:string;cls:string}> = {
      ACTIVE: {label:'نشط', cls:'bg-tertiary/10 text-tertiary'},
      INACTIVE: {label:'غير نشط', cls:'bg-surface-container-high text-text-secondary'}
    }
    const m = map[s] || {label:s, cls:'bg-surface-container-high text-text-secondary'}
    return `<span class="inline-flex items-center px-3 py-1 rounded-full font-label-sm text-label-sm ${m.cls}">${m.label}</span>`
  }

  private openCreateModal(el: HTMLElement) {
    const modal = el.querySelector('#create-modal') as HTMLElement
    const nameIn = el.querySelector('#customer-name') as HTMLInputElement
    const phoneIn = el.querySelector('#customer-phone') as HTMLInputElement
    const addrIn = el.querySelector('#customer-address') as HTMLInputElement
    const statusIn = el.querySelector('#customer-status') as HTMLSelectElement
    if (!modal || !nameIn || !phoneIn) return

    nameIn.value = ''
    phoneIn.value = ''
    addrIn.value = ''
    statusIn.value = 'ACTIVE'

    modal.classList.remove('hidden')
    modal.classList.add('flex')

    const close = () => {
      modal.classList.add('hidden')
      modal.classList.remove('flex')
    }

    el.querySelector('#create-cancel')?.addEventListener('click', close)
    el.querySelector('#save-customer-btn')?.addEventListener('click', async () => {
      const fullName = nameIn.value.trim()
      const phone = phoneIn.value.trim()
      if (!fullName) {
        ;(window as any).toast?.show?.({ message: 'الاسم مطلوب', type: 'warning' })
        nameIn.focus()
        return
      }
      if (!isPhone(phone)) {
        ;(window as any).toast?.show?.({ message: 'رقم الموبايل يجب أن يبدأ بـ 09 ويتبعه 8 أرقام', type: 'warning' })
        phoneIn.focus()
        return
      }
      try {
        const res = await this.api.post('/api/customers', {
          fullName,
          phone,
          address: addrIn.value.trim(),
          status: statusIn.value,
        })
        if (res.success || res.data || (res as any).id) {
          close()
          this.load(el)
        } else {
          ;(window as any).toast?.show?.({ message: res.message || 'فشل الإنشاء', type: 'error' })
        }
      } catch {
        ;(window as any).toast?.show?.({ message: 'حدث خطأ أثناء الإنشاء', type: 'error' })
      }
    })
  }
}
