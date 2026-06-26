import { AuthService } from '../services/auth'
import { ApiClient } from '../api/client'
import { Router } from '../router'
import { AppLayout } from '../components/layout'

export class ServicesScreen {
  private allCategories: any[] = []
  private exchangeRate: number = 15000

  constructor(private auth: AuthService, private api: ApiClient, private router: Router) {}

  private async loadExchangeRate() {
    try {
      const res = await this.api.get<any>('/api/settings')
      if (res.success && res.data && res.data.exchangeRate) {
        this.exchangeRate = Number(res.data.exchangeRate)
      }
    } catch {
      // keep default
    }
  }

  private async loadCategories() {
    try {
      const res = await this.api.get<any>('/api/service-categories')
      if (res.success !== false && res.data) {
        this.allCategories = Array.isArray(res.data) ? res.data : res.data.data || []
      }
    } catch {
      // categories will remain empty
    }
  }

  private populateCategorySelect(el: HTMLElement, selectedValue?: string) {
    const select = el.querySelector('#svc-category') as HTMLSelectElement
    if (!select) return
    const options = this.allCategories.map((c: any) =>
      `<option value="${c.name}" ${selectedValue === c.name ? 'selected' : ''}>${c.name}</option>`
    ).join('')
    select.innerHTML = `<option value="">اختر الفئة</option>` + options
  }

  render(): HTMLElement {
    const layout = new AppLayout(this.auth, this.router, 'الخدمات', 'build', this.api)
    const content = document.createElement('div')
    content.className = 'page-enter min-h-screen bg-background p-gutter'
    content.innerHTML = `
      <div class="max-w-7xl mx-auto space-y-stack-lg">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="font-beVietnamPro text-headline-md text-on-surface">إدارة الخدمات</h1>
            <p class="text-body-md text-text-secondary mt-1">إضافة وإدارة خدمات الصيانة والإصلاح</p>
          </div>
          <div class="flex items-center gap-3">
            <button class="h-[48px] bg-surface-subtle text-on-surface font-ibmPlexSans font-body-lg text-body-lg rounded-lg border border-border hover:bg-surface-container-low transition-all duration-200 flex items-center justify-center gap-2 px-4" id="manage-categories-btn">
              <span class="material-symbols-outlined text-[20px]">category</span>
              فئات الخدمات
            </button>
            <button class="h-[48px] bg-primary text-on-primary font-ibmPlexSans font-body-lg text-body-lg rounded-lg shadow-sm hover:shadow-lg hover:-translate-y-[1px] transition-all duration-200 flex items-center justify-center gap-2 px-6" id="new-service-btn">
              <span class="material-symbols-outlined text-[20px]">add</span>
              خدمة جديدة
            </button>
          </div>
        </div>
        <!-- Filters -->
        <div class="glass-panel rounded-xl shadow-lg border border-border p-card-padding">
          <div class="flex flex-col sm:flex-row gap-4 items-center">
            <div class="relative flex-1 w-full">
              <span class="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline">search</span>
              <input class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg pr-10 pl-4 font-ibmPlexSans font-body-md text-body-md text-on-surface placeholder:text-outline-variant focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow duration-200" type="text" placeholder="بحث باسم الخدمة..." id="service-search" />
            </div>
            <select class="h-[48px] bg-surface-subtle border border-border rounded-lg pr-4 pl-10 font-ibmPlexSans font-body-md text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow duration-200 w-full sm:w-48 appearance-none" style="background-image: url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2716%27 height=%2716%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%23475569%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Cpath d=%27M6 9l6 6 6-6%27/%3E%3C/svg%3E'); background-repeat: no-repeat; background-position: left 0.75rem center; background-size: 1rem;" id="status-filter">
              <option value="">كل الحالات</option>
              <option value="active">نشط</option>
              <option value="inactive">غير نشط</option>
            </select>
            <button class="h-[48px] px-4 bg-surface-subtle text-on-surface font-ibmPlexSans font-body-md text-body-md rounded-lg border border-border hover:bg-surface-container-low transition-colors flex items-center gap-2 w-full sm:w-auto justify-center" id="clear-filters">
              <span class="material-symbols-outlined text-[20px]">refresh</span>
              مسح
            </button>
          </div>
        </div>
        <!-- Table -->
        <div class="bg-surface-container-lowest rounded-xl shadow-md border border-surface-subtle overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="bg-surface-subtle border-b border-outline-variant/10">
                  <th class="px-6 py-4 text-right font-label-sm text-label-sm text-text-tertiary uppercase">الخدمة</th>
                  <th class="px-6 py-4 text-right font-label-sm text-label-sm text-text-tertiary uppercase">الفئة</th>
                  <th class="px-6 py-4 text-right font-label-sm text-label-sm text-text-tertiary uppercase">السعر (ل.س)</th>
                  <th class="px-6 py-4 text-right font-label-sm text-label-sm text-text-tertiary uppercase">السعر ($)</th>
                  <th class="px-6 py-4 text-right font-label-sm text-label-sm text-text-tertiary uppercase">تكلفة العمل</th>
                  <th class="px-6 py-4 text-right font-label-sm text-label-sm text-text-tertiary uppercase">تكلفة المواد</th>
                  <th class="px-6 py-4 text-right font-label-sm text-label-sm text-text-tertiary uppercase">الربح</th>
                  <th class="px-6 py-4 text-right font-label-sm text-label-sm text-text-tertiary uppercase">نقاط الولاء</th>
                  <th class="px-6 py-4 text-right font-label-sm text-label-sm text-text-tertiary uppercase">كفالة</th>
                  <th class="px-6 py-4 text-right font-label-sm text-label-sm text-text-tertiary uppercase">وصف الكفالة</th>
                  <th class="px-6 py-4 text-right font-label-sm text-label-sm text-text-tertiary uppercase">شروط الكفالة</th>
                  <th class="px-6 py-4 text-right font-label-sm text-label-sm text-text-tertiary uppercase">المدة (دقيقة)</th>
                  <th class="px-6 py-4 text-right font-label-sm text-label-sm text-text-tertiary uppercase">الحالة</th>
                  <th class="px-6 py-4 text-right font-label-sm text-label-sm text-text-tertiary uppercase">إجراءات</th>
                </tr>
              </thead>
              <tbody id="services-tbody">
                <tr><td colspan="14" class="px-6 py-8 text-center text-text-secondary">
                  <div class="skeleton-shimmer h-4 rounded w-32 mx-auto"></div>
                </td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <!-- Category Modal -->
      <div id="category-modal" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 hidden items-center justify-center" role="dialog" aria-modal="true">
        <div class="bg-surface-container-lowest rounded-xl shadow-2xl border border-border w-full max-w-md mx-4">
          <div class="p-6 border-b border-outline-variant/10 bg-surface-subtle flex items-center justify-between">
            <h3 class="font-headline-md text-lg text-on-surface font-semibold">إضافة فئة خدمات</h3>
            <button id="close-category-modal" class="touch-safe w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-text-tertiary" aria-label="إغلاق نافذة الفئة">
              <span class="material-symbols-outlined" aria-hidden="true">close</span>
            </button>
          </div>
          <div class="p-6 space-y-4">
            <div>
              <label class="block font-label-sm text-label-sm text-text-tertiary mb-2">اسم الفئة *</label>
              <input class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-ibmPlexSans font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow" id="cat-name" placeholder="اسم الفئة" />
            </div>
            <div>
              <label class="block font-label-sm text-label-sm text-text-tertiary mb-2">الوصف</label>
              <textarea class="w-full bg-surface-subtle border border-border rounded-lg p-4 font-ibmPlexSans font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow resize-none" id="cat-description" rows="2" placeholder="وصف الفئة..."></textarea>
            </div>
          </div>
          <div class="p-6 border-t border-outline-variant/10 flex justify-end gap-3">
            <button class="h-[48px] px-6 bg-surface-subtle text-on-surface font-ibmPlexSans font-body-lg rounded-lg border border-border hover:bg-surface-container-low transition-colors" id="cancel-category-modal">إلغاء</button>
            <button class="h-[48px] px-6 bg-primary text-on-primary font-ibmPlexSans font-body-lg rounded-lg shadow-sm hover:shadow-lg transition-all" id="save-category">حفظ</button>
          </div>
        </div>
      </div>
      <!-- Add/Edit Modal -->
      <div id="service-modal" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 hidden items-center justify-center" role="dialog" aria-modal="true">
        <div class="bg-surface-container-lowest rounded-xl shadow-2xl border border-border w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
          <div class="p-6 border-b border-outline-variant/10 bg-surface-subtle flex items-center justify-between">
            <h3 class="font-headline-md text-lg text-on-surface font-semibold" id="modal-title">خدمة جديدة</h3>
            <button id="close-modal" class="touch-safe w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-text-tertiary" aria-label="إغلاق نافذة الخدمة">
              <span class="material-symbols-outlined" aria-hidden="true">close</span>
            </button>
          </div>
          <div class="p-6 space-y-4">
            <div>
              <label class="block font-label-sm text-label-sm text-text-tertiary mb-2">اسم الخدمة *</label>
              <input class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-ibmPlexSans font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow" id="service-name" placeholder="اسم الخدمة" required />
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block font-label-sm text-label-sm text-text-tertiary mb-2">القسم المختص <span id="dept-loading" class="text-text-tertiary text-body-xs hidden">جاري التحميل...</span></label>
                <select id="svc-department" class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-ibmPlexSans font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow">
                  <option value="">اختر القسم</option>
                </select>
              </div>
              <div>
                <label class="block font-label-sm text-label-sm text-text-tertiary mb-2">المدة المتوقعة (دقيقة)</label>
                <input type="number" id="svc-duration-minutes" class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-ibmPlexSans font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow" placeholder="60" value="60" />
              </div>
            </div>
            <div id="employee-warning" class="hidden bg-warning/10 rounded-lg p-3 text-body-sm text-warning font-medium">
              <span class="material-symbols-outlined text-[18px] align-middle">warning</span>
              هذا القسم لا يستخدم راتب ثابت — يجب اختيار الموظف المختص
            </div>
            <div id="employee-select-row" class="hidden">
              <label class="block font-label-sm text-label-sm text-text-tertiary mb-2">الموظف المختص <span id="emp-loading" class="text-text-tertiary text-body-xs hidden">جاري التحميل...</span></label>
              <select id="svc-employee" class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-ibmPlexSans font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow">
                <option value="">اختر الموظف</option>
              </select>
            </div>
            <div id="parts-section" class="bg-surface-container-low rounded-lg p-3 border border-outline-variant/10 space-y-3">
              <div class="flex items-center justify-between">
                <p class="text-xs text-text-tertiary font-medium">قطع الغيار المستخدمة</p>
                <button type="button" id="add-part-btn" class="h-[32px] bg-primary text-on-primary font-ibmPlexSans font-body-sm rounded-lg shadow-sm hover:shadow-lg transition-all flex items-center justify-center gap-1 px-3 text-body-sm">
                  <span class="material-symbols-outlined text-[16px]">add</span>
                  إضافة مادة
                </button>
              </div>
              <div id="parts-list" class="space-y-2">
                <!-- Parts rows will be added here dynamically -->
              </div>
              <div id="parts-total-display" class="bg-primary/10 rounded-lg p-2 text-body-sm text-primary font-semibold hidden">
                إجمالي تكلفة المواد: <span id="parts-total-value">0</span> ل.س
              </div>
            </div>
            <div class="bg-surface-container-low rounded-lg p-3 border border-outline-variant/10">
              <p class="text-xs text-text-tertiary mb-2 font-medium">السعر = تكلفة العمل + تكلفة المواد + الربح</p>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                <div>
                  <label class="block font-label-sm text-label-sm text-text-tertiary mb-2">تكلفة العمل (ل.س)</label>
                  <input type="number" class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-ibmPlexSans font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow" id="svc-labor-cost-syp" placeholder="0" />
                </div>
                <div>
                  <label class="block font-label-sm text-label-sm text-text-tertiary mb-2">تكلفة العمل ($)</label>
                  <input type="number" class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-ibmPlexSans font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow" id="svc-labor-cost-usd" placeholder="0" />
                </div>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                <div>
                  <label class="block font-label-sm text-label-sm text-text-tertiary mb-2">تكلفة المواد (ل.س)</label>
                  <input type="number" class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-ibmPlexSans font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow" id="svc-material-cost-syp" placeholder="0" />
                </div>
                <div>
                  <label class="block font-label-sm text-label-sm text-text-tertiary mb-2">تكلفة المواد ($)</label>
                  <input type="number" class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-ibmPlexSans font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow" id="svc-material-cost-usd" placeholder="0" />
                </div>
              </div>
              <div class="mb-3">
                <label class="block font-label-sm text-label-sm text-text-tertiary mb-2">طريقة حساب الربح</label>
                <div class="flex gap-4">
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="profit-type" value="percentage" checked id="profit-type-percentage" />
                    <span class="font-body-md text-on-surface">نسبة %</span>
                  </label>
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="profit-type" value="fixed" id="profit-type-fixed" />
                    <span class="font-body-md text-on-surface">قيمة ثابتة</span>
                  </label>
                </div>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3" id="profit-percentage-row">
                <div>
                  <label class="block font-label-sm text-label-sm text-text-tertiary mb-2">نسبة الربح (%)</label>
                  <input type="number" step="0.01" class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-ibmPlexSans font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow" id="svc-profit-margin" placeholder="25" value="25" />
                </div>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3 hidden" id="profit-fixed-row">
                <div>
                  <label class="block font-label-sm text-label-sm text-text-tertiary mb-2">قيمة الربح (ل.س)</label>
                  <input type="number" class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-ibmPlexSans font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow" id="svc-profit-syp" placeholder="0" />
                </div>
                <div>
                  <label class="block font-label-sm text-label-sm text-text-tertiary mb-2">قيمة الربح ($)</label>
                  <input type="number" class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-ibmPlexSans font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow" id="svc-profit-usd" placeholder="0" />
                </div>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block font-label-sm text-label-sm text-text-tertiary mb-2">السعر النهائي (ل.س) *</label>
                  <input type="number" min="0" step="0.01" class="w-full h-[48px] bg-surface-container-high border border-border rounded-lg px-4 font-ibmPlexSans font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow" id="service-price-syp" placeholder="0" required />
                </div>
                <div>
                  <label class="block font-label-sm text-label-sm text-text-tertiary mb-2">السعر النهائي ($)</label>
                  <input type="number" min="0" step="0.01" class="w-full h-[48px] bg-surface-container-high border border-border rounded-lg px-4 font-ibmPlexSans font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow" id="service-price-usd" placeholder="0" />
                </div>
              </div>
              <button type="button" class="w-full h-[40px] mt-2 bg-secondary text-on-secondary font-ibmPlexSans font-body-md rounded-lg shadow-sm hover:shadow-lg transition-all flex items-center justify-center gap-2" id="calc-cost-btn">
                <span class="material-symbols-outlined text-[18px]">calculate</span>
                تحليل التكلفة التفصيلي
              </button>
              <div id="cost-breakdown-results" class="hidden mt-2 bg-surface-container-low rounded-lg p-3 border border-outline-variant/10 space-y-2 text-sm"></div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label class="block font-label-sm text-label-sm text-text-tertiary mb-2">نقاط الولاء</label>
                <input type="number" class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-ibmPlexSans font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow" id="svc-loyalty" placeholder="0" />
              </div>
              <div>
                <label class="block font-label-sm text-label-sm text-text-tertiary mb-2">المدة (دقيقة) *</label>
                <input type="number" min="1" class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-ibmPlexSans font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow" id="svc-duration" placeholder="30" required />
              </div>
              <div>
                <label class="block font-label-sm text-label-sm text-text-tertiary mb-2">الفئة</label>
                <select class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg pr-4 pl-10 font-ibmPlexSans font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow appearance-none" style="background-image: url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2716%27 height=%2716%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%23475569%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Cpath d=%27M6 9l6 6 6-6%27/%3E%3C/svg%3E'); background-repeat: no-repeat; background-position: left 0.75rem center; background-size: 1rem;" id="svc-category">
                  <option value="">اختر الفئة</option>
                </select>
              </div>
            </div>
            <div>
              <label class="block font-label-sm text-label-sm text-text-tertiary mb-2">الوصف</label>
              <textarea class="w-full bg-surface-subtle border border-border rounded-lg p-4 font-ibmPlexSans font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow resize-none" id="svc-description" rows="2" placeholder="وصف الخدمة..."></textarea>
            </div>
            <div class="border border-border rounded-lg p-4 space-y-3">
              <div class="flex items-center gap-2">
                <input type="checkbox" id="svc-warranty" class="w-5 h-5 rounded border-border text-primary focus:ring-primary" />
                <label for="svc-warranty" class="font-body-md text-on-surface">تتضمن كفالة</label>
              </div>
              <div id="warranty-detail-fields" class="space-y-3">
                <div>
                  <label class="block font-label-sm text-label-sm text-text-tertiary mb-2">وصف الكفالة</label>
                  <input class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-ibmPlexSans font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow" id="svc-warranty-desc" placeholder="وصف الكفالة" />
                </div>
                <div>
                  <label class="block font-label-sm text-label-sm text-text-tertiary mb-2">شروط الكفالة</label>
                  <textarea class="w-full bg-surface-subtle border border-border rounded-lg p-4 font-ibmPlexSans font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow resize-none" id="svc-warranty-terms" rows="2" placeholder="شروط الكفالة..."></textarea>
                </div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <input type="checkbox" id="svc-active" checked class="w-5 h-5 rounded border-border text-primary focus:ring-primary" />
              <label for="svc-active" class="font-body-md text-on-surface">نشط</label>
            </div>
          </div>
          <div class="p-6 border-t border-outline-variant/10 flex justify-end gap-3">
            <button class="h-[48px] px-6 bg-surface-subtle text-on-surface font-ibmPlexSans font-body-lg rounded-lg border border-border hover:bg-surface-container-low transition-colors" id="cancel-modal">إلغاء</button>
            <button class="h-[48px] px-6 bg-primary text-on-primary font-ibmPlexSans font-body-lg rounded-lg shadow-sm hover:shadow-lg transition-all" id="save-service-btn">حفظ</button>
          </div>
        </div>
      </div>
    `

    let allServices: any[] = []
    let editingId: string | null = null

    // Load settings and categories on init
    this.loadExchangeRate()
    this.loadCategories()

    const filterAndRender = () => {
      const searchInput = content.querySelector('#service-search') as HTMLInputElement
      const statusSelect = content.querySelector('#status-filter') as HTMLSelectElement
      const searchTerm = searchInput?.value?.trim().toLowerCase() || ''
      const statusFilter = statusSelect?.value || ''

      let filtered = allServices
      if (statusFilter === 'active') {
        filtered = filtered.filter((s: any) => s.isActive)
      } else if (statusFilter === 'inactive') {
        filtered = filtered.filter((s: any) => !s.isActive)
      }
      if (searchTerm) {
        filtered = filtered.filter((s: any) => {
          const name = (s.name || '').toLowerCase()
          const category = (s.category || '').toLowerCase()
          const warrantyDesc = (s.warrantyDescription || '').toLowerCase()
          const warrantyTerms = (s.warrantyTerms || '').toLowerCase()
          return name.includes(searchTerm) || category.includes(searchTerm) || warrantyDesc.includes(searchTerm) || warrantyTerms.includes(searchTerm)
        })
      }
      this.renderServices(content, filtered)
    }

    this.loadServices(content, (services) => {
      allServices = services
      filterAndRender()
    })

    // Event listeners
    content.querySelector('#new-service-btn')?.addEventListener('click', () => {
      editingId = null
      this.openModal(content, null)
    })
    content.querySelector('#service-search')?.addEventListener('input', filterAndRender)
    content.querySelector('#status-filter')?.addEventListener('change', filterAndRender)
    content.querySelector('#clear-filters')?.addEventListener('click', () => {
      const searchInput = content.querySelector('#service-search') as HTMLInputElement
      const statusSelect = content.querySelector('#status-filter') as HTMLSelectElement
      if (searchInput) searchInput.value = ''
      if (statusSelect) statusSelect.value = ''
      filterAndRender()
    })
    // Category modal events
    content.querySelector('#manage-categories-btn')?.addEventListener('click', () => {
      const modal = content.querySelector('#category-modal') as HTMLElement
      if (modal) {
        modal.classList.remove('hidden')
        modal.classList.add('flex')
      }
    })
    content.querySelector('#close-category-modal')?.addEventListener('click', () => {
      const modal = content.querySelector('#category-modal') as HTMLElement
      if (modal) {
        modal.classList.add('hidden')
        modal.classList.remove('flex')
      }
    })
    content.querySelector('#cancel-category-modal')?.addEventListener('click', () => {
      const modal = content.querySelector('#category-modal') as HTMLElement
      if (modal) {
        modal.classList.add('hidden')
        modal.classList.remove('flex')
      }
    })
    content.querySelector('#save-category')?.addEventListener('click', async () => {
      const name = (content.querySelector('#cat-name') as HTMLInputElement)?.value.trim()
      const description = (content.querySelector('#cat-description') as HTMLTextAreaElement)?.value.trim()
      if (!name) {
        ;(window as any).toast?.show?.({ message: 'اسم الفئة مطلوب', type: 'warning' })
        return
      }
      try {
        const res = await this.api.post<any>('/api/service-categories', { name, description })
        if (res.success !== false) {
          const modal = content.querySelector('#category-modal') as HTMLElement
          if (modal) {
            modal.classList.add('hidden')
            modal.classList.remove('flex')
          }
          ;(content.querySelector('#cat-name') as HTMLInputElement).value = ''
          ;(content.querySelector('#cat-description') as HTMLTextAreaElement).value = ''
          await this.loadCategories()
          ;(window as any).toast?.show?.({ message: 'تم إضافة الفئة بنجاح', type: 'success' })
        } else {
          ;(window as any).toast?.show?.({ message: res.message || 'فشل إضافة الفئة', type: 'error' })
        }
      } catch {
        ;(window as any).toast?.show?.({ message: 'حدث خطأ أثناء إضافة الفئة', type: 'error' })
      }
    })

    content.querySelector('#close-modal')?.addEventListener('click', () => this.closeModal(content))
    content.querySelector('#cancel-modal')?.addEventListener('click', () => this.closeModal(content))
    content.querySelector('#save-service-btn')?.addEventListener('click', async () => {
      await this.saveService(content, editingId, () => {
        this.loadServices(content, (services) => {
          allServices = services
          filterAndRender()
        })
      })
    })

    content.querySelector('#calc-cost-btn')?.addEventListener('click', async () => {
      await this.calculateCostBreakdown(content)
    })

    return layout.render(content)
  }

  private async loadServices(el: HTMLElement, callback?: (services: any[]) => void) {
    try {
      const res = await this.api.get<any>('/api/services')
      const tbody = el.querySelector('#services-tbody')!
      if (res.success !== false && res.data) {
        const services = Array.isArray(res.data) ? res.data : res.data.data || []
        if (callback) {
          callback(services)
          return
        }
        this.renderServices(el, services)
      } else {
        tbody.innerHTML = `<tr><td colspan="14" class="px-6 py-8 text-center text-text-secondary font-body-md">لا توجد خدمات</td></tr>`
      }
    } catch {
      const tbody = el.querySelector('#services-tbody')!
      tbody.innerHTML = `<tr><td colspan="14" class="px-6 py-8 text-center text-error font-body-md">حدث خطأ أثناء التحميل</td></tr>`
    }
  }

  private renderServices(el: HTMLElement, services: any[]) {
    const tbody = el.querySelector('#services-tbody')!
    if (services.length === 0) {
      tbody.innerHTML = `<tr><td colspan="14" class="px-6 py-8 text-center text-text-secondary font-body-md">لا توجد خدمات</td></tr>`
      return
    }
    tbody.innerHTML = services.map((s: any) => `
      <tr class="border-b border-outline-variant/10 hover:bg-surface-container-low/50 transition-colors">
        <td class="px-6 py-4">
          <div class="font-body-md text-on-surface font-medium">${s.name || '-'}</div>
          <div class="text-sm text-text-tertiary">${s.description || ''}</div>
        </td>
        <td class="px-6 py-4 font-body-md text-on-surface">${s.category || '-'}</td>
        <td class="px-6 py-4 font-body-md text-on-surface">${s.priceSYP ? Number(s.priceSYP).toLocaleString() + ' ل.س' : '-'}</td>
        <td class="px-6 py-4 font-body-md text-on-surface">${s.priceUSD ? '$' + Number(s.priceUSD).toLocaleString() : '-'}</td>
        <td class="px-6 py-4 font-body-md text-on-surface">${s.laborCostSYP ? Number(s.laborCostSYP).toLocaleString() + ' ل.س' : '-'}</td>
        <td class="px-6 py-4 font-body-md text-on-surface">${s.materialCostSYP ? Number(s.materialCostSYP).toLocaleString() + ' ل.س' : '-'}</td>
        <td class="px-6 py-4 font-body-md text-on-surface">${s.profitAmountSYP ? Number(s.profitAmountSYP).toLocaleString() + ' ل.س' : '-'}</td>
        <td class="px-6 py-4 font-body-md text-on-surface">${s.loyaltyPoints || 0}</td>
        <td class="px-6 py-4" title="${s.hasWarranty ? ((s.warrantyDescription || '') + (s.warrantyTerms ? ' | ' + s.warrantyTerms : '')) : ''}">${s.hasWarranty ? '<span class="inline-flex items-center px-2 py-1 rounded-full font-label-sm text-label-sm bg-tertiary/10 text-tertiary">نعم</span>' : '<span class="inline-flex items-center px-2 py-1 rounded-full font-label-sm text-label-sm bg-surface-container-high text-text-secondary">لا</span>'}</td>
        <td class="px-6 py-4 font-body-md text-on-surface">${s.hasWarranty ? (s.warrantyDescription || '-') : '-'}</td>
        <td class="px-6 py-4 font-body-md text-on-surface">${s.hasWarranty ? (s.warrantyTerms || '-') : '-'}</td>
        <td class="px-6 py-4 font-body-md text-on-surface">${s.estimatedDurationMinutes || s.duration || '-'}</td>
        <td class="px-6 py-4">${this.statusBadge(s.isActive)}</td>
        <td class="px-6 py-4">
          <div class="flex items-center gap-2">
            <button class="touch-safe w-8 h-8 rounded-lg hover:bg-surface-container flex items-center justify-center text-text-tertiary hover:text-info transition-colors" title="تعديل" aria-label="تعديل الخدمة" data-action="edit" data-id="${s.id}">
              <span class="material-symbols-outlined text-[18px]" aria-hidden="true">edit</span>
            </button>
            <button class="touch-safe w-8 h-8 rounded-lg hover:bg-surface-container flex items-center justify-center text-text-tertiary hover:text-error transition-colors" title="حذف" aria-label="حذف الخدمة" data-action="delete" data-id="${s.id}">
              <span class="material-symbols-outlined text-[18px]" aria-hidden="true">delete</span>
            </button>
          </div>
        </td>
      </tr>
    `).join('')

    tbody.querySelectorAll('[data-action="edit"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id')
        if (id) {
          const service = services.find((s: any) => s.id === id)
          this.openModal(el, service, id)
        }
      })
    })
    tbody.querySelectorAll('[data-action="delete"]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id')
        if (id && confirm('هل أنت متأكد من حذف هذه الخدمة؟')) {
          try {
            const res = await this.api.delete<any>(`/api/services/${id}`)
            if (res.success !== false) {
              this.loadServices(el, (services) => this.renderServices(el, services))
            } else {
              ;(window as any).toast?.show?.({ message: res.message || 'فشل الحذف', type: 'error' })
            }
          } catch {
            ;(window as any).toast?.show?.({ message: 'حدث خطأ أثناء الحذف', type: 'error' })
          }
        }
      })
    })
  }

  private statusBadge(isActive: boolean): string {
    if (isActive) {
      return `<span class="inline-flex items-center px-3 py-1 rounded-full font-label-sm text-label-sm bg-tertiary/10 text-tertiary">نشط</span>`
    }
    return `<span class="inline-flex items-center px-3 py-1 rounded-full font-label-sm text-label-sm bg-surface-container-high text-text-secondary">غير نشط</span>`
  }

  private setupAutoCalculation(el: HTMLElement) {
    const laborCostSYP = el.querySelector('#svc-labor-cost-syp') as HTMLInputElement
    const materialCostSYP = el.querySelector('#svc-material-cost-syp') as HTMLInputElement
    const profitMargin = el.querySelector('#svc-profit-margin') as HTMLInputElement
    const profitSYP = el.querySelector('#svc-profit-syp') as HTMLInputElement
    const profitUSD = el.querySelector('#svc-profit-usd') as HTMLInputElement
    const priceSYP = el.querySelector('#service-price-syp') as HTMLInputElement
    const priceUSD = el.querySelector('#service-price-usd') as HTMLInputElement
    const laborCostUSD = el.querySelector('#svc-labor-cost-usd') as HTMLInputElement
    const materialCostUSD = el.querySelector('#svc-material-cost-usd') as HTMLInputElement
    const profitTypePercentage = el.querySelector('#profit-type-percentage') as HTMLInputElement
    const profitTypeFixed = el.querySelector('#profit-type-fixed') as HTMLInputElement
    const profitPercentageRow = el.querySelector('#profit-percentage-row') as HTMLElement
    const profitFixedRow = el.querySelector('#profit-fixed-row') as HTMLElement

    const getProfitType = () => {
      if (profitTypeFixed?.checked) return 'fixed'
      return 'percentage'
    }

    const toggleProfitInputs = () => {
      const type = getProfitType()
      if (type === 'fixed') {
        profitPercentageRow?.classList.add('hidden')
        profitFixedRow?.classList.remove('hidden')
      } else {
        profitPercentageRow?.classList.remove('hidden')
        profitFixedRow?.classList.add('hidden')
      }
      calcSYP()
      calcUSD()
    }

    profitTypePercentage?.addEventListener('change', toggleProfitInputs)
    profitTypeFixed?.addEventListener('change', toggleProfitInputs)

    // Price calculation:
    // percentage: Price = (labor + material) × (1 + profitMargin/100)
    // fixed: Price = (labor + material) + profitAmount
    const calcSYP = () => {
      const labor = parseFloat(laborCostSYP?.value) || 0
      const material = parseFloat(materialCostSYP?.value) || 0
      const directCost = labor + material
      let finalPrice = 0

      if (getProfitType() === 'fixed') {
        const profit = parseFloat(profitSYP?.value) || 0
        finalPrice = directCost + profit
      } else {
        const pm = (parseFloat(profitMargin?.value) || 25) / 100
        finalPrice = directCost * (1 + pm)
      }

      if (priceSYP && !priceSYP.dataset.userEdited) {
        priceSYP.value = String(Math.round(finalPrice))
      }
    }

    const calcUSD = () => {
      const labor = parseFloat(laborCostUSD?.value) || 0
      const material = parseFloat(materialCostUSD?.value) || 0
      const directCost = labor + material
      let finalPrice = 0

      if (getProfitType() === 'fixed') {
        const profit = parseFloat(profitUSD?.value) || 0
        finalPrice = directCost + profit
      } else {
        const pm = (parseFloat(profitMargin?.value) || 25) / 100
        finalPrice = directCost * (1 + pm)
      }

      if (priceUSD && !priceUSD.dataset.userEdited) {
        priceUSD.value = String(finalPrice > 0 ? finalPrice.toFixed(2) : '')
      }
    }

    const convertSYPtoUSD = () => {
      const syp = parseFloat(priceSYP?.value) || 0
      if (syp > 0 && priceUSD && !priceUSD.dataset.userEdited) {
        const usd = syp / this.exchangeRate
        priceUSD.value = String(usd.toFixed(2))
      }
    }

    // Mark price as user-edited when manually changed
    priceSYP?.addEventListener('input', () => { priceSYP.dataset.userEdited = 'true' })
    priceUSD?.addEventListener('input', () => { priceUSD.dataset.userEdited = 'true' })

    laborCostSYP?.addEventListener('input', calcSYP)
    materialCostSYP?.addEventListener('input', calcSYP)
    laborCostUSD?.addEventListener('input', calcUSD)
    materialCostUSD?.addEventListener('input', calcUSD)
    profitMargin?.addEventListener('input', () => { calcSYP(); calcUSD() })
    profitSYP?.addEventListener('input', () => { calcSYP(); convertSYPtoUSD() })
    profitUSD?.addEventListener('input', calcUSD)
    priceSYP?.addEventListener('blur', convertSYPtoUSD)
  }

  private async loadDepartmentsForService(el: HTMLElement) {
    const select = el.querySelector('#svc-department') as HTMLSelectElement
    const loading = el.querySelector('#dept-loading') as HTMLElement
    loading?.classList.remove('hidden')
    try {
      const res: any = await this.api.get('/api/departments')
      const depts = res.data?.data || res.data || []
      select.innerHTML = '<option value="">اختر القسم</option>'
      depts.forEach((d: any) => {
        const opt = document.createElement('option')
        opt.value = d.id
        opt.textContent = d.nameAr || d.name || 'غير مسمى'
        opt.dataset.hasFixedSalary = d.hasFixedSalary ? 'true' : 'false'
        opt.dataset.hourlyRate = d.calculatedHourlyRateSYP || ''
        select.appendChild(opt)
      })
    } catch { /* ignore */ }
    loading?.classList.add('hidden')
  }

  private async loadEmployeesForService(el: HTMLElement, departmentId: string) {
    const select = el.querySelector('#svc-employee') as HTMLSelectElement
    const loading = el.querySelector('#emp-loading') as HTMLElement
    loading?.classList.remove('hidden')
    try {
      const res: any = await this.api.get(`/api/employees?departmentId=${departmentId}`)
      const employees = res.data?.employees || res.data || []
      select.innerHTML = '<option value="">اختر الموظف</option>'
      employees.forEach((e: any) => {
        const opt = document.createElement('option')
        opt.value = e.id
        opt.textContent = e.fullNameAr || e.name || 'غير مسمى'
        opt.dataset.hourlyRate = e.hourlyRate || ''
        select.appendChild(opt)
      })
    } catch { /* ignore */ }
    loading?.classList.add('hidden')
  }

  private setupWarrantyToggle(el: HTMLElement) {
    const checkbox = el.querySelector('#svc-warranty') as HTMLInputElement
    const fields = el.querySelector('#warranty-detail-fields') as HTMLElement
    if (!checkbox || !fields) return
    const update = () => {
      if (checkbox.checked) {
        fields.classList.remove('hidden')
      } else {
        fields.classList.add('hidden')
      }
    }
    checkbox.addEventListener('change', update)
    update()
  }

  private setupDepartmentEmployeeLogic(el: HTMLElement) {
    const deptSelect = el.querySelector('#svc-department') as HTMLSelectElement
    const empSelectRow = el.querySelector('#employee-select-row') as HTMLElement
    const empWarning = el.querySelector('#employee-warning') as HTMLElement
    const empSelect = el.querySelector('#svc-employee') as HTMLSelectElement
    const durationInput = el.querySelector('#svc-duration-minutes') as HTMLInputElement
    const laborCostSYP = el.querySelector('#svc-labor-cost-syp') as HTMLInputElement

    deptSelect?.addEventListener('change', async () => {
      const selectedOption = deptSelect.selectedOptions[0]
      const hasFixedSalary = selectedOption?.dataset.hasFixedSalary === 'true'
      const deptHourlyRate = selectedOption?.dataset.hourlyRate
      const deptId = deptSelect.value

      if (!deptId) {
        empSelectRow.classList.add('hidden')
        empWarning.classList.add('hidden')
        return
      }

      if (hasFixedSalary) {
        empSelectRow.classList.add('hidden')
        empWarning.classList.add('hidden')
        // Auto-calculate labor cost
        const duration = parseFloat(durationInput?.value) || 60
        if (deptHourlyRate) {
          const laborCost = Math.round(Number(deptHourlyRate) * (duration / 60))
          laborCostSYP.value = String(laborCost)
          laborCostSYP.dispatchEvent(new Event('input'))
        }
      } else {
        empWarning.classList.remove('hidden')
        empSelectRow.classList.remove('hidden')
        await this.loadEmployeesForService(el, deptId)
      }
    })

    empSelect?.addEventListener('change', () => {
      const selectedOption = empSelect.selectedOptions[0]
      const empHourlyRate = selectedOption?.dataset.hourlyRate
      const duration = parseFloat(durationInput?.value) || 60
      if (empHourlyRate) {
        const laborCost = Math.round(Number(empHourlyRate) * (duration / 60))
        laborCostSYP.value = String(laborCost)
        laborCostSYP.dispatchEvent(new Event('input'))
      }
    })

    durationInput?.addEventListener('input', () => {
      const deptId = deptSelect.value
      if (!deptId) return
      const selectedOption = deptSelect.selectedOptions[0]
      const hasFixedSalary = selectedOption?.dataset.hasFixedSalary === 'true'
      const duration = parseFloat(durationInput?.value) || 60
      if (hasFixedSalary) {
        const deptHourlyRate = selectedOption?.dataset.hourlyRate
        if (deptHourlyRate) {
          const laborCost = Math.round(Number(deptHourlyRate) * (duration / 60))
          laborCostSYP.value = String(laborCost)
          laborCostSYP.dispatchEvent(new Event('input'))
        }
      } else {
        const empOption = empSelect.selectedOptions[0]
        const empHourlyRate = empOption?.dataset.hourlyRate
        if (empHourlyRate) {
          const laborCost = Math.round(Number(empHourlyRate) * (duration / 60))
          laborCostSYP.value = String(laborCost)
          laborCostSYP.dispatchEvent(new Event('input'))
        }
      }
    })
  }

  private partsData: any[] = []

  private async loadPartsForService(_el: HTMLElement) {
    try {
      const res: any = await this.api.get('/api/parts')
      this.partsData = res.data?.data || res.data || []
    } catch { /* ignore */ }
  }

  private createPartRowHtml(partId: string = '', quantity: string = '1'): string {
    const options = this.partsData.map((p: any) =>
      `<option value="${p.id}" ${p.id === partId ? 'selected' : ''} data-cost="${p.costSYP || 0}">${p.name || p.nameAr || 'غير مسمى'} (${p.partNumber || ''})</option>`
    ).join('')
    return `
      <div class="part-row flex items-center gap-2 bg-surface-subtle rounded-lg p-2 border border-outline-variant/10">
        <select class="part-select flex-1 h-[36px] bg-surface-container-high border border-outline-variant rounded-lg px-2 text-body-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all">
          <option value="">اختر المادة</option>
          ${options}
        </select>
        <input type="number" min="1" value="${quantity}" class="part-qty w-[70px] h-[36px] bg-surface-container-high border border-outline-variant rounded-lg px-2 text-body-sm text-on-surface text-center focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" placeholder="1" />
        <span class="part-cost text-body-xs text-text-tertiary whitespace-nowrap"></span>
        <button type="button" class="remove-part-btn w-[28px] h-[28px] rounded-full hover:bg-error/10 text-error flex items-center justify-center transition-all">
          <span class="material-symbols-outlined text-[16px]">close</span>
        </button>
      </div>
    `
  }

  private updatePartsTotal(el: HTMLElement) {
    const materialCostSYP = el.querySelector('#svc-material-cost-syp') as HTMLInputElement
    const totalDisplay = el.querySelector('#parts-total-display') as HTMLElement
    const totalValue = el.querySelector('#parts-total-value') as HTMLElement
    let total = 0

    el.querySelectorAll('.part-row').forEach((row) => {
      const select = row.querySelector('.part-select') as HTMLSelectElement
      const qtyInput = row.querySelector('.part-qty') as HTMLInputElement
      const costSpan = row.querySelector('.part-cost') as HTMLElement
      if (select.value) {
        const part = this.partsData.find((p: any) => p.id === select.value)
        const cost = part?.costSYP ? Number(part.costSYP) : 0
        const qty = parseInt(qtyInput?.value) || 1
        const lineTotal = cost * qty
        total += lineTotal
        if (costSpan) costSpan.textContent = `${lineTotal} ل.س`
      }
    })

    if (total > 0) {
      totalValue.textContent = String(total)
      totalDisplay.classList.remove('hidden')
      if (materialCostSYP) {
        materialCostSYP.value = String(total)
        materialCostSYP.dispatchEvent(new Event('input'))
      }
    } else {
      totalDisplay.classList.add('hidden')
    }
  }

  private setupPartsLogic(el: HTMLElement) {
    const addPartBtn = el.querySelector('#add-part-btn')
    const partsList = el.querySelector('#parts-list')

    addPartBtn?.addEventListener('click', () => {
      const row = document.createElement('div')
      row.innerHTML = this.createPartRowHtml()
      partsList?.appendChild(row.firstElementChild!)
      this.bindPartRowEvents(el, partsList?.lastElementChild as HTMLElement)
      this.updatePartsTotal(el)
    })
  }

  private bindPartRowEvents(el: HTMLElement, row: HTMLElement) {
    const select = row.querySelector('.part-select')
    const qty = row.querySelector('.part-qty')
    const removeBtn = row.querySelector('.remove-part-btn')

    select?.addEventListener('change', () => this.updatePartsTotal(el))
    qty?.addEventListener('input', () => this.updatePartsTotal(el))
    removeBtn?.addEventListener('click', () => {
      row.remove()
      this.updatePartsTotal(el)
    })
  }

  private populateParts(el: HTMLElement, parts: any[]) {
    const partsList = el.querySelector('#parts-list')
    if (!partsList) return
    partsList.innerHTML = ''
    parts?.forEach((p: any) => {
      const row = document.createElement('div')
      row.innerHTML = this.createPartRowHtml(p.partId, String(p.quantity))
      partsList.appendChild(row.firstElementChild!)
      this.bindPartRowEvents(el, partsList.lastElementChild as HTMLElement)
    })
    this.updatePartsTotal(el)
  }

  private openModal(el: HTMLElement, service: any | null, editingId?: string) {
    const modal = el.querySelector('#service-modal') as HTMLElement
    const title = el.querySelector('#modal-title') as HTMLElement
    title.textContent = service ? 'تعديل خدمة' : 'خدمة جديدة'

    ;(el.querySelector('#service-name') as HTMLInputElement).value = service?.name || ''
    ;(el.querySelector('#service-price-syp') as HTMLInputElement).value = service?.priceSYP?.toString() || ''
    ;(el.querySelector('#service-price-usd') as HTMLInputElement).value = service?.priceUSD?.toString() || ''
    ;(el.querySelector('#svc-labor-cost-syp') as HTMLInputElement).value = service?.laborCostSYP?.toString() || ''
    ;(el.querySelector('#svc-labor-cost-usd') as HTMLInputElement).value = service?.laborCostUSD?.toString() || ''
    ;(el.querySelector('#svc-material-cost-syp') as HTMLInputElement).value = service?.materialCostSYP?.toString() || ''
    ;(el.querySelector('#svc-material-cost-usd') as HTMLInputElement).value = service?.materialCostUSD?.toString() || ''
    ;(el.querySelector('#svc-profit-syp') as HTMLInputElement).value = service?.profitAmountSYP?.toString() || ''
    ;(el.querySelector('#svc-profit-usd') as HTMLInputElement).value = service?.profitAmountUSD?.toString() || ''
    ;(el.querySelector('#svc-profit-margin') as HTMLInputElement).value = service?.profitMargin?.toString() || '25'
    const profitType = service?.profitType || 'percentage'
    ;(el.querySelector('#profit-type-percentage') as HTMLInputElement).checked = profitType === 'percentage'
    ;(el.querySelector('#profit-type-fixed') as HTMLInputElement).checked = profitType === 'fixed'
    const profitPercentageRow = el.querySelector('#profit-percentage-row') as HTMLElement
    const profitFixedRow = el.querySelector('#profit-fixed-row') as HTMLElement
    if (profitType === 'fixed') {
      profitPercentageRow?.classList.add('hidden')
      profitFixedRow?.classList.remove('hidden')
    } else {
      profitPercentageRow?.classList.remove('hidden')
      profitFixedRow?.classList.add('hidden')
    }
    ;(el.querySelector('#svc-loyalty') as HTMLInputElement).value = service?.loyaltyPoints?.toString() || '0'
    ;(el.querySelector('#svc-duration') as HTMLInputElement).value = service?.estimatedDurationMinutes?.toString() || service?.duration?.toString() || ''
    ;(el.querySelector('#svc-description') as HTMLTextAreaElement).value = service?.description || ''
    ;(el.querySelector('#svc-warranty') as HTMLInputElement).checked = service ? !!service.hasWarranty : false
    ;(el.querySelector('#svc-warranty-desc') as HTMLInputElement).value = service?.warrantyDescription || ''
    ;(el.querySelector('#svc-warranty-terms') as HTMLTextAreaElement).value = service?.warrantyTerms || ''
    ;(el.querySelector('#svc-active') as HTMLInputElement).checked = service ? service.isActive !== false : true

    this.populateCategorySelect(el, service?.category || '')

    // Load departments and setup department/employee logic
    this.loadDepartmentsForService(el).then(() => {
      if (service?.departmentId) {
        const deptSelect = el.querySelector('#svc-department') as HTMLSelectElement
        deptSelect.value = service.departmentId
        // Trigger change to load employees if needed
        deptSelect.dispatchEvent(new Event('change'))
        if (service?.assignedEmployeeId) {
          setTimeout(() => {
            const empSelect = el.querySelector('#svc-employee') as HTMLSelectElement
            empSelect.value = service.assignedEmployeeId
          }, 300)
        }
      }
    })
    this.setupDepartmentEmployeeLogic(el)

    // Load parts and setup parts logic
    this.loadPartsForService(el).then(() => {
      this.setupPartsLogic(el)
      if (service?.parts && service.parts.length > 0) {
        this.populateParts(el, service.parts)
      } else {
        // Clear parts list for new service
        const partsList = el.querySelector('#parts-list')
        if (partsList) partsList.innerHTML = ''
        const totalDisplay = el.querySelector('#parts-total-display')
        if (totalDisplay) totalDisplay.classList.add('hidden')
      }
    })

    // Setup auto-calculation listeners
    this.setupAutoCalculation(el)
    this.setupWarrantyToggle(el)

    if (editingId) {
      modal.dataset.editingId = editingId
    } else {
      delete modal.dataset.editingId
    }

    modal.classList.remove('hidden')
    modal.classList.add('flex')
  }

  private closeModal(el: HTMLElement) {
    const modal = el.querySelector('#service-modal') as HTMLElement
    modal.classList.add('hidden')
    modal.classList.remove('flex')
    delete modal.dataset.editingId
  }

  private async saveService(el: HTMLElement, _editingId: string | null, onDone: () => void) {
    const name = (el.querySelector('#service-name') as HTMLInputElement).value.trim()
    const priceSYP = parseFloat((el.querySelector('#service-price-syp') as HTMLInputElement).value) || 0
    const priceUSD = parseFloat((el.querySelector('#service-price-usd') as HTMLInputElement).value) || undefined
    const laborCostSYP = parseFloat((el.querySelector('#svc-labor-cost-syp') as HTMLInputElement).value) || undefined
    const laborCostUSD = parseFloat((el.querySelector('#svc-labor-cost-usd') as HTMLInputElement).value) || undefined
    const materialCostSYP = parseFloat((el.querySelector('#svc-material-cost-syp') as HTMLInputElement).value) || undefined
    const materialCostUSD = parseFloat((el.querySelector('#svc-material-cost-usd') as HTMLInputElement).value) || undefined
    const profitType = (el.querySelector('input[name="profit-type"]:checked') as HTMLInputElement)?.value || 'percentage'
    const profitMargin = parseFloat((el.querySelector('#svc-profit-margin') as HTMLInputElement).value) || undefined
    const profitAmountSYP = parseFloat((el.querySelector('#svc-profit-syp') as HTMLInputElement).value) || undefined
    const profitAmountUSD = parseFloat((el.querySelector('#svc-profit-usd') as HTMLInputElement).value) || undefined
    const loyaltyPoints = parseInt((el.querySelector('#svc-loyalty') as HTMLInputElement).value) || undefined
    const duration = parseInt((el.querySelector('#svc-duration') as HTMLInputElement).value) || undefined
    const category = (el.querySelector('#svc-category') as HTMLInputElement).value.trim() || undefined
    const description = (el.querySelector('#svc-description') as HTMLTextAreaElement).value.trim() || undefined
    const hasWarranty = (el.querySelector('#svc-warranty') as HTMLInputElement).checked
    const warrantyDescription = hasWarranty
      ? (el.querySelector('#svc-warranty-desc') as HTMLInputElement).value.trim() || undefined
      : undefined
    const warrantyTerms = hasWarranty
      ? (el.querySelector('#svc-warranty-terms') as HTMLTextAreaElement).value.trim() || undefined
      : undefined
    const isActive = (el.querySelector('#svc-active') as HTMLInputElement).checked
    const departmentId = (el.querySelector('#svc-department') as HTMLSelectElement).value || undefined
    const assignedEmployeeId = (el.querySelector('#svc-employee') as HTMLSelectElement).value || undefined

    // Collect parts from UI
    const parts: { partId: string; quantity: number }[] = []
    el.querySelectorAll('.part-row').forEach((row) => {
      const select = row.querySelector('.part-select') as HTMLSelectElement
      const qtyInput = row.querySelector('.part-qty') as HTMLInputElement
      if (select.value && qtyInput.value) {
        parts.push({
          partId: select.value,
          quantity: parseInt(qtyInput.value) || 1,
        })
      }
    })

    if (!name) {
      ;(window as any).toast?.show?.({ message: 'اسم الخدمة مطلوب', type: 'warning' })
      return
    }
    if (priceSYP <= 0) {
      ;(window as any).toast?.show?.({ message: 'السعر بالليرة السورية يجب أن يكون أكبر من صفر', type: 'warning' })
      return
    }

    const payload: any = {
      name,
      priceSYP,
      priceUSD,
      laborCostSYP,
      laborCostUSD,
      materialCostSYP,
      materialCostUSD,
      profitType,
      profitMargin,
      profitAmountSYP,
      profitAmountUSD,
      loyaltyPoints,
      estimatedDurationMinutes: duration,
      category,
      description,
      hasWarranty,
      warrantyDescription,
      warrantyTerms,
      isActive,
      departmentId,
      assignedEmployeeId,
      parts: parts.length > 0 ? parts : undefined,
    }

    try {
      const modal = el.querySelector('#service-modal') as HTMLElement
      const id = modal.dataset.editingId
      let res: any
      if (id) {
        res = await this.api.put<any>(`/api/services/${id}`, payload)
      } else {
        res = await this.api.post<any>('/api/services', payload)
      }
      if (res.success !== false) {
        this.closeModal(el)
        onDone()
      } else {
        ;(window as any).toast?.show?.({ message: res.message || res.error || 'فشل الحفظ', type: 'error' })
      }
    } catch {
      ;(window as any).toast?.show?.({ message: 'حدث خطأ أثناء الحفظ', type: 'error' })
    }
  }

  private async calculateCostBreakdown(el: HTMLElement) {
    const laborCostSYP = parseFloat((el.querySelector('#svc-labor-cost-syp') as HTMLInputElement)?.value) || 0
    const materialCostSYP = parseFloat((el.querySelector('#svc-material-cost-syp') as HTMLInputElement)?.value) || 0
    const profitAmountSYP = parseFloat((el.querySelector('#svc-profit-syp') as HTMLInputElement)?.value) || 0
    const profitMargin = parseFloat((el.querySelector('#svc-profit-margin') as HTMLInputElement)?.value) || 0
    const profitType = (el.querySelector('input[name="profit-type"]:checked') as HTMLInputElement)?.value || 'percentage'
    const estimatedDurationMinutes = parseInt((el.querySelector('#svc-duration') as HTMLInputElement)?.value) || 60
    const serviceId = (el.querySelector('#service-modal') as HTMLElement)?.dataset?.editingId || 'new'

    const resultsDiv = el.querySelector('#cost-breakdown-results') as HTMLElement
    resultsDiv.classList.remove('hidden')
    resultsDiv.innerHTML = '<div class="text-center py-2 text-text-secondary">جاري الحساب...</div>'

    try {
      const payload: any = {
        serviceId,
        laborCostSYP,
        materialCostSYP,
        estimatedDurationMinutes,
      }
      if (profitType === 'fixed') {
        payload.profitAmountSYP = profitAmountSYP
      } else {
        payload.profitPercent = profitMargin
      }
      const res = await this.api.post<any>('/api/cost-centers/service-cost', payload)
      if (res.success && res.data) {
        const d = res.data
        resultsDiv.innerHTML = `
          <div class="grid grid-cols-2 gap-2 font-body-md">
            <div class="text-text-secondary">تكلفة العمل المباشر:</div>
            <div class="text-on-surface font-semibold">${d.directLaborSYP.toLocaleString('ar-SA')} ل.س</div>
            <div class="text-text-secondary">تكلفة المواد المباشرة:</div>
            <div class="text-on-surface font-semibold">${d.directMaterialSYP.toLocaleString('ar-SA')} ل.س</div>
            <div class="text-text-secondary">Overhead متغير:</div>
            <div class="text-on-surface font-semibold">${d.variableOverheadSYP.toLocaleString('ar-SA')} ل.س</div>
            <div class="text-text-secondary">Overhead ثابت:</div>
            <div class="text-on-surface font-semibold">${d.fixedOverheadSYP.toLocaleString('ar-SA')} ل.س</div>
            <div class="text-text-secondary">الاستهلاك:</div>
            <div class="text-on-surface font-semibold">${d.depreciationSYP.toLocaleString('ar-SA')} ل.س</div>
            <div class="border-t border-border pt-1 text-text-secondary font-bold">إجمالي التكلفة:</div>
            <div class="border-t border-border pt-1 text-primary font-bold">${d.totalCostSYP.toLocaleString('ar-SA')} ل.س</div>
            <div class="text-text-secondary">الربح:</div>
            <div class="text-on-surface font-semibold">${d.profitAmountSYP.toLocaleString('ar-SA')} ل.س</div>
            <div class="border-t border-border pt-1 text-text-secondary font-bold text-success">السعر النهائي:</div>
            <div class="border-t border-border pt-1 text-success font-bold text-lg">${d.finalPriceSYP.toLocaleString('ar-SA')} ل.س</div>
          </div>
        `
        // Auto-fill the price field
        const priceInput = el.querySelector('#service-price-syp') as HTMLInputElement
        if (priceInput && !priceInput.value) {
          priceInput.value = Math.round(d.finalPriceSYP).toString()
        }

        // Offer to save cost details
        const saveBtn = document.createElement('button')
        saveBtn.className = 'w-full h-[36px] mt-2 bg-primary text-on-primary font-body-md rounded-lg flex items-center justify-center gap-2'
        saveBtn.innerHTML = '<span class="material-symbols-outlined text-[16px]">save</span> حفظ تفاصيل التكلفة'
        saveBtn.addEventListener('click', async () => {
          saveBtn.disabled = true
          saveBtn.innerHTML = '<span class="material-symbols-outlined text-[16px] animate-spin">sync</span> جاري الحفظ...'
          try {
            const detailsPayload = d.costDetails?.map((cd: any) => ({
              costCenterId: cd.costCenterId,
              assetId: cd.assetId,
              costType: cd.costType,
              amountSYP: cd.amountSYP,
              amountUSD: cd.amountUSD,
            })) || []
            const saveRes = await this.api.post<any>(`/api/cost-centers/service-cost/${serviceId}`, { details: detailsPayload })
            if (saveRes.success) {
              saveBtn.innerHTML = '<span class="material-symbols-outlined text-[16px]">check</span> تم الحفظ'
              saveBtn.classList.replace('bg-primary', 'bg-success')
            } else {
              saveBtn.innerHTML = '<span class="material-symbols-outlined text-[16px]">error</span> فشل'
              saveBtn.classList.replace('bg-primary', 'bg-error')
            }
          } catch {
            saveBtn.innerHTML = '<span class="material-symbols-outlined text-[16px]">error</span> خطأ'
            saveBtn.classList.replace('bg-primary', 'bg-error')
          }
        })
        resultsDiv.appendChild(saveBtn)
      } else {
        resultsDiv.innerHTML = '<div class="text-error text-center py-2">فشل الحساب</div>'
      }
    } catch (e: any) {
      resultsDiv.innerHTML = '<div class="text-error text-center py-2">خطأ في الاتصال بالخادم</div>'
    }
  }
}
