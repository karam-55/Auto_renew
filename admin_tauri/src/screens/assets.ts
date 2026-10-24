import { AuthService } from '../services/auth'
import { ApiClient } from '../api/client'
import { Router } from '../router'
import { AppLayout } from '../components/layout'

function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]!)
}

export class AssetsScreen {
  private assets: any[] = []
  private categories: any[] = []
  private includeInactive = false
  private readonly role: string

  constructor(auth: AuthService, api: ApiClient, router: Router) {
    this.auth = auth
    this.api = api
    this.router = router
    this.role = (auth.getUser()?.role || '').toUpperCase()
  }

  private auth: AuthService
  private api: ApiClient
  private router: Router

  private get canManage(): boolean {
    return ['OWNER', 'MANAGER'].includes(this.role)
  }

  private get canDelete(): boolean {
    return this.role === 'OWNER'
  }

  render(): HTMLElement {
    const layout = new AppLayout(this.auth, this.router, 'الأصول والاستهلاك', 'assets', this.api)
    const content = document.createElement('div')
    content.className = 'page-enter min-h-screen bg-background p-gutter'
    content.innerHTML = `
      <div class="max-w-7xl mx-auto space-y-stack-lg">
        <header class="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 class="font-beVietnamPro text-headline-md text-on-surface">الأصول والاستهلاك</h1>
            <p class="text-body-md text-text-secondary mt-1">إدارة بيانات الأصول، سياسات الإهلاك، والترحيل المحاسبي الشهري</p>
          </div>
          <div class="flex flex-wrap gap-2">
            ${this.canManage ? `<button data-add-category class="min-h-[44px] rounded-lg border border-border bg-surface px-4 text-on-surface">فئة جديدة</button>
            <button data-add-asset class="min-h-[44px] rounded-lg bg-primary px-4 font-semibold text-white">إضافة أصل</button>
            <button data-run-depreciation class="min-h-[44px] rounded-lg border border-warning/40 bg-warning/10 px-4 font-semibold text-warning">ترحيل إهلاك الشهر</button>` : ''}
          </div>
        </header>

        <label class="inline-flex min-h-[44px] items-center gap-2 text-body-sm text-text-secondary">
          <input data-include-inactive type="checkbox" class="h-5 w-5 accent-primary" />
          إظهار الأصول والفئات المعطلة
        </label>

        <section class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="ملخص الأصول">
          <article class="rounded-xl border border-border bg-surface p-4"><p class="text-sm text-text-secondary">الأصول النشطة</p><p data-summary-count class="mt-2 text-2xl font-bold text-on-surface">—</p></article>
          <article class="rounded-xl border border-border bg-surface p-4"><p class="text-sm text-text-secondary">تكلفة الشراء</p><p data-summary-cost class="mt-2 text-xl font-bold text-on-surface">—</p></article>
          <article class="rounded-xl border border-border bg-surface p-4"><p class="text-sm text-text-secondary">القيمة الدفترية الحالية</p><p data-summary-book-value class="mt-2 text-xl font-bold text-primary">—</p></article>
          <article class="rounded-xl border border-border bg-surface p-4"><p class="text-sm text-text-secondary">الإهلاك الشهري المتوقع</p><p data-summary-monthly class="mt-2 text-xl font-bold text-warning">—</p></article>
        </section>

        <div class="bg-surface-container-lowest rounded-xl shadow-md border border-surface-subtle p-card-padding">
          <div class="mb-4 flex flex-wrap items-end justify-between gap-2">
            <div><h2 class="font-headline-sm text-on-surface">سجل الأصول</h2><p class="mt-1 text-sm text-text-secondary">الإهلاك التراكمي محسوب من القيود المرحلة ولا يمكن تعديله يدوياً.</p></div>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full min-w-[1100px] text-right">
              <thead>
                <tr class="border-b border-surface-subtle">
                  <th class="px-4 py-3 font-label-lg text-text-tertiary">الاسم</th>
                  <th class="px-4 py-3 font-label-lg text-text-tertiary">الفئة</th>
                  <th class="px-4 py-3 font-label-lg text-text-tertiary">تاريخ الشراء</th>
                  <th class="px-4 py-3 font-label-lg text-text-tertiary">تكلفة الشراء</th>
                  <th class="px-4 py-3 font-label-lg text-text-tertiary">قيمة تخريدية</th>
                  <th class="px-4 py-3 font-label-lg text-text-tertiary">الاستهلاك الشهري</th>
                  <th class="px-4 py-3 font-label-lg text-text-tertiary">الاستهلاك التراكمي</th>
                  <th class="px-4 py-3 font-label-lg text-text-tertiary">الحالة</th>
                  <th class="px-4 py-3 font-label-lg text-text-tertiary">إجراءات</th>
                </tr>
              </thead>
              <tbody id="assets-tbody">
                <tr><td colspan="9" class="px-4 py-8 text-center text-text-secondary font-body-md">جاري التحميل...</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="bg-surface-container-lowest rounded-xl shadow-md border border-surface-subtle p-card-padding">
          <h2 class="font-headline-sm text-on-surface mb-1">إعدادات فئات الأصول</h2>
          <p class="mb-4 text-sm text-text-secondary">تغيير العمر أو طريقة الإهلاك يعيد حساب المعدل الشهري للأصول غير المعدلة يدوياً دون تغيير الإهلاك المرحل سابقاً.</p>
          <div class="overflow-x-auto">
            <table class="w-full min-w-[760px] text-right">
              <thead>
                <tr class="border-b border-surface-subtle">
                  <th class="px-4 py-3 font-label-lg text-text-tertiary">الاسم</th>
                  <th class="px-4 py-3 font-label-lg text-text-tertiary">طريقة الاستهلاك</th>
                  <th class="px-4 py-3 font-label-lg text-text-tertiary">العمر الافتراضي (سنوات)</th>
                  <th class="px-4 py-3 font-label-lg text-text-tertiary">القيمة التخريدية الافتراضية</th>
                  <th class="px-4 py-3 font-label-lg text-text-tertiary">الحالة</th>
                  <th class="px-4 py-3 font-label-lg text-text-tertiary">إجراءات</th>
                </tr>
              </thead>
              <tbody id="assets-categories-tbody">
                <tr><td colspan="6" class="px-4 py-8 text-center text-text-secondary font-body-md">جاري التحميل...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `
    content.querySelector('[data-include-inactive]')?.addEventListener('change', (event) => {
      this.includeInactive = (event.currentTarget as HTMLInputElement).checked
      this.loadAssets(content)
      this.loadCategories(content)
    })
    content.querySelector('[data-add-asset]')?.addEventListener('click', () => this.openAssetModal(content))
    content.querySelector('[data-add-category]')?.addEventListener('click', () => this.openCategoryModal(content))
    content.querySelector('[data-run-depreciation]')?.addEventListener('click', () => this.runDepreciation(content))
    this.loadAssets(content)
    this.loadCategories(content)
    return layout.render(content)
  }

  private async loadAssets(el: HTMLElement) {
    try {
      const res = await this.api.get<any>(`/api/assets${this.includeInactive ? '?includeInactive=true' : ''}`, false)
      const tbody = el.querySelector('#assets-tbody')!
      if (res.success === false) throw new Error(res.message || 'تعذر تحميل الأصول')
      const assets = Array.isArray(res.data) ? res.data : res.data?.assets || []
      this.assets = Array.isArray(assets) ? assets : []
      if (this.assets.length > 0) {
        this.renderAssets(el)
      } else {
        tbody.innerHTML = '<tr><td colspan="9" class="px-4 py-8 text-center text-text-secondary font-body-md">لا توجد أصول مطابقة</td></tr>'
        this.updateSummary(el)
      }
    } catch (error: any) {
      el.querySelector('#assets-tbody')!.innerHTML = `<tr><td colspan="9" class="px-4 py-8 text-center text-error font-body-md">${escapeHtml(error.message || 'حدث خطأ')}</td></tr>`
    }
  }

  private async loadCategories(el: HTMLElement) {
    try {
      const res = await this.api.get<any>(`/api/assets/categories${this.includeInactive ? '?includeInactive=true' : ''}`, false)
      const tbody = el.querySelector('#assets-categories-tbody')!
      if (res.success === false) throw new Error(res.message || 'تعذر تحميل فئات الأصول')
      const categories = Array.isArray(res.data) ? res.data : res.data?.categories || []
      this.categories = Array.isArray(categories) ? categories : []
      if (this.categories.length > 0) {
        this.renderCategories(el)
      } else {
        tbody.innerHTML = '<tr><td colspan="6" class="px-4 py-8 text-center text-text-secondary font-body-md">لا توجد فئات أصول</td></tr>'
      }
    } catch (error: any) {
      el.querySelector('#assets-categories-tbody')!.innerHTML = `<tr><td colspan="6" class="px-4 py-8 text-center text-error font-body-md">${escapeHtml(error.message || 'حدث خطأ')}</td></tr>`
    }
  }

  private formatMoney(value: unknown): string {
    return `${new Intl.NumberFormat('ar-SY', { maximumFractionDigits: 2 }).format(Number(value || 0))} ل.س`
  }

  private updateSummary(el: HTMLElement): void {
    const active = this.assets.filter((asset) => asset.isActive)
    const purchaseCost = active.reduce((sum, asset) => sum + Number(asset.purchaseCost || 0), 0)
    const bookValue = active.reduce((sum, asset) => sum + Math.max(0, Number(asset.purchaseCost || 0) - Number(asset.accumulatedDepreciation || 0)), 0)
    const monthly = active.reduce((sum, asset) => sum + Number(asset.userAdjustedDepreciation ?? asset.monthlyDepreciation ?? 0), 0)
    const set = (selector: string, value: string) => {
      const element = el.querySelector(selector)
      if (element) element.textContent = value
    }
    set('[data-summary-count]', active.length.toLocaleString('ar-SY'))
    set('[data-summary-cost]', this.formatMoney(purchaseCost))
    set('[data-summary-book-value]', this.formatMoney(bookValue))
    set('[data-summary-monthly]', this.formatMoney(monthly))
  }

  private renderAssets(el: HTMLElement): void {
    const tbody = el.querySelector('#assets-tbody') as HTMLElement
    tbody.innerHTML = this.assets.map((asset: any) => {
      const accumulated = Number(asset.accumulatedDepreciation || 0)
      const monthly = Number(asset.userAdjustedDepreciation ?? asset.monthlyDepreciation ?? 0)
      const bookValue = Math.max(0, Number(asset.purchaseCost || 0) - accumulated)
      const purchaseDate = asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString('ar-SY') : '—'
      return `<tr class="border-b border-surface-subtle/50 hover:bg-surface-subtle/30">
        <td class="px-4 py-3 font-semibold text-on-surface">${escapeHtml(asset.name)}</td>
        <td class="px-4 py-3 text-text-secondary">${escapeHtml(asset.categoryName || '—')}</td>
        <td class="px-4 py-3 text-text-secondary">${escapeHtml(purchaseDate)}</td>
        <td class="px-4 py-3">${this.formatMoney(asset.purchaseCost)}</td>
        <td class="px-4 py-3 text-text-secondary">${this.formatMoney(asset.salvageValue)}</td>
        <td class="px-4 py-3">${this.formatMoney(monthly)}${asset.userAdjustedDepreciation != null ? '<div class="text-xs text-warning">محدد يدوياً</div>' : '<div class="text-xs text-text-tertiary">محسوب تلقائياً</div>'}</td>
        <td class="px-4 py-3 text-text-secondary">${this.formatMoney(accumulated)}<div class="text-xs">القيمة الدفترية: ${this.formatMoney(bookValue)}</div></td>
        <td class="px-4 py-3"><span class="rounded-full px-3 py-1 text-xs ${asset.isActive ? 'bg-success/10 text-success' : 'bg-surface-subtle text-text-secondary'}">${asset.isActive ? 'نشط' : 'معطل'}</span></td>
        <td class="px-4 py-3"><div class="flex flex-wrap gap-2">
          ${this.canManage ? `<button data-edit-asset="${escapeHtml(asset.id)}" class="min-h-[40px] rounded-lg border border-border px-3 text-sm text-primary">تعديل</button>` : ''}
          ${this.canDelete ? asset.isActive
            ? `<button data-deactivate-asset="${escapeHtml(asset.id)}" class="min-h-[40px] rounded-lg border border-error/30 px-3 text-sm text-error">حذف</button>`
            : `<button data-activate-asset="${escapeHtml(asset.id)}" class="min-h-[40px] rounded-lg border border-success/30 px-3 text-sm text-success">إعادة تفعيل</button>`
            : ''}
        </div></td>
      </tr>`
    }).join('')

    tbody.querySelectorAll<HTMLButtonElement>('[data-edit-asset]').forEach((button) => {
      button.addEventListener('click', () => {
        const asset = this.assets.find((item) => item.id === button.dataset.editAsset)
        if (asset) this.openAssetModal(el, asset)
      })
    })
    tbody.querySelectorAll<HTMLButtonElement>('[data-deactivate-asset]').forEach((button) => {
      button.addEventListener('click', () => void this.setAssetActive(el, button.dataset.deactivateAsset!, false))
    })
    tbody.querySelectorAll<HTMLButtonElement>('[data-activate-asset]').forEach((button) => {
      button.addEventListener('click', () => void this.setAssetActive(el, button.dataset.activateAsset!, true))
    })
    this.updateSummary(el)
  }

  private renderCategories(el: HTMLElement): void {
    const tbody = el.querySelector('#assets-categories-tbody') as HTMLElement
    tbody.innerHTML = this.categories.map((category: any) => `
      <tr class="border-b border-surface-subtle/50 hover:bg-surface-subtle/30">
        <td class="px-4 py-3 font-semibold text-on-surface">${escapeHtml(category.name)}</td>
        <td class="px-4 py-3 text-text-secondary">${escapeHtml(this.translateMethod(category.depreciationMethod))}</td>
        <td class="px-4 py-3 text-text-secondary">${Number(category.usefulLifeYears).toLocaleString('ar-SY')} سنة</td>
        <td class="px-4 py-3 text-text-secondary">${Number(category.salvageValuePercent ?? 10).toLocaleString('ar-SY')}%</td>
        <td class="px-4 py-3"><span class="rounded-full px-3 py-1 text-xs ${category.isActive ? 'bg-success/10 text-success' : 'bg-surface-subtle text-text-secondary'}">${category.isActive ? 'نشطة' : 'معطلة'}</span></td>
        <td class="px-4 py-3"><div class="flex flex-wrap gap-2">
          ${this.canManage ? `<button data-edit-category="${escapeHtml(category.id)}" class="min-h-[40px] rounded-lg border border-border px-3 text-sm text-primary">تعديل الإعدادات</button>` : ''}
          ${this.canDelete ? category.isActive
            ? `<button data-deactivate-category="${escapeHtml(category.id)}" class="min-h-[40px] rounded-lg border border-error/30 px-3 text-sm text-error">حذف الفئة</button>`
            : `<button data-activate-category="${escapeHtml(category.id)}" class="min-h-[40px] rounded-lg border border-success/30 px-3 text-sm text-success">إعادة تفعيل</button>`
            : ''}
        </div></td>
      </tr>
    `).join('')
    tbody.querySelectorAll<HTMLButtonElement>('[data-edit-category]').forEach((button) => {
      button.addEventListener('click', () => {
        const category = this.categories.find((item) => item.id === button.dataset.editCategory)
        if (category) this.openCategoryModal(el, category)
      })
    })
    tbody.querySelectorAll<HTMLButtonElement>('[data-deactivate-category]').forEach((button) => {
      button.addEventListener('click', () => void this.setCategoryActive(el, button.dataset.deactivateCategory!, false))
    })
    tbody.querySelectorAll<HTMLButtonElement>('[data-activate-category]').forEach((button) => {
      button.addEventListener('click', () => void this.setCategoryActive(el, button.dataset.activateCategory!, true))
    })
  }

  private async setAssetActive(el: HTMLElement, id: string, isActive: boolean): Promise<void> {
    const asset = this.assets.find((item) => item.id === id)
    const confirmation = isActive
      ? `هل تريد إعادة تفعيل الأصل «${asset?.name}»؟`
      : `سيتم حذف الأصل «${asset?.name}» من القائمة النشطة مع إبقاء القيود المحاسبية السابقة. هل تريد المتابعة؟`
    if (!asset || !window.confirm(confirmation)) return
    await this.saveActiveState(`/api/assets/${encodeURIComponent(id)}`, isActive, () => this.loadAssets(el))
  }

  private async setCategoryActive(el: HTMLElement, id: string, isActive: boolean): Promise<void> {
    const category = this.categories.find((item) => item.id === id)
    const confirmation = isActive
      ? `هل تريد إعادة تفعيل فئة «${category?.name}»؟`
      : `هل تريد حذف الفئة «${category?.name}»؟ لن يتم حذف أي أصل أو قيد مرتبط بها.`
    if (!category || !window.confirm(confirmation)) return
    await this.saveActiveState(`/api/assets/categories/${encodeURIComponent(id)}`, isActive, async () => {
      await this.loadCategories(el)
      await this.loadAssets(el)
    })
  }

  private async saveActiveState(path: string, isActive: boolean, reload: () => void | Promise<void>): Promise<void> {
    try {
      const response = await this.api.put<any>(path, { isActive })
      if (response.success === false) throw new Error(response.message || 'تعذر تحديث الحالة')
      ;(window as any).toast?.show?.({ message: isActive ? 'تمت إعادة التفعيل' : 'تم التعطيل دون حذف السجل المحاسبي', type: 'success' })
      this.api.clearCache()
      await reload()
    } catch (error: any) {
      ;(window as any).toast?.show?.({ message: error.message || 'تعذر تحديث الحالة', type: 'error' })
    }
  }

  private openAssetModal(parent: HTMLElement, asset?: any): void {
    if (!this.canManage) return
    const categories = this.categories.filter((category) => category.isActive || category.id === asset?.categoryId)
    if (categories.filter((category) => category.isActive).length === 0) {
      ;(window as any).toast?.show?.({ message: 'أضف أو فعّل فئة أصول أولاً', type: 'warning' })
      return
    }

    const modal = document.createElement('div')
    modal.className = 'fixed inset-0 z-[80] flex items-center justify-center bg-black/55 p-3 sm:p-6'
    modal.innerHTML = `
      <section role="dialog" aria-modal="true" aria-labelledby="asset-form-title" class="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-surface shadow-2xl">
        <header class="flex items-start justify-between gap-3 border-b border-border bg-surface-subtle p-5">
          <div>
            <p class="text-sm font-semibold text-primary">سجل الأصول</p>
            <h2 id="asset-form-title" class="mt-1 text-xl font-bold text-on-surface">${asset ? 'تعديل بيانات الأصل' : 'إضافة أصل جديد'}</h2>
            <p class="mt-1 text-sm text-text-secondary">الإهلاك التراكمي يأتي من القيود المرحلة ولا يتغير بالتعديل.</p>
          </div>
          <button type="button" data-close class="min-h-[44px] min-w-[44px] rounded-lg border border-border" aria-label="إغلاق">×</button>
        </header>
        <form data-form class="space-y-4 p-5">
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label class="text-sm text-text-secondary">اسم الأصل *
              <input name="name" required maxlength="120" value="${escapeHtml(asset?.name || '')}" class="mt-1 min-h-[48px] w-full rounded-lg border border-border bg-surface-subtle px-3 text-on-surface" />
            </label>
            <label class="text-sm text-text-secondary">فئة الأصل *
              <select name="categoryId" required class="mt-1 min-h-[48px] w-full rounded-lg border border-border bg-surface-subtle px-3 text-on-surface">
                <option value="">اختر الفئة</option>
                ${categories.map((category) => `<option value="${escapeHtml(category.id)}" ${category.id === asset?.categoryId ? 'selected' : ''}>${escapeHtml(category.name)}${category.isActive ? '' : ' (معطلة)'}</option>`).join('')}
              </select>
            </label>
            <label class="text-sm text-text-secondary">تكلفة الشراء (ل.س) *
              <input name="purchaseCost" type="number" min="0.01" step="0.01" required value="${asset?.purchaseCost ?? ''}" class="mt-1 min-h-[48px] w-full rounded-lg border border-border bg-surface-subtle px-3 text-on-surface" />
            </label>
            <label class="text-sm text-text-secondary">تاريخ الشراء *
              <input name="purchaseDate" type="date" required value="${asset?.purchaseDate ? new Date(asset.purchaseDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)}" class="mt-1 min-h-[48px] w-full rounded-lg border border-border bg-surface-subtle px-3 text-on-surface" />
            </label>
            <label class="text-sm text-text-secondary">القيمة التخريدية (ل.س)
              <input name="salvageValue" type="number" min="0" step="0.01" value="${asset?.salvageValue ?? ''}" class="mt-1 min-h-[48px] w-full rounded-lg border border-border bg-surface-subtle px-3 text-on-surface" />
              <span data-salvage-hint class="mt-1 block text-xs text-text-tertiary">تُقترح من نسبة الفئة ويمكن تعديلها.</span>
            </label>
            <label class="text-sm text-text-secondary">إهلاك شهري يدوي (اختياري)
              <input name="userAdjustedDepreciation" type="number" min="0" step="0.01" value="${asset?.userAdjustedDepreciation ?? ''}" class="mt-1 min-h-[48px] w-full rounded-lg border border-border bg-surface-subtle px-3 text-on-surface" />
              <span class="mt-1 block text-xs text-text-tertiary">اتركه فارغاً لاستخدام المعدل المحسوب تلقائياً.</span>
            </label>
          </div>
          <label class="block text-sm text-text-secondary">الوصف
            <textarea name="description" rows="2" maxlength="500" class="mt-1 w-full rounded-lg border border-border bg-surface-subtle p-3 text-on-surface">${escapeHtml(asset?.description || '')}</textarea>
          </label>
          <div data-preview class="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-on-surface" aria-live="polite"></div>
          ${asset ? `<div class="rounded-lg bg-surface-subtle p-3 text-sm text-text-secondary">الإهلاك التراكمي المسجل: <strong>${this.formatMoney(asset.accumulatedDepreciation)}</strong>. لتصحيح رصيد مرحل، استخدم قيداً محاسبياً معتمداً، وليس تعديل الأصل.</div>` : ''}
          <div data-error class="hidden rounded-lg border border-error/30 bg-error/5 p-3 text-sm text-error" role="alert"></div>
          <footer class="flex justify-end gap-2 border-t border-border pt-4">
            <button type="button" data-close class="min-h-[44px] rounded-lg border border-border px-4 text-on-surface">إلغاء</button>
            <button type="submit" class="min-h-[44px] rounded-lg bg-primary px-5 font-semibold text-white">${asset ? 'حفظ التعديلات' : 'إضافة الأصل'}</button>
          </footer>
        </form>
      </section>`
    parent.appendChild(modal)
    const close = () => modal.remove()
    modal.querySelectorAll('[data-close]').forEach((button) => button.addEventListener('click', close))
    modal.addEventListener('click', (event) => { if (event.target === modal) close() })

    const form = modal.querySelector('[data-form]') as HTMLFormElement
    const categorySelect = form.elements.namedItem('categoryId') as HTMLSelectElement
    const costInput = form.elements.namedItem('purchaseCost') as HTMLInputElement
    const salvageInput = form.elements.namedItem('salvageValue') as HTMLInputElement
    const preview = modal.querySelector('[data-preview]') as HTMLElement
    let salvageWasEdited = Boolean(asset)
    salvageInput.addEventListener('input', () => { salvageWasEdited = true; updatePreview() })
    const updatePreview = () => {
      const category = categories.find((item) => item.id === categorySelect.value)
      const cost = Number(costInput.value || 0)
      if (!salvageWasEdited && category && cost > 0) {
        const suggested = Math.round(cost * Number(category.salvageValuePercent ?? 10)) / 100
        salvageInput.value = String(suggested)
      }
      const salvage = Number(salvageInput.value || 0)
      const years = Number(category?.usefulLifeYears || 0)
      const base = Math.max(0, cost - salvage)
      const monthly = category?.depreciationMethod === 'DECLINING_BALANCE'
        ? (years > 0 ? base * 2 / years / 12 : 0)
        : (years > 0 ? base / years / 12 : 0)
      preview.textContent = category
        ? `الطريقة: ${this.translateMethod(category.depreciationMethod)} · العمر: ${years} سنوات · الإهلاك الشهري التقديري: ${this.formatMoney(monthly)}`
        : 'اختر فئة لعرض طريقة ومعدل الإهلاك التقديري.'
    }
    categorySelect.addEventListener('change', () => { if (!asset) salvageWasEdited = false; updatePreview() })
    costInput.addEventListener('input', updatePreview)
    updatePreview()

    form.addEventListener('submit', async (event) => {
      event.preventDefault()
      const data = new FormData(form)
      const purchaseCost = Number(data.get('purchaseCost'))
      const salvageValue = Number(data.get('salvageValue') || 0)
      if (!Number.isFinite(purchaseCost) || purchaseCost <= 0 || salvageValue < 0 || salvageValue > purchaseCost) {
        const error = modal.querySelector('[data-error]') as HTMLElement
        error.textContent = 'تحقق من تكلفة الشراء والقيمة التخريدية؛ يجب ألا تتجاوز التخريدية تكلفة الأصل.'
        error.classList.remove('hidden')
        return
      }
      const payload: Record<string, unknown> = {
        name: String(data.get('name') || '').trim(),
        categoryId: String(data.get('categoryId') || ''),
        purchaseCost,
        purchaseDate: String(data.get('purchaseDate') || ''),
        salvageValue,
        description: String(data.get('description') || '').trim(),
      }
      const adjusted = String(data.get('userAdjustedDepreciation') || '').trim()
      payload.userAdjustedDepreciation = adjusted ? Number(adjusted) : null
      const button = form.querySelector('[type="submit"]') as HTMLButtonElement
      button.disabled = true
      try {
        const response = asset
          ? await this.api.put<any>(`/api/assets/${encodeURIComponent(asset.id)}`, payload)
          : await this.api.post<any>('/api/assets', payload)
        if (response.success === false) throw new Error(response.message || 'تعذر حفظ الأصل')
        close()
        this.api.clearCache()
        ;(window as any).toast?.show?.({ message: asset ? 'تم تحديث الأصل' : 'تمت إضافة الأصل', type: 'success' })
        await this.loadAssets(parent)
      } catch (error: any) {
        const box = modal.querySelector('[data-error]') as HTMLElement
        box.textContent = error.message || 'تعذر حفظ الأصل'
        box.classList.remove('hidden')
      } finally {
        button.disabled = false
      }
    })
  }

  private async runDepreciation(parent: HTMLElement): Promise<void> {
    if (!this.canManage) return
    if (!window.confirm('سيُنشأ قيد إهلاك لكل أصل مؤهل لهذا الشهر، ولن يتكرر القيد إذا كان قد رُحّل بالفعل. هل تريد المتابعة؟')) return
    try {
      const response = await this.api.post<any>('/api/accounting/depreciation/run', {})
        if (response.success === false) throw new Error(response.message || 'تعذر ترحيل الإهلاك')
      const result = response.data || {}
      ;(window as any).toast?.show?.({
        message: `تم ترحيل ${Number(result.created || 0).toLocaleString('ar-SY')} قيد/قيود بإجمالي ${this.formatMoney(result.totalAmount)}`,
        type: 'success',
      })
      this.api.clearCache()
      await this.loadAssets(parent)
    } catch (error: any) {
      ;(window as any).toast?.show?.({ message: error.message || 'تعذر ترحيل الإهلاك', type: 'error' })
    }
  }

  private openCategoryModal(parent: HTMLElement, category?: any): void {
    if (!this.canManage) return
    const modal = document.createElement('div')
    modal.className = 'fixed inset-0 z-[80] flex items-center justify-center bg-black/55 p-3 sm:p-6'
    const supported = ['STRAIGHT_LINE', 'DECLINING_BALANCE'].includes(category?.depreciationMethod)
    modal.innerHTML = `
      <section role="dialog" aria-modal="true" aria-labelledby="asset-category-title" class="w-full max-w-xl rounded-2xl border border-border bg-surface shadow-2xl">
        <header class="flex items-start justify-between gap-3 border-b border-border bg-surface-subtle p-5">
          <div>
            <p class="text-sm font-semibold text-primary">إعدادات الإهلاك</p>
            <h2 id="asset-category-title" class="mt-1 text-xl font-bold text-on-surface">${category ? 'تعديل فئة الأصول' : 'إضافة فئة أصول'}</h2>
          </div>
          <button type="button" data-close class="min-h-[44px] min-w-[44px] rounded-lg border border-border" aria-label="إغلاق">×</button>
        </header>
        <form data-form class="space-y-4 p-5">
          <label class="block text-sm text-text-secondary">اسم الفئة *
            <input name="name" required maxlength="100" value="${escapeHtml(category?.name || '')}" class="mt-1 min-h-[48px] w-full rounded-lg border border-border bg-surface-subtle px-3 text-on-surface" />
          </label>
          <label class="block text-sm text-text-secondary">الوصف
            <textarea name="description" rows="2" maxlength="400" class="mt-1 w-full rounded-lg border border-border bg-surface-subtle p-3 text-on-surface">${escapeHtml(category?.description || '')}</textarea>
          </label>
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <label class="text-sm text-text-secondary">طريقة الإهلاك *
              <select name="depreciationMethod" required class="mt-1 min-h-[48px] w-full rounded-lg border border-border bg-surface-subtle px-3 text-on-surface">
                ${!supported && category?.depreciationMethod ? `<option value="${escapeHtml(category.depreciationMethod)}" selected>طريقة قديمة غير مدعومة — اختر طريقة</option>` : ''}
                <option value="STRAIGHT_LINE" ${category?.depreciationMethod === 'STRAIGHT_LINE' || !category ? 'selected' : ''}>القسط الثابت</option>
                <option value="DECLINING_BALANCE" ${category?.depreciationMethod === 'DECLINING_BALANCE' ? 'selected' : ''}>الرصيد المتناقص</option>
              </select>
            </label>
            <label class="text-sm text-text-secondary">العمر الافتراضي (سنوات) *
              <input name="usefulLifeYears" type="number" min="1" max="100" step="1" required value="${category?.usefulLifeYears ?? 5}" class="mt-1 min-h-[48px] w-full rounded-lg border border-border bg-surface-subtle px-3 text-on-surface" />
            </label>
            <label class="text-sm text-text-secondary">التخريد الافتراضي (%) *
              <input name="salvageValuePercent" type="number" min="0" max="100" step="0.01" required value="${category?.salvageValuePercent ?? 10}" class="mt-1 min-h-[48px] w-full rounded-lg border border-border bg-surface-subtle px-3 text-on-surface" />
            </label>
          </div>
          <p class="rounded-lg bg-primary/5 p-3 text-sm text-text-secondary">تحديث طريقة الإهلاك أو العمر يعيد حساب المعدل الشهري للأصول غير المعدلة يدوياً. القيود والإهلاك التراكمي السابق لا يتغيران.</p>
          <div data-error class="hidden rounded-lg border border-error/30 bg-error/5 p-3 text-sm text-error" role="alert"></div>
          <footer class="flex justify-end gap-2 border-t border-border pt-4">
            <button type="button" data-close class="min-h-[44px] rounded-lg border border-border px-4">إلغاء</button>
            <button type="submit" class="min-h-[44px] rounded-lg bg-primary px-5 font-semibold text-white">${category ? 'حفظ إعدادات الفئة' : 'إضافة الفئة'}</button>
          </footer>
        </form>
      </section>`
    parent.appendChild(modal)
    const close = () => modal.remove()
    modal.querySelectorAll('[data-close]').forEach((button) => button.addEventListener('click', close))
    modal.addEventListener('click', (event) => { if (event.target === modal) close() })
    const form = modal.querySelector('[data-form]') as HTMLFormElement
    form.addEventListener('submit', async (event) => {
      event.preventDefault()
      const data = new FormData(form)
      const payload = {
        name: String(data.get('name') || '').trim(),
        description: String(data.get('description') || '').trim() || undefined,
        depreciationMethod: String(data.get('depreciationMethod') || ''),
        usefulLifeYears: Number(data.get('usefulLifeYears')),
        salvageValuePercent: Number(data.get('salvageValuePercent')),
      }
      if (!payload.name || !['STRAIGHT_LINE', 'DECLINING_BALANCE'].includes(payload.depreciationMethod)) {
        const error = modal.querySelector('[data-error]') as HTMLElement
        error.textContent = 'أدخل اسم الفئة واختر طريقة إهلاك مدعومة.'
        error.classList.remove('hidden')
        return
      }
      const button = form.querySelector('[type="submit"]') as HTMLButtonElement
      button.disabled = true
      try {
        const response = category
          ? await this.api.put<any>(`/api/assets/categories/${encodeURIComponent(category.id)}`, payload)
          : await this.api.post<any>('/api/assets/categories', payload)
        if (response.success === false) throw new Error(response.message || 'تعذر حفظ إعدادات الفئة')
        close()
        this.api.clearCache()
        ;(window as any).toast?.show?.({ message: category ? 'تم تحديث إعدادات الفئة' : 'تمت إضافة فئة الأصول', type: 'success' })
        await this.loadCategories(parent)
        await this.loadAssets(parent)
      } catch (error: any) {
        const box = modal.querySelector('[data-error]') as HTMLElement
        box.textContent = error.message || 'تعذر حفظ إعدادات الفئة'
        box.classList.remove('hidden')
      } finally {
        button.disabled = false
      }
    })
  }

  private translateMethod(method: string): string {
    const map: Record<string, string> = {
      STRAIGHT_LINE: 'القسط الثابت',
      DECLINING_BALANCE: 'الرصيد المتناقص',
    }
    return map[method] || 'طريقة غير مدعومة'
  }
}
