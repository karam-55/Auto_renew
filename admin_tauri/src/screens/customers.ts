import { AuthService } from '../services/auth'
import { ApiClient } from '../api/client'
import { Router } from '../router'
import { AppLayout } from '../components/layout'

export class CustomersScreen {
  constructor(private _auth: AuthService, private api: ApiClient, private router: Router) {}
  render(): HTMLElement {
    const layout = new AppLayout(this._auth, this.router, 'العملاء', 'group', this.api)
    const c = document.createElement('div')
    c.className = 'page-enter max-w-[1600px] mx-auto'
    c.innerHTML = `
      <div class="space-y-stack-lg">
        <div class="flex items-center justify-between page-enter">
          <div>
            <h1 class="font-beVietnamPro text-headline-md text-on-surface">إدارة العملاء</h1>
            <p class="text-body-md text-on-surface-variant mt-1">قاعدة بيانات العملاء والمركبات</p>
          </div>
          <button class="h-12 btn-primary-gradient text-white font-body-md rounded-xl shadow-lg shadow-primary/25 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 px-6" id="new-customer-btn">
            <span class="material-symbols-outlined text-[20px]">add</span>
            عميل جديد
          </button>
        </div>
        <div class="glass-card rounded-2xl p-card-padding stagger-entry stagger-entry-1">
          <div class="relative">
            <span class="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
            <input class="w-full h-12 bg-white/50 border border-glass-border rounded-xl pr-10 pl-4 font-body-md text-on-surface placeholder:text-on-surface-variant input-glow transition-all" placeholder="بحث بالاسم أو الموبايل..." id="customer-search"/>
          </div>
        </div>
        <!-- Bulk actions bar -->
        <div id="bulk-bar" class="hidden glass-card border border-error/20 rounded-2xl p-4 flex items-center justify-between stagger-entry">
          <span class="font-body-md text-error font-semibold" id="bulk-count">تم تحديد 0</span>
          <button class="h-10 px-4 bg-error text-white font-body-md rounded-xl flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-error/20" id="bulk-delete-btn">
            <span class="material-symbols-outlined text-[18px]">delete</span>
            حذف المحدد
          </button>
        </div>
        <div class="glass-card rounded-2xl overflow-hidden stagger-entry stagger-entry-2">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="bg-white/40 border-b border-glass-border">
                  <th class="px-4 py-4 text-center font-label-sm text-on-surface-variant uppercase">
                    <input type="checkbox" class="w-4 h-4 rounded border-glass-border text-primary focus:ring-primary cursor-pointer" id="select-all"/>
                  </th>
                  <th class="px-6 py-4 text-right font-label-sm text-on-surface-variant uppercase">الاسم</th>
                  <th class="px-6 py-4 text-right font-label-sm text-on-surface-variant uppercase">الموبايل</th>
                  <th class="px-6 py-4 text-right font-label-sm text-on-surface-variant uppercase">العنوان</th>
                  <th class="px-6 py-4 text-right font-label-sm text-on-surface-variant uppercase">المركبات</th>
                  <th class="px-6 py-4 text-right font-label-sm text-on-surface-variant uppercase">الحالة</th>
                  <th class="px-6 py-4 text-right font-label-sm text-on-surface-variant uppercase">إجراءات</th>
                </tr>
              </thead>
              <tbody id="customers-tbody">
                <tr><td colspan="7" class="px-6 py-8 text-center text-on-surface-variant"><div class="skeleton-shimmer h-4 rounded w-32 mx-auto"></div></td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <!-- Delete Confirmation Modal -->
      <div id="delete-modal" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] hidden items-center justify-center p-4">
        <div class="glass-card rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 border border-glass-border">
          <div class="flex flex-col items-center text-center gap-4">
            <div class="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center pulse-soft">
              <span class="material-symbols-outlined text-[32px] text-error">warning</span>
            </div>
            <h3 class="font-headline-md text-lg text-on-surface font-semibold" id="delete-modal-title">تأكيد الحذف</h3>
            <p class="text-body-md text-on-surface-variant" id="delete-modal-message">هل أنت متأكد من حذف هذا العميل؟</p>
            <div class="flex gap-3 w-full">
              <button class="flex-1 h-12 glass-card text-on-surface font-body-md rounded-xl border border-glass-border hover:bg-white/80 transition-all" id="delete-modal-cancel">إلغاء</button>
              <button class="flex-1 h-12 bg-error text-white font-body-md rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-error/20" id="delete-modal-confirm">حذف</button>
            </div>
          </div>
        </div>
      </div>
      <!-- Create Modal -->
      <div id="create-modal" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] hidden items-center justify-center p-4">
        <div class="glass-card rounded-2xl shadow-xl border border-glass-border max-w-lg w-full p-6 space-y-4">
          <h2 class="font-headline-md text-lg text-on-surface font-beVietnamPro">عميل جديد</h2>
          <div class="space-y-3">
            <div>
              <label class="block font-label-sm text-on-surface-variant mb-1">الاسم</label>
              <input class="w-full h-12 bg-white/50 border border-glass-border rounded-xl px-4 font-body-md text-on-surface input-glow transition-all" id="customer-name"/>
            </div>
            <div>
              <label class="block font-label-sm text-on-surface-variant mb-1">الموبايل</label>
              <input class="w-full h-12 bg-white/50 border border-glass-border rounded-xl px-4 font-body-md text-on-surface input-glow transition-all" id="customer-phone" dir="ltr"/>
            </div>
            <div>
              <label class="block font-label-sm text-on-surface-variant mb-1">العنوان</label>
              <input class="w-full h-12 bg-white/50 border border-glass-border rounded-xl px-4 font-body-md text-on-surface input-glow transition-all" id="customer-address"/>
            </div>
            <div>
              <label class="block font-label-sm text-on-surface-variant mb-1">الحالة</label>
              <select class="w-full h-12 bg-white/50 border border-glass-border rounded-xl px-4 font-body-md text-on-surface input-glow transition-all cursor-pointer" id="customer-status">
                <option value="ACTIVE">نشط</option>
                <option value="INACTIVE">غير نشط</option>
              </select>
            </div>
          </div>
          <div class="flex justify-end gap-3 pt-2">
            <button class="h-10 px-4 font-body-md rounded-xl border border-glass-border hover:bg-white/80 transition-all" id="create-cancel">إلغاء</button>
            <button class="h-10 px-6 btn-primary-gradient text-white font-body-md rounded-xl shadow-md hover:scale-105 active:scale-95 transition-all" id="save-customer-btn">حفظ</button>
          </div>
        </div>
      </div>
      <!-- Edit Modal -->
      <div id="edit-modal" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] hidden items-center justify-center p-4">
        <div class="glass-card rounded-2xl shadow-xl border border-glass-border max-w-lg w-full p-6 space-y-4">
          <h2 class="font-headline-md text-lg text-on-surface font-beVietnamPro">تعديل العميل</h2>
          <div class="space-y-3">
            <div>
              <label class="block font-label-sm text-on-surface-variant mb-1">الاسم</label>
              <input class="w-full h-12 bg-white/50 border border-glass-border rounded-xl px-4 font-body-md text-on-surface input-glow transition-all" id="edit-name"/>
            </div>
            <div>
              <label class="block font-label-sm text-on-surface-variant mb-1">الموبايل</label>
              <input class="w-full h-12 bg-white/50 border border-glass-border rounded-xl px-4 font-body-md text-on-surface input-glow transition-all" id="edit-phone" dir="ltr"/>
            </div>
            <div>
              <label class="block font-label-sm text-on-surface-variant mb-1">العنوان</label>
              <input class="w-full h-12 bg-white/50 border border-glass-border rounded-xl px-4 font-body-md text-on-surface input-glow transition-all" id="edit-address"/>
            </div>
            <div>
              <label class="block font-label-sm text-on-surface-variant mb-1">الحالة</label>
              <select class="w-full h-12 bg-white/50 border border-glass-border rounded-xl px-4 font-body-md text-on-surface input-glow transition-all cursor-pointer" id="edit-status">
                <option value="ACTIVE">نشط</option>
                <option value="INACTIVE">غير نشط</option>
              </select>
            </div>
          </div>
          <div class="flex justify-end gap-3 pt-2">
            <button class="h-10 px-4 font-body-md rounded-xl border border-glass-border hover:bg-white/80 transition-all" id="edit-cancel">إلغاء</button>
            <button class="h-10 px-6 btn-primary-gradient text-white font-body-md rounded-xl shadow-md hover:scale-105 active:scale-95 transition-all" id="edit-save">حفظ</button>
          </div>
        </div>
      </div>

      <!-- Smart FAB -->
      <button class="fab-glass pulse-glow" id="customers-fab" title="عميل جديد">
        <span class="material-symbols-outlined text-[28px]" style="font-variation-settings: 'FILL' 1">person_add</span>
      </button>`

    this.load(c)

    c.querySelector('#new-customer-btn')?.addEventListener('click', () => this.openCreateModal(c))
    c.querySelector('#customers-fab')?.addEventListener('click', () => this.openCreateModal(c))
    return layout.render(c)
  }

  private selectedIds = new Set<string>()
  private allCustomers: any[] = []

  private async load(el: HTMLElement) {
    try {
      const res = await this.api.get<any>('/api/customers')
      const tbody = el.querySelector('#customers-tbody')!
      if (res.success && res.data) {
        const items = Array.isArray(res.data) ? res.data : res.data.data || []
        this.allCustomers = items
        if (items.length === 0) { tbody.innerHTML = '<tr><td colspan="7" class="px-6 py-12 text-center text-on-surface-variant font-body-md"><span class="material-symbols-outlined text-4xl mb-2 opacity-50">group</span><br/>لا يوجد عملاء</td></tr>'; return }
        this.renderRows(el, items)
      }
    } catch { el.querySelector('#customers-tbody')!.innerHTML = '<tr><td colspan="7" class="px-6 py-12 text-center text-error font-body-md"><span class="material-symbols-outlined text-4xl mb-2">error</span><br/>حدث خطأ</td></tr>' }
  }

  private renderRows(el: HTMLElement, items: any[]) {
    const tbody = el.querySelector('#customers-tbody')!
    tbody.innerHTML = items.map((c: any) => `
      <tr class="border-b border-glass-border hover:bg-white/40 hover:translate-y-[-2px] hover:shadow-sm transition-all duration-300 group" data-cid="${c.id}">
        <td class="px-4 py-4 text-center">
          <input type="checkbox" class="w-4 h-4 rounded border-glass-border text-primary focus:ring-primary cursor-pointer row-check" data-id="${c.id}"/>
        </td>
        <td class="px-6 py-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-primary-fixed text-primary flex items-center justify-center border border-primary/20">
              <span class="material-symbols-outlined text-[18px]" style="font-variation-settings:'FILL' 1">person</span>
            </div>
            <span class="font-body-md text-on-surface font-semibold">${c.fullName || c.name || '-'}</span>
          </div>
        </td>
        <td class="px-6 py-4 font-body-md text-on-surface font-mono" dir="ltr">${c.phone || '-'}</td>
        <td class="px-6 py-4 font-body-md text-on-surface-variant">${c.address || '-'}</td>
        <td class="px-6 py-4 text-financial-data text-on-surface font-semibold">${c.vehicleCount || c._count?.vehicles || 0}</td>
        <td class="px-6 py-4">${this.statusBadge(c.status || 'ACTIVE')}</td>
        <td class="px-6 py-4">
          <div class="flex items-center gap-2">
            <button class="w-8 h-8 rounded-lg hover:bg-info/10 flex items-center justify-center text-on-surface-variant hover:text-info hover:scale-110 transition-all" title="تعديل" data-action="edit" data-id="${c.id}">
              <span class="material-symbols-outlined text-[18px]">edit</span>
            </button>
            <button class="w-8 h-8 rounded-lg hover:bg-error/10 flex items-center justify-center text-on-surface-variant hover:text-error hover:scale-110 transition-all" title="حذف" data-action="delete" data-id="${c.id}">
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

    // Search
    const searchInput = el.querySelector('#customer-search') as HTMLInputElement
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        const term = searchInput.value.trim().toLowerCase()
        const filtered = term ? this.allCustomers.filter((c: any) =>
          (c.fullName || '').toLowerCase().includes(term) || (c.phone || '').includes(term)
        ) : this.allCustomers
        this.renderRows(el, filtered)
      })
    }
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
      try {
        const res = await this.api.put(`/api/customers/${id}`, {
          fullName: nameIn.value,
          phone: phoneIn.value,
          address: addrIn.value,
          status: statusIn.value,
        })
        if (res.success) {
          close()
          this.load(el)
        } else {
          alert(res.message || 'فشل التحديث')
        }
      } catch {
        alert('حدث خطأ أثناء التحديث')
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
      alert(err.message || 'حدث خطأ أثناء الحذف')
    }
  }

  private statusBadge(s: string): string {
    const map: Record<string,{label:string;cls:string;glow:string}> = {
      ACTIVE: {label:'نشط', cls:'bg-success/10 text-success', glow:'rgba(5,150,105,0.4)'},
      INACTIVE: {label:'غير نشط', cls:'bg-surface-container-high text-on-surface-variant', glow:'rgba(115,118,133,0.4)'}
    }
    const m = map[s] || {label:s, cls:'bg-surface-container-high text-on-surface-variant', glow:'rgba(115,118,133,0.4)'}
    return `<span class="inline-flex items-center px-3 py-1 rounded-full font-label-sm text-label-sm ${m.cls} badge-neon" style="text-shadow:0 0 8px ${m.glow}">${m.label}</span>`
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
      try {
        const res = await this.api.post('/api/customers', {
          fullName: nameIn.value,
          phone: phoneIn.value,
          address: addrIn.value,
          status: statusIn.value,
        })
        if (res.success || res.data || (res as any).id) {
          close()
          this.load(el)
        } else {
          alert(res.message || 'فشل الإنشاء')
        }
      } catch {
        alert('حدث خطأ أثناء الإنشاء')
      }
    })
  }
}
