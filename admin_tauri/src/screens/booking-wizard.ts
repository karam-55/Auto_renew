import { AuthService } from '../services/auth'
import { ApiClient } from '../api/client'
import { Router } from '../router'
import { AppLayout } from '../components/layout'
import { isPhone } from '../utils/validation'

export class BookingWizardScreen {
  private auth: AuthService
  private api: ApiClient
  private router: Router
  private type: 'registered' | 'new'

  constructor(auth: AuthService, api: ApiClient, router: Router, type: 'registered' | 'new') {
    this.auth = auth
    this.api = api
    this.router = router
    this.type = type
  }

  render(): HTMLElement {
    const layout = new AppLayout(this.auth, this.router, 'حجز جديد', 'calendar_month', this.api)
    const el = document.createElement('div')
    el.className = 'page-enter max-w-4xl mx-auto'
    el.innerHTML = `
      <style>
        .wizard-step {
          opacity: 0;
          transform: translateX(30px);
          transition: opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1), transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          display: none;
        }
        .wizard-step.active {
          opacity: 1;
          transform: translateX(0);
          display: block;
        }
        .wizard-step.leaving {
          opacity: 0;
          transform: translateX(-30px);
          transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .wizard-step.enter-left {
          transform: translateX(-30px);
        }
        .wizard-step.enter-right {
          transform: translateX(30px);
        }
        .wizard-step.leave-left {
          transform: translateX(-30px);
        }
        .wizard-step.leave-right {
          transform: translateX(30px);
        }
      </style>
      <div class="space-y-stack-lg">
        <div class="flex items-center justify-between page-enter">
          <div>
            <h1 class="font-beVietnamPro text-headline-md text-on-surface">حجز جديد</h1>
            <p class="text-body-md text-on-surface-variant mt-1">${this.type === 'registered' ? 'عميل مسجل' : 'عميل جديد'}</p>
          </div>
          <button class="h-12 px-4 glass-card text-on-surface font-body-md rounded-xl border border-glass-border hover:bg-white/80 hover:rotate-90 transition-all flex items-center gap-2" id="cancel-btn" aria-label="إلغاء الحجز">
            <span class="material-symbols-outlined text-[20px]" aria-hidden="true">close</span>
            إلغاء
          </button>
        </div>
        <!-- Steps Indicator -->
        <div class="flex items-center gap-2 glass-card rounded-2xl p-4 stagger-entry stagger-entry-1" id="wizard-steps">
          <div class="flex items-center gap-2" data-step="1">
            <div class="w-8 h-8 rounded-full btn-primary-gradient text-white flex items-center justify-center font-bold text-sm step-num shadow-lg shadow-primary/25">1</div>
            <span class="font-label-sm text-primary font-semibold step-label">بيانات العميل</span>
          </div>
          <div class="flex-1 h-[2px] bg-glass-border step-line transition-all duration-500" data-from="1" data-to="2"></div>
          <div class="flex items-center gap-2" data-step="2">
            <div class="w-8 h-8 rounded-full bg-surface-container-high text-on-surface-variant flex items-center justify-center font-bold text-sm step-num">2</div>
            <span class="font-label-sm text-on-surface-variant step-label">بيانات المركبة</span>
          </div>
          <div class="flex-1 h-[2px] bg-glass-border step-line transition-all duration-500" data-from="2" data-to="3"></div>
          <div class="flex items-center gap-2" data-step="3">
            <div class="w-8 h-8 rounded-full bg-surface-container-high text-on-surface-variant flex items-center justify-center font-bold text-sm step-num">3</div>
            <span class="font-label-sm text-on-surface-variant step-label">الخدمة</span>
          </div>
        </div>
        <!-- Step 1: Customer -->
        <div id="step-1" class="wizard-step active">
          <div class="glass-card rounded-2xl overflow-hidden stagger-entry stagger-entry-2">
            <div class="p-6 border-b border-glass-border bg-white/40">
              <h3 class="font-headline-md text-lg text-on-surface font-semibold">بيانات العميل</h3>
            </div>
            <div class="p-6 space-y-4">
              ${this.type === 'registered' ? `
              <div>
                <label class="block font-label-sm text-label-sm text-text-tertiary mb-2">اختر العميل *</label>
                <select class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg pr-4 pl-10 font-ibmPlexSans font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow appearance-none" style="background-image: url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2716%27 height=%2716%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%23475569%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Cpath d=%27M6 9l6 6 6-6%27/%3E%3C/svg%3E'); background-repeat: no-repeat; background-position: left 0.75rem center; background-size: 1rem;" id="customer-select">
                  <option value="">جاري تحميل العملاء...</option>
                </select>
              </div>
              ` : ''}
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block font-label-sm text-label-sm text-text-tertiary mb-2">الاسم *</label>
                  <input class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-ibmPlexSans font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow" id="customer-name" placeholder="اسم العميل" ${this.type === 'registered' ? 'readonly' : 'required'} />
                </div>
                <div>
                  <label class="block font-label-sm text-label-sm text-text-tertiary mb-2">رقم الموبايل *</label>
                  <input class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-ibmPlexSans font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow" id="customer-phone" dir="ltr" placeholder="09XXXXXXXX" ${this.type === 'registered' ? 'readonly' : 'required type="tel" pattern="^09[0-9]{8}$" title="يجب أن يبدأ بـ 09 ويتبعه 8 أرقام"'} />
                </div>
              </div>
              <div>
                <label class="block font-label-sm text-label-sm text-text-tertiary mb-2">العنوان</label>
                <input class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-ibmPlexSans font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow" id="customer-address" placeholder="عنوان العميل" ${this.type === 'registered' ? 'readonly' : ''} />
              </div>
              <div>
                <label class="block font-label-sm text-label-sm text-text-tertiary mb-2">ملاحظات العميل</label>
                <textarea class="w-full bg-surface-subtle border border-border rounded-lg p-4 font-ibmPlexSans font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow resize-none" id="customer-notes" rows="2" placeholder="ملاحظات..." ${this.type === 'registered' ? 'readonly' : ''}></textarea>
              </div>
            </div>
          </div>
        </div>
        <!-- Step 2: Vehicle -->
        <div id="step-2" class="wizard-step hidden">
          <div class="glass-card rounded-2xl overflow-hidden stagger-entry stagger-entry-2">
            <div class="p-6 border-b border-glass-border bg-white/40">
              <h3 class="font-headline-md text-lg text-on-surface font-semibold">بيانات المركبة</h3>
            </div>
            <div class="p-6 space-y-4">
              ${this.type === 'registered' ? `
              <div>
                <label class="block font-label-sm text-label-sm text-text-tertiary mb-2">اختر المركبة (أو أدخل جديدة)</label>
                <select class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg pr-4 pl-10 font-ibmPlexSans font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow appearance-none" style="background-image: url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2716%27 height=%2716%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%23475569%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Cpath d=%27M6 9l6 6 6-6%27/%3E%3C/svg%3E'); background-repeat: no-repeat; background-position: left 0.75rem center; background-size: 1rem;" id="vehicle-select">
                  <option value="">اختر مركبة أو أدخل جديدة</option>
                </select>
              </div>
              ` : ''}
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block font-label-sm text-label-sm text-text-tertiary mb-2">الماركة</label>
                  <input class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-ibmPlexSans font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow" id="vehicle-make" placeholder="مثال: تويوتا" />
                </div>
                <div>
                  <label class="block font-label-sm text-label-sm text-text-tertiary mb-2">الموديل</label>
                  <input class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-ibmPlexSans font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow" id="vehicle-model" placeholder="مثال: كورولا" />
                </div>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label class="block font-label-sm text-label-sm text-text-tertiary mb-2">سنة الصنع *</label>
                  <input type="number" class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-ibmPlexSans font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow" id="vehicle-year" dir="ltr" placeholder="2020" />
                </div>
                <div>
                  <label class="block font-label-sm text-label-sm text-text-tertiary mb-2">رقم اللوحة *</label>
                  <input class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-ibmPlexSans font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow" id="vehicle-plate" dir="ltr" placeholder="123-456" />
                </div>
                <div>
                  <label class="block font-label-sm text-label-sm text-text-tertiary mb-2">العداد (كم)</label>
                  <input type="number" class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-ibmPlexSans font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow" id="vehicle-mileage" dir="ltr" placeholder="50000" />
                </div>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block font-label-sm text-label-sm text-text-tertiary mb-2">رقم الهيكل (VIN)</label>
                  <input class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-ibmPlexSans font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow" id="vehicle-vin" dir="ltr" placeholder="JTDBU4EE3B9123456" />
                </div>
                <div>
                  <label class="block font-label-sm text-label-sm text-text-tertiary mb-2">اللون</label>
                  <input class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-ibmPlexSans font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow" id="vehicle-color" placeholder="مثال: أبيض" />
                </div>
              </div>
              <div>
                <label class="block font-label-sm text-label-sm text-text-tertiary mb-2">ملاحظات المركبة</label>
                <textarea class="w-full bg-surface-subtle border border-border rounded-lg p-4 font-ibmPlexSans font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow resize-none" id="vehicle-notes" rows="2" placeholder="ملاحظات..."></textarea>
              </div>
            </div>
          </div>
        </div>
        <!-- Step 3: Service -->
        <div id="step-3" class="wizard-step hidden">
          <div class="glass-card rounded-2xl overflow-hidden stagger-entry stagger-entry-2">
            <div class="p-6 border-b border-glass-border bg-white/40">
              <h3 class="font-headline-md text-lg text-on-surface font-semibold">الخدمات</h3>
            </div>
            <div class="p-6 space-y-4">
              <div>
                <label class="block font-label-sm text-label-sm text-text-tertiary mb-2">الخدمات *</label>
                <div class="w-full max-h-[200px] overflow-y-auto bg-surface-subtle border border-border rounded-lg p-3 space-y-2" id="service-list">
                  <p class="text-text-secondary text-sm">جاري تحميل الخدمات...</p>
                </div>
                <div class="flex items-center justify-between mt-2 px-1">
                  <p class="text-text-tertiary text-xs">اختر خدمة وحدد سعرها (ل.س)</p>
                  <div class="flex items-center gap-2">
                    <span class="font-label-sm text-text-tertiary">الإجمالي:</span>
                    <span class="font-financial-data text-body-lg text-primary font-semibold" id="services-total">0</span>
                    <span class="text-text-tertiary text-xs">ل.س</span>
                  </div>
                </div>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block font-label-sm text-label-sm text-text-tertiary mb-2">تاريخ الموعد</label>
                  <input type="date" class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-ibmPlexSans font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow" id="booking-date" />
                </div>
                <div>
                  <label class="block font-label-sm text-label-sm text-text-tertiary mb-2">وقت الموعد</label>
                  <input type="time" class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-ibmPlexSans font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow" id="booking-time" />
                </div>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block font-label-sm text-label-sm text-text-tertiary mb-2">حالة الحجز</label>
                  <select class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg pr-4 pl-10 font-ibmPlexSans font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow appearance-none" style="background-image: url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2716%27 height=%2716%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%23475569%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Cpath d=%27M6 9l6 6 6-6%27/%3E%3C/svg%3E'); background-repeat: no-repeat; background-position: left 0.75rem center; background-size: 1rem;" id="booking-status">
                    <option value="PENDING">قيد الانتظار</option>
                    <option value="CONFIRMED">مؤكد</option>
                    <option value="IN_PROGRESS">قيد العمل</option>
                    <option value="WAITING_PARTS">بانتظار المواد</option>
                    <option value="READY">جاهز</option>
                    <option value="COMPLETED">مكتمل</option>
                    <option value="CANCELLED">ملغي</option>
                  </select>
                </div>
                <div>
                  <label class="block font-label-sm text-label-sm text-text-tertiary mb-2">طريقة الدفع</label>
                  <select class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg pr-4 pl-10 font-ibmPlexSans font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow appearance-none" style="background-image: url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2716%27 height=%2716%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%23475569%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Cpath d=%27M6 9l6 6 6-6%27/%3E%3C/svg%3E'); background-repeat: no-repeat; background-position: left 0.75rem center; background-size: 1rem;" id="booking-payment-method">
                    <option value="CASH">نقدي</option>
                    <option value="CREDIT">آجل</option>
                    <option value="ELECTRONIC">إلكتروني</option>
                  </select>
                </div>
              </div>
              <div>
                <label class="block font-label-sm text-label-sm text-text-tertiary mb-2">الأولوية</label>
                <select class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg pr-4 pl-10 font-ibmPlexSans font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow appearance-none" style="background-image: url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2716%27 height=%2716%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%23475569%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Cpath d=%27M6 9l6 6 6-6%27/%3E%3C/svg%3E'); background-repeat: no-repeat; background-position: left 0.75rem center; background-size: 1rem;" id="booking-priority">
                  <option value="NORMAL">عادي</option>
                  <option value="LOW">منخفض</option>
                  <option value="HIGH">عالي</option>
                  <option value="URGENT">عاجل</option>
                </select>
              </div>
              <div>
                <label class="block font-label-sm text-label-sm text-text-tertiary mb-2">تاريخ الإنجاز المتوقع</label>
                <input type="date" class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-ibmPlexSans font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow" id="booking-estimated-completion" />
              </div>
              <div>
                <label class="block font-label-sm text-label-sm text-text-tertiary mb-2">ملاحظات</label>
                <textarea class="w-full bg-surface-subtle border border-border rounded-lg p-4 font-ibmPlexSans font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow resize-none" id="service-notes" rows="3" placeholder="وصف المشكلة أو المطلوب..."></textarea>
              </div>
            </div>
          </div>
        </div>
        <!-- Navigation -->
        <div class="flex justify-between gap-4">
          <button class="h-12 px-6 glass-card text-on-surface font-body-md rounded-xl border border-glass-border hover:bg-white/80 hover:translate-x-1 transition-all flex items-center gap-2 hidden" id="prev-btn">
            <span class="material-symbols-outlined text-[20px]" aria-hidden="true">arrow_forward</span>
            السابق
          </button>
          <div class="flex-1"></div>
          <button class="h-12 px-6 btn-primary-gradient text-white font-body-md rounded-xl shadow-lg shadow-primary/25 hover:scale-105 active:scale-95 transition-all flex items-center gap-2" id="next-btn">
            <span class="material-symbols-outlined text-[20px]" aria-hidden="true">arrow_back</span>
            التالي
          </button>
        </div>
      </div>
    `
    let currentStep = 1
    const totalSteps = 3
    let isAnimating = false
    let selectedCustomerId = ''
    let selectedVehicleId = ''
    const customers: any[] = []

    const showStep = (step: number, direction: 'forward' | 'backward' = 'forward') => {
      if (isAnimating) return
      isAnimating = true

      const oldStepEl = el.querySelector(`#step-${currentStep}`) as HTMLElement
      const newStepEl = el.querySelector(`#step-${step}`) as HTMLElement
      if (!newStepEl) { isAnimating = false; return }

      const enterDir = direction === 'forward' ? 'enter-right' : 'enter-left'
      const leaveDir = direction === 'forward' ? 'leave-left' : 'leave-right'

      // Animate old step out
      if (oldStepEl && oldStepEl !== newStepEl) {
        oldStepEl.classList.add('leaving', leaveDir)
      }

      // Prepare new step: show but off-screen
      newStepEl.classList.remove('hidden')
      newStepEl.classList.add(enterDir)

      // Force reflow to ensure transition starts
      void newStepEl.offsetWidth

      // Animate new step in
      newStepEl.classList.add('active')
      newStepEl.classList.remove(enterDir)

      // Update indicators
      updateIndicators(step)

      // Update buttons
      const prevBtn = el.querySelector('#prev-btn')!
      const nextBtn = el.querySelector('#next-btn')!
      if (step === 1) {
        prevBtn.classList.add('hidden')
      } else {
        prevBtn.classList.remove('hidden')
      }
      if (step === totalSteps) {
        nextBtn.innerHTML = `<span class="material-symbols-outlined text-[20px]" aria-hidden="true">check</span> إنهاء الحجز`
      } else {
        nextBtn.innerHTML = `<span class="material-symbols-outlined text-[20px]" aria-hidden="true">arrow_back</span> التالي`
      }

      // Cleanup after animation
      setTimeout(() => {
        el.querySelectorAll('.wizard-step').forEach((s: any) => {
          if (s !== newStepEl) {
            s.classList.add('hidden')
            s.classList.remove('leaving', 'active', 'enter-left', 'enter-right', 'leave-left', 'leave-right')
          } else {
            s.classList.remove('leaving', 'enter-left', 'enter-right', 'leave-left', 'leave-right')
            // Keep .active on current step
          }
        })
        isAnimating = false
      }, 380)
    }

    const updateIndicators = (step: number) => {
      el.querySelectorAll('[data-step]').forEach((ind: any) => {
        const s = parseInt(ind.getAttribute('data-step')!)
        const num = ind.querySelector('.step-num')!
        const label = ind.querySelector('.step-label')!
        if (s <= step) {
          num.className = 'w-8 h-8 rounded-full btn-primary-gradient text-white flex items-center justify-center font-bold text-sm step-num step-num-active shadow-lg shadow-primary/25'
          label.className = 'font-label-sm text-primary font-semibold step-label'
        } else {
          num.className = 'w-8 h-8 rounded-full bg-white/50 text-on-surface-variant border border-glass-border flex items-center justify-center font-bold text-sm step-num'
          label.className = 'font-label-sm text-on-surface-variant step-label'
        }
      })

      // Lines with animated fill
      el.querySelectorAll('.step-line').forEach((line: any) => {
        const from = parseInt(line.getAttribute('data-from')!)
        if (from < step) {
          line.classList.remove('bg-glass-border')
          line.classList.add('bg-primary', 'filled')
        } else {
          line.classList.remove('bg-primary', 'filled')
          line.classList.add('bg-glass-border')
        }
      })
    }

    el.querySelector('#cancel-btn')?.addEventListener('click', () => {
      el.classList.add('wizard-canceling')
      setTimeout(() => this.router.navigate('/bookings'), 400)
    })

    el.querySelector('#prev-btn')?.addEventListener('click', () => {
      if (currentStep > 1 && !isAnimating) {
        currentStep--
        showStep(currentStep, 'backward')
      }
    })

    const getValue = (id: string) => {
      const input = el.querySelector(`#${id}`) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      return input?.value?.trim() || ''
    }

    el.querySelector('#next-btn')?.addEventListener('click', async () => {
      if (currentStep < totalSteps && !isAnimating) {
        currentStep++
        showStep(currentStep, 'forward')
        return
      }

      if (currentStep === totalSteps && !isAnimating) {
        // Validate required fields
        const customerName = getValue('customer-name')
        const customerPhone = getValue('customer-phone')
        const vehicleMake = getValue('vehicle-make')
        const vehicleModel = getValue('vehicle-model')
        const vehicleYear = parseInt(getValue('vehicle-year'))
        const vehiclePlate = getValue('vehicle-plate')

        if (this.type === 'registered' && !selectedCustomerId) {
          ;(window as any).toast?.show?.({ message: 'يرجى اختيار عميل من القائمة', type: 'warning' })
          return
        }
        if (this.type === 'new' && (!customerName || !customerPhone)) {
          ;(window as any).toast?.show?.({ message: 'يرجى تعبئة بيانات العميل', type: 'warning' })
          return
        }
        if (this.type === 'new' && !isPhone(customerPhone)) {
          ;(window as any).toast?.show?.({ message: 'رقم الموبايل يجب أن يبدأ بـ 09 ويتبعه 8 أرقام', type: 'warning' })
          return
        }
        if (!vehicleMake || !vehicleModel || !vehiclePlate) {
          ;(window as any).toast?.show?.({ message: 'يرجى تعبئة بيانات المركبة', type: 'warning' })
          return
        }
        if (!vehicleYear || vehicleYear < 1900 || vehicleYear > new Date().getFullYear() + 1) {
          ;(window as any).toast?.show?.({ message: 'يرجى إدخال سنة صنع صحيحة للمركبة', type: 'warning' })
          return
        }
        const checkedServices = el.querySelectorAll<HTMLInputElement>('#service-list .svc-check:checked')
        const servicesPayload = Array.from(checkedServices).map((cb) => {
          const row = cb.closest('.service-row') as HTMLElement
          const priceInput = row.querySelector<HTMLInputElement>('.svc-price')
          const price = parseFloat(priceInput?.value || '0') || 0
          return { serviceId: cb.value, priceSYP: price }
        })
        if (servicesPayload.length === 0) {
          ;(window as any).toast?.show?.({ message: 'يرجى اختيار خدمة واحدة على الأقل', type: 'warning' })
          return
        }

        const nextBtn = el.querySelector('#next-btn') as HTMLButtonElement
        if (nextBtn) {
          nextBtn.disabled = true
          nextBtn.innerHTML = `<span class="material-symbols-outlined text-[20px] animate-spin" aria-hidden="true">sync</span> جاري الحفظ...`
        }

        try {
          let customerId = selectedCustomerId

          // Step 1: Create customer (only for new)
          if (this.type === 'new') {
            if (nextBtn) nextBtn.innerHTML = `<span class="material-symbols-outlined text-[20px] animate-spin" aria-hidden="true">sync</span> جاري إنشاء العميل (1/3)...`
            const customerRes = await this.api.post<any>('/api/customers', {
              fullName: customerName,
              phone: customerPhone,
              address: getValue('customer-address'),
              notes: getValue('customer-notes'),
            })
            const customerData = customerRes.data?.customer || customerRes.data
            if (!customerRes.success || !customerData?.id) {
              throw new Error(customerRes.message || JSON.stringify(customerRes.data) || 'فشل إنشاء العميل')
            }
            customerId = customerData.id
          }

          // Step 2: Create vehicle (only if not selected existing)
          let vehicleId = selectedVehicleId
          if (!vehicleId) {
            if (nextBtn) nextBtn.innerHTML = `<span class="material-symbols-outlined text-[20px] animate-spin" aria-hidden="true">sync</span> جاري إنشاء المركبة (2/3)...`
            const vehicleRes = await this.api.post<any>('/api/vehicles', {
              customerId: customerId,
              make: vehicleMake,
              model: vehicleModel,
              year: vehicleYear,
              licensePlate: vehiclePlate,
              currentKm: parseInt(getValue('vehicle-mileage')) || 0,
              vin: getValue('vehicle-vin') || undefined,
              color: getValue('vehicle-color') || undefined,
              notes: getValue('vehicle-notes') || undefined,
            })
            const vehicleData = vehicleRes.data?.vehicle || vehicleRes.data
            if (!vehicleRes.success || !vehicleData?.id) {
              throw new Error(vehicleRes.message || JSON.stringify(vehicleRes.data) || 'فشل إنشاء المركبة')
            }
            vehicleId = vehicleData.id
          }

          // Step 3: Create booking
          if (nextBtn) nextBtn.innerHTML = `<span class="material-symbols-outlined text-[20px] animate-spin" aria-hidden="true">sync</span> جاري إنشاء الحجز (3/3)...`
          const dateInput = getValue('booking-date')
          const timeInput = getValue('booking-time')
          const priorityInput = getValue('booking-priority') || 'NORMAL'
          const statusInput = getValue('booking-status') || 'PENDING'
          const estimatedInput = getValue('booking-estimated-completion')
          let scheduledDate = new Date().toISOString()
          if (dateInput) {
            const d = new Date(dateInput)
            if (!isNaN(d.getTime())) scheduledDate = d.toISOString()
          }
          const paymentMethod = getValue('booking-payment-method') || 'CASH'
          const bookingPayload: any = {
            customerId: customerId,
            vehicleId: vehicleId,
            scheduledDate: scheduledDate,
            notes: getValue('service-notes'),
            services: servicesPayload,
            status: statusInput,
            priority: priorityInput,
            paymentMethod: paymentMethod,
          }
          if (timeInput) bookingPayload.scheduledTime = timeInput
          if (estimatedInput) {
            const est = new Date(estimatedInput)
            if (!isNaN(est.getTime())) bookingPayload.estimatedCompletionDate = estimatedInput
          }
          const bookingRes = await this.api.post<any>('/api/bookings', bookingPayload)
          if (!bookingRes.success || !bookingRes.data?.id) {
            throw new Error(bookingRes.message || 'فشل إنشاء الحجز')
          }
          const bookingId = bookingRes.data.id

          // Clear cache so bookings list shows the new booking
          this.api.clearCache()
          // Navigate to print ticket
          this.router.navigate(`/bookings/print/${bookingId}`)
        } catch (err: any) {
          ;(window as any).toast?.show?.({ message: err.message || 'حدث خطأ أثناء إنشاء الحجز', type: 'error' })
          if (nextBtn) {
            nextBtn.disabled = false
            nextBtn.innerHTML = `<span class="material-symbols-outlined text-[20px]" aria-hidden="true">check</span> إنهاء الحجز`
          }
        }
      }
    })

    // Set default dates
    const todayStr = new Date().toISOString().split('T')[0]
    const dateInput = el.querySelector('#booking-date') as HTMLInputElement
    if (dateInput) dateInput.value = todayStr

    // Fetch real services for multi-select with per-service price input
    // (limit=0 → "all rows": lookup for booking form)
    this.api.get<any>('/api/services?limit=0').then(res => {
      const list = el.querySelector('#service-list') as HTMLDivElement
      if (!list) return
      if (res.success && res.data) {
        const services = Array.isArray(res.data) ? res.data : res.data.data || []
        if (services.length > 0) {
          list.innerHTML = services.map((s: any) => {
            const defaultPrice = s.priceSYP ?? s.basePrice ?? 0
            return `
            <div class="service-row flex items-center gap-2 hover:bg-surface-container-low/50 rounded px-2 py-1.5 transition-colors" data-service-id="${s.id}" data-default-price="${defaultPrice}">
              <label class="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                <input type="checkbox" value="${s.id}" class="svc-check w-4 h-4 rounded border-border text-primary focus:ring-primary" />
                <span class="font-body-md text-on-surface truncate">${s.name}</span>
              </label>
              <input type="number" min="0" step="1000" value="${defaultPrice}" placeholder="السعر (ل.س)" class="svc-price w-32 h-8 text-sm bg-surface border border-border rounded px-2 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none disabled:opacity-50 disabled:bg-surface-subtle" disabled />
              <span class="text-text-tertiary text-xs whitespace-nowrap">ل.س</span>
            </div>
          `}).join('')

          // Enable/disable price input based on checkbox state + recompute total
          const updateTotal = () => {
            const checked = list.querySelectorAll<HTMLInputElement>('.svc-check:checked')
            let total = 0
            checked.forEach((cb) => {
              const row = cb.closest('.service-row') as HTMLElement
              const priceInput = row.querySelector<HTMLInputElement>('.svc-price')
              if (priceInput) total += parseFloat(priceInput.value) || 0
            })
            const totalEl = el.querySelector('#services-total') as HTMLElement
            if (totalEl) totalEl.textContent = total.toLocaleString('en-US')
          }

          list.querySelectorAll<HTMLInputElement>('.svc-check').forEach((cb) => {
            cb.addEventListener('change', () => {
              const row = cb.closest('.service-row') as HTMLElement
              const priceInput = row.querySelector<HTMLInputElement>('.svc-price')
              if (priceInput) priceInput.disabled = !cb.checked
              updateTotal()
            })
          })
          list.querySelectorAll<HTMLInputElement>('.svc-price').forEach((input) => {
            input.addEventListener('input', updateTotal)
          })
        } else {
          list.innerHTML = `<p class="text-text-secondary text-sm">لا توجد خدمات متوفرة</p>`
        }
      } else {
        list.innerHTML = `<p class="text-text-secondary text-sm">خطأ في تحميل الخدمات</p>`
      }
    }).catch(() => {
      const list = el.querySelector('#service-list') as HTMLDivElement
      if (list) list.innerHTML = `<p class="text-text-secondary text-sm">لا يمكن الاتصال بالخادم</p>`
    })

    // Fetch customers for registered booking (limit=0 → "all rows": lookup for booking form)
    if (this.type === 'registered') {
      this.api.get<any>('/api/customers?limit=0').then(res => {
        const select = el.querySelector('#customer-select') as HTMLSelectElement
        if (!select) return
        if (res.success && res.data) {
          const custs = Array.isArray(res.data) ? res.data : res.data.data || []
          customers.push(...custs)
          if (custs.length > 0) {
            select.innerHTML = `<option value="">اختر العميل</option>` +
              custs.map((c: any) => `<option value="${c.id}">${c.fullName || '-'} - ${c.phone || ''}</option>`).join('')
          } else {
            select.innerHTML = `<option value="">لا يوجد عملاء</option>`
          }
        } else {
          select.innerHTML = `<option value="">خطأ في تحميل العملاء</option>`
        }
      }).catch(() => {
        const select = el.querySelector('#customer-select') as HTMLSelectElement
        if (select) select.innerHTML = `<option value="">لا يمكن الاتصال بالخادم</option>`
      })

      // Handle customer selection
      el.querySelector('#customer-select')?.addEventListener('change', async (e) => {
        const target = e.target as HTMLSelectElement
        const customerId = target.value
        selectedCustomerId = customerId
        const customer = customers.find((c: any) => c.id === customerId)
        if (customer) {
          const nameInput = el.querySelector('#customer-name') as HTMLInputElement
          const phoneInput = el.querySelector('#customer-phone') as HTMLInputElement
          const addressInput = el.querySelector('#customer-address') as HTMLInputElement
          const notesInput = el.querySelector('#customer-notes') as HTMLTextAreaElement
          if (nameInput) nameInput.value = customer.fullName || customer.name || ''
          if (phoneInput) phoneInput.value = customer.phone || ''
          if (addressInput) addressInput.value = customer.address || ''
          if (notesInput) notesInput.value = customer.notes || ''
        }

        // Fetch customer's vehicles
        const vehicleSelect = el.querySelector('#vehicle-select') as HTMLSelectElement
        if (!vehicleSelect || !customerId) return

        vehicleSelect.innerHTML = `<option value="">جاري تحميل المركبات...</option>`
        try {
          const res = await this.api.get<any>(`/api/vehicles/customer/${customerId}`)
          if (res.success && res.data) {
            const vehicles = Array.isArray(res.data) ? res.data : res.data.data || []
            if (vehicles.length > 0) {
              vehicleSelect.innerHTML = `<option value="">اختر مركبة أو أدخل جديدة</option>` +
                vehicles.map((v: any) => `<option value="${v.id}" data-json="${encodeURIComponent(JSON.stringify(v))}">${v.make} ${v.model} - ${v.licensePlate}</option>`).join('')
            } else {
              vehicleSelect.innerHTML = `<option value="">لا توجد مركبات مسجلة - أدخل جديدة</option>`
            }
          } else {
            vehicleSelect.innerHTML = `<option value="">خطأ في تحميل المركبات</option>`
          }
        } catch {
          vehicleSelect.innerHTML = `<option value="">خطأ في تحميل المركبات</option>`
        }
      })

      // Handle vehicle selection
      el.querySelector('#vehicle-select')?.addEventListener('change', (e) => {
        const target = e.target as HTMLSelectElement
        const option = target.options[target.selectedIndex]
        selectedVehicleId = target.value
        if (!option || !option.getAttribute('data-json')) {
          // New vehicle - clear fields
          selectedVehicleId = ''
          const fields = ['vehicle-make','vehicle-model','vehicle-year','vehicle-plate','vehicle-mileage','vehicle-vin','vehicle-color','vehicle-notes']
          fields.forEach(id => {
            const input = el.querySelector(`#${id}`) as HTMLInputElement | HTMLTextAreaElement
            if (input) input.value = ''
          })
          return
        }
        try {
          const rawJson = option.getAttribute('data-json')
          if (!rawJson) return
          const vehicle = JSON.parse(decodeURIComponent(rawJson))
          // Validate expected shape to avoid prototype pollution
          if (!vehicle || typeof vehicle !== 'object') return
          const makeInput = el.querySelector('#vehicle-make') as HTMLInputElement
          const modelInput = el.querySelector('#vehicle-model') as HTMLInputElement
          const yearInput = el.querySelector('#vehicle-year') as HTMLInputElement
          const plateInput = el.querySelector('#vehicle-plate') as HTMLInputElement
          const mileageInput = el.querySelector('#vehicle-mileage') as HTMLInputElement
          const vinInput = el.querySelector('#vehicle-vin') as HTMLInputElement
          const colorInput = el.querySelector('#vehicle-color') as HTMLInputElement
          const notesInput = el.querySelector('#vehicle-notes') as HTMLTextAreaElement
          if (makeInput) makeInput.value = typeof vehicle.make === 'string' ? vehicle.make : ''
          if (modelInput) modelInput.value = typeof vehicle.model === 'string' ? vehicle.model : ''
          if (yearInput) yearInput.value = vehicle.year != null ? String(vehicle.year) : ''
          if (plateInput) plateInput.value = typeof vehicle.licensePlate === 'string' ? vehicle.licensePlate : ''
          if (mileageInput) mileageInput.value = vehicle.currentKm != null ? String(vehicle.currentKm) : ''
          if (vinInput) vinInput.value = typeof vehicle.vin === 'string' ? vehicle.vin : ''
          if (colorInput) colorInput.value = typeof vehicle.color === 'string' ? vehicle.color : ''
          if (notesInput) notesInput.value = typeof vehicle.notes === 'string' ? vehicle.notes : ''
        } catch {
          // ignore decode/parsing errors
        }
      })
    }

    return layout.render(el)
  }
}
