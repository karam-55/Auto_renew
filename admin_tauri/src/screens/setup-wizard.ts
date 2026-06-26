import { AuthService } from '../services/auth'
import { ApiClient } from '../api/client'
import { Router } from '../router'
import { SetupWizardService, Step1Data, Step2Data, Step3Data, Step4Data, Step5Data, Step6Data, Step6User } from '../services/setup-wizard.service'
import { isPhone } from '../utils/validation'
import {
  WIZARD_STEPS, step1Template, step2Template, step3Template,
  step4Template, step5Template, step6Template, step7Template,
} from './setup-wizard-steps'

export class SetupWizardScreen {
  private currentStep = 1
  private svc: SetupWizardService
  private stepData: Record<number, any> = {}
  private users: any[] = []

  constructor(_auth: AuthService, api: ApiClient, private router: Router) {
    this.svc = new SetupWizardService(api)
  }

  render(): HTMLElement {
    const el = document.createElement('div')
    el.className = 'min-h-screen bg-surface-subtle font-ibmPlexSans'
    el.innerHTML = this.buildLayout()
    this.loadStatus().then(() => this.renderStep(el))
    this.attachGlobalListeners(el)
    return el
  }

  private buildLayout(): string {
    return `
      <div class="flex h-screen overflow-hidden">
        <aside class="w-[280px] bg-surface border-l border-border flex flex-col shrink-0">
          <div class="p-6 border-b border-border">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <span class="material-symbols-outlined" aria-hidden="true">settings</span>
              </div>
              <div>
                <h2 class="font-headline-sm text-on-surface font-bold">إعدادات أولية</h2>
                <p class="text-body-sm text-text-tertiary">7 خطوات للإعداد</p>
              </div>
            </div>
          </div>
          <nav class="flex-1 overflow-y-auto p-4 space-y-1" id="wizard-steps"></nav>
          <div class="p-4 border-t border-border">
            <div class="bg-surface-subtle rounded-lg p-3">
              <div class="flex justify-between text-body-sm mb-1">
                <span class="text-text-secondary">التقدم</span>
                <span class="text-primary font-medium" id="progress-text">0%</span>
              </div>
              <div class="h-2 bg-border rounded-full overflow-hidden">
                <div id="progress-bar" class="h-full bg-primary rounded-full transition-all duration-500" style="width:0%"></div>
              </div>
            </div>
          </div>
        </aside>
        <main class="flex-1 overflow-y-auto">
          <div class="max-w-3xl mx-auto p-8" id="wizard-content"></div>
        </main>
      </div>
    `
  }

  private async loadStatus() {
    try {
      const st = await this.svc.getStatus()
      this.currentStep = Math.min(st.setupStep + 1, 7)
    } catch { /* ignore */ }
  }

  private renderStep(container: HTMLElement) {
    this.renderSidebar(container)
    this.updateProgress(container)
    const content = container.querySelector('#wizard-content')!
    switch (this.currentStep) {
      case 1: content.innerHTML = step1Template; break
      case 2: content.innerHTML = step2Template; break
      case 3: content.innerHTML = step3Template; break
      case 4: content.innerHTML = step4Template; break
      case 5: content.innerHTML = step5Template; break
      case 6: content.innerHTML = step6Template; break
      case 7: content.innerHTML = step7Template; this.fillReview(content); break
    }
    this.attachStepListeners(container, this.currentStep)
  }

  private renderSidebar(container: HTMLElement) {
    const nav = container.querySelector('#wizard-steps')!
    nav.innerHTML = WIZARD_STEPS.map(s => {
      const active = s.id === this.currentStep
      const done = s.id < this.currentStep
      return `
        <button data-step="${s.id}" class="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-right
          ${active ? 'bg-primary-container text-primary font-medium' : 'text-text-secondary hover:bg-surface-subtle'}">
          <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0
            ${active ? 'bg-primary text-white' : done ? 'bg-tertiary/10 text-tertiary' : 'bg-surface-subtle text-text-tertiary'}">
            ${done ? '<span class="material-symbols-outlined text-[16px]" aria-hidden="true">check</span>' : s.id}
          </div>
          <div class="flex-1"><p class="font-body-md">${s.label}</p></div>
        </button>
      `
    }).join('')
    nav.querySelectorAll('button[data-step]').forEach((btn: any) => {
      btn.addEventListener('click', () => {
        const step = parseInt(btn.dataset.step)
        if (step <= this.currentStep) {
          this.currentStep = step
          this.renderStep(container)
        }
      })
    })
  }

  private updateProgress(container: HTMLElement) {
    const pct = Math.round(((this.currentStep - 1) / 6) * 100)
    const bar = container.querySelector('#progress-bar') as HTMLElement
    const txt = container.querySelector('#progress-text') as HTMLElement
    if (bar) bar.style.width = `${pct}%`
    if (txt) txt.textContent = `${pct}%`
  }

  private attachGlobalListeners(_container: HTMLElement) {
    // nothing extra needed
  }

  private attachStepListeners(container: HTMLElement, _step: number) {
    container.querySelector('#btn-next')?.addEventListener('click', () => this.handleNext(container, this.currentStep))
    container.querySelector('#btn-prev')?.addEventListener('click', () => {
      if (this.currentStep > 1) {
        this.currentStep--
        this.renderStep(container)
      }
    })

    if (this.currentStep === 6) {
      container.querySelector('#add-user-btn')?.addEventListener('click', () => this.addUser(container))
    }
  }

  private async handleNext(container: HTMLElement, step: number) {
    const btn = container.querySelector('#btn-next') as HTMLButtonElement
    if (btn) { btn.disabled = true; btn.innerHTML = 'جاري...' }

    try {
      switch (step) {
        case 1: await this.saveStep1(container); break
        case 2: await this.saveStep2(container); break
        case 3: await this.saveStep3(container); break
        case 4: await this.saveStep4(container); break
        case 5: await this.saveStep5(container); break
        case 6: await this.saveStep6(container); break
        case 7: await this.complete(); return
      }
      this.currentStep++
      this.renderStep(container)
    } catch (err: any) {
      ;(window as any).toast?.show?.({ message: err.message || 'حدث خطأ', type: 'error' })
    } finally {
      if (btn) { btn.disabled = false; btn.innerHTML = step === 7 ? 'إكمال الإعداد' : 'التالي' }
    }
  }

  // ---- Save steps ----
  private async saveStep1(c: HTMLElement) {
    const name = (c.querySelector('#step1-name') as HTMLInputElement)?.value.trim()
    const phone = (c.querySelector('#step1-phone') as HTMLInputElement)?.value.trim() || ''
    if (!name) throw new Error('يرجى إدخال اسم الشركة')
    if (phone && !/^09[0-9]{8}$/.test(phone)) throw new Error('رقم الهاتف يجب أن يبدأ بـ 09 ويتبعه 8 أرقام')
    const data: Step1Data = {
      companyName: name,
      companyNameEn: (c.querySelector('#step1-name-en') as HTMLInputElement)?.value.trim() || undefined,
      address: (c.querySelector('#step1-address') as HTMLInputElement)?.value.trim() || undefined,
      phone: phone || undefined,
      taxNumber: (c.querySelector('#step1-tax') as HTMLInputElement)?.value.trim() || undefined,
      currency: (c.querySelector('#step1-currency') as HTMLSelectElement)?.value || 'SYP',
      timezone: (c.querySelector('#step1-timezone') as HTMLSelectElement)?.value || undefined,
      dateFormat: (c.querySelector('#step1-dateformat') as HTMLSelectElement)?.value || undefined,
    }
    await this.svc.saveStep(1, data)
    this.stepData[1] = data
  }

  private async saveStep2(c: HTMLElement) {
    const rate = parseFloat((c.querySelector('#step2-rate') as HTMLInputElement)?.value || '0')
    if (!rate || rate <= 0) throw new Error('يرجى إدخال سعر الصرف')
    const startDate = (c.querySelector('#step2-fiscal-start') as HTMLInputElement)?.value
    const endDate = (c.querySelector('#step2-fiscal-end') as HTMLInputElement)?.value
    if (startDate && endDate && new Date(endDate) <= new Date(startDate)) throw new Error('تاريخ النهاية يجب أن يكون بعد تاريخ البداية')

    const data: Step2Data = {
      exchangeRate: rate,
      taxRate: parseFloat((c.querySelector('#step2-tax') as HTMLInputElement)?.value || '0') || undefined,
      overheadPercentage: parseFloat((c.querySelector('#step2-overhead') as HTMLInputElement)?.value || '0') || undefined,
      monthlyWorkingHours: parseInt((c.querySelector('#step2-hours') as HTMLInputElement)?.value || '0') || undefined,
      serviceOverheadPercent: parseFloat((c.querySelector('#step2-svc-overhead') as HTMLInputElement)?.value || '0') || undefined,
      invoicePrefix: (c.querySelector('#step2-prefix') as HTMLInputElement)?.value.trim() || undefined,
      autoGenerateInvoiceNumber: (c.querySelector('#step2-auto-num') as HTMLInputElement)?.checked,
      fiscalPeriodName: (c.querySelector('#step2-fiscal-name') as HTMLInputElement)?.value.trim() || undefined,
      fiscalStartDate: startDate || undefined,
      fiscalEndDate: endDate || undefined,
    }
    await this.svc.saveStep(2, data)
    this.stepData[2] = data
  }

  private async saveStep3(c: HTMLElement) {
    const data: Step3Data = {
      createDefaultAccounts: (c.querySelector('#step3-confirm') as HTMLInputElement)?.checked ?? true,
      openingBalanceSYP: parseFloat((c.querySelector('#step3-syp') as HTMLInputElement)?.value || '0') || undefined,
      openingBalanceUSD: parseFloat((c.querySelector('#step3-usd') as HTMLInputElement)?.value || '0') || undefined,
    }
    await this.svc.saveStep(3, data)
    this.stepData[3] = data
  }

  private async saveStep4(c: HTMLElement) {
    const data: Step4Data = {
      createDefaultCategories: (c.querySelector('#step4-confirm') as HTMLInputElement)?.checked ?? true,
    }
    await this.svc.saveStep(4, data)
    this.stepData[4] = data
  }

  private async saveStep5(c: HTMLElement) {
    const data: Step5Data = {
      createDefaultCenters: (c.querySelector('#step5-confirm') as HTMLInputElement)?.checked ?? true,
    }
    await this.svc.saveStep(5, data)
    this.stepData[5] = data
  }

  private async saveStep6(_c: HTMLElement) {
    if (this.users.length === 0) throw new Error('يرجى إضافة مستخدم واحد على الأقل')
    const data: Step6Data = { users: this.users }
    await this.svc.saveStep(6, data)
    this.stepData[6] = data
  }

  private async complete() {
    await this.svc.complete()
    ;(window as any).toast?.show?.({ message: 'تم إكمال إعداد النظام بنجاح!', type: 'success' })
    this.router.navigate('/dashboard')
  }

  // ---- Users ----
  private addUser(c: HTMLElement) {
    const fullName = (c.querySelector('#user-fullName') as HTMLInputElement)?.value.trim() || ''
    const phone = (c.querySelector('#user-phone') as HTMLInputElement)?.value.trim() || ''
    const password = (c.querySelector('#user-password') as HTMLInputElement)?.value.trim() || ''
    const role = (c.querySelector('#user-role') as HTMLSelectElement)?.value || 'RECEPTIONIST'
    if (!fullName) { ;(window as any).toast?.show?.({ message: 'يرجى إدخال الاسم', type: 'warning' }); return }
    if (!isPhone(phone)) { ;(window as any).toast?.show?.({ message: 'رقم الموبايل يجب أن يبدأ بـ 09 ويتبعه 8 أرقام', type: 'warning' }); return }
    if (password.length < 6) { ;(window as any).toast?.show?.({ message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل', type: 'warning' }); return }
    if (password === phone) { ;(window as any).toast?.show?.({ message: 'كلمة المرور يجب أن تكون مختلفة عن رقم الموبايل', type: 'warning' }); return }
    const user: Step6User = { fullName, username: phone, phone, password, role }
    this.users.push(user)
    ;(c.querySelector('#user-fullName') as HTMLInputElement).value = ''
    ;(c.querySelector('#user-phone') as HTMLInputElement).value = ''
    ;(c.querySelector('#user-password') as HTMLInputElement).value = ''
    this.refreshUsersList(c)
  }

  private refreshUsersList(c: HTMLElement) {
    const list = c.querySelector('#users-list') as HTMLElement
    const content = c.querySelector('#users-list-content')!
    if (this.users.length === 0) { list.classList.add('hidden'); return }
    list.classList.remove('hidden')
    content.innerHTML = this.users.map((u, idx) => `
      <div class="flex items-center justify-between bg-surface-subtle rounded-lg p-3 border border-border">
        <div>
          <p class="font-body-md text-on-surface">${u.fullName}</p>
          <p class="text-sm text-text-secondary">${u.phone} — ${this.roleLabel(u.role)}</p>
        </div>
        <button class="touch-safe w-8 h-8 rounded-lg hover:bg-error/10 text-error flex items-center justify-center" aria-label="حذف المستخدم" data-remove="${idx}">
          <span class="material-symbols-outlined text-[18px]" aria-hidden="true">delete</span>
        </button>
      </div>
    `).join('')
    content.querySelectorAll('[data-remove]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-remove')!)
        this.users.splice(idx, 1)
        this.refreshUsersList(c)
      })
    })
  }

  private roleLabel(role: string): string {
    const map: Record<string, string> = { ADMIN: 'مدير', MANAGER: 'مسؤول', RECEPTIONIST: 'استقبال', MECHANIC: 'ميكانيكي' }
    return map[role] || role
  }

  // ---- Review ----
  private fillReview(content: Element) {
    const review = content.querySelector('#review-content')
    if (!review) return
    const d1 = this.stepData[1] || {}
    const d2 = this.stepData[2] || {}
    review.innerHTML = `
      <div class="flex items-center gap-2 text-primary font-headline-sm"><span class="material-symbols-outlined" aria-hidden="true">check_circle</span> معلومات الشركة</div>
      <p class="text-body-md text-text-secondary pr-6">الاسم: ${d1.companyName || '-'} | العملة: ${d1.currency || '-'} | الهاتف: ${d1.phone || '-'}</p>
      <hr class="border-border" />
      <div class="flex items-center gap-2 text-primary font-headline-sm"><span class="material-symbols-outlined" aria-hidden="true">check_circle</span> الإعدادات المالية</div>
      <p class="text-body-md text-text-secondary pr-6">سعر الصرف: ${d2.exchangeRate || '-'} | الضريبة: ${d2.taxRate ?? '-'}%</p>
      <hr class="border-border" />
      <div class="flex items-center gap-2 text-primary font-headline-sm"><span class="material-symbols-outlined" aria-hidden="true">check_circle</span> شجرة الحسابات</div>
      <p class="text-body-md text-text-secondary pr-6">${(this.stepData[3]?.createDefaultAccounts ?? true) ? 'سيتم إنشاء الحسابات الافتراضية' : 'تم تخطي إنشاء الحسابات'}</p>
      <hr class="border-border" />
      <div class="flex items-center gap-2 text-primary font-headline-sm"><span class="material-symbols-outlined" aria-hidden="true">check_circle</span> المستخدمون</div>
      <p class="text-body-md text-text-secondary pr-6">${this.users.length} مستخدم/مستخدمين سيتم إنشاؤهم</p>
    `
  }
}
