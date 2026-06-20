import { AuthService } from '../services/auth'
import { ApiClient } from '../api/client'
import { Router } from '../router'
import { AppLayout } from '../components/layout'

export class WorkshopMapScreen {
  constructor(private auth: AuthService, private api: ApiClient, private router: Router) {}

  render(): HTMLElement {
    const layout = new AppLayout(this.auth, this.router, 'خريطة الورشة', 'map', this.api)
    const c = document.createElement('div')
    c.className = 'page-enter min-h-screen bg-background p-gutter'
    c.innerHTML = `
      <div class="max-w-7xl mx-auto space-y-stack-lg">
        <div>
          <h1 class="font-beVietnamPro text-headline-md text-on-surface">خريطة الورشة</h1>
          <p class="text-body-md text-text-secondary mt-1">توزيع الموارد والمحطات داخل الورشة</p>
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2 bg-surface-container-lowest rounded-xl shadow-md border border-surface-subtle p-card-padding min-h-[400px] flex items-center justify-center">
            <div class="text-center">
              <span class="material-symbols-outlined text-[64px] text-text-tertiary mb-4">map</span>
              <p class="text-text-secondary font-body-md">خريطة تفاعلية للورشة</p>
              <p class="text-text-tertiary text-sm mt-2">جاري تحميل الخريطة...</p>
            </div>
          </div>
          <div class="lg:col-span-1 space-y-stack-md">
            <div class="bg-surface-container-lowest p-card-padding rounded-xl shadow-md border border-surface-subtle">
              <h3 class="font-headline-md text-lg text-on-surface font-semibold mb-4">المحطات</h3>
              <div class="space-y-3">
                <div class="flex items-center justify-between p-3 bg-surface-subtle rounded-lg">
                  <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-primary">build</span>
                    <span class="font-body-md text-on-surface">محطة الصيانة 1</span>
                  </div>
                  <span class="bg-tertiary/10 text-tertiary px-2 py-0.5 rounded-full text-xs font-label-sm">متاح</span>
                </div>
                <div class="flex items-center justify-between p-3 bg-surface-subtle rounded-lg">
                  <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-primary">build</span>
                    <span class="font-body-md text-on-surface">محطة الصيانة 2</span>
                  </div>
                  <span class="bg-error/10 text-error px-2 py-0.5 rounded-full text-xs font-label-sm">مشغول</span>
                </div>
                <div class="flex items-center justify-between p-3 bg-surface-subtle rounded-lg">
                  <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-secondary">car_repair</span>
                    <span class="font-body-md text-on-surface">محطة الإصلاح</span>
                  </div>
                  <span class="bg-tertiary/10 text-tertiary px-2 py-0.5 rounded-full text-xs font-label-sm">متاح</span>
                </div>
                <div class="flex items-center justify-between p-3 bg-surface-subtle rounded-lg">
                  <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-info">local_car_wash</span>
                    <span class="font-body-md text-on-surface">محطة الغسيل</span>
                  </div>
                  <span class="bg-tertiary/10 text-tertiary px-2 py-0.5 rounded-full text-xs font-label-sm">متاح</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `
    return layout.render(c)
  }
}
