import { AuthService } from '../services/auth'
import { ApiClient } from '../api/client'
import { Router } from '../router'
import { AppLayout } from '../components/layout'

export class AdminScreen {
  constructor(private auth: AuthService, private api: ApiClient, private router: Router) {}
  render(): HTMLElement {
    const layout = new AppLayout(this.auth, this.router, 'الإدارة', 'settings', this.api)
    const c = document.createElement('div')
    c.className = 'page-enter min-h-screen bg-background p-gutter'
    c.innerHTML = `
      <div class="max-w-7xl mx-auto space-y-stack-lg">
        <div>
          <h1 class="font-beVietnamPro text-headline-md text-on-surface">الإدارة والأمان</h1>
          <p class="text-body-md text-text-secondary mt-1">إدارة المستخدمين والصلاحيات والإعدادات</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div class="bg-surface-container-lowest p-card-padding rounded-xl shadow-md hover:shadow-lg border border-surface-subtle hover:-translate-y-1 transition-all duration-300 cursor-pointer group" data-route="/admin/users">
            <div class="w-12 h-12 rounded-xl bg-primary/5 text-primary flex items-center justify-center mb-4 transition-colors group-hover:bg-primary/10">
              <span class="material-symbols-outlined text-[24px]" style="font-variation-settings: 'FILL' 1;">manage_accounts</span>
            </div>
            <h3 class="font-headline-md text-lg text-on-surface font-semibold mb-2 group-hover:text-primary transition-colors">المستخدمين</h3>
            <p class="text-text-secondary font-body-md text-sm">إدارة المستخدمين والأدوار</p>
          </div>
          <div class="bg-surface-container-lowest p-card-padding rounded-xl shadow-md hover:shadow-lg border border-surface-subtle hover:-translate-y-1 transition-all duration-300 cursor-pointer group" data-route="/admin/roles">
            <div class="w-12 h-12 rounded-xl bg-secondary/5 text-secondary flex items-center justify-center mb-4 transition-colors group-hover:bg-secondary/10">
              <span class="material-symbols-outlined text-[24px]" style="font-variation-settings: 'FILL' 1;">shield</span>
            </div>
            <h3 class="font-headline-md text-lg text-on-surface font-semibold mb-2 group-hover:text-primary transition-colors">الصلاحيات</h3>
            <p class="text-text-secondary font-body-md text-sm">إدارة RBAC والأذونات</p>
          </div>
          <div class="bg-surface-container-lowest p-card-padding rounded-xl shadow-md hover:shadow-lg border border-surface-subtle hover:-translate-y-1 transition-all duration-300 cursor-pointer group" data-route="/admin/audit">
            <div class="w-12 h-12 rounded-xl bg-tertiary/5 text-tertiary flex items-center justify-center mb-4 transition-colors group-hover:bg-tertiary/10">
              <span class="material-symbols-outlined text-[24px]" style="font-variation-settings: 'FILL' 1;">history</span>
            </div>
            <h3 class="font-headline-md text-lg text-on-surface font-semibold mb-2 group-hover:text-primary transition-colors">سجل التدقيق</h3>
            <p class="text-text-secondary font-body-md text-sm">سجل العمليات والتغييرات</p>
          </div>
          <div class="bg-surface-container-lowest p-card-padding rounded-xl shadow-md hover:shadow-lg border border-surface-subtle hover:-translate-y-1 transition-all duration-300 cursor-pointer group" data-route="/admin/settings">
            <div class="w-12 h-12 rounded-xl bg-info/5 text-info flex items-center justify-center mb-4 transition-colors group-hover:bg-info/10">
              <span class="material-symbols-outlined text-[24px]" style="font-variation-settings: 'FILL' 1;">settings</span>
            </div>
            <h3 class="font-headline-md text-lg text-on-surface font-semibold mb-2 group-hover:text-primary transition-colors">الإعدادات</h3>
            <p class="text-text-secondary font-body-md text-sm">إعدادات النظام العامة</p>
          </div>
        </div>
      </div>
    `
    this.loadAdminStats(c)

    c.querySelectorAll('[data-route]').forEach(el => {
      el.addEventListener('click', () => {
        const route = el.getAttribute('data-route')
        if (route) this.router.navigate(route)
      })
    })
    return layout.render(c)
  }

  private async loadAdminStats(c: HTMLElement) {
    try {
      const [usersRes, rolesRes, auditRes] = await Promise.all([
        this.api.get<any>('/api/users'),
        this.api.get<any>('/api/roles'),
        this.api.get<any>('/api/audit?limit=1'),
      ])

      let userCount = 0
      if (usersRes.success && usersRes.data) {
        const arr = Array.isArray(usersRes.data.data) ? usersRes.data.data
          : Array.isArray(usersRes.data.users) ? usersRes.data.users
          : Array.isArray(usersRes.data) ? usersRes.data : []
        userCount = arr.length
      }

      let roleCount = 0
      if (rolesRes.success && rolesRes.data) {
        const arr = Array.isArray(rolesRes.data.data) ? rolesRes.data.data
          : Array.isArray(rolesRes.data.roles) ? rolesRes.data.roles
          : Array.isArray(rolesRes.data) ? rolesRes.data : []
        roleCount = arr.length
      }

      let auditCount = 0
      if (auditRes.success && auditRes.data) {
        auditCount = auditRes.data.total || auditRes.data.meta?.total || 0
      }

      // Update subtitle counts
      const usersCard = c.querySelector('[data-route="/admin/users"] p')
      if (usersCard) usersCard.textContent = `${userCount} مستخدم · إدارة المستخدمين والأدوار`

      const rolesCard = c.querySelector('[data-route="/admin/roles"] p')
      if (rolesCard) rolesCard.textContent = `${roleCount} دور · إدارة RBAC والأذونات`

      const auditCard = c.querySelector('[data-route="/admin/audit"] p')
      if (auditCard) auditCard.textContent = `${auditCount} حدث · سجل العمليات والتغييرات`

    } catch (e) {
      // Silently fail
    }
  }
}
