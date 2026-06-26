import { AuthService } from '../services/auth'
import { ApiClient } from '../api/client'
import { Router } from '../router'
import { AppLayout } from '../components/layout'

export class PosScreen {
  private auth: AuthService
  private api: ApiClient
  private router: Router
  private cart: { id: string; name: string; price: number; qty: number }[] = []

  constructor(auth: AuthService, api: ApiClient, router: Router) {
    this.auth = auth
    this.api = api
    this.router = router
  }

  render(): HTMLElement {
    const layout = new AppLayout(this.auth, this.router, 'نقطة البيع (POS, this.api)', 'point_of_sale')
    const content = document.createElement('div')
    content.className = 'page-enter max-w-[1600px] mx-auto'
    content.innerHTML = `
      <div class="space-y-stack-lg">
        <div class="flex items-center justify-between page-enter">
          <div>
            <h1 class="font-beVietnamPro text-headline-md text-on-surface">نقطة البيع</h1>
            <p class="text-body-md text-on-surface-variant mt-1">إنشاء فواتير ومعالجة المدفوعات</p>
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
            <!-- Product Grid -->
            <div class="grid grid-cols-2 md:grid-cols-3 gap-4" id="pos-products">
              <div class="col-span-full flex items-center justify-center py-12">
                <div class="skeleton-shimmer h-4 rounded w-32"></div>
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
                إتمام الدفع
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
    // Event delegation on product grid (performance fix)
    const grid = content.querySelector('#pos-products') as HTMLElement
    if (grid) {
      grid.addEventListener('click', (e) => {
        const btn = (e.target as HTMLElement).closest('button[data-product-id]') as HTMLButtonElement | null
        if (btn) {
          const id = btn.getAttribute('data-product-id')!
          const name = btn.getAttribute('data-product-name') || '-'
          const price = parseFloat(btn.getAttribute('data-product-price') || '0')
          this.addToCart(id, name, price)
          this.renderCart(content)
        }
      })
    }
    this.loadProducts(content)
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

  private addToCart(id: string, name: string, price: number) {
    const existing = this.cart.find(item => item.id === id)
    if (existing) {
      existing.qty++
    } else {
      this.cart.push({ id, name, price, qty: 1 })
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
            <p class="text-sm text-text-secondary">${item.qty} × ${item.price.toLocaleString('ar-SA')} ل.س</p>
          </div>
          <div class="flex items-center gap-2">
            <span class="font-body-md font-bold text-on-surface">${(item.qty * item.price).toLocaleString('ar-SA')}</span>
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
    const tax = Math.round(subtotal * 0.05)
    const total = subtotal + tax

    if (subtotalEl) subtotalEl.textContent = `${subtotal.toLocaleString('ar-SA')} ل.س`
    if (taxEl) taxEl.textContent = `${tax.toLocaleString('ar-SA')} ل.س`
    if (totalEl) totalEl.textContent = `${total.toLocaleString('ar-SA')} ل.س`
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
      const res = await this.api.get<any>('/api/parts?limit=50')
      const grid = el.querySelector('#pos-products')!
      if (res.success && res.data) {
        const items = Array.isArray(res.data) ? res.data : res.data.data || []
        if (items.length === 0) { grid.innerHTML = '<div class="col-span-full text-center py-12 text-on-surface-variant font-body-md"><span class="material-symbols-outlined text-4xl mb-2 opacity-50">shopping_basket</span><br/>لا توجد منتجات</div>'; return }
        const colors = ['primary', 'secondary', 'tertiary', 'info', 'warning']
        const icons = ['oil_barrel', 'filter_alt', 'air', 'car_crash', 'build', 'handyman', 'inventory_2']
        grid.innerHTML = items.map((item: any, i: number) => {
          const color = colors[i % colors.length]
          const icon = icons[i % icons.length]
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
            <button class="glass-card p-4 rounded-2xl hover-lift-8 flex flex-col items-center gap-3 group text-right w-full relative overflow-hidden" data-product-id="${item.id}" data-product-name="${item.name || '-'}" data-product-price="${item.sellingPriceSYP || 0}">
              <div class="absolute inset-x-0 top-0 h-1 bg-${color}"></div>
              <div class="w-12 h-12 rounded-xl ${colorCls[color]} flex items-center justify-center transition-all group-hover:scale-110" style="box-shadow:0 4px 12px ${glow[color]}">
                <span class="material-symbols-outlined text-[24px]" style="font-variation-settings: 'FILL' 1;">${icon}</span>
              </div>
              <div class="text-center">
                <h4 class="font-body-md text-on-surface font-semibold mb-1 group-hover:text-primary transition-colors">${item.name || '-'}</h4>
                <p class="text-financial-data text-primary font-bold">${(item.sellingPriceSYP || 0).toLocaleString('ar-SA')} ل.س</p>
              </div>
            </button>
          `
        }).join('')
      }
    } catch { el.querySelector('#pos-products')!.innerHTML = '<div class="col-span-full text-center py-12 text-error font-body-md"><span class="material-symbols-outlined text-4xl mb-2">error</span><br/>حدث خطأ</div>' }
  }
}
