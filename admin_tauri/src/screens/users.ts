import { AuthService } from '../services/auth'
import { ApiClient } from '../api/client'
import { Router } from '../router'
import { AppLayout } from '../components/layout'
import { isPhone } from '../utils/validation'

export class UsersScreen {
  private auth: AuthService
  private api: ApiClient
  private router: Router

  constructor(auth: AuthService, api: ApiClient, router: Router) {
    this.auth = auth
    this.api = api
    this.router = router
  }

  render(): HTMLElement {
    const layout = new AppLayout(this.auth, this.router, 'المستخدمين', 'settings', this.api)
    const content = document.createElement('div')
    content.className = 'page-enter min-h-screen bg-background p-gutter'
    content.innerHTML = `
      <div class="max-w-7xl mx-auto space-y-stack-lg">
        <!-- Header -->
        <div class="flex items-center justify-between">
          <div>
            <h1 class="font-headline-lg text-on-surface font-bold">المستخدمين</h1>
            <p class="text-text-secondary text-sm mt-1">إدارة المستخدمين والأدوار والأذونات</p>
          </div>
          <button class="bg-primary text-on-primary px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow-sm hover:shadow-md transition-all" id="btn-new-user">
            <span class="material-symbols-outlined text-[18px]">person_add</span>
            مستخدم جديد
          </button>
        </div>

        <!-- KPI Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4" id="users-kpi-cards">
          <div class="bg-surface-container-lowest p-card-padding rounded-xl shadow-sm border border-surface-subtle">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <span class="material-symbols-outlined">group</span>
              </div>
              <div>
                <p class="text-text-tertiary text-xs">إجمالي المستخدمين</p>
                <p class="font-headline-md text-on-surface font-bold" id="kpi-total-users">-</p>
              </div>
            </div>
          </div>
          <div class="bg-surface-container-lowest p-card-padding rounded-xl shadow-sm border border-surface-subtle">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-tertiary/10 flex items-center justify-center text-tertiary">
                <span class="material-symbols-outlined">check_circle</span>
              </div>
              <div>
                <p class="text-text-tertiary text-xs">نشطون</p>
                <p class="font-headline-md text-on-surface font-bold" id="kpi-active-users">-</p>
              </div>
            </div>
          </div>
          <div class="bg-surface-container-lowest p-card-padding rounded-xl shadow-sm border border-surface-subtle">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center text-error">
                <span class="material-symbols-outlined">block</span>
              </div>
              <div>
                <p class="text-text-tertiary text-xs">غير نشطين</p>
                <p class="font-headline-md text-on-surface font-bold" id="kpi-inactive-users">-</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Table Card -->
        <div class="bg-surface-container-lowest rounded-xl shadow-md border border-surface-subtle overflow-hidden">
          <div class="p-4 border-b border-outline-variant/10 bg-surface-subtle flex justify-between items-center">
            <h3 class="font-headline-md text-on-surface font-semibold">قائمة المستخدمين</h3>
            <div class="flex items-center gap-2">
              <input type="text" placeholder="بحث..." class="bg-surface-container-high border border-outline-variant/20 rounded-lg px-3 py-1.5 text-sm text-on-surface placeholder:text-text-tertiary outline-none focus:border-primary" id="users-search" />
              <select id="users-role-filter" class="bg-surface-container-high border border-outline-variant/20 rounded-lg px-3 py-1.5 text-sm text-on-surface outline-none focus:border-primary">
                <option value="">كل الأدوار</option>
                <option value="OWNER">مالك</option>
                <option value="MANAGER">مدير</option>
                <option value="RECEPTIONIST">استقبال</option>
                <option value="MECHANIC">ميكانيكي</option>
              </select>
            </div>
          </div>
          <div class="overflow-x-auto" id="users-table-container">
            <table class="w-full text-sm" id="users-table">
              <thead class="bg-surface-subtle text-text-tertiary">
                <tr>
                  <th class="text-right px-4 py-3 font-medium" scope="col">المستخدم</th>
                  <th class="text-right px-4 py-3 font-medium" scope="col">الدور</th>
                  <th class="text-right px-4 py-3 font-medium" scope="col">الحالة</th>
                  <th class="text-right px-4 py-3 font-medium" scope="col">تاريخ الإنشاء</th>
                  <th class="text-right px-4 py-3 font-medium" scope="col">إجراءات</th>
                </tr>
              </thead>
              <tbody id="users-table-body">
                <tr><td colspan="5"><div class="p-6 space-y-3"><div class="skeleton-shimmer h-10 rounded"></div><div class="skeleton-shimmer h-10 rounded"></div><div class="skeleton-shimmer h-10 rounded"></div></div></td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `

    this.loadUsers(content)

    content.querySelector('#btn-new-user')?.addEventListener('click', () => {
      this.showUserModal(content)
    })

    content.querySelector('#users-search')?.addEventListener('input', (e) => {
      const term = (e.target as HTMLInputElement).value.toLowerCase()
      this.filterUsers(content, term, (content.querySelector('#users-role-filter') as HTMLSelectElement)?.value || '')
    })

    content.querySelector('#users-role-filter')?.addEventListener('change', (e) => {
      const role = (e.target as HTMLSelectElement).value
      this.filterUsers(content, (content.querySelector('#users-search') as HTMLInputElement)?.value.toLowerCase() || '', role)
    })
    // Event delegation for user actions (performance fix)
    content.querySelector('#users-table-body')?.addEventListener('click', (e) => {
      const btn = (e.target as HTMLElement).closest('.edit-user-btn') as HTMLButtonElement | null
      if (btn) {
        const id = btn.getAttribute('data-id')
        const user = this.allUsers.find((u: any) => u.id === id)
        if (user) this.showEditUserModal(content, user)
      }
    })

    return layout.render(content)
  }

  private allUsers: any[] = []

  private async loadUsers(content: HTMLElement) {
    const tbody = content.querySelector('#users-table-body')
    if (!tbody) return

    try {
      const res = await this.api.get<any>('/api/users')
      let users: any[] = []
      if (res.success && res.data) {
        if (Array.isArray(res.data.data)) users = res.data.data
        else if (Array.isArray(res.data.users)) users = res.data.users
        else if (Array.isArray(res.data)) users = res.data
      }

      this.allUsers = users

      const total = users.length
      const active = users.filter((u: any) => u.isActive !== false).length
      const inactive = total - active

      const totalEl = content.querySelector('#kpi-total-users')
      const activeEl = content.querySelector('#kpi-active-users')
      const inactiveEl = content.querySelector('#kpi-inactive-users')
      if (totalEl) totalEl.textContent = total.toString()
      if (activeEl) activeEl.textContent = active.toString()
      if (inactiveEl) inactiveEl.textContent = inactive.toString()

      if (users.length === 0) {
        tbody.innerHTML = `
          <tr><td colspan="5">
            <div class="text-center py-12">
              <span class="material-symbols-outlined text-text-tertiary text-4xl mb-3">group_off</span>
              <p class="text-text-tertiary text-sm">لا يوجد مستخدمين</p>
            </div>
          </td></tr>
        `
        return
      }

      this.renderUsersTable(content, users)

    } catch (e) {
      console.error('Failed to load users:', e)
      tbody.innerHTML = `
        <tr><td colspan="5">
          <div class="text-center py-12 bg-error/5 rounded-xl">
            <span class="material-symbols-outlined text-error text-4xl mb-3">error</span>
            <p class="text-error text-sm font-medium">فشل تحميل المستخدمين</p>
            <button class="mt-3 text-primary text-sm font-medium retry-users-btn">إعادة المحاولة</button>
          </div>
        </td></tr>
      `
      tbody.querySelector('.retry-users-btn')?.addEventListener('click', () => this.loadUsers(content))
    }
  }

  private renderUsersTable(content: HTMLElement, users: any[]) {
    const tbody = content.querySelector('#users-table-body')
    if (!tbody) return

    const roleMap: Record<string, { label: string; color: string }> = {
      OWNER: { label: 'مالك', color: 'error' },
      MANAGER: { label: 'مدير', color: 'primary' },
      RECEPTIONIST: { label: 'استقبال', color: 'secondary' },
      MECHANIC: { label: 'ميكانيكي', color: 'tertiary' },
      ACCOUNTANT: { label: 'محاسب', color: 'info' },
      HR_MANAGER: { label: 'موارد بشرية', color: 'warning' },
    }

    const fragment = document.createDocumentFragment()
    users.forEach((u: any) => {
      const r = roleMap[u.role] || { label: u.role, color: 'text-tertiary' }
      const statusClass = u.isActive !== false ? 'bg-tertiary/10 text-tertiary' : 'bg-error/10 text-error'
      const statusLabel = u.isActive !== false ? 'نشط' : 'غير نشط'
      const date = u.createdAt ? new Date(u.createdAt).toLocaleDateString('ar-SY') : '-'
      const name = u.fullName || u.username || '-'
      const tr = document.createElement('tr')
      tr.className = 'border-b border-outline-variant/5 hover:bg-surface-subtle/50 transition-colors'
      tr.innerHTML = `
          <td class="px-4 py-3">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                ${name.charAt(0)}
              </div>
              <div>
                <p class="font-medium text-on-surface">${name}</p>
                <p class="text-text-tertiary text-xs">${u.phone || u.username || ''}</p>
              </div>
            </div>
          </td>
          <td class="px-4 py-3"><span class="${r.color} bg-${r.color}/10 px-2 py-0.5 rounded-full text-xs font-medium">${r.label}</span></td>
          <td class="px-4 py-3"><span class="${statusClass} px-2 py-0.5 rounded-full text-xs font-medium">${statusLabel}</span></td>
          <td class="px-4 py-3 text-text-tertiary">${date}</td>
          <td class="px-4 py-3">
            <button class="text-text-tertiary hover:text-primary transition-colors edit-user-btn" data-id="${u.id}">
              <span class="material-symbols-outlined text-[18px]">edit</span>
            </button>
          </td>
      `
      fragment.appendChild(tr)
    })
    tbody.innerHTML = ''
    tbody.appendChild(fragment)
  }

  private filterUsers(content: HTMLElement, term: string, role: string) {
    let filtered = this.allUsers
    if (term) {
      filtered = filtered.filter((u: any) => {
        const name = (u.fullName || u.username || '').toLowerCase()
        const phone = (u.phone || '').toLowerCase()
        return name.includes(term) || phone.includes(term)
      })
    }
    if (role) {
      filtered = filtered.filter((u: any) => u.role === role)
    }
    this.renderUsersTable(content, filtered)
  }

  private showUserModal(content: HTMLElement, user?: any) {
    document.querySelectorAll('.user-modal-overlay').forEach(el => el.remove())
    const isEdit = !!user
    const overlay = document.createElement('div')
    overlay.className = 'user-modal-overlay fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm'
    overlay.innerHTML = `
      <div class="bg-surface-container-lowest rounded-xl shadow-2xl border border-surface-subtle w-full max-w-md mx-4 p-6 space-y-4 animate-in scale-in">
        <div class="flex items-center justify-between">
          <h2 class="font-headline-md text-on-surface font-bold">${isEdit ? 'تعديل مستخدم' : 'مستخدم جديد'}</h2>
          <button class="text-text-tertiary hover:text-error transition-colors" id="modal-close"><span class="material-symbols-outlined">close</span></button>
        </div>
        <div class="space-y-3">
          <div>
            <label class="block font-label-sm text-text-tertiary mb-1">الاسم الكامل *</label>
            <input id="user-fullname" class="w-full h-10 bg-surface-subtle border border-outline-variant/20 rounded-lg px-3 text-sm text-on-surface outline-none focus:border-primary" value="${isEdit ? (user.fullName || '') : ''}" required />
          </div>
          <div>
            <label class="block font-label-sm text-text-tertiary mb-1">اسم المستخدم *</label>
            <input id="user-username" class="w-full h-10 bg-surface-subtle border border-outline-variant/20 rounded-lg px-3 text-sm text-on-surface outline-none focus:border-primary" value="${isEdit ? (user.username || '') : ''}" ${isEdit ? 'readonly' : ''} required />
          </div>
          <div>
            <label class="block font-label-sm text-text-tertiary mb-1">رقم الهاتف *</label>
            <input id="modal-phone" class="w-full h-10 bg-surface-subtle border border-outline-variant/20 rounded-lg px-3 text-sm text-on-surface outline-none focus:border-primary" value="${isEdit ? (user.phone || '') : ''}" required type="tel" pattern="^09[0-9]{8}$" title="يجب أن يبدأ بـ 09 ويتبعه 8 أرقام" />
          </div>
          <div>
            <label class="block font-label-sm text-text-tertiary mb-1">الدور</label>
            <select id="modal-role" class="w-full h-10 bg-surface-subtle border border-outline-variant/20 rounded-lg px-3 text-sm text-on-surface outline-none focus:border-primary">
              <option value="OWNER" ${isEdit && user.role === 'OWNER' ? 'selected' : ''}>مالك</option>
              <option value="MANAGER" ${isEdit && user.role === 'MANAGER' ? 'selected' : ''}>مدير</option>
              <option value="RECEPTIONIST" ${isEdit && user.role === 'RECEPTIONIST' ? 'selected' : ''}>استقبال</option>
              <option value="MECHANIC" ${isEdit && user.role === 'MECHANIC' ? 'selected' : ''}>ميكانيكي</option>
              <option value="ACCOUNTANT" ${isEdit && user.role === 'ACCOUNTANT' ? 'selected' : ''}>محاسب</option>
              <option value="HR_MANAGER" ${isEdit && user.role === 'HR_MANAGER' ? 'selected' : ''}>موارد بشرية</option>
            </select>
          </div>
          ${!isEdit ? `<div>
            <label class="block font-label-sm text-text-tertiary mb-1">كلمة المرور *</label>
            <input id="modal-password" type="password" class="w-full h-10 bg-surface-subtle border border-outline-variant/20 rounded-lg px-3 text-sm text-on-surface outline-none focus:border-primary" placeholder="******" required minlength="6" />
          </div>` : ''}
          <div class="flex items-center gap-2">
            <input type="checkbox" id="modal-active" class="w-4 h-4" ${!isEdit || user.isActive !== false ? 'checked' : ''} />
            <label for="modal-active" class="text-sm text-on-surface">نشط</label>
          </div>
        </div>
        <div class="flex justify-end gap-3 pt-2">
          <button class="px-4 py-2 bg-surface-subtle text-on-surface rounded-lg text-sm font-medium border border-border" id="modal-cancel">إلغاء</button>
          <button class="px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-medium" id="save-user-btn">حفظ</button>
        </div>
      </div>
    `
    document.body.appendChild(overlay)

    const close = () => overlay.remove()
    overlay.querySelector('#modal-close')?.addEventListener('click', close)
    overlay.querySelector('#modal-cancel')?.addEventListener('click', close)
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close() })
    overlay.querySelector('#save-user-btn')?.addEventListener('click', async () => {
      const fullName = (overlay.querySelector('#user-fullname') as HTMLInputElement)?.value?.trim() || ''
      const username = (overlay.querySelector('#user-username') as HTMLInputElement)?.value?.trim() || ''
      const phone = (overlay.querySelector('#modal-phone') as HTMLInputElement)?.value?.trim() || ''
      const role = (overlay.querySelector('#modal-role') as HTMLSelectElement)?.value || 'OWNER'
      const password = (overlay.querySelector('#modal-password') as HTMLInputElement)?.value || ''
      const isActive = (overlay.querySelector('#modal-active') as HTMLInputElement)?.checked ?? true

      if (!fullName) { ;(window as any).toast?.show?.({ message: 'الاسم الكامل مطلوب', type: 'warning' }); return }
      if (!username) { ;(window as any).toast?.show?.({ message: 'اسم المستخدم مطلوب', type: 'warning' }); return }
      if (!isPhone(phone)) { ;(window as any).toast?.show?.({ message: 'رقم الهاتف يجب أن يبدأ بـ 09 ويتبعه 8 أرقام', type: 'warning' }); return }
      if (!isEdit && password.length < 6) { ;(window as any).toast?.show?.({ message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل', type: 'warning' }); return }

      const btn = overlay.querySelector('#save-user-btn') as HTMLButtonElement
      if (btn) { btn.disabled = true; btn.innerHTML = 'جاري الحفظ...' }

      try {
        const payload: any = { fullName, username, phone, role, isActive }
        if (!isEdit && password) payload.password = password
        else if (isEdit) {
          delete payload.username
        }

        let res: any
        if (isEdit) {
          res = await this.api.put<any>(`/api/users/${user.id}`, payload)
        } else {
          res = await this.api.post<any>('/api/users', payload)
        }
        if (res.success) {
          close()
          await this.loadUsers(content)
        } else {
          ;(window as any).toast?.show?.({ message: res.message || 'فشل الحفظ', type: 'error' })
          if (btn) { btn.disabled = false; btn.innerHTML = 'حفظ' }
        }
      } catch (err: any) {
        ;(window as any).toast?.show?.({ message: 'حدث خطأ: ' + (err.message || 'فشل الاتصال'), type: 'error' })
        if (btn) { btn.disabled = false; btn.innerHTML = 'حفظ' }
      }
    })
  }

  private showEditUserModal(content: HTMLElement, user: any) {
    this.showUserModal(content, user)
  }
}
