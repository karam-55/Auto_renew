import { AuthService } from '../services/auth'
import { ApiClient } from '../api/client'
import { Router } from '../router'
import { AppLayout } from '../components/layout'

export class HrScreen {
  constructor(private auth: AuthService, private api: ApiClient, private router: Router) {}
  render(): HTMLElement {
    const layout = new AppLayout(this.auth, this.router, 'الموارد البشرية', 'badge', this.api)
    const c = document.createElement('div')
    c.className = 'page-enter min-h-screen bg-background p-gutter'
    c.innerHTML = `
      <div class="max-w-7xl mx-auto space-y-stack-lg">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="font-beVietnamPro text-headline-md text-on-surface">الموارد البشرية</h1>
            <p class="text-body-md text-text-secondary mt-1">إدارة فريق العمل والرواتب</p>
          </div>
          <div class="flex items-center gap-3">
            <button id="bulk-delete-btn" class="hidden h-[48px] bg-error text-on-error font-ibmPlexSans font-body-lg text-body-lg rounded-lg shadow-sm hover:shadow-lg hover:-translate-y-[1px] transition-all duration-200 flex items-center justify-center gap-2 px-6">
              <span class="material-symbols-outlined text-[20px]">delete</span>
              حذف المحدد (<span id="selected-count">0</span>)
            </button>
            <button class="h-[48px] bg-secondary text-on-secondary font-ibmPlexSans font-body-lg text-body-lg rounded-lg shadow-sm hover:shadow-lg hover:-translate-y-[1px] transition-all duration-200 flex items-center justify-center gap-2 px-6" id="departments-btn">
              <span class="material-symbols-outlined text-[20px]">apartment</span>
              الأقسام
            </button>
            <button class="h-[48px] bg-primary text-on-primary font-ibmPlexSans font-body-lg text-body-lg rounded-lg shadow-sm hover:shadow-lg hover:-translate-y-[1px] transition-all duration-200 flex items-center justify-center gap-2 px-6" id="new-employee-btn">
              <span class="material-symbols-outlined text-[20px]">add</span>
              موظف جديد
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
                  <th class="px-6 py-4 text-right font-label-sm text-label-sm text-text-tertiary uppercase">الاسم</th>
                  <th class="px-6 py-4 text-right font-label-sm text-label-sm text-text-tertiary uppercase">الدور</th>
                  <th class="px-6 py-4 text-right font-label-sm text-label-sm text-text-tertiary uppercase">القسم</th>
                  <th class="px-6 py-4 text-right font-label-sm text-label-sm text-text-tertiary uppercase">الموبايل</th>
                  <th class="px-6 py-4 text-right font-label-sm text-label-sm text-text-tertiary uppercase">الراتب</th>
                  <th class="px-6 py-4 text-right font-label-sm text-label-sm text-text-tertiary uppercase">الحالة</th>
                  <th class="px-6 py-4 text-right font-label-sm text-label-sm text-text-tertiary uppercase">إجراءات</th>
                </tr>
              </thead>
              <tbody id="hr-tbody">
                <tr><td colspan="8" class="px-6 py-8 text-center text-text-secondary"><div class="skeleton-shimmer h-4 rounded w-32 mx-auto"></div></td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>`
    this.load(c)
    c.querySelector('#new-employee-btn')?.addEventListener('click', () => {
      this.router.navigate('/hr/employees/new')
    })
    c.querySelector('#departments-btn')?.addEventListener('click', () => {
      this.router.navigate('/departments')
    })

    // Select all
    c.querySelector('#select-all')?.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement
      const checkboxes = c.querySelectorAll('.emp-checkbox')
      checkboxes.forEach((cb: any) => {
        cb.checked = target.checked
        const id = cb.getAttribute('data-id')!
        if (target.checked) this.selectedIds.add(id)
        else this.selectedIds.delete(id)
      })
      this.updateSelectionUI(c)
    })

    // Bulk delete
    c.querySelector('#bulk-delete-btn')?.addEventListener('click', async () => {
      if (this.selectedIds.size === 0) return
      if (!confirm(`هل أنت متأكد من حذف ${this.selectedIds.size} موظف؟`)) return
      try {
        const res: any = await this.api.post('/api/employees/bulk-delete', { ids: Array.from(this.selectedIds) })
        alert(res.message || `تم حذف ${res.deleted || 0} موظف`)
        this.selectedIds.clear()
        this.load(c)
      } catch (err: any) {
        alert(err.message || 'فشل الحذف')
      }
    })

    return layout.render(c)
  }
  private selectedIds: Set<string> = new Set()

  private async load(el: HTMLElement) {
    try {
      // Load departments first to map IDs to names
      let deptMap: Record<string, string> = {}
      try {
        const deptRes: any = await this.api.get('/api/departments')
        const depts = deptRes.data?.data || deptRes.data || []
        depts.forEach((d: any) => { deptMap[d.id] = d.nameAr || d.name || 'غير مسمى' })
      } catch { /* ignore */ }

      const res = await this.api.get<any>('/api/employees')
      const tbody = el.querySelector('#hr-tbody')!
      if (res.success && res.data) {
        const items = Array.isArray(res.data) ? res.data : res.data.data || []
        if (items.length === 0) { tbody.innerHTML = '<tr><td colspan="8" class="px-6 py-8 text-center text-text-secondary font-body-md">لا يوجد موظفين</td></tr>'; return }
        tbody.innerHTML = items.map((e: any) => {
          const deptName = e.departmentId ? (deptMap[e.departmentId] || e.departmentId?.slice(0, 8) + '...') : '-'
          const isInactive = e.status !== 'ACTIVE'
          return `
          <tr class="border-b border-outline-variant/10 hover:bg-surface-container-low/50 transition-colors ${isInactive ? 'opacity-50' : ''}">
            <td class="px-4 py-4 align-middle">
              <input type="checkbox" class="emp-checkbox w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary" data-id="${e.id}">
            </td>
            <td class="px-6 py-4 align-middle">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-secondary-fixed text-secondary flex items-center justify-center shrink-0">
                  <span class="material-symbols-outlined text-[16px]">person</span>
                </div>
                <span class="font-body-md text-on-surface truncate">${e.fullNameAr || e.fullName || e.name || '-'}</span>
              </div>
            </td>
            <td class="px-6 py-4 align-middle whitespace-nowrap">${this.roleBadge(e.role || e.position || 'MECHANIC')}</td>
            <td class="px-6 py-4 align-middle font-body-md text-text-secondary whitespace-nowrap">${deptName}</td>
            <td class="px-6 py-4 align-middle font-body-md text-on-surface whitespace-nowrap text-right" dir="ltr">${e.phone || '-'}</td>
            <td class="px-6 py-4 align-middle font-body-md text-on-surface whitespace-nowrap">${this.fmt(e.salarySYP || e.salary || 0)} ل.س</td>
            <td class="px-6 py-4 align-middle whitespace-nowrap">${this.statusBadge(e.status || 'ACTIVE')}</td>
            <td class="px-6 py-4 align-middle">
              <div class="flex items-center gap-2">
                <button class="edit-btn w-8 h-8 rounded-lg hover:bg-surface-container flex items-center justify-center text-text-tertiary hover:text-info transition-colors" title="تعديل" data-id="${e.id}">
                  <span class="material-symbols-outlined text-[18px]">edit</span>
                </button>
                <button class="delete-btn w-8 h-8 rounded-lg hover:bg-error/10 flex items-center justify-center text-text-tertiary hover:text-error transition-colors" title="حذف" data-id="${e.id}">
                  <span class="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
            </td>
          </tr>
        `}).join('')

        // Checkbox events
        tbody.querySelectorAll('.emp-checkbox').forEach((cb: any) => {
          cb.addEventListener('change', () => {
            const id = cb.getAttribute('data-id')!
            if (cb.checked) this.selectedIds.add(id)
            else this.selectedIds.delete(id)
            this.updateSelectionUI(el)
          })
        })

        // Edit buttons
        tbody.querySelectorAll('.edit-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id')
            if (id) this.router.navigate(`/hr/employees/${id}`)
          })
        })

        // Delete single
        tbody.querySelectorAll('.delete-btn').forEach(btn => {
          btn.addEventListener('click', async () => {
            const id = btn.getAttribute('data-id')!
            if (!confirm('هل أنت متأكد من حذف هذا الموظف؟')) return
            try {
              await this.api.delete(`/api/employees/${id}`)
              this.load(el)
            } catch (err: any) {
              alert(err.message || 'فشل الحذف')
            }
          })
        })
      }
    } catch { el.querySelector('#hr-tbody')!.innerHTML = '<tr><td colspan="8" class="px-6 py-8 text-center text-error font-body-md">حدث خطأ</td></tr>' }
  }

  private updateSelectionUI(el: HTMLElement) {
    const btn = el.querySelector('#bulk-delete-btn') as HTMLElement
    const count = el.querySelector('#selected-count')
    if (btn && count) {
      const size = this.selectedIds.size
      count.textContent = String(size)
      if (size > 0) btn.classList.remove('hidden')
      else btn.classList.add('hidden')
    }
  }
  private roleBadge(role: string): string {
    const map: Record<string,{label:string;cls:string}> = {
      OWNER: {label:'صاحب المرآب', cls:'bg-warning/10 text-warning'},
      MANAGER: {label:'مدير', cls:'bg-secondary/10 text-secondary'},
      ACCOUNTANT: {label:'محاسب', cls:'bg-primary/10 text-primary'},
      RECEPTIONIST: {label:'موظف استقبال', cls:'bg-info/10 text-info'},
      MECHANIC: {label:'ميكانيكي', cls:'bg-tertiary/10 text-tertiary'},
      HR_MANAGER: {label:'مدير موارد بشرية', cls:'bg-secondary/10 text-secondary'},
      SALES: {label:'مبيعات', cls:'bg-tertiary/10 text-tertiary'},
      CASHIER: {label:'أمين صندوق', cls:'bg-primary/10 text-primary'},
    }
    const m = map[role] || {label:role, cls:'bg-surface-container-high text-text-secondary'}
    return `<span class="inline-flex items-center px-3 py-1 rounded-full font-label-sm text-label-sm ${m.cls}">${m.label}</span>`
  }
  private statusBadge(s: string): string {
    const m = s==='ACTIVE' ? {label:'نشط', cls:'bg-tertiary/10 text-tertiary'} : {label:'غير نشط', cls:'bg-surface-container-high text-text-secondary'}
    return `<span class="inline-flex items-center px-3 py-1 rounded-full font-label-sm text-label-sm ${m.cls}">${m.label}</span>`
  }
  private fmt(n: number) { return new Intl.NumberFormat('ar-SA',{minimumFractionDigits:2}).format(n) }
}
