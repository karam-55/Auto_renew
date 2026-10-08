import { AuthService } from '../services/auth'
import { ApiClient } from '../api/client'
import { Router } from '../router'
import { AppLayout } from '../components/layout'
import { loadExchangeRate, sypFromUsd, wireUsdSypPair } from '../utils/currency'

export class InventoryScreen {
  private editingPartId: string | null = null
  private currentPage = 1
  private pageSize = 20
  private totalCount = 0
  private totalPages = 1
  private searchTimer: number | null = null

  constructor(private auth: AuthService, private api: ApiClient, private router: Router) {}
  render(): HTMLElement {
    const layout = new AppLayout(this.auth, this.router, 'المخزون', 'inventory_2', this.api)
    const c = document.createElement('div')
    c.className = 'page-enter min-h-screen bg-background p-gutter'
    c.innerHTML = `
      <div class="max-w-7xl mx-auto space-y-stack-lg">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="font-beVietnamPro text-headline-md text-on-surface">إدارة المخزون</h1>
            <p class="text-body-md text-text-secondary mt-1">متابعة المواد والمستلزمات والقطع</p>
          </div>
          <div class="flex items-center gap-3">
            <button class="h-[48px] bg-surface-subtle text-on-surface font-ibmPlexSans font-body-lg text-body-lg rounded-lg border border-border hover:bg-surface-container-low transition-all duration-200 flex items-center justify-center gap-2 px-4" id="export-inventory-btn">
              <span class="material-symbols-outlined text-[20px]">download</span>
              تصدير
            </button>
            <button class="h-[48px] bg-secondary/10 text-secondary font-ibmPlexSans font-body-lg text-body-lg rounded-lg border border-secondary/30 hover:bg-secondary/20 transition-all duration-200 flex items-center justify-center gap-2 px-4" id="manage-categories-btn">
              <span class="material-symbols-outlined text-[20px]">category</span>
              الفئات
            </button>
            <button class="h-[48px] bg-primary text-on-primary font-ibmPlexSans font-body-lg text-body-lg rounded-lg shadow-sm hover:shadow-lg hover:-translate-y-[1px] transition-all duration-200 flex items-center justify-center gap-2 px-6" id="new-part-btn">
              <span class="material-symbols-outlined text-[20px]">add</span>
              مادة جديدة
            </button>
          </div>
        </div>
        <!-- Filters -->
        <div class="glass-panel rounded-xl shadow-lg border border-border p-card-padding">
          <div class="flex flex-col sm:flex-row gap-4 items-center">
            <div class="relative flex-1 w-full">
              <span class="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline">search</span>
              <input class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg pr-10 pl-4 font-ibmPlexSans font-body-md text-body-md text-on-surface placeholder:text-outline-variant focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow duration-200" type="text" placeholder="بحث بالاسم أو الرمز..." id="part-search" />
            </div>
            <select class="h-[48px] bg-surface-subtle border border-border rounded-lg pr-4 pl-10 font-ibmPlexSans font-body-md text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow duration-200 w-full sm:w-48 appearance-none" style="background-image: url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2716%27 height=%2716%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%23475569%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Cpath d=%27M6 9l6 6 6-6%27/%3E%3C/svg%3E'); background-repeat: no-repeat; background-position: left 0.75rem center; background-size: 1rem;" id="category-filter">
              <option value="">كل الفئات</option>
            </select>
            <select class="h-[48px] bg-surface-subtle border border-border rounded-lg pr-4 pl-10 font-ibmPlexSans font-body-md text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow duration-200 w-full sm:w-48 appearance-none" style="background-image: url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2716%27 height=%2716%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%23475569%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Cpath d=%27M6 9l6 6 6-6%27/%3E%3C/svg%3E'); background-repeat: no-repeat; background-position: left 0.75rem center; background-size: 1rem;" id="stock-filter">
              <option value="">كل المواد</option>
              <option value="low">منخفضة</option>
              <option value="out">نافدة</option>
              <option value="ok">متوفر</option>
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
                  <th class="px-6 py-4 text-right font-label-sm text-label-sm text-text-tertiary uppercase">الرمز</th>
                  <th class="px-6 py-4 text-right font-label-sm text-label-sm text-text-tertiary uppercase">الاسم</th>
                  <th class="px-6 py-4 text-right font-label-sm text-label-sm text-text-tertiary uppercase">الفئة</th>
                  <th class="px-6 py-4 text-right font-label-sm text-label-sm text-text-tertiary uppercase">الكمية</th>
                  <th class="px-6 py-4 text-right font-label-sm text-label-sm text-text-tertiary uppercase">الحد الأدنى</th>
                  <th class="px-6 py-4 text-right font-label-sm text-label-sm text-text-tertiary uppercase">سعر البيع</th>
                  <th class="px-6 py-4 text-right font-label-sm text-label-sm text-text-tertiary uppercase">التكلفة</th>
                  <th class="px-6 py-4 text-right font-label-sm text-label-sm text-text-tertiary uppercase">الحالة</th>
                  <th class="px-6 py-4 text-right font-label-sm text-label-sm text-text-tertiary uppercase">إجراءات</th>
                </tr>
              </thead>
              <tbody id="inventory-tbody">
                <tr><td colspan="9" class="px-6 py-8 text-center text-text-secondary"><div class="skeleton-shimmer h-4 rounded w-32 mx-auto"></div></td></tr>
              </tbody>
            </table>
          </div>
          <!-- Pagination -->
          <div class="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-outline-variant/10 bg-surface-subtle/50" id="pagination-bar">
            <div class="flex items-center gap-2 font-body-sm text-text-secondary">
              <span id="page-info">صفحة 1 من 1</span>
              <span class="text-outline-variant">·</span>
              <span id="total-info">0 مادة</span>
            </div>
            <div class="flex items-center gap-2">
              <select class="h-[40px] bg-surface-subtle border border-border rounded-lg px-3 font-ibmPlexSans font-body-sm text-on-surface focus:border-primary focus:outline-none" id="page-size-select" title="عدد الصفوف بالصفحة">
                <option value="10">10 صفوف</option>
                <option value="20" selected>20 صف</option>
                <option value="50">50 صف</option>
                <option value="100">100 صف</option>
              </select>
              <button class="h-[40px] px-3 rounded-lg border border-border bg-surface-subtle text-on-surface hover:bg-surface-container-low transition-colors flex items-center disabled:opacity-40 disabled:cursor-not-allowed" id="prev-page-btn" aria-label="الصفحة السابقة">
                <span class="material-symbols-outlined text-[20px]">chevron_right</span>
              </button>
              <button class="h-[40px] px-3 rounded-lg border border-border bg-surface-subtle text-on-surface hover:bg-surface-container-low transition-colors flex items-center disabled:opacity-40 disabled:cursor-not-allowed" id="next-page-btn" aria-label="الصفحة التالية">
                <span class="material-symbols-outlined text-[20px]">chevron_left</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      <!-- Add/Edit Part Modal -->
      <div id="part-modal" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 hidden items-start justify-center overflow-y-auto py-10 px-4" role="dialog" aria-modal="true">
        <div class="bg-surface-container-lowest rounded-xl shadow-2xl border border-border w-full max-w-lg max-h-[85vh] overflow-y-auto">
          <div class="p-6 border-b border-outline-variant/10 bg-surface-subtle flex items-center justify-between">
            <h3 class="font-headline-md text-lg text-on-surface font-semibold" id="part-modal-title">إضافة مادة جديدة</h3>
            <button id="close-part-modal" class="touch-safe w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-text-tertiary" aria-label="إغلاق نافذة إضافة مادة">
              <span class="material-symbols-outlined" aria-hidden="true">close</span>
            </button>
          </div>
          <div class="p-6 space-y-4">
            <div>
              <label class="block font-label-sm text-label-sm text-text-tertiary mb-2">اسم المادة *</label>
              <input class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-ibmPlexSans font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow" id="part-name" placeholder="اسم المادة" required />
            </div>
            <div>
              <label class="block font-label-sm text-label-sm text-text-tertiary mb-2">رمز المادة</label>
              <input class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-ibmPlexSans font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow" id="part-code" placeholder="رمز المادة" />
            </div>
            <div>
              <label class="block font-label-sm text-label-sm text-text-tertiary mb-2">الفئة</label>
              <div class="flex gap-2">
                <select class="flex-1 h-[48px] bg-surface-subtle border border-border rounded-lg pr-4 pl-10 font-ibmPlexSans font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow appearance-none" style="background-image: url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2716%27 height=%2716%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%23475569%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Cpath d=%27M6 9l6 6 6-6%27/%3E%3C/svg%3E'); background-repeat: no-repeat; background-position: left 0.75rem center; background-size: 1rem;" id="part-category">
                  <option value="">بدون فئة</option>
                </select>
                <button type="button" class="h-[48px] px-3 bg-secondary/10 text-secondary rounded-lg border border-secondary/30 hover:bg-secondary/20 transition-colors flex items-center justify-center" id="add-category-inline-btn" title="إضافة فئة جديدة">
                  <span class="material-symbols-outlined text-[20px]">add</span>
                </button>
              </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block font-label-sm text-label-sm text-text-tertiary mb-2">الكمية الحالية (تتغير عبر حركة مخزون)</label>
                <input type="number" min="0" disabled class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-ibmPlexSans font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow disabled:opacity-70" id="part-quantity" placeholder="0" />
              </div>
              <div>
                <label class="block font-label-sm text-label-sm text-text-tertiary mb-2">الحد الأدنى</label>
                <input type="number" min="0" class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-ibmPlexSans font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow" id="part-min-qty" placeholder="0" />
              </div>
            </div>
            <div class="border border-border rounded-xl p-4 space-y-3 bg-surface-subtle/40">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-[18px] text-secondary">inventory</span>
                <span class="font-label-sm text-label-sm text-text-tertiary">وحدات الشراء والبيع (اختياري — للمواد يلي بتُشترى بالطرد)</span>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label class="block font-label-sm text-label-sm text-text-tertiary mb-2">وحدة البيع</label>
                  <input class="w-full h-[44px] bg-surface-subtle border border-border rounded-lg px-4 font-ibmPlexSans font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow" id="part-base-unit" placeholder="عبوة" />
                </div>
                <div>
                  <label class="block font-label-sm text-label-sm text-text-tertiary mb-2">وحدة الشراء</label>
                  <input class="w-full h-[44px] bg-surface-subtle border border-border rounded-lg px-4 font-ibmPlexSans font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow" id="part-purchase-unit" placeholder="طرد" />
                </div>
                <div>
                  <label class="block font-label-sm text-label-sm text-text-tertiary mb-2">عدد وحدات البيع بالوحدة الشرائية</label>
                  <input type="number" min="0" step="1" class="w-full h-[44px] bg-surface-subtle border border-border rounded-lg px-4 font-ibmPlexSans font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow" id="part-units-per-package" placeholder="40" />
                </div>
              </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block font-label-sm text-label-sm text-text-tertiary mb-2">سعر البيع (ل.س)</label>
                <input type="number" min="0" class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-ibmPlexSans font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow" id="part-price" placeholder="0" />
              </div>
              <div>
                <label class="block font-label-sm text-label-sm text-text-tertiary mb-2">التكلفة (ل.س)</label>
                <input type="number" min="0" class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-ibmPlexSans font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow" id="part-cost" placeholder="0" />
              </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block font-label-sm text-label-sm text-text-tertiary mb-2">سعر البيع بالدولار ($)</label>
                <input type="number" min="0" step="0.01" class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-ibmPlexSans font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow" id="part-price-usd" placeholder="0.00" />
              </div>
              <div>
                <label class="block font-label-sm text-label-sm text-text-tertiary mb-2">التكلفة بالدولار ($)</label>
                <input type="number" min="0" step="0.01" class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-ibmPlexSans font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow" id="part-cost-usd" placeholder="0.00" />
              </div>
            </div>
            <div>
              <label class="block font-label-sm text-label-sm text-text-tertiary mb-2">الوصف</label>
              <textarea class="w-full bg-surface-subtle border border-border rounded-lg p-4 font-ibmPlexSans font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow resize-none" id="part-description" rows="2" placeholder="وصف المادة..."></textarea>
            </div>
          </div>
          <div class="p-6 border-t border-outline-variant/10 flex justify-end gap-3">
            <button class="h-[48px] px-6 bg-surface-subtle text-on-surface font-ibmPlexSans font-body-lg rounded-lg border border-border hover:bg-surface-container-low transition-colors" id="cancel-part-modal">إلغاء</button>
            <button class="h-[48px] px-6 bg-primary text-on-primary font-ibmPlexSans font-body-lg rounded-lg shadow-sm hover:shadow-lg transition-all" id="save-part-btn">حفظ</button>
          </div>
        </div>
      </div>
      <!-- Categories Manager Modal -->
      <div id="category-modal" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 hidden items-start justify-center overflow-y-auto py-10 px-4" role="dialog" aria-modal="true">
        <div class="bg-surface-container-lowest rounded-xl shadow-2xl border border-border w-full max-w-xl max-h-[85vh] overflow-y-auto">
          <div class="p-6 border-b border-outline-variant/10 bg-surface-subtle flex items-center justify-between">
            <h3 class="font-headline-md text-lg text-on-surface font-semibold">إدارة فئات المواد</h3>
            <button id="close-category-modal" class="touch-safe w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-text-tertiary" aria-label="إغلاق نافذة الفئات">
              <span class="material-symbols-outlined" aria-hidden="true">close</span>
            </button>
          </div>
          <div class="p-6 space-y-4">
            <form id="category-form" class="glass-panel rounded-xl border border-border p-4 space-y-3">
              <input type="hidden" id="category-edit-id" value="" />
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label class="block font-label-sm text-label-sm text-text-tertiary mb-2">اسم الفئة *</label>
                  <input class="w-full h-[44px] bg-surface-subtle border border-border rounded-lg px-4 font-ibmPlexSans font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow" id="category-name" placeholder="مثال: زيوت ومواد تشحيم" required />
                </div>
                <div>
                  <label class="block font-label-sm text-label-sm text-text-tertiary mb-2">الوصف</label>
                  <input class="w-full h-[44px] bg-surface-subtle border border-border rounded-lg px-4 font-ibmPlexSans font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow" id="category-desc" placeholder="وصف اختياري" />
                </div>
              </div>
              <div class="flex justify-end gap-2">
                <button type="button" class="h-[40px] px-4 bg-surface-subtle text-on-surface font-ibmPlexSans font-body-md rounded-lg border border-border hover:bg-surface-container-low transition-colors hidden" id="cancel-category-edit">إلغاء التعديل</button>
                <button type="submit" class="h-[40px] px-5 bg-secondary text-on-secondary font-ibmPlexSans font-body-md rounded-lg shadow-sm hover:shadow-md transition-all flex items-center gap-2" id="save-category-btn">
                  <span class="material-symbols-outlined text-[18px]">add</span>
                  <span id="category-save-label">إضافة فئة</span>
                </button>
              </div>
            </form>
            <div class="rounded-xl border border-border overflow-hidden">
              <table class="w-full">
                <thead>
                  <tr class="bg-surface-subtle border-b border-outline-variant/10">
                    <th class="px-4 py-3 text-right font-label-sm text-label-sm text-text-tertiary uppercase">الفئة</th>
                    <th class="px-4 py-3 text-right font-label-sm text-label-sm text-text-tertiary uppercase">الوصف</th>
                    <th class="px-4 py-3 text-right font-label-sm text-label-sm text-text-tertiary uppercase">إجراءات</th>
                  </tr>
                </thead>
                <tbody id="category-tbody">
                  <tr><td colspan="3" class="px-4 py-6 text-center text-text-secondary"><div class="skeleton-shimmer h-4 rounded w-24 mx-auto"></div></td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      <!-- Stock Intake Modal -->
      <div id="intake-modal" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 hidden items-start justify-center overflow-y-auto py-10 px-4" role="dialog" aria-modal="true">
        <div class="bg-surface-container-lowest rounded-xl shadow-2xl border border-border w-full max-w-md max-h-[85vh] overflow-y-auto">
          <div class="p-6 border-b border-outline-variant/10 bg-surface-subtle flex items-center justify-between">
            <div>
              <h3 class="font-headline-md text-lg text-on-surface font-semibold">استلام مخزون</h3>
              <p class="text-body-sm text-text-tertiary mt-1" id="intake-part-name"></p>
            </div>
            <button id="close-intake-modal" class="touch-safe w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-text-tertiary" aria-label="إغلاق نافذة الاستلام">
              <span class="material-symbols-outlined" aria-hidden="true">close</span>
            </button>
          </div>
          <div class="p-6 space-y-4">
            <input type="hidden" id="intake-part-id" value="" />
            <input type="hidden" id="intake-idempotency-key" value="" />
            <!-- Package mode (part has unitsPerPackage) -->
            <div id="intake-package-fields" class="space-y-4">
              <div>
                <label class="block font-label-sm text-label-sm text-text-tertiary mb-2">عدد الأطرد المستلمة *</label>
                <input type="number" min="0" step="1" class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-ibmPlexSans font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow" id="intake-packages" placeholder="مثال: 2" />
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block font-label-sm text-label-sm text-text-tertiary mb-2">سعر الطرد (ل.س) *</label>
                  <input type="number" min="0" class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-ibmPlexSans font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow" id="intake-package-cost" placeholder="0" />
                </div>
                <div>
                  <label class="block font-label-sm text-label-sm text-text-tertiary mb-2">سعر الطرد ($) — اختياري</label>
                  <input type="number" min="0" step="0.01" class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-ibmPlexSans font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow" id="intake-package-cost-usd" placeholder="0.00" />
                </div>
              </div>
              <div id="intake-preview" class="hidden rounded-xl border border-secondary/30 bg-secondary/5 p-4 text-body-sm text-on-surface"></div>
            </div>
            <!-- Unit mode (part without package config) -->
            <div id="intake-unit-fields" class="space-y-4 hidden">
              <div>
                <label class="block font-label-sm text-label-sm text-text-tertiary mb-2">الكمية المضافة *</label>
                <input type="number" min="0" class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-ibmPlexSans font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow" id="intake-units" placeholder="0" />
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block font-label-sm text-label-sm text-text-tertiary mb-2">تكلفة الوحدة (ل.س) *</label>
                  <input type="number" min="0" class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-ibmPlexSans font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow" id="intake-unit-cost" placeholder="0" />
                </div>
                <div>
                  <label class="block font-label-sm text-label-sm text-text-tertiary mb-2">تكلفة الوحدة ($) — اختياري</label>
                  <input type="number" min="0" step="0.01" class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-ibmPlexSans font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow" id="intake-unit-cost-usd" placeholder="0.00" />
                </div>
              </div>
            </div>
            <div>
              <label class="block font-label-sm text-label-sm text-text-tertiary mb-2">طريقة تسجيل تكلفة الاستلام *</label>
              <select id="intake-settlement-account" class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-ibmPlexSans font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none">
                <option value="">اختر الحساب الدائن</option>
                <option value="CASH">نقداً (الصندوق)</option>
                <option value="BANK">مدفوع من البنك</option>
                <option value="PAYABLE">على حساب المورد</option>
              </select>
            </div>
            <div>
              <label class="block font-label-sm text-label-sm text-text-tertiary mb-2">ملاحظات</label>
              <input class="w-full h-[44px] bg-surface-subtle border border-border rounded-lg px-4 font-ibmPlexSans font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow" id="intake-notes" placeholder="مثال: فاتورة المورد رقم..." />
            </div>
          </div>
          <div class="p-6 border-t border-outline-variant/10 flex justify-end gap-3">
            <button class="h-[48px] px-6 bg-surface-subtle text-on-surface font-ibmPlexSans font-body-lg rounded-lg border border-border hover:bg-surface-container-low transition-colors" id="cancel-intake-modal">إلغاء</button>
            <button class="h-[48px] px-6 bg-primary text-on-primary font-ibmPlexSans font-body-lg rounded-lg shadow-sm hover:shadow-lg transition-all" id="submit-intake-btn">تسجيل الاستلام</button>
          </div>
        </div>
      </div>
    `
    let categories: any[] = []

    loadExchangeRate(this.api).then(() => {
      wireUsdSypPair(
        c.querySelector('#part-cost-usd') as HTMLInputElement,
        c.querySelector('#part-cost') as HTMLInputElement
      )
      wireUsdSypPair(
        c.querySelector('#part-price-usd') as HTMLInputElement,
        c.querySelector('#part-price') as HTMLInputElement
      )
      wireUsdSypPair(
        c.querySelector('#intake-package-cost-usd') as HTMLInputElement,
        c.querySelector('#intake-package-cost') as HTMLInputElement
      )
    })

    const reloadParts = () => this.loadParts(c)

    this.loadCategories((cats) => {
      categories = cats
      this.renderCategoryOptions(c, categories)
      this.renderCategoryList(c, categories)
    })
    reloadParts()

    // Event listeners
    c.querySelector('#new-part-btn')?.addEventListener('click', () => {
      this.editingPartId = null
      this.openPartModal(c, null, categories)
    })
    c.querySelector('#part-search')?.addEventListener('input', () => {
      if (this.searchTimer) window.clearTimeout(this.searchTimer)
      this.searchTimer = window.setTimeout(() => {
        this.currentPage = 1
        reloadParts()
      }, 300)
    })
    c.querySelector('#category-filter')?.addEventListener('change', () => { this.currentPage = 1; reloadParts() })
    c.querySelector('#stock-filter')?.addEventListener('change', () => { this.currentPage = 1; reloadParts() })
    c.querySelector('#clear-filters')?.addEventListener('click', () => {
      const searchInput = c.querySelector('#part-search') as HTMLInputElement
      const stockSelect = c.querySelector('#stock-filter') as HTMLSelectElement
      const categorySelect = c.querySelector('#category-filter') as HTMLSelectElement
      if (searchInput) searchInput.value = ''
      if (stockSelect) stockSelect.value = ''
      if (categorySelect) categorySelect.value = ''
      this.currentPage = 1
      reloadParts()
    })

    // Pagination controls
    c.querySelector('#prev-page-btn')?.addEventListener('click', () => {
      if (this.currentPage > 1) { this.currentPage--; reloadParts() }
    })
    c.querySelector('#next-page-btn')?.addEventListener('click', () => {
      if (this.currentPage < this.totalPages) { this.currentPage++; reloadParts() }
    })
    c.querySelector('#page-size-select')?.addEventListener('change', (e) => {
      this.pageSize = parseInt((e.target as HTMLSelectElement).value) || 20
      this.currentPage = 1
      reloadParts()
    })

    c.querySelector('#close-part-modal')?.addEventListener('click', () => { this.editingPartId = null; this.closeModal(c, '#part-modal') })
    c.querySelector('#cancel-part-modal')?.addEventListener('click', () => { this.editingPartId = null; this.closeModal(c, '#part-modal') })
    c.querySelector('#save-part-btn')?.addEventListener('click', async () => {
      await this.savePart(c, () => {
        this.editingPartId = null
        reloadParts()
      })
    })

    // Inline add-category from part modal
    c.querySelector('#add-category-inline-btn')?.addEventListener('click', () => {
      this.openCategoryModal(c)
    })

    // Stock intake modal
    c.querySelector('#close-intake-modal')?.addEventListener('click', () => this.closeModal(c, '#intake-modal'))
    c.querySelector('#cancel-intake-modal')?.addEventListener('click', () => this.closeModal(c, '#intake-modal'))
    const intakeModalEl = c.querySelector('#intake-modal') as HTMLElement
    intakeModalEl?.addEventListener('click', (e) => {
      if (e.target === intakeModalEl) this.closeModal(c, '#intake-modal')
    })
    ;['#intake-packages', '#intake-package-cost', '#intake-package-cost-usd'].forEach(sel => {
      c.querySelector(sel)?.addEventListener('input', () => this.updateIntakePreview(c))
    })
    c.querySelector('#submit-intake-btn')?.addEventListener('click', async () => {
      await this.submitIntake(c, () => reloadParts())
    })

    // Backdrop click
    const partModalEl = c.querySelector('#part-modal') as HTMLElement
    partModalEl?.addEventListener('click', (e) => {
      if (e.target === partModalEl) this.closeModal(c, '#part-modal')
    })

    // Categories manager
    c.querySelector('#manage-categories-btn')?.addEventListener('click', () => this.openCategoryModal(c))
    c.querySelector('#close-category-modal')?.addEventListener('click', () => this.closeModal(c, '#category-modal'))
    const categoryModalEl = c.querySelector('#category-modal') as HTMLElement
    categoryModalEl?.addEventListener('click', (e) => {
      if (e.target === categoryModalEl) this.closeModal(c, '#category-modal')
    })

    const categoryForm = c.querySelector('#category-form') as HTMLFormElement
    categoryForm?.addEventListener('submit', async (e) => {
      e.preventDefault()
      await this.saveCategory(c, () => {
        this.loadCategories((cats) => {
          categories = cats
          this.renderCategoryOptions(c, categories)
          this.renderCategoryList(c, categories)
        })
      })
    })
    c.querySelector('#cancel-category-edit')?.addEventListener('click', () => this.resetCategoryForm(c))

    // Export — full dataset (one-off, all rows)
    c.querySelector('#export-inventory-btn')?.addEventListener('click', async () => {
      try {
        const res = await this.api.get<any>('/api/parts?limit=0', false)
        const all = res.data?.parts || res.data?.data || (Array.isArray(res.data) ? res.data : [])
        const data = (all as any[]).map((p: any) => ({
          الرمز: p.partNumber || p.code || '',
          الاسم: p.name,
          الفئة: p.category?.name || '',
          الكمية: p.quantity || 0,
          الحد_الأدنى: p.minQuantity || 0,
          سعر_البيع: p.sellingPriceUSD != null ? (sypFromUsd(Number(p.sellingPriceUSD)) || p.sellingPriceSYP || 0) : (p.sellingPriceSYP || 0),
          سعر_البيع_دولار: p.sellingPriceUSD || '',
          التكلفة: p.costUSD != null ? (sypFromUsd(Number(p.costUSD)) || p.costSYP || 0) : (p.costSYP || 0),
          التكلفة_دولار: p.costUSD || '',
        }))
        const csv = [Object.keys(data[0] || {}).join(','), ...data.map((row: any) => Object.values(row).join(','))].join('\n')
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = 'inventory.csv'
        link.click()
      } catch {
        ;(window as any).toast?.show?.({ message: 'حدث خطأ أثناء التصدير', type: 'error' })
      }
    })

    return layout.render(c)
  }

  // ===== Stock Intake =====

  private async openIntakeModal(el: HTMLElement, part: any) {
    const modal = el.querySelector('#intake-modal') as HTMLElement
    if (!modal) return
    const nameEl = el.querySelector('#intake-part-name') as HTMLElement
    const idEl = el.querySelector('#intake-part-id') as HTMLInputElement
    const idempotencyKeyEl = el.querySelector('#intake-idempotency-key') as HTMLInputElement
    const pkgFields = el.querySelector('#intake-package-fields') as HTMLElement
    const unitFields = el.querySelector('#intake-unit-fields') as HTMLElement
    const preview = el.querySelector('#intake-preview') as HTMLElement
    const packagesIn = el.querySelector('#intake-packages') as HTMLInputElement
    const pkgCostIn = el.querySelector('#intake-package-cost') as HTMLInputElement
    const pkgCostUsdIn = el.querySelector('#intake-package-cost-usd') as HTMLInputElement
    const unitsIn = el.querySelector('#intake-units') as HTMLInputElement
    const unitCostIn = el.querySelector('#intake-unit-cost') as HTMLInputElement
    const unitCostUsdIn = el.querySelector('#intake-unit-cost-usd') as HTMLInputElement
    const settlementSelect = el.querySelector('#intake-settlement-account') as HTMLSelectElement
    const notesIn = el.querySelector('#intake-notes') as HTMLInputElement

    if (nameEl) nameEl.textContent = part?.name || ''
    if (idEl) idEl.value = part?.id || ''
    if (idempotencyKeyEl && part?.id) {
      const storageKey = `stock-intake-id:${part.id}`
      let key = localStorage.getItem(storageKey)
      if (!key) {
        key = crypto.randomUUID()
        localStorage.setItem(storageKey, key)
      }
      idempotencyKeyEl.value = key
    }
    if (packagesIn) packagesIn.value = ''
    if (pkgCostIn) pkgCostIn.value = ''
    if (pkgCostUsdIn) pkgCostUsdIn.value = ''
    if (unitsIn) unitsIn.value = ''
    if (unitCostIn) unitCostIn.value = ''
    if (unitCostUsdIn) unitCostUsdIn.value = ''
    if (settlementSelect) settlementSelect.value = ''
    if (notesIn) notesIn.value = ''
    if (preview) preview.classList.add('hidden')

    const hasPackage = part?.unitsPerPackage != null && part.unitsPerPackage > 0
    if (pkgFields) pkgFields.classList.toggle('hidden', !hasPackage)
    if (unitFields) unitFields.classList.toggle('hidden', hasPackage)

    modal.classList.remove('hidden')
    modal.classList.add('flex')
    setTimeout(() => (hasPackage ? packagesIn : unitsIn)?.focus(), 100)
  }

  private updateIntakePreview(el: HTMLElement) {
    const preview = el.querySelector('#intake-preview') as HTMLElement
    const packagesIn = el.querySelector('#intake-packages') as HTMLInputElement
    const pkgCostIn = el.querySelector('#intake-package-cost') as HTMLInputElement
    const pkgCostUsdIn = el.querySelector('#intake-package-cost-usd') as HTMLInputElement
    if (!preview || !packagesIn) return
    const packages = parseFloat(packagesIn.value)
    const cost = parseFloat(pkgCostIn?.value || '')
    if (!packages || packages <= 0 || isNaN(cost) || cost < 0) {
      preview.classList.add('hidden')
      return
    }
    // Read conversion from the part stored on the modal state
    const part = this.currentIntakePart
    const upp = part?.unitsPerPackage || 0
    if (!upp) { preview.classList.add('hidden'); return }
    const units = packages * upp
    const unitCost = cost / upp
    const usdCost = parseFloat(pkgCostUsdIn?.value || '')
    let html = `سيضاف <b>${units}</b> ${this.esc(part?.baseUnitName || 'وحدة')} · تكلفة الوحدة <b>${this.fmt(unitCost)} ل.س</b>`
    if (!isNaN(usdCost) && usdCost > 0) {
      html += ` · <b>$${this.fmtUsd(usdCost / upp)}</b>`
    }
    preview.innerHTML = html
    preview.classList.remove('hidden')
  }

  private currentIntakePart: any = null

  private async submitIntake(el: HTMLElement, onSuccess: () => void) {
    const idEl = el.querySelector('#intake-part-id') as HTMLInputElement
    const id = idEl?.value
    if (!id) return
    const idempotencyKey = (el.querySelector('#intake-idempotency-key') as HTMLInputElement)?.value
    if (!idempotencyKey) { ;(window as any).toast?.show?.({ message: 'تعذر إنشاء مفتاح الاستلام، أغلق النافذة وافتحها مجدداً', type: 'error' }); return }
    const part = this.currentIntakePart
    const hasPackage = part?.unitsPerPackage != null && part.unitsPerPackage > 0

    let payload: Record<string, unknown> = {}
    const settlementAccount = (el.querySelector('#intake-settlement-account') as HTMLSelectElement)?.value
    if (!settlementAccount) { ;(window as any).toast?.show?.({ message: 'اختر حساب تسجيل تكلفة الاستلام', type: 'warning' }); return }
    payload.settlementAccount = settlementAccount
    const notesIn = el.querySelector('#intake-notes') as HTMLInputElement
    if (notesIn?.value?.trim()) payload.notes = notesIn.value.trim()

    if (hasPackage) {
      const packages = parseFloat((el.querySelector('#intake-packages') as HTMLInputElement)?.value || '')
      const pkgCost = parseFloat((el.querySelector('#intake-package-cost') as HTMLInputElement)?.value || '')
      const pkgCostUsdRaw = (el.querySelector('#intake-package-cost-usd') as HTMLInputElement)?.value?.trim()
      if (!packages || packages <= 0) { ;(window as any).toast?.show?.({ message: 'أدخل عدد الأطرد', type: 'warning' }); return }
      if (isNaN(pkgCost) || pkgCost < 0) { ;(window as any).toast?.show?.({ message: 'أدخل سعر الطرد', type: 'warning' }); return }
      payload.packages = packages
      payload.packageCostSYP = pkgCost
      if (pkgCostUsdRaw) payload.packageCostUSD = parseFloat(pkgCostUsdRaw)
    } else {
      const units = parseFloat((el.querySelector('#intake-units') as HTMLInputElement)?.value || '')
      const unitCost = parseFloat((el.querySelector('#intake-unit-cost') as HTMLInputElement)?.value || '')
      const unitCostUsdRaw = (el.querySelector('#intake-unit-cost-usd') as HTMLInputElement)?.value?.trim()
      if (!units || units <= 0) { ;(window as any).toast?.show?.({ message: 'أدخل الكمية', type: 'warning' }); return }
      if (isNaN(unitCost) || unitCost < 0) { ;(window as any).toast?.show?.({ message: 'أدخل تكلفة الوحدة', type: 'warning' }); return }
      payload.units = units
      payload.unitCostSYP = unitCost
      if (unitCostUsdRaw) payload.unitCostUSD = parseFloat(unitCostUsdRaw)
    }

    payload.idempotencyKey = idempotencyKey
    const submitButton = el.querySelector('#submit-intake-btn') as HTMLButtonElement
    if (submitButton?.disabled) return
    if (submitButton) submitButton.disabled = true
    try {
      const res = await this.api.post<any>(`/api/parts/${id}/stock-intake`, payload)
      if (res.success !== false) {
        localStorage.removeItem(`stock-intake-id:${id}`)
        this.closeModal(el, '#intake-modal')
        ;(window as any).toast?.show?.({ message: 'تم تسجيل الاستلام وتحديث المخزون', type: 'success' })
        onSuccess()
      } else {
        ;(window as any).toast?.show?.({ message: res.message || 'فشل تسجيل الاستلام', type: 'error' })
      }
    } catch (e: any) {
      ;(window as any).toast?.show?.({ message: e?.message || 'حدث خطأ أثناء الاستلام', type: 'error' })
    } finally {
      if (submitButton) submitButton.disabled = false
    }
  }

  // ===== Categories =====

  private async loadCategories(callback?: (categories: any[]) => void) {
    try {
      const res = await this.api.get<any>('/api/part-categories', false)
      const cats = res.data?.categories || res.data || []
      if (callback) callback(Array.isArray(cats) ? cats : [])
    } catch {
      if (callback) callback([])
    }
  }

  private renderCategoryOptions(el: HTMLElement, categories: any[]) {
    const partSelect = el.querySelector('#part-category') as HTMLSelectElement
    const filterSelect = el.querySelector('#category-filter') as HTMLSelectElement
    if (partSelect) {
      const current = partSelect.value
      partSelect.innerHTML = `<option value="">بدون فئة</option>` +
        categories.map((cat: any) => `<option value="${cat.id}">${this.esc(cat.name)}</option>`).join('')
      if (current && categories.some((cat: any) => cat.id === current)) partSelect.value = current
    }
    if (filterSelect) {
      const current = filterSelect.value
      filterSelect.innerHTML = `<option value="">كل الفئات</option>` +
        categories.map((cat: any) => `<option value="${cat.id}">${this.esc(cat.name)}</option>`).join('')
      if (current && categories.some((cat: any) => cat.id === current)) filterSelect.value = current
    }
  }

  private renderCategoryList(el: HTMLElement, categories: any[]) {
    const tbody = el.querySelector('#category-tbody') as HTMLElement
    if (!tbody) return
    if (categories.length === 0) {
      tbody.innerHTML = `<tr><td colspan="3" class="px-4 py-6 text-center text-text-secondary font-body-md">لا توجد فئات بعد — أضف أول فئة من الأعلى</td></tr>`
      return
    }
    tbody.innerHTML = categories.map((cat: any) => `
      <tr class="border-b border-outline-variant/10 hover:bg-surface-container-low/50 transition-colors">
        <td class="px-4 py-3">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-[18px] text-secondary">label</span>
            <span class="font-body-md text-on-surface font-medium">${this.esc(cat.name)}</span>
          </div>
        </td>
        <td class="px-4 py-3 font-body-md text-text-secondary">${this.esc(cat.description || '-')}</td>
        <td class="px-4 py-3">
          <div class="flex items-center gap-2">
            <button class="touch-safe w-8 h-8 rounded-lg hover:bg-surface-container flex items-center justify-center text-text-tertiary hover:text-info transition-colors" title="تعديل" aria-label="تعديل الفئة" data-cat-action="edit" data-id="${cat.id}">
              <span class="material-symbols-outlined text-[18px]" aria-hidden="true">edit</span>
            </button>
            <button class="touch-safe w-8 h-8 rounded-lg hover:bg-surface-container flex items-center justify-center text-text-tertiary hover:text-error transition-colors" title="حذف" aria-label="حذف الفئة" data-cat-action="delete" data-id="${cat.id}">
              <span class="material-symbols-outlined text-[18px]" aria-hidden="true">delete</span>
            </button>
          </div>
        </td>
      </tr>
    `).join('')

    tbody.querySelectorAll('[data-cat-action="edit"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id')
        const cat = categories.find((x: any) => x.id === id)
        if (cat) this.fillCategoryForm(el, cat)
      })
    })
    tbody.querySelectorAll('[data-cat-action="delete"]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id')
        if (!id) return
        const cat = categories.find((x: any) => x.id === id)
        if (!confirm(`هل أنت متأكد من حذف الفئة "${cat?.name || ''}"؟`)) return
        try {
          const res = await this.api.delete<any>(`/api/part-categories/${id}`)
          if (res.success !== false) {
            ;(window as any).toast?.show?.({ message: 'تم حذف الفئة', type: 'success' })
            this.loadCategories((cats) => {
              this.renderCategoryOptions(el, cats)
              this.renderCategoryList(el, cats)
            })
          } else {
            ;(window as any).toast?.show?.({ message: res.message || 'فشل حذف الفئة', type: 'error' })
          }
        } catch (e: any) {
          ;(window as any).toast?.show?.({ message: e?.message || 'حدث خطأ أثناء حذف الفئة', type: 'error' })
        }
      })
    })
  }

  private fillCategoryForm(el: HTMLElement, cat: any) {
    const editId = el.querySelector('#category-edit-id') as HTMLInputElement
    const nameIn = el.querySelector('#category-name') as HTMLInputElement
    const descIn = el.querySelector('#category-desc') as HTMLInputElement
    const saveLabel = el.querySelector('#category-save-label') as HTMLElement
    const cancelBtn = el.querySelector('#cancel-category-edit') as HTMLElement
    if (!editId || !nameIn) return
    editId.value = cat.id
    nameIn.value = cat.name || ''
    if (descIn) descIn.value = cat.description || ''
    if (saveLabel) saveLabel.textContent = 'حفظ التعديل'
    if (cancelBtn) cancelBtn.classList.remove('hidden')
    nameIn.focus()
  }

  private resetCategoryForm(el: HTMLElement) {
    const editId = el.querySelector('#category-edit-id') as HTMLInputElement
    const nameIn = el.querySelector('#category-name') as HTMLInputElement
    const descIn = el.querySelector('#category-desc') as HTMLInputElement
    const saveLabel = el.querySelector('#category-save-label') as HTMLElement
    const cancelBtn = el.querySelector('#cancel-category-edit') as HTMLElement
    if (editId) editId.value = ''
    if (nameIn) nameIn.value = ''
    if (descIn) descIn.value = ''
    if (saveLabel) saveLabel.textContent = 'إضافة فئة'
    if (cancelBtn) cancelBtn.classList.add('hidden')
  }

  private async saveCategory(el: HTMLElement, onSuccess: () => void) {
    const editId = el.querySelector('#category-edit-id') as HTMLInputElement
    const nameIn = el.querySelector('#category-name') as HTMLInputElement
    const descIn = el.querySelector('#category-desc') as HTMLInputElement
    const name = nameIn?.value?.trim()
    if (!name) {
      ;(window as any).toast?.show?.({ message: 'اسم الفئة مطلوب', type: 'warning' })
      nameIn?.focus()
      return
    }
    const payload = { name, description: descIn?.value?.trim() || undefined }
    try {
      const res = editId?.value
        ? await this.api.put<any>(`/api/part-categories/${editId.value}`, payload)
        : await this.api.post<any>('/api/part-categories', payload)
      if (res.success !== false) {
        ;(window as any).toast?.show?.({ message: editId?.value ? 'تم تحديث الفئة' : 'تمت إضافة الفئة', type: 'success' })
        this.resetCategoryForm(el)
        onSuccess()
      } else {
        ;(window as any).toast?.show?.({ message: res.message || 'فشل حفظ الفئة', type: 'error' })
      }
    } catch (e: any) {
      ;(window as any).toast?.show?.({ message: e?.message || 'حدث خطأ أثناء حفظ الفئة', type: 'error' })
    }
  }

  private openCategoryModal(el: HTMLElement) {
    const modal = el.querySelector('#category-modal') as HTMLElement
    if (!modal) return
    this.resetCategoryForm(el)
    this.loadCategories((cats) => {
      this.renderCategoryOptions(el, cats)
      this.renderCategoryList(el, cats)
    })
    modal.classList.remove('hidden')
    modal.classList.add('flex')
  }

  // ===== Parts =====

  private openPartModal(el: HTMLElement, part: any | null, categories: any[]) {
    const modal = el.querySelector('#part-modal') as HTMLElement
    const title = el.querySelector('#part-modal-title') as HTMLElement
    const nameIn = el.querySelector('#part-name') as HTMLInputElement
    const codeIn = el.querySelector('#part-code') as HTMLInputElement
    const catSelect = el.querySelector('#part-category') as HTMLSelectElement
    const qtyIn = el.querySelector('#part-quantity') as HTMLInputElement
    const minQtyIn = el.querySelector('#part-min-qty') as HTMLInputElement
    const priceIn = el.querySelector('#part-price') as HTMLInputElement
    const costIn = el.querySelector('#part-cost') as HTMLInputElement
    const usdPriceIn = el.querySelector('#part-price-usd') as HTMLInputElement
    const usdCostIn = el.querySelector('#part-cost-usd') as HTMLInputElement
    const baseUnitIn = el.querySelector('#part-base-unit') as HTMLInputElement
    const purchaseUnitIn = el.querySelector('#part-purchase-unit') as HTMLInputElement
    const uppIn = el.querySelector('#part-units-per-package') as HTMLInputElement
    const descIn = el.querySelector('#part-description') as HTMLTextAreaElement
    if (!modal || !nameIn) return

    if (title) title.textContent = part ? 'تعديل المادة' : 'إضافة مادة جديدة'
    nameIn.value = part?.name || ''
    if (codeIn) codeIn.value = part?.partNumber || part?.code || ''
    if (catSelect) {
      catSelect.innerHTML = `<option value="">بدون فئة</option>` +
        categories.map((cat: any) => `<option value="${cat.id}">${this.esc(cat.name)}</option>`).join('')
      catSelect.value = part?.categoryId || ''
    }
    if (qtyIn) qtyIn.value = part?.quantity != null ? String(part.quantity) : ''
    if (minQtyIn) minQtyIn.value = part?.minQuantity != null ? String(part.minQuantity) : ''
    if (priceIn) priceIn.value = part?.sellingPriceUSD != null && sypFromUsd(Number(part.sellingPriceUSD)) > 0
      ? String(sypFromUsd(Number(part.sellingPriceUSD)))
      : part?.sellingPriceSYP != null ? String(part.sellingPriceSYP) : ''
    if (costIn) costIn.value = part?.costUSD != null && sypFromUsd(Number(part.costUSD)) > 0
      ? String(sypFromUsd(Number(part.costUSD)))
      : part?.costSYP != null ? String(part.costSYP) : ''
    if (usdPriceIn) usdPriceIn.value = part?.sellingPriceUSD != null ? String(part.sellingPriceUSD) : ''
    if (usdCostIn) usdCostIn.value = part?.costUSD != null ? String(part.costUSD) : ''
    if (baseUnitIn) baseUnitIn.value = part?.baseUnitName || ''
    if (purchaseUnitIn) purchaseUnitIn.value = part?.purchaseUnitName || ''
    if (uppIn) uppIn.value = part?.unitsPerPackage != null ? String(part.unitsPerPackage) : ''
    if (descIn) descIn.value = part?.description || ''
    modal.classList.remove('hidden')
    modal.classList.add('flex')
    setTimeout(() => nameIn.focus(), 100)
  }

  private closeModal(el: HTMLElement, selector: string) {
    const modal = el.querySelector(selector) as HTMLElement
    if (modal) {
      modal.classList.add('hidden')
      modal.classList.remove('flex')
    }
  }

  private async savePart(el: HTMLElement, onSuccess: () => void) {
    const nameIn = el.querySelector('#part-name') as HTMLInputElement
    const codeIn = el.querySelector('#part-code') as HTMLInputElement
    const catSelect = el.querySelector('#part-category') as HTMLSelectElement
    const qtyIn = el.querySelector('#part-quantity') as HTMLInputElement
    const minQtyIn = el.querySelector('#part-min-qty') as HTMLInputElement
    const priceIn = el.querySelector('#part-price') as HTMLInputElement
    const costIn = el.querySelector('#part-cost') as HTMLInputElement
    const usdPriceIn = el.querySelector('#part-price-usd') as HTMLInputElement
    const usdCostIn = el.querySelector('#part-cost-usd') as HTMLInputElement
    const baseUnitIn = el.querySelector('#part-base-unit') as HTMLInputElement
    const purchaseUnitIn = el.querySelector('#part-purchase-unit') as HTMLInputElement
    const uppIn = el.querySelector('#part-units-per-package') as HTMLInputElement
    const descIn = el.querySelector('#part-description') as HTMLTextAreaElement

    if (!nameIn || !nameIn.value.trim()) {
      ;(window as any).toast?.show?.({ message: 'اسم المادة مطلوب', type: 'warning' })
      nameIn?.focus()
      return
    }
    const qty = parseInt(qtyIn?.value || '0') || 0
    const minQty = parseInt(minQtyIn?.value || '0') || 0
    const price = parseInt(priceIn?.value || '0') || 0
    const cost = parseInt(costIn?.value || '0') || 0
    const usdPrice = usdPriceIn?.value?.trim() ? parseFloat(usdPriceIn.value) : undefined
    const usdCost = usdCostIn?.value?.trim() ? parseFloat(usdCostIn.value) : undefined
    if (qty < 0) { ;(window as any).toast?.show?.({ message: 'الكمية لا يمكن أن تكون سالبة', type: 'warning' }); return }
    if (minQty < 0) { ;(window as any).toast?.show?.({ message: 'الحد الأدنى لا يمكن أن يكون سالباً', type: 'warning' }); return }
    if (price < 0) { ;(window as any).toast?.show?.({ message: 'سعر البيع لا يمكن أن يكون سالباً', type: 'warning' }); return }
    if (cost < 0) { ;(window as any).toast?.show?.({ message: 'التكلفة لا يمكن أن تكون سالبة', type: 'warning' }); return }
    if ((usdPrice != null && usdPrice < 0) || (usdCost != null && usdCost < 0)) { ;(window as any).toast?.show?.({ message: 'السعر بالدولار لا يمكن أن يكون سالباً', type: 'warning' }); return }

    const categoryId = catSelect?.value || undefined
    const payload: Record<string, unknown> = {
      name: nameIn.value.trim(),
      partNumber: codeIn?.value?.trim() || '',
      description: descIn?.value?.trim() || '',
      quantity: qty,
      minQuantity: minQty,
      sellingPriceSYP: price,
      costSYP: cost,
    }
    if (categoryId) payload.categoryId = categoryId
    if (usdPrice != null) payload.sellingPriceUSD = usdPrice
    if (usdCost != null) payload.costUSD = usdCost
    const baseUnit = baseUnitIn?.value?.trim()
    const purchaseUnit = purchaseUnitIn?.value?.trim()
    const uppRaw = uppIn?.value?.trim()
    if (baseUnit) payload.baseUnitName = baseUnit
    if (purchaseUnit) payload.purchaseUnitName = purchaseUnit
    if (uppRaw) {
      const upp = parseInt(uppRaw)
      if (upp > 0) payload.unitsPerPackage = upp
    }

    try {
      const res = this.editingPartId
        ? await this.api.put<any>(`/api/parts/${this.editingPartId}`, payload)
        : await this.api.post('/api/parts', payload)
      if (res.success !== false) {
        this.closeModal(el, '#part-modal')
        ;(window as any).toast?.show?.({ message: this.editingPartId ? 'تم تحديث المادة' : 'تمت إضافة المادة', type: 'success' })
        onSuccess()
      } else {
        ;(window as any).toast?.show?.({ message: res.message || 'فشل الحفظ', type: 'error' })
      }
    } catch (e: any) {
      ;(window as any).toast?.show?.({ message: e?.message || 'حدث خطأ أثناء الحفظ', type: 'error' })
    }
  }

  private async loadParts(el: HTMLElement) {
    const tbody = el.querySelector('#inventory-tbody') as HTMLElement
    try {
      await loadExchangeRate(this.api)
      const searchInput = el.querySelector('#part-search') as HTMLInputElement
      const categorySelect = el.querySelector('#category-filter') as HTMLSelectElement
      const stockSelect = el.querySelector('#stock-filter') as HTMLSelectElement

      const params = new URLSearchParams()
      params.set('page', String(this.currentPage))
      params.set('limit', String(this.pageSize))
      const search = searchInput?.value?.trim()
      if (search) params.set('search', search)
      if (categorySelect?.value) params.set('categoryId', categorySelect.value)
      const stock = stockSelect?.value
      if (stock === 'low') params.set('status', 'LOW')
      else if (stock === 'out') params.set('status', 'OUT_OF_STOCK')
      else if (stock === 'ok') params.set('status', 'OK')

      const res = await this.api.get<any>(`/api/parts?${params.toString()}`, false)
      if (res.success !== false && res.data) {
        const parts = Array.isArray(res.data) ? res.data : res.data.parts || res.data.data || []
        this.totalCount = res.data.total ?? (Array.isArray(parts) ? parts.length : 0)
        this.totalPages = Math.max(1, res.data.totalPages ?? 1)
        if (this.currentPage > this.totalPages) {
          this.currentPage = this.totalPages
          const retry = new URLSearchParams(params)
          retry.set('page', String(this.currentPage))
          const retryRes = await this.api.get<any>(`/api/parts?${retry.toString()}`, false)
          const retryParts = Array.isArray(retryRes.data) ? retryRes.data : retryRes.data?.parts || retryRes.data?.data || []
          this.renderParts(el, retryParts)
          this.renderPagination(el)
          return
        }
        this.renderParts(el, parts)
        this.renderPagination(el)
      } else {
        tbody.innerHTML = `<tr><td colspan="9" class="px-6 py-8 text-center text-text-secondary font-body-md">لا توجد مواد</td></tr>`
      }
    } catch {
      tbody.innerHTML = `<tr><td colspan="9" class="px-6 py-8 text-center text-error font-body-md">حدث خطأ أثناء التحميل</td></tr>`
    }
  }

  private renderPagination(el: HTMLElement) {
    const pageInfo = el.querySelector('#page-info') as HTMLElement
    const totalInfo = el.querySelector('#total-info') as HTMLElement
    const prevBtn = el.querySelector('#prev-page-btn') as HTMLButtonElement
    const nextBtn = el.querySelector('#next-page-btn') as HTMLButtonElement
    if (pageInfo) pageInfo.textContent = `صفحة ${this.currentPage} من ${this.totalPages}`
    if (totalInfo) totalInfo.textContent = `${this.totalCount} مادة`
    if (prevBtn) prevBtn.disabled = this.currentPage <= 1
    if (nextBtn) nextBtn.disabled = this.currentPage >= this.totalPages
  }

  private renderParts(el: HTMLElement, parts: any[]) {
    const tbody = el.querySelector('#inventory-tbody')!
    if (parts.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" class="px-6 py-8 text-center text-text-secondary font-body-md">لا توجد مواد</td></tr>`
      return
    }
    tbody.innerHTML = parts.map((p: any) => {
      const qty = p.quantity || 0
      const min = p.minQuantity || 0
      const status = qty <= 0 ? 'out' : (qty < min ? 'low' : 'ok')
      const unitLabel = p.baseUnitName ? ` ${this.esc(p.baseUnitName)}` : ''
      const fullPackages = p.unitsPerPackage && p.unitsPerPackage > 0 ? Math.floor(qty / p.unitsPerPackage) : 0
      const packagesInfo = fullPackages > 0
        ? `<div class="text-sm text-text-tertiary">يعادل ${fullPackages} ${this.esc(p.purchaseUnitName || 'طرد')}</div>`
        : ''
      return `
      <tr class="border-b border-outline-variant/10 hover:bg-surface-container-low/50 transition-colors">
        <td class="px-6 py-4 font-body-md text-on-surface">${this.esc(p.partNumber || p.code || p.id?.slice(0,8))}</td>
        <td class="px-6 py-4">
          <div class="font-body-md text-on-surface font-medium">${this.esc(p.name)}</div>
          <div class="text-sm text-text-tertiary">${this.esc(p.description || '')}</div>
        </td>
        <td class="px-6 py-4 font-body-md text-on-surface">${p.category?.name ? this.esc(p.category.name) : '-'}</td>
        <td class="px-6 py-4 font-body-md ${status === 'out' ? 'text-error' : (status === 'low' ? 'text-warning' : 'text-on-surface')}">${qty}${unitLabel}${packagesInfo}</td>
        <td class="px-6 py-4 font-body-md text-text-secondary">${min}</td>
        <td class="px-6 py-4 font-body-md text-on-surface">
          ${p.sellingPriceUSD != null ? `<div>$${this.fmtUsd(p.sellingPriceUSD)}</div>` : ''}
          <div class="${p.sellingPriceUSD != null ? 'text-sm text-text-tertiary' : ''}">${this.fmt(p.sellingPriceUSD != null ? (sypFromUsd(Number(p.sellingPriceUSD)) || p.sellingPriceSYP || 0) : (p.sellingPriceSYP || p.unitPrice || 0))} ل.س</div>
        </td>
        <td class="px-6 py-4 font-body-md text-text-secondary">
          ${p.costUSD != null ? `<div>$${this.fmtUsd(p.costUSD)}</div>` : ''}
          <div class="${p.costUSD != null ? 'text-sm text-text-tertiary' : ''}">${this.fmt(p.costUSD != null ? (sypFromUsd(Number(p.costUSD)) || p.costSYP || 0) : (p.costSYP || 0))} ل.س</div>
        </td>
        <td class="px-6 py-4">${this.stockBadge(status)}</td>
        <td class="px-6 py-4">
          <div class="flex items-center gap-2">
            <button class="touch-safe w-8 h-8 rounded-lg hover:bg-surface-container flex items-center justify-center text-text-tertiary hover:text-success transition-colors" title="استلام مخزون" aria-label="استلام مخزون" data-action="intake" data-id="${p.id}">
              <span class="material-symbols-outlined text-[18px]" aria-hidden="true">archive</span>
            </button>
            <button class="touch-safe w-8 h-8 rounded-lg hover:bg-surface-container flex items-center justify-center text-text-tertiary hover:text-info transition-colors" title="تعديل" aria-label="تعديل المادة" data-action="edit" data-id="${p.id}">
              <span class="material-symbols-outlined text-[18px]" aria-hidden="true">edit</span>
            </button>
            <button class="touch-safe w-8 h-8 rounded-lg hover:bg-surface-container flex items-center justify-center text-text-tertiary hover:text-error transition-colors" title="حذف" aria-label="حذف المادة" data-action="delete" data-id="${p.id}">
              <span class="material-symbols-outlined text-[18px]" aria-hidden="true">delete</span>
            </button>
          </div>
        </td>
      </tr>
    `}).join('')

    tbody.querySelectorAll('[data-action="intake"]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id')
        if (!id) return
        try {
          const res = await this.api.get<any>(`/api/parts/${id}`, false)
          const part = res.data?.part || res.data
          if (part) {
            this.currentIntakePart = part
            this.openIntakeModal(el, part)
          } else {
            ;(window as any).toast?.show?.({ message: 'لم يتم العثور على المادة', type: 'error' })
          }
        } catch {
          ;(window as any).toast?.show?.({ message: 'حدث خطأ أثناء جلب المادة', type: 'error' })
        }
      })
    })
    tbody.querySelectorAll('[data-action="edit"]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id')
        if (!id) return
        try {
          const res = await this.api.get<any>(`/api/parts/${id}`, false)
          const part = res.data?.part || res.data
          if (part) {
            this.editingPartId = id
            this.openPartModal(el, part, this.currentCategories(el))
          } else {
            ;(window as any).toast?.show?.({ message: 'لم يتم العثور على المادة', type: 'error' })
          }
        } catch {
          ;(window as any).toast?.show?.({ message: 'حدث خطأ أثناء جلب المادة', type: 'error' })
        }
      })
    })
    tbody.querySelectorAll('[data-action="delete"]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id')
        if (id && confirm('هل أنت متأكد من حذف هذه المادة؟')) {
          try {
            const res = await this.api.delete<any>(`/api/parts/${id}`)
            if (res.success !== false) {
              ;(window as any).toast?.show?.({ message: 'تم حذف المادة', type: 'success' })
              this.loadParts(el)
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

  private currentCategories(el: HTMLElement): any[] {
    const select = el.querySelector('#part-category') as HTMLSelectElement
    if (!select) return []
    return Array.from(select.options)
      .filter(o => o.value)
      .map(o => ({ id: o.value, name: o.textContent || '' }))
  }

  private esc(s: string): string {
    const A = String.fromCharCode(38) // ampersand
    const map: Record<string, string> = {
      [A]: A + 'amp;',
      '<': A + 'lt;',
      '>': A + 'gt;',
      '"': A + 'quot;',
      "'": A + '#39;',
    }
    return String(s ?? '').replace(/[&<>"']/g, ch => map[ch])
  }

  private stockBadge(status: string): string {
    if (status === 'out') {
      return `<span class="inline-flex items-center px-3 py-1 rounded-full font-label-sm text-label-sm bg-error/10 text-error">نافد</span>`
    }
    if (status === 'low') {
      return `<span class="inline-flex items-center px-3 py-1 rounded-full font-label-sm text-label-sm bg-warning/10 text-warning">منخفض</span>`
    }
    return `<span class="inline-flex items-center px-3 py-1 rounded-full font-label-sm text-label-sm bg-tertiary/10 text-tertiary">متوفر</span>`
  }

  private fmt(n: number) {
    return new Intl.NumberFormat('ar-SA',{minimumFractionDigits:2}).format(n)
  }

  private fmtUsd(n: number) {
    return new Intl.NumberFormat('en-US',{minimumFractionDigits:2, maximumFractionDigits:2}).format(n)
  }
}
