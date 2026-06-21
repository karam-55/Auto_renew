import { AuthService } from '../services/auth'
import { ApiClient } from '../api/client'
import { Router } from '../router'
import { AppLayout } from '../components/layout'
import { isPhone } from '../utils/validation'

export class EmployeeFormScreen {
  constructor(private auth: AuthService, private api: ApiClient, private router: Router, private employeeId: string | null = null) {}

  render(): HTMLElement {
    const isEdit = this.employeeId !== null
    const layout = new AppLayout(this.auth, this.router, isEdit ? 'تعديل موظف' : 'موظف جديد', 'person', this.api)
    const c = document.createElement('div')
    c.className = 'page-enter min-h-screen bg-background p-gutter'
    c.innerHTML = `
      <div class="max-w-3xl mx-auto">
        <div class="bg-surface-container-lowest rounded-xl shadow-md border border-surface-subtle p-6 space-y-6">
          <h2 class="font-beVietnamPro text-headline-sm text-on-surface">${isEdit ? 'تعديل بيانات الموظف' : 'بيانات الموظف الجديد'}</h2>
          <form id="employee-form" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block font-label-sm text-label-sm text-text-secondary mb-1">الاسم الكامل</label>
                <input type="text" name="fullNameAr" required class="w-full h-[48px] bg-surface-container-high border border-outline-variant rounded-lg px-4 text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" placeholder="أحمد محمد">
              </div>
              <div>
                <label class="block font-label-sm text-label-sm text-text-secondary mb-1">كود الموظف</label>
                <input type="text" name="employeeCode" required class="w-full h-[48px] bg-surface-container-high border border-outline-variant rounded-lg px-4 text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" placeholder="EMP-001">
              </div>
              <div>
                <label class="block font-label-sm text-label-sm text-text-secondary mb-1">المنصب الوظيفي</label>
                <input type="text" name="position" required class="w-full h-[48px] bg-surface-container-high border border-outline-variant rounded-lg px-4 text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" placeholder="ميكانيكي متقدم">
              </div>
              <div>
                <label class="block font-label-sm text-label-sm text-text-secondary mb-1">رقم الهاتف *</label>
                <input type="tel" name="phone" required pattern="^09[0-9]{8}$" title="يجب أن يبدأ بـ 09 ويتبعه 8 أرقام" class="w-full h-[48px] bg-surface-container-high border border-outline-variant rounded-lg px-4 text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" dir="ltr" placeholder="09XXXXXXXX">
              </div>
              <div>
                <label class="block font-label-sm text-label-sm text-text-secondary mb-1">القسم <span id="dept-loading" class="text-text-tertiary text-body-xs hidden">جاري التحميل...</span></label>
                <select name="departmentId" id="dept-select" required class="w-full h-[48px] bg-surface-container-high border border-outline-variant rounded-lg pl-4 pr-10 text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%3E%3Cpath%20fill%3D%22%236B7280%22%20d%3D%22M7%2010l5%205%205-5z%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[length:20px] bg-[left_0.75rem_center]">
                  <option value="">اختر القسم</option>
                </select>
              </div>
              <div>
                <label class="block font-label-sm text-label-sm text-text-secondary mb-1">نوع العقد</label>
                <select name="contractType" required class="w-full h-[48px] bg-surface-container-high border border-outline-variant rounded-lg pl-4 pr-10 text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%3E%3Cpath%20fill%3D%22%236B7280%22%20d%3D%22M7%2010l5%205%205-5z%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[length:20px] bg-[left_0.75rem_center]">
                  <option value="FULL_TIME">دوام كامل</option>
                  <option value="PART_TIME">دوام جزئي</option>
                  <option value="CONTRACT">عقد</option>
                  <option value="TEMPORARY">مؤقت</option>
                </select>
              </div>
              <div>
                <label class="block font-label-sm text-label-sm text-text-secondary mb-1">الراتب الشهري (ل.س) *</label>
                <input type="number" name="salarySYP" id="salary-input" required min="0" step="1" class="w-full h-[48px] bg-surface-container-high border border-outline-variant rounded-lg px-4 text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" placeholder="500000">
              </div>
              <div>
                <label class="block font-label-sm text-label-sm text-text-secondary mb-1">سعر الساعة (ل.س) <span class="text-tertiary text-body-xs">(يُحسب تلقائياً)</span></label>
                <input type="number" name="hourlyRate" id="hourly-rate-input" class="w-full h-[48px] bg-surface-container-high border border-outline-variant rounded-lg px-4 text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" placeholder="5000">
              </div>
              <div>
                <label class="block font-label-sm text-label-sm text-text-secondary mb-1">تاريخ التعيين</label>
                <input type="date" name="hireDate" required class="w-full h-[48px] bg-surface-container-high border border-outline-variant rounded-lg px-4 text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all">
              </div>
              <div>
                <label class="block font-label-sm text-label-sm text-text-secondary mb-1">كلمة المرور</label>
                <input type="password" name="password" ${isEdit ? '' : 'required'} class="w-full h-[48px] bg-surface-container-high border border-outline-variant rounded-lg px-4 text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" placeholder="${isEdit ? 'اتركه فارغاً إذا لا تريد التغيير' : '******'}">
              </div>
              <div class="flex items-center gap-3 h-[48px] bg-surface-container-high border border-outline-variant rounded-lg px-4">
                <input type="checkbox" name="status" id="status-checkbox" value="ACTIVE" checked class="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary">
                <label for="status-checkbox" class="font-body-md text-on-surface cursor-pointer select-none">الموظف نشط</label>
              </div>
            </div>
            <div class="flex items-center gap-3 pt-4">
              <button type="submit" class="h-[48px] bg-primary text-on-primary font-ibmPlexSans font-body-lg text-body-lg rounded-lg shadow-sm hover:shadow-lg hover:-translate-y-[1px] transition-all duration-200 flex items-center justify-center gap-2 px-6">
                <span class="material-symbols-outlined text-[20px]">save</span>
                ${isEdit ? 'حفظ التعديلات' : 'إنشاء موظف'}
              </button>
              <button type="button" id="cancel-btn" class="h-[48px] bg-surface-container-high text-text-secondary font-ibmPlexSans font-body-lg text-body-lg rounded-lg border border-outline-variant hover:bg-surface-container transition-all duration-200 flex items-center justify-center gap-2 px-6">
                إلغاء
              </button>
            </div>
            <div id="form-error" class="hidden text-error text-body-sm bg-error/10 rounded-lg p-3"></div>
            <div id="form-success" class="hidden text-tertiary text-body-sm bg-tertiary/10 rounded-lg p-3"></div>
          </form>
        </div>
      </div>`

    this.loadDepartments(c)
    this.bindEvents(c)
    if (isEdit) this.loadEmployee(c)
    return layout.render(c)
  }

  private async loadDepartments(c: HTMLElement) {
    const loading = c.querySelector('#dept-loading') as HTMLElement
    const select = c.querySelector('#dept-select') as HTMLSelectElement
    if (loading) loading.classList.remove('hidden')
    try {
      const res: any = await this.api.get('/api/departments')
      if (res.success && res.data) {
        const depts = Array.isArray(res.data) ? res.data : (res.data.data || [])
        depts.forEach((d: any) => {
          const opt = document.createElement('option')
          opt.value = d.id
          opt.textContent = d.nameAr || d.name || 'غير مسمى'
          select?.appendChild(opt)
        })
      }
    } catch { /* ignore */ }
    if (loading) loading.classList.add('hidden')
  }

  private bindEvents(c: HTMLElement) {
    const form = c.querySelector('#employee-form') as HTMLFormElement
    const cancelBtn = c.querySelector('#cancel-btn')
    const errorDiv = c.querySelector('#form-error') as HTMLElement
    const successDiv = c.querySelector('#form-success') as HTMLElement

    cancelBtn?.addEventListener('click', () => this.router.navigate('/hr'))

    // Auto-calculate hourly rate when salary changes
    const salaryInput = c.querySelector('#salary-input') as HTMLInputElement
    const hourlyRateInput = c.querySelector('#hourly-rate-input') as HTMLInputElement
    let userEditedHourlyRate = false

    // Track if user manually edited the hourly rate
    hourlyRateInput?.addEventListener('input', () => {
      userEditedHourlyRate = true
    })

    salaryInput?.addEventListener('input', () => {
      const salary = Number(salaryInput.value)
      if (salary > 0 && !userEditedHourlyRate) {
        const autoRate = Math.round(salary / 160)
        if (hourlyRateInput) {
          hourlyRateInput.value = String(autoRate)
          // Visual feedback — highlight briefly
          hourlyRateInput.classList.add('border-tertiary', 'ring-1', 'ring-tertiary')
          setTimeout(() => hourlyRateInput.classList.remove('border-tertiary', 'ring-1', 'ring-tertiary'), 500)
        }
      }
    })

    form?.addEventListener('submit', async (e) => {
      e.preventDefault()
      errorDiv.classList.add('hidden')
      successDiv.classList.add('hidden')

      const fd = new FormData(form)
      const salarySYP = Number(fd.get('salarySYP'))
      const hourlyRateVal = fd.get('hourlyRate') ? Number(fd.get('hourlyRate')) : 0
      const phone = fd.get('phone') as string

      if (!isPhone(phone)) {
        errorDiv.textContent = 'رقم الهاتف يجب أن يبدأ بـ 09 ويتبعه 8 أرقام'
        errorDiv.classList.remove('hidden')
        return
      }
      if (salarySYP <= 0) {
        errorDiv.textContent = 'الراتب يجب أن يكون أكبر من صفر'
        errorDiv.classList.remove('hidden')
        return
      }
      const autoHourlyRate = salarySYP > 0 ? Math.round(salarySYP / 160) : 0
      const hireDate = fd.get('hireDate') as string

      const statusCheckbox = form.querySelector('#status-checkbox') as HTMLInputElement
      const fullNameVal = fd.get('fullNameAr') as string
      const positionVal = fd.get('position') as string
      const data: any = {
        fullNameAr: fullNameVal,
        employeeCode: fd.get('employeeCode'),
        position: positionVal,
        phone: fd.get('phone'),
        departmentId: fd.get('departmentId'),
        contractType: fd.get('contractType'),
        salarySYP: salarySYP,
        hourlyRate: hourlyRateVal > 0 ? hourlyRateVal : (autoHourlyRate > 0 ? autoHourlyRate : undefined),
        hireDate: hireDate ? new Date(hireDate).toISOString() : undefined,
        status: statusCheckbox?.checked ? 'ACTIVE' : 'TERMINATED',
      }

      const password = fd.get('password') as string
      if (password) data.password = password

      try {
        let res: any
        if (this.employeeId) {
          res = await this.api.put(`/api/employees/${this.employeeId}`, data)
        } else {
          res = await this.api.post('/api/employees', data)
        }

        if (res.success || res.employee) {
          successDiv.textContent = this.employeeId ? 'تم تحديث بيانات الموظف بنجاح' : 'تم إنشاء الموظف بنجاح'
          successDiv.classList.remove('hidden')
          setTimeout(() => this.router.navigate('/hr'), 1500)
        } else {
          errorDiv.textContent = res.error || res.message || 'حدث خطأ'
          errorDiv.classList.remove('hidden')
        }
      } catch (err: any) {
        errorDiv.textContent = err.message || 'حدث خطأ في الاتصال'
        errorDiv.classList.remove('hidden')
      }
    })
  }

  private async loadEmployee(c: HTMLElement) {
    if (!this.employeeId) return
    try {
      const res: any = await this.api.get(`/api/employees/${this.employeeId}`)
      if (res.success && res.data) {
        const e: any = res.data.employee || res.data
        const form = c.querySelector('#employee-form') as HTMLFormElement
        if (form) {
          const fn = form.querySelector('[name="fullNameAr"]') as HTMLInputElement; if (fn) fn.value = (e.fullNameAr ?? '') as string
          const ec = form.querySelector('[name="employeeCode"]') as HTMLInputElement; if (ec) ec.value = (e.employeeCode ?? '') as string
          const ps = form.querySelector('[name="position"]') as HTMLInputElement; if (ps) ps.value = (e.position ?? '') as string
          const ph = form.querySelector('[name="phone"]') as HTMLInputElement; if (ph) ph.value = (e.phone ?? '') as string
          const ds = form.querySelector('[name="departmentId"]') as HTMLSelectElement; if (ds) ds.value = (e.departmentId ?? '') as string
          const ct = form.querySelector('[name="contractType"]') as HTMLSelectElement; if (ct) ct.value = (e.contractType ?? 'FULL_TIME') as string
          const sy = form.querySelector('[name="salarySYP"]') as HTMLInputElement; if (sy) sy.value = String(e.salarySYP ?? '')
          const hr = form.querySelector('[name="hourlyRate"]') as HTMLInputElement; if (hr) hr.value = String(e.hourlyRate ?? '')
          const st = form.querySelector('#status-checkbox') as HTMLInputElement; if (st) st.checked = (e.status === 'ACTIVE')
          const hd = form.querySelector('[name="hireDate"]') as HTMLInputElement
          if (hd && e.hireDate) hd.value = String(e.hireDate).split('T')[0]
        }
      }
    } catch { /* ignore */ }
  }
}
