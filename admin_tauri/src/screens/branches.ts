import { AuthService } from '../services/auth'
import { ApiClient } from '../api/client'
import { Router } from '../router'
import { AppLayout } from '../components/layout'

export class BranchesScreen {
  constructor(private _auth: AuthService, private api: ApiClient, private router: Router) {}

  render(): HTMLElement {
    const layout = new AppLayout(this._auth, this.router, 'إدارة الفروع', 'storefront', this.api)
    const c = document.createElement('div')
    c.className = 'page-enter min-h-screen bg-background p-gutter'
    c.innerHTML = `
      <div class="max-w-7xl mx-auto space-y-stack-lg">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="font-beVietnamPro text-headline-md text-on-surface">إدارة الفروع</h1>
            <p class="text-body-md text-text-secondary mt-1">إضافة وتعديل وحذف الفروع والمنشآت</p>
          </div>
          <button class="h-[48px] bg-primary text-on-primary font-ibmPlexSans font-body-lg text-body-lg rounded-lg shadow-sm hover:shadow-lg hover:-translate-y-[1px] transition-all duration-200 flex items-center justify-center gap-2 px-6" id="new-branch-btn">
            <span class="material-symbols-outlined text-[20px]">add</span>
            فرع جديد
          </button>
        </div>
        <div class="bg-surface-container-lowest rounded-xl shadow-md border border-surface-subtle overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="bg-surface-subtle border-b border-outline-variant/10">
                  <th class="px-6 py-4 text-right font-label-sm text-label-sm text-text-tertiary uppercase">الفرع</th>
                  <th class="px-6 py-4 text-right font-label-sm text-label-sm text-text-tertiary uppercase">العنوان</th>
                  <th class="px-6 py-4 text-right font-label-sm text-label-sm text-text-tertiary uppercase">الهاتف</th>
                  <th class="px-6 py-4 text-right font-label-sm text-label-sm text-text-tertiary uppercase">الحالة</th>
                  <th class="px-6 py-4 text-right font-label-sm text-label-sm text-text-tertiary uppercase">إجراءات</th>
                </tr>
              </thead>
              <tbody id="branches-tbody">
                <tr><td colspan="5" class="px-6 py-8 text-center text-text-secondary">جاري التحميل...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <!-- Delete Confirmation Modal -->
      <div id="delete-modal" class="fixed inset-0 bg-black/50 z-[100] hidden items-center justify-center p-4">
        <div class="bg-surface-container-lowest rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 border border-border">
          <div class="flex flex-col items-center text-center gap-4">
            <div class="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center">
              <span class="material-symbols-outlined text-[32px] text-error">warning</span>
            </div>
            <h3 class="font-headline-md text-lg text-on-surface font-semibold">تأكيد الحذف</h3>
            <p class="text-body-md text-text-secondary">هل أنت متأكد من حذف هذا الفرع؟</p>
            <div class="flex gap-3 w-full">
              <button class="flex-1 h-[48px] bg-surface-subtle text-on-surface font-ibmPlexSans font-body-md rounded-lg border border-border hover:bg-surface-container-low transition-colors" id="delete-cancel">إلغاء</button>
              <button class="flex-1 h-[48px] bg-error text-on-error font-ibmPlexSans font-body-md rounded-lg hover:bg-error/90 transition-colors" id="delete-confirm">حذف</button>
            </div>
          </div>
        </div>
      </div>
      <!-- Add/Edit Modal -->
      <div id="branch-modal" class="fixed inset-0 bg-black/50 z-[100] hidden items-center justify-center p-4">
        <div class="bg-surface-container-lowest rounded-xl shadow-xl border border-surface-subtle max-w-lg w-full p-6 space-y-4">
          <h2 class="font-headline-md text-lg text-on-surface font-semibold" id="modal-title">فرع جديد</h2>
          <div class="space-y-3">
            <div>
              <label class="font-label-sm text-text-secondary block mb-1">اسم الفرع</label>
              <input class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow" id="b-name" placeholder="مثال: المركز الرئيسي - الرياض" required/>
            </div>
            <div>
              <label class="font-label-sm text-text-secondary block mb-1">العنوان</label>
              <input class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow" id="b-address" placeholder="عنوان الفرع"/>
            </div>
            <div>
              <label class="font-label-sm text-text-secondary block mb-1">الهاتف</label>
              <input class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow" id="b-phone" placeholder="رقم الهاتف"/>
            </div>
            <div>
              <label class="font-label-sm text-text-secondary block mb-1">الحالة</label>
              <select class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow" id="b-status">
                <option value="ACTIVE">نشط</option>
                <option value="INACTIVE">غير نشط</option>
              </select>
            </div>
          </div>
          <div class="flex gap-3 pt-2">
            <button class="flex-1 h-[48px] bg-surface-subtle text-on-surface font-ibmPlexSans font-body-md rounded-lg border border-border hover:bg-surface-container-low transition-colors" id="modal-cancel">إلغاء</button>
            <button class="flex-1 h-[48px] bg-primary text-on-primary font-ibmPlexSans font-body-md rounded-lg hover:bg-primary/90 transition-colors" id="save-branch-btn">حفظ</button>
          </div>
        </div>
      </div>
    `

    this.loadBranches(c)

    c.querySelector('#new-branch-btn')?.addEventListener('click', () => {
      this.openModal(c)
    })

    // Delete modal handlers
    let deleteId: string | null = null
    c.querySelector('#delete-cancel')?.addEventListener('click', () => {
      this.toggleModal(c, 'delete-modal', false)
    })
    c.querySelector('#delete-confirm')?.addEventListener('click', async () => {
      if (!deleteId) return
      const res = await this.api.delete(`/api/branches/${deleteId}`)
      if (res.success) {
        this.loadBranches(c)
      } else {
        alert(res.message || 'فشل الحذف')
      }
      this.toggleModal(c, 'delete-modal', false)
      deleteId = null
    })

    // Branch modal handlers
    let editId: string | null = null
    c.querySelector('#modal-cancel')?.addEventListener('click', () => {
      this.toggleModal(c, 'branch-modal', false)
      editId = null
    })
    c.querySelector('#save-branch-btn')?.addEventListener('click', async () => {
      const name = (c.querySelector('#b-name') as HTMLInputElement).value.trim()
      const address = (c.querySelector('#b-address') as HTMLInputElement).value.trim()
      const phone = (c.querySelector('#b-phone') as HTMLInputElement).value.trim()
      const isActive = (c.querySelector('#b-status') as HTMLSelectElement).value === 'ACTIVE'

      if (!name) { alert('اسم الفرع مطلوب'); return }

      const payload = { name, address: address || undefined, phone: phone || undefined, isActive }

      if (editId) {
        const res = await this.api.put(`/api/branches/${editId}`, payload)
        if (!res.success) { alert(res.message || 'فشل التحديث'); return }
      } else {
        const res = await this.api.post('/api/branches', payload)
        if (!res.success) { alert(res.message || 'فشل الإنشاء'); return }
      }

      this.loadBranches(c)
      this.toggleModal(c, 'branch-modal', false)
      editId = null
    })

    return layout.render(c)
  }

  private async loadBranches(el: HTMLElement) {
    const tbody = el.querySelector('#branches-tbody') as HTMLElement
    if (!tbody) return
    tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-text-secondary">جاري التحميل...</td></tr>'

    const res = await this.api.get<any>('/api/branches')
    const branches = res.data?.branches || res.data || []

    if (!Array.isArray(branches) || branches.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-text-secondary">لا توجد فروع</td></tr>'
      return
    }

    tbody.innerHTML = branches.map((b: any) => `
      <tr class="border-b border-outline-variant/10 hover:bg-surface-container-low transition-colors">
        <td class="px-6 py-4 font-body-md text-on-surface font-semibold">${b.name || '-'}</td>
        <td class="px-6 py-4 font-body-md text-text-secondary">${b.address || '-'}</td>
        <td class="px-6 py-4 font-body-md text-text-secondary" dir="ltr">${b.phone || '-'}</td>
        <td class="px-6 py-4">
          ${b.isActive !== false
            ? '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success">نشط</span>'
            : '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-surface-container text-on-surface-variant">غير نشط</span>'}
        </td>
        <td class="px-6 py-4">
          <div class="flex items-center gap-2">
            <button class="w-8 h-8 rounded-lg hover:bg-surface-container flex items-center justify-center text-text-tertiary hover:text-info transition-colors" data-action="edit" data-id="${b.id}" title="تعديل">
              <span class="material-symbols-outlined text-[18px]">edit</span>
            </button>
            <button class="w-8 h-8 rounded-lg hover:bg-error/10 flex items-center justify-center text-text-tertiary hover:text-error transition-colors" data-action="delete" data-id="${b.id}" title="حذف">
              <span class="material-symbols-outlined text-[18px]">delete</span>
            </button>
          </div>
        </td>
      </tr>
    `).join('')

    tbody.querySelectorAll('[data-action="edit"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id')
        const b = branches.find((x: any) => x.id === id)
        if (id && b) this.openModal(el, b)
      })
    })

    tbody.querySelectorAll('[data-action="delete"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id')
        if (id) {
          (el.querySelector('#delete-confirm') as HTMLButtonElement)?.setAttribute('data-delete-id', id)
          this.toggleModal(el, 'delete-modal', true)
        }
      })
    })

    // Wire delete confirm
    const deleteConfirm = el.querySelector('#delete-confirm') as HTMLButtonElement
    if (deleteConfirm) {
      const newBtn = deleteConfirm.cloneNode(true) as HTMLButtonElement
      deleteConfirm.parentNode?.replaceChild(newBtn, deleteConfirm)
      newBtn.addEventListener('click', async () => {
        const id = newBtn.getAttribute('data-delete-id')
        if (!id) return
        const res = await this.api.delete(`/api/branches/${id}`)
        if (res.success) {
          this.loadBranches(el)
        } else {
          alert(res.message || 'فشل الحذف')
        }
        this.toggleModal(el, 'delete-modal', false)
      })
    }
  }

  private openModal(el: HTMLElement, branch?: any) {
    const isEdit = !!branch
    el.querySelector('#modal-title')!.textContent = isEdit ? 'تعديل الفرع' : 'فرع جديد'
    ;(el.querySelector('#b-name') as HTMLInputElement).value = branch?.name || ''
    ;(el.querySelector('#b-address') as HTMLInputElement).value = branch?.address || ''
    ;(el.querySelector('#b-phone') as HTMLInputElement).value = branch?.phone || ''
    ;(el.querySelector('#b-status') as HTMLSelectElement).value = branch?.isActive !== false ? 'ACTIVE' : 'INACTIVE'

    const saveBtn = el.querySelector('#save-branch-btn') as HTMLButtonElement
    // Replace to clear old listeners
    const newSave = saveBtn.cloneNode(true) as HTMLButtonElement
    saveBtn.parentNode?.replaceChild(newSave, saveBtn)

    newSave.addEventListener('click', async () => {
      const name = (el.querySelector('#b-name') as HTMLInputElement).value.trim()
      const address = (el.querySelector('#b-address') as HTMLInputElement).value.trim()
      const phone = (el.querySelector('#b-phone') as HTMLInputElement).value.trim()
      const isActive = (el.querySelector('#b-status') as HTMLSelectElement).value === 'ACTIVE'

      if (!name) { alert('اسم الفرع مطلوب'); return }

      const payload = { name, address: address || undefined, phone: phone || undefined, isActive }

      if (isEdit) {
        const res = await this.api.put(`/api/branches/${branch.id}`, payload)
        if (!res.success) { alert(res.message || 'فشل التحديث'); return }
      } else {
        const res = await this.api.post('/api/branches', payload)
        if (!res.success) { alert(res.message || 'فشل الإنشاء'); return }
      }

      this.loadBranches(el)
      this.toggleModal(el, 'branch-modal', false)
    })

    this.toggleModal(el, 'branch-modal', true)
  }

  private toggleModal(el: HTMLElement, id: string, show: boolean) {
    const modal = el.querySelector(`#${id}`) as HTMLElement
    if (!modal) return
    if (show) {
      modal.classList.remove('hidden')
      modal.classList.add('flex')
    } else {
      modal.classList.add('hidden')
      modal.classList.remove('flex')
    }
  }
}
