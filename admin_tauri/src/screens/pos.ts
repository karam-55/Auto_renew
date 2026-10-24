import { AuthService } from '../services/auth'
import { ApiClient } from '../api/client'
import { Router } from '../router'
import { AppLayout } from '../components/layout'
import { loadExchangeRate, sypFromUsd, fmtUsd } from '../utils/currency'

function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]!)
}

export class PosScreen {
  private auth: AuthService
  private api: ApiClient
  private router: Router
  private cart: { id: string; itemType: 'PART' | 'SERVICE'; name: string; price: number; priceUSD: number | null; qty: number; availableQty: number | null }[] = []
  private taxRate = 0

  constructor(auth: AuthService, api: ApiClient, router: Router) {
    this.auth = auth
    this.api = api
    this.router = router
  }

  render(): HTMLElement {
    const layout = new AppLayout(this.auth, this.router, 'نقاط البيع', 'point_of_sale', this.api)
    const content = document.createElement('div')
    content.className = 'page-enter max-w-[1600px] mx-auto'
    content.innerHTML = `
      <div class="space-y-stack-lg">
        <div class="flex items-center justify-between page-enter">
          <div>
            <h1 class="font-beVietnamPro text-headline-md text-on-surface">نقاط البيع</h1>
            <p class="text-body-md text-on-surface-variant mt-1">اختيار خدمات القسم وقطع المخزون، ثم إنشاء الفاتورة</p>
          </div>
          <button class="h-12 btn-secondary-gradient text-white font-body-md rounded-xl shadow-lg shadow-secondary/25 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 px-6" id="quick-invoice-btn">
            <span class="material-symbols-outlined text-[20px]">receipt_long</span>
            فاتورة سريعة
          </button>
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Products -->
          <div class="lg:col-span-2 space-y-stack-md">
            <!-- Search -->
            <div class="glass-card rounded-2xl p-card-padding stagger-entry stagger-entry-1">
              <div class="relative">
                <span class="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
                <input class="w-full h-12 bg-white/50 border border-glass-border rounded-xl pr-10 pl-4 font-body-md text-on-surface placeholder:text-on-surface-variant input-glow transition-all" placeholder="البحث عن منتج أو خدمة..." id="pos-search"/>
              </div>
            </div>
            <div id="pos-departments" class="flex flex-wrap gap-2">
              <div class="skeleton-shimmer h-9 rounded-lg w-40"></div>
            </div>
            <div class="glass-card rounded-2xl p-card-padding">
              <div class="flex items-center justify-between mb-3">
                <h3 id="pos-department-title" class="font-headline-md text-lg text-on-surface font-semibold">خدمات القسم</h3>
              </div>
              <div class="grid grid-cols-2 md:grid-cols-3 gap-4" id="pos-services">
                <div class="col-span-full flex items-center justify-center py-8">
                  <div class="skeleton-shimmer h-4 rounded w-32"></div>
                </div>
              </div>
            </div>
            <div class="glass-card rounded-2xl p-card-padding">
              <h3 class="font-headline-md text-lg text-on-surface font-semibold mb-3">قطع ومنتجات المخزون</h3>
              <div class="grid grid-cols-2 md:grid-cols-3 gap-4" id="pos-products">
              <div class="col-span-full flex items-center justify-center py-12">
                <div class="skeleton-shimmer h-4 rounded w-32"></div>
              </div>
              </div>
            </div>
          </div>
          <!-- Cart -->
          <div class="lg:col-span-1">
            <div class="glass-card rounded-2xl p-card-padding sticky top-24 stagger-entry stagger-entry-2">
              <h3 class="font-headline-md text-lg text-on-surface font-semibold mb-4 flex items-center gap-2 font-beVietnamPro">
                <span class="material-symbols-outlined text-secondary">shopping_cart</span>
                سلة المشتريات
              </h3>
              <div class="space-y-3 mb-4 min-h-[120px] flex items-center justify-center">
                <p class="text-on-surface-variant text-sm">السلة فارغة</p>
              </div>
              <div class="border-t border-glass-border pt-4 space-y-2">
                <div class="flex justify-between font-body-md text-on-surface-variant">
                  <span>المجموع الفرعي</span>
                  <span class="text-financial-data">0 ل.س</span>
                </div>
                <div class="flex justify-between font-body-md text-on-surface-variant">
                  <span>الضريبة</span>
                  <span class="text-financial-data">0 ل.س</span>
                </div>
                <div class="flex justify-between font-headline-md text-lg text-on-surface font-bold pt-2">
                  <span>الإجمالي</span>
                  <span class="text-financial-data text-primary">0 ل.س</span>
                </div>
              </div>
              <button class="w-full mt-4 h-12 btn-primary-gradient text-white font-body-md rounded-xl shadow-lg shadow-primary/25 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2" id="checkout-btn">
                <span class="material-symbols-outlined text-[20px]">payments</span>
                إنشاء الفاتورة
              </button>
              <button class="w-full mt-2 h-10 bg-surface-subtle text-on-surface font-body-md rounded-xl border border-border hover:bg-surface-container-low transition-all flex items-center justify-center gap-2 text-sm" id="clear-cart-btn">
                <span class="material-symbols-outlined text-[18px]">delete</span>
                إفراغ السلة
              </button>
            </div>
          </div>
        </div>
      </div>
    `
    this.attachItemGrid(content, '#pos-products', 'PART')
    this.attachItemGrid(content, '#pos-services', 'SERVICE')
    content.querySelector('#pos-search')?.addEventListener('input', (event) => {
      this.applySearchFilter(content, (event.target as HTMLInputElement).value)
    })
    this.loadProducts(content)
    this.loadDepartments(content)
    content.querySelector('#quick-invoice-btn')?.addEventListener('click', () => {
      this.router.navigate('/invoices/new')
    })
    content.querySelector('#checkout-btn')?.addEventListener('click', () => {
      this.checkout()
    })
    content.querySelector('#clear-cart-btn')?.addEventListener('click', () => {
      this.cart = []
      this.renderCart(content)
    })
    return layout.render(content)
  }

  private addToCart(id: string, itemType: 'PART' | 'SERVICE', name: string, price: number, priceUSD: number | null, availableQty: number | null) {
    const existing = this.cart.find(item => item.id === id && item.itemType === itemType)
    if (existing) {
      if (itemType === 'PART' && availableQty != null && existing.qty >= availableQty) {
        ;(window as any).toast?.show?.({ message: 'الكمية المطلوبة أكبر من المتوفر بالمخزون', type: 'warning' })
        return
      }
      existing.qty++
    } else {
      this.cart.push({ id, itemType, name, price, priceUSD, qty: 1, availableQty })
    }
  }

  private renderCart(el: HTMLElement) {
    const cartContainer = el.querySelector('.lg\\:col-span-1 .space-y-3') as HTMLElement
    const subtotalEl = el.querySelector('.lg\\:col-span-1 .border-t .flex:nth-child(1) .text-financial-data') as HTMLElement
    const taxEl = el.querySelector('.lg\\:col-span-1 .border-t .flex:nth-child(2) .text-financial-data') as HTMLElement
    const totalEl = el.querySelector('.lg\\:col-span-1 .border-t .flex:nth-child(3) .text-financial-data') as HTMLElement

    if (!cartContainer) return

    if (this.cart.length === 0) {
      cartContainer.innerHTML = '<p class="text-on-surface-variant text-sm text-center">السلة فارغة</p>'
    } else {
      cartContainer.innerHTML = this.cart.map((item, idx) => `
        <div class="flex items-center justify-between bg-surface-subtle rounded-lg p-3 border border-border">
          <div>
            <p class="font-body-md text-on-surface">${item.name}</p>
            <p class="text-sm text-text-secondary">${item.qty} × ${item.price.toLocaleString('ar-SA')} ل.س${item.priceUSD != null ? ` · $${fmtUsd(item.priceUSD)}` : ''}</p>
          </div>
          <div class="flex items-center gap-2">
            <span class="font-body-md font-bold text-on-surface">${(item.qty * item.price).toLocaleString('ar-SA')}${item.priceUSD != null ? ` · $${fmtUsd(item.qty * item.priceUSD)}` : ''}</span>
            <button class="touch-safe w-6 h-6 rounded hover:bg-error/10 text-error flex items-center justify-center" aria-label="إزالة المنتج من السلة" data-remove="${idx}">
              <span class="material-symbols-outlined text-[16px]" aria-hidden="true">close</span>
            </button>
          </div>
        </div>
      `).join('')

      cartContainer.querySelectorAll('[data-remove]').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = parseInt(btn.getAttribute('data-remove')!)
          this.cart.splice(idx, 1)
          this.renderCart(el)
        })
      })
    }

    const subtotal = this.cart.reduce((sum, item) => sum + (item.price * item.qty), 0)
    const subtotalUSD = this.cart.every((item) => item.priceUSD != null)
      ? this.cart.reduce((sum, item) => sum + (Number(item.priceUSD) * item.qty), 0)
      : null
    const tax = Math.round(subtotal * (this.taxRate / 100))
    const taxUSD = subtotalUSD == null ? null : Math.round(subtotalUSD * (this.taxRate / 100) * 100) / 100
    const total = subtotal + tax
    const totalUSD = subtotalUSD == null || taxUSD == null ? null : subtotalUSD + taxUSD

    if (subtotalEl) subtotalEl.textContent = `${subtotal.toLocaleString('ar-SA')} ل.س${subtotalUSD != null ? ` · $${fmtUsd(subtotalUSD)}` : ''}`
    if (taxEl) taxEl.textContent = `${tax.toLocaleString('ar-SA')} ل.س${taxUSD != null ? ` · $${fmtUsd(taxUSD)}` : ''}`
    if (totalEl) totalEl.textContent = `${total.toLocaleString('ar-SA')} ل.س${totalUSD != null ? ` · $${fmtUsd(totalUSD)}` : ''}`
  }

  private attachItemGrid(el: HTMLElement, selector: string, itemType: 'PART' | 'SERVICE') {
    const grid = el.querySelector(selector) as HTMLElement | null
    grid?.addEventListener('click', (event) => {
      const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-product-id]')
      if (!button) return
      const id = button.dataset.productId
      if (!id) return
      const name = button.dataset.productName || '-'
      const price = Number(button.dataset.productPrice || 0)
      const rawUsd = button.dataset.productPriceUsd
      const priceUSD = rawUsd ? Number(rawUsd) : null
      const rawStock = button.dataset.stockQuantity
      const availableQty = itemType === 'PART' && rawStock != null ? Number(rawStock) : null
      this.addToCart(id, itemType, name, price, Number.isFinite(priceUSD) ? priceUSD : null, availableQty)
      this.renderCart(el)
    })
  }

  private applySearchFilter(el: HTMLElement, value: string) {
    const query = value.trim().toLocaleLowerCase()
    el.querySelectorAll<HTMLButtonElement>('#pos-products button[data-product-id], #pos-services button[data-product-id]')
      .forEach((button) => {
        button.classList.toggle('hidden', !button.dataset.productName?.toLocaleLowerCase().includes(query))
      })
  }

  private async loadDepartments(el: HTMLElement) {
    const tabs = el.querySelector('#pos-departments') as HTMLElement
    const servicesGrid = el.querySelector('#pos-services') as HTMLElement
    try {
      const response = await this.api.get<any>('/api/service-categories')
      const raw = response.data
      const categories: any[] = Array.isArray(raw) ? raw : (raw?.data || [])
      const departmentOrder = [
        'الصيانة الميكانيكية والفنية',
        'الغسيل والخدمات السريعة',
        'الحماية والعناية والتجديد',
      ]
      const activeCategories = categories
        .filter((category) => category.isActive && !category.deletedAt)
        .sort((left, right) => {
          const leftName = left.nameAr || left.name
          const rightName = right.nameAr || right.name
          const leftIndex = departmentOrder.indexOf(leftName)
          const rightIndex = departmentOrder.indexOf(rightName)
          if (leftIndex >= 0 || rightIndex >= 0) {
            return (leftIndex < 0 ? departmentOrder.length : leftIndex) -
              (rightIndex < 0 ? departmentOrder.length : rightIndex)
          }
          return String(leftName).localeCompare(String(rightName), 'ar')
        })

      if (activeCategories.length === 0) {
        tabs.innerHTML = '<p class="text-sm text-text-secondary">أضف الأقسام الثلاثة من «الخدمات ← فئات الخدمات» أولاً.</p>'
        servicesGrid.innerHTML = '<div class="col-span-full text-center py-8 text-text-secondary">لا توجد أقسام خدمات مفعّلة</div>'
        return
      }

      tabs.innerHTML = activeCategories.map((category) => `
        <button type="button"
          class="pos-department-tab h-10 px-4 rounded-lg border border-border bg-surface-subtle text-on-surface hover:border-primary transition-colors"
          data-category-id="${escapeHtml(category.id)}">
          ${escapeHtml(category.nameAr || category.name)}
        </button>
      `).join('')

      tabs.querySelectorAll<HTMLButtonElement>('.pos-department-tab').forEach((button) => {
        button.addEventListener('click', () => {
          const category = activeCategories.find((item) => item.id === button.dataset.categoryId)
          if (category) this.loadServicesForDepartment(el, category)
        })
      })

      await this.loadServicesForDepartment(el, activeCategories[0])
    } catch {
      tabs.innerHTML = '<p class="text-sm text-error">تعذر تحميل أقسام الخدمات</p>'
      servicesGrid.innerHTML = '<div class="col-span-full text-center py-8 text-error">حدث خطأ في تحميل خدمات القسم</div>'
    }
  }

  private async loadServicesForDepartment(el: HTMLElement, category: any) {
    const tabs = el.querySelector('#pos-departments') as HTMLElement
    const title = el.querySelector('#pos-department-title') as HTMLElement
    const grid = el.querySelector('#pos-services') as HTMLElement
    title.textContent = category.nameAr || category.name

    tabs.querySelectorAll<HTMLButtonElement>('.pos-department-tab').forEach((button) => {
      const active = button.dataset.categoryId === category.id
      button.classList.toggle('bg-primary', active)
      button.classList.toggle('text-white', active)
      button.classList.toggle('border-primary', active)
      button.classList.toggle('bg-surface-subtle', !active)
      button.classList.toggle('text-on-surface', !active)
    })
    grid.innerHTML = '<div class="col-span-full py-8 text-center text-text-secondary">جاري تحميل الخدمات...</div>'

    try {
      const response = await this.api.get<any>(`/api/services/category/${encodeURIComponent(category.name)}`)
      const raw = response.data
      const services: any[] = Array.isArray(raw) ? raw : (raw?.services || raw?.data || [])
      const sellable = services.filter((service) =>
        service.isActive && (Number(service.priceSYP || 0) > 0 || Number(service.priceUSD || 0) > 0)
      )

      if (sellable.length === 0) {
        grid.innerHTML = '<div class="col-span-full py-8 text-center text-text-secondary">ما في خدمات مسعّرة للبيع المباشر بهالقسم. الخدمات ذات السعر المتغير أو المرتبطة بأمر شغل لازم تتسعّر قبل إضافتها.</div>'
        return
      }

      const colors = ['primary', 'secondary', 'tertiary', 'info', 'warning']
      const icons = ['build', 'car_repair', 'oil_barrel', 'air', 'cleaning_services']
      grid.innerHTML = sellable.map((service, index) => {
        const priceUSD = service.priceUSD == null ? null : Number(service.priceUSD)
        const priceSYP = Number(service.priceSYP || 0)
        return `
          <button class="glass-card p-4 rounded-2xl hover-lift-8 flex flex-col items-center gap-3 group text-right w-full relative overflow-hidden"
            data-product-id="${escapeHtml(service.id)}"
            data-product-name="${escapeHtml(service.nameAr || service.name || '-')}"
            data-product-price="${priceSYP}"
            data-product-price-usd="${priceUSD ?? ''}">
            <div class="absolute inset-x-0 top-0 h-1 bg-${colors[index % colors.length]}"></div>
            <div class="w-12 h-12 rounded-xl bg-primary-container/10 text-primary flex items-center justify-center transition-all group-hover:scale-110">
              <span class="material-symbols-outlined text-[24px]">${icons[index % icons.length]}</span>
            </div>
            <div class="text-center">
              <h4 class="font-body-md text-on-surface font-semibold mb-1">${escapeHtml(service.nameAr || service.name || '-')}</h4>
              ${priceUSD != null ? `<p class="text-sm text-text-tertiary font-semibold">$${fmtUsd(priceUSD)}</p>` : ''}
              <p class="text-financial-data text-primary font-bold">${priceSYP.toLocaleString('ar-SA')} ل.س</p>
            </div>
          </button>
        `
      }).join('')
      this.applySearchFilter(el, (el.querySelector('#pos-search') as HTMLInputElement).value)
    } catch {
      grid.innerHTML = '<div class="col-span-full py-8 text-center text-error">تعذر تحميل خدمات هالقسم</div>'
    }
  }

  private checkout() {
    if (this.cart.length === 0) {
      ;(window as any).toast?.show?.({ message: 'يرجى إضافة منتجات إلى السلة أولاً', type: 'warning' })
      return
    }
    // Navigate to manual invoice with cart data (stored in session for now)
    sessionStorage.setItem('pos-cart', JSON.stringify(this.cart))
    this.router.navigate('/invoices/new')
  }

  private async loadProducts(el: HTMLElement) {
    try {
      // limit=0 → "all rows": POS lookup needs every available product.
      const res = await this.api.get<any>('/api/parts?limit=0')
      const grid = el.querySelector('#pos-products')!
      if (res.success && res.data) {
        const rows: any[] = Array.isArray(res.data) ? res.data : res.data.data || []
        const items = rows.filter((item: any) =>
          item.isActive !== false &&
          Number(item.quantity || 0) > 0 &&
          (Number(item.sellingPriceSYP || 0) > 0 || Number(item.sellingPriceUSD || 0) > 0)
        )
        if (items.length === 0) { grid.innerHTML = '<div class="col-span-full text-center py-12 text-on-surface-variant font-body-md"><span class="material-symbols-outlined text-4xl mb-2 opacity-50">shopping_basket</span><br/>لا توجد منتجات</div>'; return }
        try {
          const settings = await this.api.get<any>('/api/settings/exchange-rate', false)
          this.taxRate = Number(settings.data?.taxRate || 0)
        } catch {
          this.taxRate = 0
        }
        await loadExchangeRate(this.api)
        const colors = ['primary', 'secondary', 'tertiary', 'info', 'warning']
        const icons = ['oil_barrel', 'filter_alt', 'air', 'car_crash', 'build', 'handyman', 'inventory_2']
        grid.innerHTML = items.map((item: any, i: number) => {
          const color = colors[i % colors.length]
          const icon = icons[i % icons.length]
          const priceUSD = item.sellingPriceUSD == null ? null : Number(item.sellingPriceUSD)
          const priceSYP = priceUSD != null ? sypFromUsd(priceUSD) || Number(item.sellingPriceSYP || 0) : Number(item.sellingPriceSYP || 0)
          const colorCls: Record<string,string> = {
            primary: 'bg-primary-container/10 text-primary hover:bg-primary-container/20',
            secondary: 'bg-secondary/10 text-secondary hover:bg-secondary/20',
            tertiary: 'bg-tertiary/10 text-tertiary hover:bg-tertiary/20',
            info: 'bg-info/10 text-info hover:bg-info/20',
            warning: 'bg-warning/10 text-warning hover:bg-warning/20',
          }
          const glow: Record<string,string> = {
            primary: 'rgba(0,74,198,0.3)', secondary: 'rgba(113,42,226,0.3)', tertiary: 'rgba(117,31,0,0.3)',
            info: 'rgba(8,145,178,0.3)', warning: 'rgba(217,119,6,0.3)',
          }
          return `
            <button class="glass-card p-4 rounded-2xl hover-lift-8 flex flex-col items-center gap-3 group text-right w-full relative overflow-hidden" data-product-id="${escapeHtml(item.id)}" data-product-name="${escapeHtml(item.nameAr || item.name || '-')}" data-product-price="${priceSYP}" data-product-price-usd="${priceUSD ?? ''}" data-stock-quantity="${Number(item.quantity)}">
              <div class="absolute inset-x-0 top-0 h-1 bg-${color}"></div>
              <div class="w-12 h-12 rounded-xl ${colorCls[color]} flex items-center justify-center transition-all group-hover:scale-110" style="box-shadow:0 4px 12px ${glow[color]}">
                <span class="material-symbols-outlined text-[24px]" style="font-variation-settings: 'FILL' 1;">${icon}</span>
              </div>
              <div class="text-center">
                <h4 class="font-body-md text-on-surface font-semibold mb-1 group-hover:text-primary transition-colors">${escapeHtml(item.nameAr || item.name || '-')}</h4>
                ${item.sellingPriceUSD != null ? `<p class="text-sm text-text-tertiary font-semibold">$${fmtUsd(item.sellingPriceUSD)}</p>` : ''}
                <p class="text-financial-data text-primary font-bold">${priceSYP.toLocaleString('ar-SA')} ل.س</p>
                <p class="text-xs text-text-secondary">المتوفر: ${Number(item.quantity).toLocaleString('ar-SA')}</p>
              </div>
            </button>
          `
        }).join('')
        this.applySearchFilter(el, (el.querySelector('#pos-search') as HTMLInputElement).value)
      }
    } catch { el.querySelector('#pos-products')!.innerHTML = '<div class="col-span-full text-center py-12 text-error font-body-md"><span class="material-symbols-outlined text-4xl mb-2">error</span><br/>حدث خطأ</div>' }
  }
}
