import { AuthService } from '../services/auth'
import { ApiClient } from '../api/client'
import { Router } from '../router'
import { AppLayout } from '../components/layout'
import { isPhone } from '../utils/validation'

export class SettingsScreen {
  private auth: AuthService
  private api: ApiClient
  private router: Router

  constructor(auth: AuthService, api: ApiClient, router: Router) {
    this.auth = auth
    this.api = api
    this.router = router
  }

  render(): HTMLElement {
    const layout = new AppLayout(this.auth, this.router, 'إعدادات النظام', 'settings', this.api)
    const content = document.createElement('div')
    content.className = 'page-enter min-h-screen bg-background p-gutter'
    content.innerHTML = `
      <div class="max-w-3xl mx-auto space-y-stack-lg">
        <div>
          <h1 class="font-beVietnamPro text-headline-md text-on-surface">إعدادات النظام</h1>
          <p class="text-body-md text-text-secondary mt-1">تخصيص إعدادات التطبيق والأعمال</p>
        </div>
        <div class="bg-surface-container-lowest rounded-xl shadow-md border border-surface-subtle overflow-hidden">
          <div class="p-6 border-b border-outline-variant/10 bg-surface-subtle">
            <h3 class="font-headline-md text-[18px] text-on-surface font-semibold flex items-center gap-2">
              <span class="material-symbols-outlined text-primary">business</span>
              معلومات المرآب
            </h3>
          </div>
          <div class="p-6 space-y-4">
            <div>
              <label class="block font-label-sm text-label-sm text-text-tertiary mb-2">اسم المرآب *</label>
              <input id="setting-garage-name" class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-ibmPlexSans font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow" placeholder="اسم المرآب" required />
            </div>
            <div>
              <label class="block font-label-sm text-label-sm text-text-tertiary mb-2">العنوان</label>
              <input id="setting-address" class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-ibmPlexSans font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow" placeholder="العنوان" />
            </div>
            <div>
              <label class="block font-label-sm text-label-sm text-text-tertiary mb-2">رقم الهاتف *</label>
              <input id="setting-phone" class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-ibmPlexSans font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow" dir="ltr" placeholder="09XXXXXXXX" required type="tel" pattern="^09[0-9]{8}$" title="يجب أن يبدأ بـ 09 ويتبعه 8 أرقام" />
            </div>
          </div>
        </div>
        <div class="bg-surface-container-lowest rounded-xl shadow-md border border-surface-subtle overflow-hidden">
          <div class="p-6 border-b border-outline-variant/10 bg-surface-subtle">
            <h3 class="font-headline-md text-[18px] text-on-surface font-semibold flex items-center gap-2">
              <span class="material-symbols-outlined text-primary">payments</span>
              إعدادات المالية
            </h3>
          </div>
          <div class="p-6 space-y-4">
            <div>
              <label class="block font-label-sm text-label-sm text-text-tertiary mb-2">العملة الافتراضية</label>
              <select id="setting-currency" class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg pr-4 pl-10 font-ibmPlexSans font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow appearance-none" style="background-image: url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2716%27 height=%2716%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%23475569%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Cpath d=%27M6 9l6 6 6-6%27/%3E%3C/svg%3E'); background-repeat: no-repeat; background-position: left 0.75rem center; background-size: 1rem;">
                <option value="SYP">ليرة سورية (SYP)</option>
                <option value="USD">دولار أمريكي (USD)</option>
              </select>
            </div>
            <div>
              <label class="block font-label-sm text-label-sm text-text-tertiary mb-2">سعر صرف الدولار (ل.س)</label>
              <input id="setting-exchange-rate" class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-ibmPlexSans font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow" type="number" min="0" placeholder="15000" />
            </div>
            <div>
              <label class="block font-label-sm text-label-sm text-text-tertiary mb-2">نسبة الضريبة (%)</label>
              <input id="setting-tax" class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-ibmPlexSans font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow" type="number" min="0" max="100" placeholder="5" />
            </div>
          </div>
        </div>
        <div class="flex justify-end gap-4">
          <button class="h-[48px] px-6 bg-surface-subtle text-on-surface font-ibmPlexSans font-body-lg rounded-lg border border-border hover:bg-surface-container-low transition-colors" id="settings-cancel">
            إلغاء
          </button>
          <button class="h-[48px] px-6 bg-primary text-on-primary font-ibmPlexSans font-body-lg rounded-lg shadow-sm hover:shadow-lg transition-all" id="settings-save">
            حفظ التغييرات
          </button>
        </div>
      </div>
    `
    this.loadSettings(content)

    content.querySelector('#settings-cancel')?.addEventListener('click', () => {
      this.router.navigate('/dashboard')
    })
    content.querySelector('#settings-save')?.addEventListener('click', () => {
      this.saveSettings(content)
    })
    return layout.render(content)
  }

  private async loadSettings(c: HTMLElement) {
    try {
      const res = await this.api.get<any>('/api/settings')
      if (res.success && res.data) {
        const s = res.data
        const nameInput = c.querySelector('#setting-garage-name') as HTMLInputElement
        const addrInput = c.querySelector('#setting-address') as HTMLInputElement
        const phoneInput = c.querySelector('#setting-phone') as HTMLInputElement
        const currSelect = c.querySelector('#setting-currency') as HTMLSelectElement
        const exchangeRateInput = c.querySelector('#setting-exchange-rate') as HTMLInputElement
        const taxInput = c.querySelector('#setting-tax') as HTMLInputElement
        if (nameInput && s.companyName) nameInput.value = s.companyName
        if (addrInput && s.address) addrInput.value = s.address
        if (phoneInput && s.phone) phoneInput.value = s.phone
        if (currSelect && s.currency) currSelect.value = s.currency
        if (exchangeRateInput && s.exchangeRate != null) exchangeRateInput.value = String(s.exchangeRate)
        if (taxInput && s.taxRate != null) taxInput.value = String(s.taxRate)
      }
    } catch {
      // ignore
    }
  }

  private async saveSettings(c: HTMLElement) {
    const name = (c.querySelector('#setting-garage-name') as HTMLInputElement)?.value?.trim() || ''
    const address = (c.querySelector('#setting-address') as HTMLInputElement)?.value?.trim() || ''
    const phone = (c.querySelector('#setting-phone') as HTMLInputElement)?.value?.trim() || ''
    const currency = (c.querySelector('#setting-currency') as HTMLSelectElement)?.value || ''
    const exchangeRate = (c.querySelector('#setting-exchange-rate') as HTMLInputElement)?.value
    const tax = (c.querySelector('#setting-tax') as HTMLInputElement)?.value

    if (!name) { ;(window as any).toast?.show?.({ message: 'اسم المرآب مطلوب', type: 'warning' }); return }
    if (!isPhone(phone)) { ;(window as any).toast?.show?.({ message: 'رقم الهاتف يجب أن يبدأ بـ 09 ويتبعه 8 أرقام', type: 'warning' }); return }
    const erNum = exchangeRate !== '' && exchangeRate != null ? Number(exchangeRate) : null
    if (erNum != null && erNum < 0) { ;(window as any).toast?.show?.({ message: 'سعر الصرف لا يمكن أن يكون سالباً', type: 'warning' }); return }
    const taxNum = tax !== '' && tax != null ? Number(tax) : null
    if (taxNum != null && (taxNum < 0 || taxNum > 100)) { ;(window as any).toast?.show?.({ message: 'نسبة الضريبة يجب أن تكون بين 0 و 100', type: 'warning' }); return }

    const btn = c.querySelector('#settings-save') as HTMLButtonElement
    if (btn) {
      btn.disabled = true
      btn.innerHTML = 'جاري الحفظ...'
    }

    try {
      const payload: any = {
        companyName: name,
        currency: currency || 'SYP',
      }
      if (address) payload.address = address
      if (phone) payload.phone = phone
      if (exchangeRate !== '' && exchangeRate != null) payload.exchangeRate = Number(exchangeRate)
      if (tax !== '' && tax != null) payload.taxRate = Number(tax)

      const res = await this.api.put<any>('/api/settings', payload)
      if (res.success) {
        ;(window as any).toast?.show?.({ message: 'تم حفظ الإعدادات بنجاح', type: 'success' })
      } else {
        ;(window as any).toast?.show?.({ message: res.message || 'فشل حفظ الإعدادات', type: 'error' })
      }
    } catch (err: any) {
      ;(window as any).toast?.show?.({ message: 'حدث خطأ أثناء الحفظ: ' + (err.message || 'فشل الاتصال'), type: 'error' })
    } finally {
      if (btn) {
        btn.disabled = false
        btn.innerHTML = 'حفظ التغييرات'
      }
    }
  }
}
