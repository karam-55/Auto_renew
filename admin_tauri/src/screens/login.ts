import { AuthService } from '../services/auth'
import { ApiClient } from '../api/client'
import { Router } from '../router'

export class LoginScreen {
  private auth: AuthService
  private api: ApiClient
  private router: Router

  constructor(auth: AuthService, api: ApiClient, router: Router) {
    this.auth = auth
    this.api = api
    this.router = router
  }

  render(): HTMLElement {
    const el = document.createElement('div')
    el.className = 'min-h-screen flex items-center justify-center text-on-surface relative overflow-hidden bg-orbs'
    el.innerHTML = `
      <div class="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div class="absolute top-[-10%] right-[-5%] w-[40vw] h-[40vw] rounded-full bg-primary/10 blur-[120px] animate-pulse-slow"></div>
        <div class="absolute bottom-[-10%] left-[-5%] w-[30vw] h-[30vw] rounded-full bg-secondary/10 blur-[100px] animate-pulse-slow" style="animation-delay:1s"></div>
      </div>
      <main class="w-full max-w-md p-gutter z-10 relative page-enter" id="login-main">
        <div class="glass-card rounded-2xl shadow-2xl border border-glass-border p-card-padding">
          <div class="text-center mb-stack-lg">
            <div class="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary-container/10 text-primary mb-stack-sm hover-lift-8" style="box-shadow:0 8px 24px rgba(0,74,198,0.25)">
              <span class="material-symbols-outlined text-[40px]">garage</span>
            </div>
            <h1 class="font-beVietnamPro font-headline-lg text-headline-lg text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary tracking-tight mb-2">Auto renew</h1>
            <p class="font-body-md text-on-surface-variant" id="login-subtitle">جاري التحميل...</p>
          </div>
          <div id="login-form-container"></div>
        </div>
      </main>
      <div class="fixed top-gutter right-gutter glass-card border border-error/20 text-error px-4 py-3 rounded-xl shadow-lg hidden z-50 flex items-center gap-2" id="login-error">
        <span class="material-symbols-outlined">error</span>
        <span id="error-text">خطأ</span>
      </div>
    `

    const container = el.querySelector('#login-form-container')!
    const subtitle = el.querySelector('#login-subtitle') as HTMLElement
    const errorBox = el.querySelector('#login-error') as HTMLDivElement
    const errorText = el.querySelector('#error-text') as HTMLSpanElement

    // Check if system needs initial setup
    this.checkNeedsInit().then((result) => {
      if (result.needsInit) {
        // Clear any stale session data when system is not initialized
        localStorage.clear()
        this.auth.logout()
        subtitle.textContent = 'إعداد النظام لأول مرة'
        this.renderInitForm(container, errorBox, errorText)
      } else {
        subtitle.textContent = 'بوابة إدارة العمليات المتقدمة'
        this.renderLoginForm(container, errorBox, errorText)
      }
      if (result.error) {
        errorText.textContent = result.error
        errorBox.classList.remove('hidden')
      }
    })

    return el
  }

  private async checkNeedsInit(): Promise<{ needsInit: boolean; error?: string }> {
    try {
      const res = await this.api.get<any>('/api/setup-wizard/needs-init')
      if (!res.success) {
        return { needsInit: true, error: `API error: ${res.message}` }
      }
      return { needsInit: res.data?.needsInit === true }
    } catch (e: any) {
      return { needsInit: true, error: `Network error: ${e.message || 'Cannot connect'}` }
    }
  }

  private renderInitForm(container: Element, errorBox: HTMLElement, errorText: HTMLElement) {
    container.innerHTML = `
      <form class="space-y-stack-md" id="init-form">
        <div class="bg-primary-container/10 border border-primary/20 rounded-xl p-4 mb-4">
          <div class="flex items-start gap-2">
            <span class="material-symbols-outlined text-primary">info</span>
            <p class="text-body-sm text-on-surface">هذا التطبيق يحتاج إعداد أولي. أدخل المعلومات الأساسية لإنشاء النظام.</p>
          </div>
        </div>
        <div>
          <label class="block font-label-sm text-on-surface-variant mb-2">اسم الشركة / المرآب <span class="text-error">*</span></label>
          <input id="init-company" class="w-full h-12 bg-white/50 border border-glass-border rounded-xl px-4 font-body-md text-on-surface input-glow transition-all" placeholder="مثال: مرآب السرعة" required />
        </div>
        <div>
          <label class="block font-label-sm text-on-surface-variant mb-2">اسم الفرع الرئيسي <span class="text-error">*</span></label>
          <input id="init-branch" class="w-full h-12 bg-white/50 border border-glass-border rounded-xl px-4 font-body-md text-on-surface input-glow transition-all" placeholder="مثال: الفرع الرئيسي" value="الفرع الرئيسي" required />
        </div>
        <div>
          <label class="block font-label-sm text-on-surface-variant mb-2">الاسم الكامل للمسؤول <span class="text-error">*</span></label>
          <input id="init-fullname" class="w-full h-12 bg-white/50 border border-glass-border rounded-xl px-4 font-body-md text-on-surface input-glow transition-all" placeholder="الاسم الكامل" required />
        </div>
        <div>
          <label class="block font-label-sm text-on-surface-variant mb-2">اسم المستخدم <span class="text-error">*</span></label>
          <input id="init-username" class="w-full h-12 bg-white/50 border border-glass-border rounded-xl px-4 font-body-md text-on-surface input-glow transition-all" placeholder="owner" value="owner" required dir="ltr" />
        </div>
        <div>
          <label class="block font-label-sm text-on-surface-variant mb-2">كلمة المرور <span class="text-error">*</span></label>
          <input id="init-password" type="password" class="w-full h-12 bg-white/50 border border-glass-border rounded-xl px-4 font-body-md text-on-surface input-glow transition-all" placeholder="6 أحرف على الأقل" required />
        </div>
        <button class="w-full h-12 btn-secondary-gradient text-white font-body-lg rounded-xl shadow-lg shadow-secondary/25 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2" id="init-btn" type="submit">
          <span class="btn-text">بدء الإعداد</span>
          <span class="btn-spinner hidden">
            <span class="material-symbols-outlined spin">progress_activity</span>
          </span>
        </button>
      </form>
    `

    const form = container.querySelector('#init-form') as HTMLFormElement
    const btn = container.querySelector('#init-btn') as HTMLButtonElement
    const btnText = container.querySelector('.btn-text') as HTMLSpanElement
    const btnSpinner = container.querySelector('.btn-spinner') as HTMLSpanElement

    form.addEventListener('submit', async (e) => {
      e.preventDefault()
      errorBox.classList.add('hidden')
      btn.disabled = true
      btnText.classList.add('hidden')
      btnSpinner.classList.remove('hidden')

      const company = (container.querySelector('#init-company') as HTMLInputElement).value.trim()
      const branch = (container.querySelector('#init-branch') as HTMLInputElement).value.trim()
      const fullName = (container.querySelector('#init-fullname') as HTMLInputElement).value.trim()
      const username = (container.querySelector('#init-username') as HTMLInputElement).value.trim()
      const password = (container.querySelector('#init-password') as HTMLInputElement).value

      try {
        const res = await this.api.post<any>('/api/setup-wizard/init', {
          tenantName: company,
          tenantNameAr: company,
          branchName: branch,
          branchNameAr: branch,
          adminFullName: fullName,
          adminUsername: username,
          adminPassword: password,
        })

        if (!res.success) {
          throw new Error(res.message || 'فشل الإعداد')
        }

        // Store tokens and redirect to wizard
        const { tokens, user } = res.data
        localStorage.setItem('token', tokens.accessToken)
        localStorage.setItem('accessToken', tokens.accessToken)
        localStorage.setItem('refreshToken', tokens.refreshToken)
        localStorage.setItem('tenantId', user.tenantId)
        localStorage.setItem('user', JSON.stringify({
          id: user.id,
          tenantId: user.tenantId,
          username: user.username,
          role: user.role,
          fullName: user.fullName,
        }))

        // Full page reload with new hash — auth service will load token on init
        // Using replace() to avoid leaking referrer in history
        window.location.replace(window.location.origin + window.location.pathname + '#admin/setup')
      } catch (err: any) {
        errorText.textContent = err.message || 'حدث خطأ أثناء الإعداد'
        errorBox.classList.remove('hidden')
      } finally {
        btn.disabled = false
        btnText.classList.remove('hidden')
        btnSpinner.classList.add('hidden')
      }
    })
  }

  private renderLoginForm(container: Element, errorBox: HTMLElement, errorText: HTMLElement) {
    container.innerHTML = `
      <form class="space-y-stack-md" id="login-form">
        <div class="space-y-stack-sm">
          <label class="font-label-sm text-on-surface-variant block" for="branch">الفرع / المنشأة</label>
          <div class="relative">
            <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">storefront</span>
            <select class="w-full h-12 bg-white/50 border border-glass-border rounded-xl pl-10 pr-4 font-body-md text-on-surface input-glow transition-all appearance-none cursor-pointer" id="branch" disabled>
              <option value="">اختر الفرع</option>
            </select>
          </div>
        </div>
        <div class="space-y-stack-sm">
          <label class="font-label-sm text-on-surface-variant block" for="username">اسم المستخدم</label>
          <div class="relative">
            <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">person</span>
            <input class="w-full h-12 bg-white/50 border border-glass-border rounded-xl pl-10 pr-4 font-body-md text-on-surface placeholder:text-on-surface-variant input-glow transition-all" id="username" placeholder="أدخل اسم المستخدم" required type="text"/>
          </div>
        </div>
        <div class="space-y-stack-sm">
          <div class="flex justify-between items-center">
            <label class="font-label-sm text-on-surface-variant" for="password">كلمة المرور</label>
            <button type="button" class="font-label-sm text-primary hover:text-secondary transition-colors bg-transparent border-0 cursor-pointer" id="forgot-password-btn">نسيت كلمة المرور؟</button>
          </div>
          <div class="relative">
            <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant cursor-pointer hover:text-on-surface transition-colors" id="toggle-password">visibility_off</span>
            <input class="w-full h-12 bg-white/50 border border-glass-border rounded-xl pl-10 pr-4 font-body-md text-on-surface placeholder:text-on-surface-variant input-glow transition-all" id="password" placeholder="••••••••" required type="password"/>
          </div>
        </div>
        <div class="pt-stack-sm space-y-stack-md">
          <div class="flex items-center gap-2">
            <input class="w-4 h-4 text-primary bg-white/50 border-glass-border rounded focus:ring-primary focus:ring-offset-0" id="remember" type="checkbox"/>
            <label class="font-body-md text-on-surface-variant cursor-pointer" for="remember">تذكرني على هذا الجهاز</label>
          </div>
          <button class="w-full h-12 btn-primary-gradient text-white font-body-lg rounded-xl shadow-lg shadow-primary/25 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2" id="login-btn" type="submit">
            <span class="btn-text">تسجيل الدخول</span>
            <span class="btn-spinner hidden">
              <span class="material-symbols-outlined spin">progress_activity</span>
            </span>
            <span class="material-symbols-outlined text-[20px] rtl:rotate-180">arrow_forward</span>
          </button>
        </div>
      </form>
      <div class="mt-stack-lg pt-stack-md border-t border-glass-border text-center">
        <p class="font-label-sm text-on-surface-variant">تواجه مشكلة في الدخول؟ <button type="button" class="text-primary hover:underline bg-transparent border-0 cursor-pointer" id="support-btn">تواصل مع الدعم الفني</button></p>
      </div>
    `

    const form = container.querySelector('#login-form') as HTMLFormElement
    const username = container.querySelector('#username') as HTMLInputElement
    const password = container.querySelector('#password') as HTMLInputElement
    const toggleBtn = container.querySelector('#toggle-password') as HTMLButtonElement
    const loginBtn = container.querySelector('#login-btn') as HTMLButtonElement
    const btnText = container.querySelector('.btn-text') as HTMLSpanElement
    const btnSpinner = container.querySelector('.btn-spinner') as HTMLSpanElement
    const branchSelect = container.querySelector('#branch') as HTMLSelectElement
    let isLoggedIn = false

    toggleBtn.addEventListener('click', () => {
      const type = password.type === 'password' ? 'text' : 'password'
      password.type = type
      toggleBtn.textContent = type === 'password' ? 'visibility_off' : 'visibility'
    })

    container.querySelector('#forgot-password-btn')?.addEventListener('click', () => {
      ;(window as any).toast?.show?.({ message: 'يرجى التواصل مع مدير النظام لإعادة تعيين كلمة المرور', type: 'info', duration: 4000 })
    })

    container.querySelector('#support-btn')?.addEventListener('click', () => {
      ;(window as any).toast?.show?.({ message: 'الدعم الفني: +963900000000', type: 'info', duration: 4000 })
    })

    form.addEventListener('submit', async (e) => {
      e.preventDefault()

      if (isLoggedIn) {
        const selectedBranch = branchSelect.value
        if (!selectedBranch) {
          errorText.textContent = 'الرجاء اختيار فرع'
          errorBox.classList.remove('hidden')
          return
        }
        this.api.setBranchId(selectedBranch)
        localStorage.setItem('branchId', selectedBranch)
        this.router.navigate('/')
        return
      }

      // Validation
      const unameVal = username.value.trim()
      const passVal = password.value
      if (unameVal.length < 3) {
        errorText.textContent = 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل'
        errorBox.classList.remove('hidden')
        loginBtn.disabled = false
        return
      }
      if (passVal.length < 6) {
        errorText.textContent = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'
        errorBox.classList.remove('hidden')
        loginBtn.disabled = false
        return
      }

      errorBox.classList.add('hidden')
      loginBtn.disabled = true
      btnText.classList.add('hidden')
      btnSpinner.classList.remove('hidden')

      const result = await this.auth.login({
        username: username.value,
        password: password.value,
      })

      loginBtn.disabled = false
      btnText.classList.remove('hidden')
      btnSpinner.classList.add('hidden')

      if (!result.success) {
        errorText.textContent = result.message || 'اسم المستخدم أو كلمة المرور غير صحيحة'
        errorBox.classList.remove('hidden')
        return
      }

      // Check setup wizard status
      let setupCompleted = true
      try {
        const setupRes = await this.api.get<any>('/api/setup-wizard/status')
        if (setupRes.data && setupRes.data.setupCompleted === false) {
          setupCompleted = false
        }
      } catch { /* ignore */ }

      if (!setupCompleted) {
        this.router.navigate('/admin/setup')
        return
      }

      // Try cached branches first (5-min TTL)
      let branches: any[] = []
      try {
        const cached = localStorage.getItem('branches_cache')
        if (cached) {
          const parsed = JSON.parse(cached)
          if (parsed.expiry > Date.now()) branches = parsed.data
        }
      } catch { /* ignore */ }

      if (!branches.length) {
        const branchesRes = await this.api.get<any>('/api/branches')
        branches = branchesRes.data?.branches || branchesRes.data || []
        try {
          localStorage.setItem('branches_cache', JSON.stringify({ data: branches, expiry: Date.now() + 5 * 60 * 1000 }))
        } catch { /* ignore */ }
      }

      if (!Array.isArray(branches) || branches.length === 0) {
        errorText.textContent = 'لا توجد فروع متاحة'
        errorBox.classList.remove('hidden')
        return
      }

      branchSelect.innerHTML = `<option value="">اختر الفرع</option>` +
        branches.map((b: any) => `<option value="${b.id}">${b.name}</option>`).join('')
      branchSelect.disabled = false

      if (branches.length === 1) {
        const branchId = branches[0].id
        this.api.setBranchId(branchId)
        localStorage.setItem('branchId', branchId)
        this.router.navigate('/')
        return
      }

      isLoggedIn = true
      errorText.textContent = 'اختر الفرع ثم اضغط دخول'
      errorBox.classList.remove('hidden')
      errorBox.className = errorBox.className.replace('bg-error-container text-on-error-container', 'bg-primary-container text-on-primary-container')
      btnText.textContent = 'دخول'
      username.disabled = true
      password.disabled = true
    })
  }
}
