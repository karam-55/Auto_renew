import { AuthService } from '../services/auth'
import { ApiClient } from '../api/client'
import { Router } from '../router'
import { AppLayout } from '../components/layout'

export class SystemSetupScreen {
  private addedUsers: any[] = []

  constructor(private auth: AuthService, private api: ApiClient, private router: Router) {}

  render(): HTMLElement {
    const layout = new AppLayout(this.auth, this.router, 'إعدادات النظام الأولية', 'settings', this.api)
    const c = document.createElement('div')
    c.className = 'page-enter min-h-screen bg-background p-gutter'
    c.innerHTML = `
      <div class="max-w-3xl mx-auto space-y-stack-lg">
        <div>
          <h1 class="font-beVietnamPro text-headline-md text-on-surface">إعدادات النظام الأولية</h1>
          <p class="text-body-md text-text-secondary mt-1">خطوات إعداد النظام للاستخدام الأول</p>
        </div>
        <div class="space-y-4" id="setup-cards">
          <!-- Card 1: Garage Info -->
          <div class="bg-surface-container-lowest rounded-xl shadow-md border border-surface-subtle overflow-hidden" data-card="garage">
            <div class="p-6 border-b border-outline-variant/10 bg-surface-subtle flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-tertiary/10 text-tertiary flex items-center justify-center font-bold text-sm">1</div>
                <h3 class="font-headline-md text-lg text-on-surface font-semibold">معلومات المرآب</h3>
              </div>
              <span class="badge-status bg-surface-container-high text-text-secondary px-3 py-1 rounded-full font-label-sm text-sm">قيد الانتظار</span>
            </div>
            <div class="p-6 space-y-4">
              <div>
                <label class="block font-label-sm text-label-sm text-text-tertiary mb-2">اسم المرآب *</label>
                <input id="setup-garage-name" class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-ibmPlexSans font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow" placeholder="اسم المرآب" />
              </div>
              <div>
                <label class="block font-label-sm text-label-sm text-text-tertiary mb-2">العنوان</label>
                <input id="setup-address" class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-ibmPlexSans font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow" placeholder="العنوان" />
              </div>
            </div>
          </div>

          <!-- Card 2: Currency -->
          <div class="bg-surface-container-lowest rounded-xl shadow-md border border-surface-subtle overflow-hidden" data-card="currency">
            <div class="p-6 border-b border-outline-variant/10 bg-surface-subtle flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">2</div>
                <h3 class="font-headline-md text-lg text-on-surface font-semibold">إعدادات العملة</h3>
              </div>
              <span class="badge-status bg-surface-container-high text-text-secondary px-3 py-1 rounded-full font-label-sm text-sm">قيد الانتظار</span>
            </div>
            <div class="p-6 space-y-4">
              <div>
                <label class="block font-label-sm text-label-sm text-text-tertiary mb-2">العملة الأساسية</label>
                <select id="setup-currency" class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg pr-4 pl-10 font-ibmPlexSans font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow appearance-none" style="background-image: url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2716%27 height=%2716%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%23475569%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Cpath d=%27M6 9l6 6 6-6%27/%3E%3C/svg%3E'); background-repeat: no-repeat; background-position: left 0.75rem center; background-size: 1rem;">
                  <option value="SYP">ليرة سورية (SYP)</option>
                  <option value="USD">دولار أمريكي (USD)</option>
                  <option value="EUR">يورو (EUR)</option>
                  <option value="AED">درهم إماراتي (AED)</option>
                  <option value="SAR">ريال سعودي (SAR)</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Card 3: Users -->
          <div class="bg-surface-container-lowest rounded-xl shadow-md border border-surface-subtle overflow-hidden" data-card="users">
            <div class="p-6 border-b border-outline-variant/10 bg-surface-subtle flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-surface-container-high text-text-secondary flex items-center justify-center font-bold text-sm">3</div>
                <h3 class="font-headline-md text-lg text-on-surface font-semibold">المستخدمون</h3>
              </div>
              <span class="badge-status bg-surface-container-high text-text-secondary px-3 py-1 rounded-full font-label-sm text-sm">قيد الانتظار</span>
            </div>
            <div class="p-6 space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label class="block font-label-sm text-label-sm text-text-tertiary mb-2">الاسم الكامل</label>
                  <input id="user-fullName" class="w-full h-[40px] bg-surface-subtle border border-border rounded-lg px-4 font-ibmPlexSans font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow" placeholder="اسم المستخدم" />
                </div>
                <div>
                  <label class="block font-label-sm text-label-sm text-text-tertiary mb-2">رقم الموبايل</label>
                  <input id="user-phone" class="w-full h-[40px] bg-surface-subtle border border-border rounded-lg px-4 font-ibmPlexSans font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow" placeholder="09..." dir="ltr" />
                </div>
                <div class="flex gap-2 items-end">
                  <div class="flex-1">
                    <label class="block font-label-sm text-label-sm text-text-tertiary mb-2">الدور</label>
                    <select id="user-role" class="w-full h-[40px] bg-surface-subtle border border-border rounded-lg pr-4 pl-10 font-ibmPlexSans font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow appearance-none" style="background-image: url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2716%27 height=%2716%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%23475569%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Cpath d=%27M6 9l6 6 6-6%27/%3E%3C/svg%3E'); background-repeat: no-repeat; background-position: left 0.75rem center; background-size: 1rem;">
                      <option value="ADMIN">مدير</option>
                      <option value="MANAGER">مسؤول</option>
                      <option value="RECEPTIONIST">استقبال</option>
                      <option value="MECHANIC">ميكانيكي</option>
                    </select>
                  </div>
                  <button class="h-[40px] px-3 bg-primary text-on-primary font-ibmPlexSans font-body-md rounded-lg shadow-sm hover:shadow-md transition-all flex items-center gap-1" id="add-user-btn">
                    <span class="material-symbols-outlined text-[18px]">add</span>
                  </button>
                </div>
              </div>
              <div id="users-list" class="space-y-2 hidden">
                <p class="font-label-sm text-label-sm text-text-tertiary">المستخدمون المضافون:</p>
                <div id="users-list-content" class="space-y-2"></div>
              </div>
            </div>
          </div>
        </div>
        <div class="flex justify-end gap-4">
          <button class="h-[48px] px-6 bg-surface-subtle text-on-surface font-ibmPlexSans font-body-lg rounded-lg border border-border hover:bg-surface-container-low transition-colors" id="setup-skip">
            تخطي
          </button>
          <button class="h-[48px] px-6 bg-primary text-on-primary font-ibmPlexSans font-body-lg rounded-lg shadow-sm hover:shadow-lg transition-all" id="setup-save">
            حفظ ومتابعة
          </button>
        </div>
      </div>
    `

    this.loadSettings(c)
    this.attachListeners(c)
    this.updateBadges(c)

    return layout.render(c)
  }

  private async loadSettings(c: HTMLElement) {
    try {
      const res = await this.api.get<any>('/api/settings')
      if (res.success && res.data) {
        const s = res.data
        const nameInput = c.querySelector('#setup-garage-name') as HTMLInputElement
        const addrInput = c.querySelector('#setup-address') as HTMLInputElement
        const currSelect = c.querySelector('#setup-currency') as HTMLSelectElement
        if (nameInput && s.companyName) nameInput.value = s.companyName
        if (addrInput && s.address) addrInput.value = s.address
        if (currSelect && s.currency) currSelect.value = s.currency
        this.updateBadges(c)
      }
    } catch {
      // ignore
    }
  }

  private attachListeners(c: HTMLElement) {
    c.querySelector('#setup-skip')?.addEventListener('click', () => {
      this.router.navigate('/dashboard')
    })

    c.querySelector('#setup-save')?.addEventListener('click', () => {
      this.saveSettings(c)
    })

    c.querySelector('#add-user-btn')?.addEventListener('click', () => {
      this.addUser(c)
    })

    const inputs = ['setup-garage-name', 'setup-address', 'setup-currency']
    inputs.forEach(id => {
      c.querySelector(`#${id}`)?.addEventListener('input', () => this.updateBadges(c))
    })
  }

  private updateBadges(c: HTMLElement) {
    const name = (c.querySelector('#setup-garage-name') as HTMLInputElement)?.value?.trim() || ''
    const curr = (c.querySelector('#setup-currency') as HTMLSelectElement)?.value || ''

    // Garage badge
    const garageCard = c.querySelector('[data-card="garage"]')
    const garageBadge = garageCard?.querySelector('.badge-status') as HTMLElement
    if (garageBadge) {
      if (name) {
        garageBadge.textContent = 'مكتمل'
        garageBadge.className = 'badge-status bg-tertiary/10 text-tertiary px-3 py-1 rounded-full font-label-sm text-sm'
      } else {
        garageBadge.textContent = 'قيد الانتظار'
        garageBadge.className = 'badge-status bg-surface-container-high text-text-secondary px-3 py-1 rounded-full font-label-sm text-sm'
      }
    }

    // Currency badge
    const currCard = c.querySelector('[data-card="currency"]')
    const currBadge = currCard?.querySelector('.badge-status') as HTMLElement
    if (currBadge) {
      if (curr) {
        currBadge.textContent = 'مكتمل'
        currBadge.className = 'badge-status bg-tertiary/10 text-tertiary px-3 py-1 rounded-full font-label-sm text-sm'
      } else {
        currBadge.textContent = 'قيد الانتظار'
        currBadge.className = 'badge-status bg-surface-container-high text-text-secondary px-3 py-1 rounded-full font-label-sm text-sm'
      }
    }

    // Users badge
    const usersCard = c.querySelector('[data-card="users"]')
    const usersBadge = usersCard?.querySelector('.badge-status') as HTMLElement
    if (usersBadge) {
      if (this.addedUsers.length > 0) {
        usersBadge.textContent = `${this.addedUsers.length} مستخدم`
        usersBadge.className = 'badge-status bg-tertiary/10 text-tertiary px-3 py-1 rounded-full font-label-sm text-sm'
      } else {
        usersBadge.textContent = 'قيد الانتظار'
        usersBadge.className = 'badge-status bg-surface-container-high text-text-secondary px-3 py-1 rounded-full font-label-sm text-sm'
      }
    }
  }

  private addUser(c: HTMLElement) {
    const fullName = (c.querySelector('#user-fullName') as HTMLInputElement)?.value?.trim() || ''
    const phone = (c.querySelector('#user-phone') as HTMLInputElement)?.value?.trim() || ''
    const role = (c.querySelector('#user-role') as HTMLSelectElement)?.value || 'RECEPTIONIST'

    if (!fullName) { alert('يرجى إدخال اسم المستخدم'); return }
    if (!phone) { alert('يرجى إدخال رقم الموبايل'); return }

    const user = { fullName, phone, role, username: phone, password: phone }
    this.addedUsers.push(user)

    // Clear inputs
    const nameInput = c.querySelector('#user-fullName') as HTMLInputElement
    const phoneInput = c.querySelector('#user-phone') as HTMLInputElement
    if (nameInput) nameInput.value = ''
    if (phoneInput) phoneInput.value = ''

    this.refreshUsersList(c)
    this.updateBadges(c)
  }

  private refreshUsersList(c: HTMLElement) {
    const list = c.querySelector('#users-list') as HTMLElement
    const content = c.querySelector('#users-list-content')!
    if (this.addedUsers.length === 0) {
      list.classList.add('hidden')
      return
    }
    list.classList.remove('hidden')
    content.innerHTML = this.addedUsers.map((u, idx) => `
      <div class="flex items-center justify-between bg-surface-subtle rounded-lg p-3 border border-border">
        <div>
          <p class="font-body-md text-on-surface">${u.fullName}</p>
          <p class="text-sm text-text-secondary">${u.phone} — ${this.roleLabel(u.role)}</p>
        </div>
        <button class="w-8 h-8 rounded-lg hover:bg-error/10 text-error flex items-center justify-center transition-colors" data-remove="${idx}">
          <span class="material-symbols-outlined text-[18px]">delete</span>
        </button>
      </div>
    `).join('')

    content.querySelectorAll('[data-remove]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-remove')!)
        this.addedUsers.splice(idx, 1)
        this.refreshUsersList(c)
        this.updateBadges(c)
      })
    })
  }

  private roleLabel(role: string): string {
    const map: Record<string, string> = {
      ADMIN: 'مدير', MANAGER: 'مسؤول', RECEPTIONIST: 'استقبال', MECHANIC: 'ميكانيكي'
    }
    return map[role] || role
  }

  private async saveSettings(c: HTMLElement) {
    const name = (c.querySelector('#setup-garage-name') as HTMLInputElement)?.value?.trim() || ''
    const address = (c.querySelector('#setup-address') as HTMLInputElement)?.value?.trim() || ''
    const currency = (c.querySelector('#setup-currency') as HTMLSelectElement)?.value || ''

    if (!name) { alert('يرجى إدخال اسم المرآب'); return }

    const btn = c.querySelector('#setup-save') as HTMLButtonElement
    if (btn) {
      btn.disabled = true
      btn.innerHTML = `<span class="material-symbols-outlined text-[20px] animate-spin">sync</span> جاري الحفظ...`
    }

    // 1. Save company settings
    try {
      const settingsRes = await this.api.put<any>('/api/settings', {
        companyName: name,
        address: address || undefined,
        currency: currency || 'SYP',
      })
      if (!settingsRes.success) {
        alert(settingsRes.message || 'فشل حفظ الإعدادات')
        if (btn) { btn.disabled = false; btn.innerHTML = 'حفظ ومتابعة' }
        return
      }
    } catch (err: any) {
      alert('حدث خطأ أثناء حفظ الإعدادات: ' + (err.message || 'فشل الاتصال'))
      if (btn) { btn.disabled = false; btn.innerHTML = 'حفظ ومتابعة' }
      return
    }

    // 2. Create users
    let usersCreated = 0
    for (const user of this.addedUsers) {
      try {
        const userRes = await this.api.post<any>('/api/users', user)
        if (userRes.success || (userRes.data && userRes.data.user)) usersCreated++
      } catch {
        // ignore individual user errors
      }
    }

    if (btn) { btn.disabled = false; btn.innerHTML = 'حفظ ومتابعة' }

    const msg = usersCreated > 0
      ? `تم حفظ الإعدادات وإنشاء ${usersCreated} مستخدم بنجاح`
      : 'تم حفظ الإعدادات بنجاح'
    alert(msg)
    this.router.navigate('/dashboard')
  }
}
