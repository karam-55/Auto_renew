import { AuthService } from '../services/auth'
import { ApiClient } from '../api/client'
import { Router } from '../router'
import { AppLayout } from '../components/layout'

export class RolesScreen {
  private auth: AuthService
  private api: ApiClient
  private router: Router

  constructor(auth: AuthService, api: ApiClient, router: Router) {
    this.auth = auth
    this.api = api
    this.router = router
  }

  render(): HTMLElement {
    const layout = new AppLayout(this.auth, this.router, 'الصلاحيات', 'settings', this.api)
    const content = document.createElement('div')
    content.className = 'page-enter min-h-screen bg-background p-gutter'
    content.innerHTML = `
      <div class="max-w-7xl mx-auto space-y-stack-lg">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="font-headline-lg text-on-surface font-bold">الصلاحيات</h1>
            <p class="text-text-secondary text-sm mt-1">إدارة الأدوار والأذونات (RBAC)</p>
          </div>
          <button class="bg-primary text-on-primary px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow-sm hover:shadow-md transition-all" id="btn-new-role">
            <span class="material-symbols-outlined text-[18px]">add</span>
            دور جديد
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6" id="roles-list">
          <div class="md:col-span-2 p-6 space-y-4">
            <div class="skeleton-shimmer h-24 rounded-xl"></div>
            <div class="skeleton-shimmer h-24 rounded-xl"></div>
            <div class="skeleton-shimmer h-24 rounded-xl"></div>
          </div>
        </div>
      </div>
    `

    content.querySelector('#btn-new-role')?.addEventListener('click', () => {
      this.showCreateRoleModal(content)
    })
    this.loadRoles(content)
    return layout.render(content)
  }

  private async loadRoles(content: HTMLElement) {
    const container = content.querySelector('#roles-list')
    if (!container) return

    // Show skeleton immediately
    container.innerHTML = Array(3).fill(`
      <div class="bg-surface-container-lowest p-card-padding rounded-xl shadow-sm border border-surface-subtle">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-10 h-10 rounded-full skeleton-shimmer"></div>
          <div class="flex-1">
            <div class="skeleton-shimmer h-5 rounded w-32 mb-2"></div>
            <div class="skeleton-shimmer h-4 rounded w-48"></div>
          </div>
        </div>
        <div class="flex gap-2 flex-wrap">
          <span class="skeleton-shimmer h-6 rounded w-20"></span>
          <span class="skeleton-shimmer h-6 rounded w-24"></span>
          <span class="skeleton-shimmer h-6 rounded w-16"></span>
        </div>
      </div>
    `).join('')

    try {
      const [rolesRes] = await Promise.all([
        this.api.get<any>('/api/roles'),
        this.api.get<any>('/api/permissions'),
      ])

      let roles: any[] = []
      if (rolesRes.success && rolesRes.data) {
        if (Array.isArray(rolesRes.data.data)) roles = rolesRes.data.data
        else if (Array.isArray(rolesRes.data.roles)) roles = rolesRes.data.roles
        else if (Array.isArray(rolesRes.data)) roles = rolesRes.data
      }

      if (roles.length === 0) {
        container.innerHTML = `
          <div class="md:col-span-2 text-center py-12 bg-surface-container-lowest rounded-xl border border-outline-variant/10">
            <span class="material-symbols-outlined text-text-tertiary text-4xl mb-3">shield</span>
            <p class="text-text-tertiary text-sm">لا توجد أدوار محددة</p>
          </div>
        `
        return
      }

      container.innerHTML = roles.map((r: any) => {
        const rolePerms = r.permissions || []
        const permNames = rolePerms.map((p: any) => {
          if (typeof p === 'string') return p
          if (p.permission && p.permission.key) return p.permission.key
          if (p.permission && p.permission.name) return p.permission.name
          if (p.key) return p.key
          if (p.name) return p.name
          return ''
        }).filter(Boolean)
        const permTags = permNames.slice(0, 5).map((p: string) => {
          const clean = p.replace(/_/g, ' ').toLowerCase()
          return `<span class="bg-surface-container px-2 py-0.5 rounded text-xs text-text-tertiary">${clean}</span>`
        }).join(' ')
        const more = permNames.length > 5 ? `<span class="text-text-tertiary text-xs">+${permNames.length - 5} أذونات</span>` : ''
        const color = r.color || 'primary'
        const userCount = r._count?.employees || r.userCount || 0
        return `
          <div class="bg-surface-container-lowest p-card-padding rounded-xl shadow-sm border border-surface-subtle">
            <div class="flex items-center gap-3 mb-3">
              <div class="w-10 h-10 rounded-full bg-${color}/10 flex items-center justify-center text-${color}">
                <span class="material-symbols-outlined">shield</span>
              </div>
              <div>
                <h3 class="font-headline-md text-on-surface font-semibold">${r.name || '-'}</h3>
                <p class="text-text-tertiary text-xs">${r.description || ''}</p>
              </div>
            </div>
            <div class="flex flex-wrap gap-1 mt-2">
              ${permTags} ${more}
            </div>
            <div class="mt-3 pt-3 border-t border-outline-variant/10 flex justify-between items-center">
              <span class="text-text-tertiary text-xs">${userCount} مستخدم</span>
              <button class="text-primary text-sm font-medium hover:underline edit-role-btn" data-id="${r.id}">تعديل</button>
            </div>
          </div>
        `
      }).join('')

      container.querySelectorAll('.edit-role-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id')
          const role = roles.find((r: any) => r.id === id)
          if (role) this.showRoleModal(content, role)
        })
      })

    } catch (e) {
      console.error('Failed to load roles:', e)
      container.innerHTML = `
        <div class="md:col-span-2 text-center py-12 bg-error/5 rounded-xl border border-error/20">
          <span class="material-symbols-outlined text-error text-4xl mb-3">error</span>
          <p class="text-error text-sm font-medium">فشل تحميل الأدوار</p>
          <button class="mt-3 text-primary text-sm font-medium retry-roles-btn">إعادة المحاولة</button>
        </div>
      `
      container.querySelector('.retry-roles-btn')?.addEventListener('click', () => this.loadRoles(content))
    }
  }

  private showRoleModal(content: HTMLElement, role: any) {
    const overlay = document.createElement('div')
    overlay.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm'
    overlay.setAttribute('role', 'dialog')
    overlay.setAttribute('aria-modal', 'true')
    overlay.innerHTML = `
      <div class="bg-surface-container-lowest rounded-xl shadow-2xl border border-surface-subtle w-full max-w-md mx-4 p-6 space-y-4 animate-in scale-in">
        <div class="flex items-center justify-between">
          <h2 class="font-headline-md text-on-surface font-bold">تعديل الدور: ${role.name || ''}</h2>
          <button class="touch-safe w-8 h-8 rounded-full flex items-center justify-center text-text-tertiary hover:text-error transition-colors" id="modal-close" aria-label="إغلاق نافذة تعديل الدور"><span class="material-symbols-outlined" aria-hidden="true">close</span></button>
        </div>
        <div class="space-y-3">
          <div>
            <label class="block font-label-sm text-text-tertiary mb-1">الاسم</label>
            <input id="modal-name" class="w-full h-10 bg-surface-subtle border border-outline-variant/20 rounded-lg px-3 text-sm text-on-surface outline-none focus:border-primary" value="${role.name || ''}" readonly />
          </div>
          <div>
            <label class="block font-label-sm text-text-tertiary mb-1">الوصف</label>
            <input id="modal-desc" class="w-full h-10 bg-surface-subtle border border-outline-variant/20 rounded-lg px-3 text-sm text-on-surface outline-none focus:border-primary" value="${role.description || ''}" />
          </div>
          <div>
            <label class="block font-label-sm text-text-tertiary mb-1">الأذونات (مفصولة بفاصلة)</label>
            <textarea id="modal-perms" rows="3" class="w-full bg-surface-subtle border border-outline-variant/20 rounded-lg px-3 py-2 text-sm text-on-surface outline-none focus:border-primary">${(role.permissions || []).map((p: any) => typeof p === 'string' ? p : (p.permission?.key || p.key || '')).filter(Boolean).join(', ')}</textarea>
          </div>
        </div>
        <div class="flex justify-end gap-3 pt-2">
          <button class="px-4 py-2 bg-surface-subtle text-on-surface rounded-lg text-sm font-medium border border-border" id="modal-cancel">إلغاء</button>
          <button class="px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-medium" id="modal-save">حفظ</button>
        </div>
      </div>
    `
    document.body.appendChild(overlay)

    const close = () => overlay.remove()
    overlay.querySelector('#modal-close')?.addEventListener('click', close)
    overlay.querySelector('#modal-cancel')?.addEventListener('click', close)
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close() })
    overlay.querySelector('#modal-save')?.addEventListener('click', async () => {
      const description = (overlay.querySelector('#modal-desc') as HTMLInputElement)?.value?.trim() || ''
      const permsRaw = (overlay.querySelector('#modal-perms') as HTMLTextAreaElement)?.value || ''
      const permissionIds = permsRaw.split(',').map(p => p.trim()).filter(Boolean)

      const btn = overlay.querySelector('#modal-save') as HTMLButtonElement
      if (btn) { btn.disabled = true; btn.innerHTML = 'جاري الحفظ...' }

      try {
        const res = await this.api.put<any>(`/api/roles/${role.id}`, { description, permissionIds })
        if (res.success) {
          close()
          await this.loadRoles(content)
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

  private showCreateRoleModal(content: HTMLElement) {
    document.querySelectorAll('.role-modal-overlay').forEach(el => el.remove())
    const overlay = document.createElement('div')
    overlay.className = 'role-modal-overlay fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm'
    overlay.setAttribute('role', 'dialog')
    overlay.setAttribute('aria-modal', 'true')
    overlay.innerHTML = `
      <div class="bg-surface-container-lowest rounded-xl shadow-2xl border border-surface-subtle w-full max-w-md mx-4 p-6 space-y-4 animate-in scale-in">
        <div class="flex items-center justify-between">
          <h2 class="font-headline-md text-on-surface font-bold">دور جديد</h2>
          <button class="touch-safe w-8 h-8 rounded-full flex items-center justify-center text-text-tertiary hover:text-error transition-colors" id="modal-close" aria-label="إغلاق نافذة دور جديد"><span class="material-symbols-outlined" aria-hidden="true">close</span></button>
        </div>
        <div class="space-y-3">
          <div>
            <label class="block font-label-sm text-text-tertiary mb-1">الاسم *</label>
            <input id="role-name" class="w-full h-10 bg-surface-subtle border border-outline-variant/20 rounded-lg px-3 text-sm text-on-surface outline-none focus:border-primary" placeholder="مثال: SUPERVISOR" required />
          </div>
          <div>
            <label class="block font-label-sm text-text-tertiary mb-1">الوصف</label>
            <input id="modal-desc" class="w-full h-10 bg-surface-subtle border border-outline-variant/20 rounded-lg px-3 text-sm text-on-surface outline-none focus:border-primary" placeholder="وصف الدور" />
          </div>
        </div>
        <div class="flex justify-end gap-3 pt-2">
          <button class="px-4 py-2 bg-surface-subtle text-on-surface rounded-lg text-sm font-medium border border-border" id="modal-cancel">إلغاء</button>
          <button class="px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-medium" id="save-role-btn">إنشاء</button>
        </div>
      </div>
    `
    document.body.appendChild(overlay)

    const close = () => overlay.remove()
    overlay.querySelector('#modal-close')?.addEventListener('click', close)
    overlay.querySelector('#modal-cancel')?.addEventListener('click', close)
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close() })
    overlay.querySelector('#save-role-btn')?.addEventListener('click', async () => {
      const name = (overlay.querySelector('#role-name') as HTMLInputElement)?.value?.trim() || ''
      const description = (overlay.querySelector('#modal-desc') as HTMLInputElement)?.value?.trim() || ''

      if (!name) { ;(window as any).toast?.show?.({ message: 'اسم الدور مطلوب', type: 'warning' }); return }

      const btn = overlay.querySelector('#save-role-btn') as HTMLButtonElement
      if (btn) { btn.disabled = true; btn.innerHTML = 'جاري الحفظ...' }

      try {
        const res = await this.api.post<any>('/api/roles', { name, description })
        if (res.success) {
          close()
          await this.loadRoles(content)
        } else {
          ;(window as any).toast?.show?.({ message: res.message || 'فشل الإنشاء', type: 'error' })
          if (btn) { btn.disabled = false; btn.innerHTML = 'إنشاء' }
        }
      } catch (err: any) {
        ;(window as any).toast?.show?.({ message: 'حدث خطأ: ' + (err.message || 'فشل الاتصال'), type: 'error' })
        if (btn) { btn.disabled = false; btn.innerHTML = 'إنشاء' }
      }
    })
  }
}
