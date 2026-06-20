import { AuthService } from '../services/auth'
import { ApiClient } from '../api/client'
import { Router } from '../router'
import { AppLayout } from '../components/layout'

export class DepartmentsScreen {
  private selectedIds: Set<string> = new Set()
  private departments: any[] = []

  constructor(private auth: AuthService, private api: ApiClient, private router: Router) {}

  render(): HTMLElement {
    const layout = new AppLayout(this.auth, this.router, 'الأقسام', 'apartment', this.api)
    const c = document.createElement('div')
    c.className = 'page-enter min-h-screen bg-background p-gutter'
    c.innerHTML = `
      <div class="max-w-7xl mx-auto space-y-stack-lg">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="font-beVietnamPro text-headline-md text-on-surface">الأقسام</h1>
            <p class="text-body-md text-text-secondary mt-1">إدارة أقسام الشركة</p>
          </div>
          <div class="flex items-center gap-3">
            <button id="delete-selected-btn" class="hidden h-[48px] bg-error text-on-error font-ibmPlexSans font-body-lg text-body-lg rounded-lg shadow-sm hover:shadow-lg hover:-translate-y-[1px] transition-all duration-200 flex items-center justify-center gap-2 px-6">
              <span class="material-symbols-outlined text-[20px]">delete</span>
              حذف المحدد (<span id="selected-count">0</span>)
            </button>
            <button id="new-dept-btn" class="h-[48px] bg-primary text-on-primary font-ibmPlexSans font-body-lg text-body-lg rounded-lg shadow-sm hover:shadow-lg hover:-translate-y-[1px] transition-all duration-200 flex items-center justify-center gap-2 px-6">
              <span class="material-symbols-outlined text-[20px]">add</span>
              قسم جديد
            </button>
          </div>
        </div>
        <div class="bg-surface-container-lowest rounded-xl shadow-md border border-surface-subtle overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="bg-surface-subtle border-b border-outline-variant/10">
                  <th class="px-4 py-4 text-right font-label-sm text-label-sm text-text-tertiary">
                    <input type="checkbox" id="select-all" class="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary">
                  </th>
                  <th class="px-6 py-4 text-right font-label-sm text-label-sm text-text-tertiary">الاسم</th>
                  <th class="px-6 py-4 text-right font-label-sm text-label-sm text-text-tertiary">الوصف</th>
                  <th class="px-6 py-4 text-right font-label-sm text-label-sm text-text-tertiary">الحالة</th>
                  <th class="px-6 py-4 text-right font-label-sm text-label-sm text-text-tertiary">تاريخ الإنشاء</th>
                  <th class="px-6 py-4 text-right font-label-sm text-label-sm text-text-tertiary">إجراءات</th>
                </tr>
              </thead>
              <tbody id="dept-tbody">
                <tr><td colspan="6" class="px-6 py-8 text-center text-text-secondary"><div class="skeleton-shimmer h-4 rounded w-32 mx-auto"></div></td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Add Department Modal -->
      <div id="dept-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div class="bg-surface-container-lowest rounded-xl shadow-xl border border-surface-subtle p-6 w-full max-w-md space-y-4">
          <h3 id="modal-title" class="font-beVietnamPro text-headline-sm text-on-surface">قسم جديد</h3>
          <form id="dept-form" class="space-y-4">
            <input type="hidden" name="id" id="dept-id">
            <div>
              <label class="block font-label-sm text-label-sm text-text-secondary mb-1">اسم القسم</label>
              <input type="text" name="nameAr" required class="w-full h-[48px] bg-surface-container-high border border-outline-variant rounded-lg px-4 text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" placeholder="الصيانة">
            </div>
            <div>
              <label class="block font-label-sm text-label-sm text-text-secondary mb-1">الاسم بالإنجليزية</label>
              <input type="text" name="nameEn" class="w-full h-[48px] bg-surface-container-high border border-outline-variant rounded-lg px-4 text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" placeholder="Maintenance">
            </div>
            <div>
              <label class="block font-label-sm text-label-sm text-text-secondary mb-1">الوصف</label>
              <textarea name="description" rows="3" class="w-full bg-surface-container-high border border-outline-variant rounded-lg px-4 py-2 text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none" placeholder="وصف القسم"></textarea>
            </div>
            <div class="flex items-center gap-3 pt-2">
              <button type="submit" class="h-[48px] bg-primary text-on-primary font-ibmPlexSans font-body-lg text-body-lg rounded-lg shadow-sm hover:shadow-lg hover:-translate-y-[1px] transition-all duration-200 flex items-center justify-center gap-2 px-6">
                حفظ
              </button>
              <button type="button" id="cancel-modal" class="h-[48px] bg-surface-container-high text-text-secondary font-ibmPlexSans font-body-lg text-body-lg rounded-lg border border-outline-variant hover:bg-surface-container transition-all duration-200 flex items-center justify-center gap-2 px-6">
                إلغاء
              </button>
            </div>
          </form>
        </div>
      </div>`

    this.load(c)
    this.bindEvents(c)
    return layout.render(c)
  }

  private async load(c: HTMLElement) {
    const tbody = c.querySelector('#dept-tbody')!
    try {
      const res: any = await this.api.get('/api/departments')
      const depts = res.data?.data || res.data || []
      this.departments = depts
      if (depts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-8 text-center text-text-secondary font-body-md">لا يوجد أقسام</td></tr>'
        return
      }
      this.renderTable(tbody, depts)
    } catch {
      tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-8 text-center text-error font-body-md">حدث خطأ في تحميل الأقسام</td></tr>'
    }
  }

  private renderTable(tbody: Element, depts: any[]) {
    tbody.innerHTML = depts.map((d: any) => `
      <tr class="border-b border-outline-variant/10 hover:bg-surface-container-low/50 transition-colors" data-id="${d.id}">
        <td class="px-4 py-4">
          <input type="checkbox" class="dept-checkbox w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary" data-id="${d.id}">
        </td>
        <td class="px-6 py-4 font-body-md text-on-surface">${d.nameAr || d.name || '-'}</td>
        <td class="px-6 py-4 font-body-md text-text-secondary">${d.description || '-'}</td>
        <td class="px-6 py-4">
          <span class="inline-flex items-center px-3 py-1 rounded-full font-label-sm text-label-sm ${d.isActive ? 'bg-tertiary/10 text-tertiary' : 'bg-surface-container-high text-text-secondary'}">
            ${d.isActive ? 'نشط' : 'غير نشط'}
          </span>
        </td>
        <td class="px-6 py-4 font-body-md text-text-secondary">${d.createdAt ? new Date(d.createdAt).toLocaleDateString('ar-SY') : '-'}</td>
        <td class="px-6 py-4">
          <div class="flex items-center gap-2">
            <button class="edit-btn w-8 h-8 rounded-lg hover:bg-surface-container flex items-center justify-center text-text-tertiary hover:text-info transition-colors" title="تعديل" data-id="${d.id}">
              <span class="material-symbols-outlined text-[18px]">edit</span>
            </button>
            <button class="delete-btn w-8 h-8 rounded-lg hover:bg-error/10 flex items-center justify-center text-text-tertiary hover:text-error transition-colors" title="حذف" data-id="${d.id}">
              <span class="material-symbols-outlined text-[18px]">delete</span>
            </button>
          </div>
        </td>
      </tr>
    `).join('')

    // Checkbox events
    tbody.querySelectorAll('.dept-checkbox').forEach(cb => {
      cb.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement
        const id = target.getAttribute('data-id')!
        if (target.checked) this.selectedIds.add(id)
        else this.selectedIds.delete(id)
        this.updateSelectionUI()
      })
    })

    // Edit buttons
    tbody.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id')!
        const dept = this.departments.find((d: any) => d.id === id)
        if (dept) this.openModal(dept)
      })
    })

    // Delete single
    tbody.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id')!
        if (!confirm('هل أنت متأكد من حذف هذا القسم؟')) return
        try {
          await this.api.delete(`/api/departments/${id}`)
          this.load(document.body.querySelector('#dept-tbody')?.closest('.page-enter') as HTMLElement)
        } catch (err: any) {
          alert(err.message || 'فشل الحذف')
        }
      })
    })
  }

  private bindEvents(c: HTMLElement) {
    const selectAll = c.querySelector('#select-all') as HTMLInputElement
    const deleteSelectedBtn = c.querySelector('#delete-selected-btn') as HTMLElement
    const newDeptBtn = c.querySelector('#new-dept-btn')
    const cancelModal = c.querySelector('#cancel-modal')
    const form = c.querySelector('#dept-form') as HTMLFormElement

    selectAll?.addEventListener('change', () => {
      const checkboxes = c.querySelectorAll('.dept-checkbox')
      checkboxes.forEach((cb: any) => {
        cb.checked = selectAll.checked
        const id = cb.getAttribute('data-id')!
        if (selectAll.checked) this.selectedIds.add(id)
        else this.selectedIds.delete(id)
      })
      this.updateSelectionUI()
    })

    deleteSelectedBtn?.addEventListener('click', async () => {
      if (this.selectedIds.size === 0) return
      if (!confirm(`هل أنت متأكد من حذف ${this.selectedIds.size} قسم؟`)) return
      try {
        const res: any = await this.api.post('/api/departments/bulk-delete', { ids: Array.from(this.selectedIds) })
        alert(res.message || `تم حذف ${res.deleted || 0} قسم`)
        this.selectedIds.clear()
        this.load(c)
      } catch (err: any) {
        alert(err.message || 'فشل الحذف')
      }
    })

    newDeptBtn?.addEventListener('click', () => this.openModal())
    cancelModal?.addEventListener('click', () => this.closeModal())

    form?.addEventListener('submit', async (e) => {
      e.preventDefault()
      const fd = new FormData(form)
      const id = (c.querySelector('#dept-id') as HTMLInputElement)?.value
      const data: any = {
        nameAr: fd.get('nameAr'),
        nameEn: fd.get('nameEn') || undefined,
        description: fd.get('description') || undefined,
        isActive: true,
      }
      try {
        if (id) {
          await this.api.put(`/api/departments/${id}`, data)
        } else {
          await this.api.post('/api/departments', data)
        }
        this.closeModal()
        this.load(c)
      } catch (err: any) {
        alert(err.message || 'فشل الحفظ')
      }
    })
  }

  private updateSelectionUI() {
    const btn = document.querySelector('#delete-selected-btn') as HTMLElement
    const count = document.querySelector('#selected-count')
    if (btn && count) {
      const size = this.selectedIds.size
      count.textContent = String(size)
      if (size > 0) btn.classList.remove('hidden')
      else btn.classList.add('hidden')
    }
  }

  private openModal(dept?: any) {
    const modal = document.querySelector('#dept-modal') as HTMLElement
    const title = document.querySelector('#modal-title') as HTMLElement
    const idInput = document.querySelector('#dept-id') as HTMLInputElement
    const nameAr = document.querySelector('[name="nameAr"]') as HTMLInputElement
    const nameEn = document.querySelector('[name="nameEn"]') as HTMLInputElement
    const desc = document.querySelector('[name="description"]') as HTMLTextAreaElement

    if (dept) {
      title.textContent = 'تعديل قسم'
      idInput.value = dept.id
      nameAr.value = dept.nameAr || ''
      nameEn.value = dept.nameEn || ''
      desc.value = dept.description || ''
    } else {
      title.textContent = 'قسم جديد'
      idInput.value = ''
      nameAr.value = ''
      nameEn.value = ''
      desc.value = ''
    }
    modal?.classList.remove('hidden')
  }

  private closeModal() {
    const modal = document.querySelector('#dept-modal') as HTMLElement
    modal?.classList.add('hidden')
  }
}
