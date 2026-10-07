import { AuthService } from '../services/auth'
import { ApiClient } from '../api/client'
import { Router } from '../router'
import { AppLayout } from '../components/layout'

export class InventoryScreen {
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
                <label class="block font-label-sm text-label-sm text-text-tertiary mb-2">الكمية</label>
                <input type="number" min="0" class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-ibmPlexSans font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow" id="part-quantity" placeholder="0" />
              </div>
              <div>
                <label class="block font-label-sm text-label-sm text-text-tertiary mb-2">الحد الأدنى</label>
                <input type="number" min="0" class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-ibmPlexSans font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow" id="part-min-qty" placeholder="0" />
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
    `
    let allParts: any[] = []
    let categories: any[] = []
    let editingPartId: string | null = null

    const filterAndRender = () => {
      const searchInput = c.querySelector('#part-search') as HTMLInputElement
      const stockSelect = c.querySelector('#stock-filter') as HTMLSelectElement
      const categorySelect = c.querySelector('#category-filter') as HTMLSelectElement
      const searchTerm = searchInput?.value?.trim().toLowerCase() || ''
      const stockFilter = stockSelect?.value || ''
      const categoryFilter = categorySelect?.value || ''

      let filtered = allParts
      if (searchTerm) {
        filtered = filtered.filter((p: any) => {
          const name = (p.name || '').toLowerCase()
          const code = (p.partNumber || p.code || '').toLowerCase()
          return name.includes(searchTerm) || code.includes(searchTerm)
        })
      }
      if (categoryFilter) {
        filtered = filtered.filter((p: any) => p.categoryId === categoryFilter)
      }
      if (stockFilter) {
        filtered = filtered.filter((p: any) => {
          const qty = p.quantity || 0
          const min = p.minQuantity || 0
          if (stockFilter === 'low') return qty > 0 && qty < min
          if (stockFilter === 'out') return qty <= 0
          if (stockFilter === 'ok') return qty >= min
          return true
        })
      }
      this.renderParts(c, filtered)
    }

    const reloadParts = () => {
      this.loadParts(c, (parts) => {
        allParts = parts
        filterAndRender()
      })
    }

    this.loadCategories((cats: any[]) => {
      categories = cats
      this.renderCategoryOptions(c, categories)
      this.renderCategoryList(c, categories)
    })
    reloadParts()

    // Event listeners
    c.querySelector('#new-part-btn')?.addEventListener('click', () => {
      editingPartId = null
      this.openPartModal(c, null, categories)
    })
    c.querySelector('#part-search')?.addEventListener('input', filterAndRender)
    c.querySelector('#stock-filter')?.addEventListener('change', filterAndRender)
    c.querySelector('#category-filter')?.addEventListener('change', filterAndRender)
    c.querySelector('#clear-filters')?.addEventListener('click', () => {
      const searchInput = c.querySelector('#part-search') as HTMLInputElement
      const stockSelect = c.querySelector('#stock-filter') as HTMLSelectElement
      const categorySelect = c.querySelector('#category-filter') as HTMLSelectElement
      if (searchInput) searchInput.value = ''
      if (stockSelect) stockSelect.value = ''
      if (categorySelect) categorySelect.value = ''
      filterAndRender()
    })

    c.querySelector('#close-part-modal')?.addEventListener('click', () => { editingPartId = null; this.closeModal(c, '#part-modal') })
    c.querySelector('#cancel-part-modal')?.addEventListener('click', () => { editingPartId = null; this.closeModal(c, '#part-modal') })
    c.querySelector('#save-part-btn')?.addEventListener('click', async () => {
      await this.savePart(c, editingPartId, () => {
        editingPartId = null
        reloadParts()
      })
    })

    // Inline add-category from part modal
    c.querySelector('#add-category-inline-btn')?.addEventListener('click', () => {
      this.openCategoryModal(c)
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
        this.loadCategories((cats: any[]) => {
          categories = cats
          this.renderCategoryOptions(c, categories)
          this.renderCategoryList(c, categories)
        })
      })
    })
    c.querySelector('#cancel-category-edit')?.addEventListener('click', () => this.resetCategoryForm(c))

    // Export
    c.querySelector('#export-inventory-btn')?.addEventListener('click', () => {
      const data = allParts.map((p: any) => ({
        الرمز: p.partNumber || p.code || '',
        الاسم: p.name,
        الفئة: p.category?.name || '',
        الكمية: p.quantity || 0,
        الحد_الأدنى: p.minQuantity || 0,
        سعر_البيع: p.sellingPriceSYP || 0,
        التكلفة: p.costSYP || 0,
      }))
      const csv = [Object.keys(data[0] || {}).join(','), ...data.map((row: any) => Object.values(row).join(','))].join('\n')
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = 'inventory.csv'
      link.click()
    })

    return layout.render(c)
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
    if (priceIn) priceIn.value = part?.sellingPriceSYP != null ? String(part.sellingPriceSYP) : ''
    if (costIn) costIn.value = part?.costSYP != null ? String(part.costSYP) : ''
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

  private async savePart(el: HTMLElement, editingPartId: string | null, onSuccess: () => void) {
    const nameIn = el.querySelector('#part-name') as HTMLInputElement
    const codeIn = el.querySelector('#part-code') as HTMLInputElement
    const catSelect = el.querySelector('#part-category') as HTMLSelectElement
    const qtyIn = el.querySelector('#part-quantity') as HTMLInputElement
    const minQtyIn = el.querySelector('#part-min-qty') as HTMLInputElement
    const priceIn = el.querySelector('#part-price') as HTMLInputElement
    const costIn = el.querySelector('#part-cost') as HTMLInputElement
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
    if (qty < 0) { ;(window as any).toast?.show?.({ message: 'الكمية لا يمكن أن تكون سالبة', type: 'warning' }); return }
    if (minQty < 0) { ;(window as any).toast?.show?.({ message: 'الحد الأدنى لا يمكن أن يكون سالباً', type: 'warning' }); return }
    if (price < 0) { ;(window as any).toast?.show?.({ message: 'سعر البيع لا يمكن أن يكون سالباً', type: 'warning' }); return }
    if (cost < 0) { ;(window as any).toast?.show?.({ message: 'التكلفة لا يمكن أن تكون سالبة', type: 'warning' }); return }

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

    try {
      const res = editingPartId
        ? await this.api.put<any>(`/api/parts/${editingPartId}`, payload)
        : await this.api.post('/api/parts', payload)
      if (res.success !== false) {
        this.closeModal(el, '#part-modal')
        ;(window as any).toast?.show?.({ message: editingPartId ? 'تم تحديث المادة' : 'تمت إضافة المادة', type: 'success' })
        onSuccess()
      } else {
        ;(window as any).toast?.show?.({ message: res.message || 'فشل الحفظ', type: 'error' })
      }
    } catch (e: any) {
      ;(window as any).toast?.show?.({ message: e?.message || 'حدث خطأ أثناء الحفظ', type: 'error' })
    }
  }

  private async loadParts(el: HTMLElement, callback?: (parts: any[]) => void) {
    try {
      const res = await this.api.get<any>(`/api/parts`, false)
      const tbody = el.querySelector('#inventory-tbody')!
      if (res.success !== false && res.data) {
        const parts = Array.isArray(res.data) ? res.data : res.data.parts || res.data.data || []
        if (callback) {
          callback(parts)
          return
        }
        this.renderParts(el, parts)
      } else {
        tbody.innerHTML = `<tr><td colspan="9" class="px-6 py-8 text-center text-text-secondary font-body-md">لا توجد مواد</td></tr>`
      }
    } catch {
      const tbody = el.querySelector('#inventory-tbody')!
      tbody.innerHTML = `<tr><td colspan="9" class="px-6 py-8 text-center text-error font-body-md">حدث خطأ أثناء التحميل</td></tr>`
    }
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
      return `
      <tr class="border-b border-outline-variant/10 hover:bg-surface-container-low/50 transition-colors">
        <td class="px-6 py-4 font-body-md text-on-surface">${this.esc(p.partNumber || p.code || p.id?.slice(0,8))}</td>
        <td class="px-6 py-4">
          <div class="font-body-md text-on-surface font-medium">${this.esc(p.name)}</div>
          <div class="text-sm text-text-tertiary">${this.esc(p.description || '')}</div>
        </td>
        <td class="px-6 py-4 font-body-md text-on-surface">${p.category?.name ? this.esc(p.category.name) : '-'}</td>
        <td class="px-6 py-4 font-body-md ${status === 'out' ? 'text-error' : (status === 'low' ? 'text-warning' : 'text-on-surface')}">${qty}</td>
        <td class="px-6 py-4 font-body-md text-text-secondary">${min}</td>
        <td class="px-6 py-4 font-body-md text-on-surface">${this.fmt(p.sellingPriceSYP || p.unitPrice || 0)} ل.س</td>
        <td class="px-6 py-4 font-body-md text-text-secondary">${this.fmt(p.costSYP || 0)} ل.س</td>
        <td class="px-6 py-4">${this.stockBadge(status)}</td>
        <td class="px-6 py-4">
          <div class="flex items-center gap-2">
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

    tbody.querySelectorAll('[data-action="edit"]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id')
        if (!id) return
        try {
          const res = await this.api.get<any>(`/api/parts/${id}`, false)
          const part = res.data?.part || res.data
          if (part) {
            editingPartId = id
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
              this.loadParts(el, (parts) => this.renderParts(el, parts))
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
}
