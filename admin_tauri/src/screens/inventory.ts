import { AuthService } from '../services/auth'
import { ApiClient } from '../api/client'
import { Router } from '../router'
import { AppLayout } from '../components/layout'

export class InventoryScreen {
  constructor(private auth: AuthService, private api: ApiClient, private router: Router) {}
  render(): HTMLElement {
    const layout = new AppLayout(this.auth, this.router, 'المخزون', 'inventory_2', this.api)
    const c = document.createElement('div')
    c.className = 'page-enter max-w-[1600px] mx-auto'
    c.innerHTML = `
      <div class="space-y-stack-lg">
        <div class="flex items-center justify-between page-enter">
          <div>
            <h1 class="font-beVietnamPro text-headline-md text-on-surface">إدارة المخزون</h1>
            <p class="text-body-md text-on-surface-variant mt-1">متابعة المواد والمستلزمات</p>
          </div>
          <button class="h-12 btn-primary-gradient text-white font-body-md rounded-xl shadow-lg shadow-primary/25 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 px-6" id="new-part-btn">
            <span class="material-symbols-outlined text-[20px]">add</span>
            مادة جديدة
          </button>
        </div>
        <div class="glass-card rounded-2xl p-card-padding stagger-entry stagger-entry-1">
          <div class="relative">
            <span class="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
            <input class="w-full h-12 bg-white/50 border border-glass-border rounded-xl pr-10 pl-4 font-body-md text-on-surface placeholder:text-on-surface-variant input-glow transition-all" placeholder="بحث بالاسم أو الرمز..." id="part-search"/>
          </div>
        </div>
        <div class="glass-card rounded-2xl overflow-hidden stagger-entry stagger-entry-2">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="bg-white/40 border-b border-glass-border">
                  <th class="px-6 py-4 text-right font-label-sm text-on-surface-variant uppercase">الرمز</th>
                  <th class="px-6 py-4 text-right font-label-sm text-on-surface-variant uppercase">الاسم</th>
                  <th class="px-6 py-4 text-right font-label-sm text-on-surface-variant uppercase">الفئة</th>
                  <th class="px-6 py-4 text-right font-label-sm text-on-surface-variant uppercase">الكمية</th>
                  <th class="px-6 py-4 text-right font-label-sm text-on-surface-variant uppercase">الحد الأدنى</th>
                  <th class="px-6 py-4 text-right font-label-sm text-on-surface-variant uppercase">سعر الوحدة</th>
                  <th class="px-6 py-4 text-right font-label-sm text-on-surface-variant uppercase">إجراءات</th>
                </tr>
              </thead>
              <tbody id="inventory-tbody">
                <tr><td colspan="7" class="px-6 py-8 text-center text-on-surface-variant"><div class="skeleton-shimmer h-4 rounded w-32 mx-auto"></div></td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <!-- Create Part Modal -->
      <div id="create-part-modal" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] hidden items-center justify-center p-4">
        <div class="glass-card rounded-2xl shadow-xl border border-glass-border max-w-lg w-full p-6 space-y-4">
          <h2 class="font-headline-md text-lg text-on-surface font-beVietnamPro">مادة جديدة</h2>
          <div class="space-y-3">
            <div><label class="block font-label-sm text-on-surface-variant mb-1">الاسم</label><input class="w-full h-12 bg-white/50 border border-glass-border rounded-xl px-4 font-body-md text-on-surface input-glow transition-all" id="part-name"/></div>
            <div><label class="block font-label-sm text-on-surface-variant mb-1">الرمز</label><input class="w-full h-12 bg-white/50 border border-glass-border rounded-xl px-4 font-body-md text-on-surface input-glow transition-all" id="part-code"/></div>
            <div><label class="block font-label-sm text-on-surface-variant mb-1">الكمية</label><input class="w-full h-12 bg-white/50 border border-glass-border rounded-xl px-4 font-body-md text-on-surface input-glow transition-all" id="part-quantity" type="number"/></div>
            <div><label class="block font-label-sm text-on-surface-variant mb-1">السعر</label><input class="w-full h-12 bg-white/50 border border-glass-border rounded-xl px-4 font-body-md text-on-surface input-glow transition-all" id="part-price" type="number"/></div>
          </div>
          <div class="flex justify-end gap-3 pt-2">
            <button class="h-10 px-4 font-body-md rounded-xl border border-glass-border hover:bg-white/80 transition-all" id="create-part-cancel">إلغاء</button>
            <button class="h-10 px-6 btn-primary-gradient text-white font-body-md rounded-xl shadow-md hover:scale-105 active:scale-95 transition-all" id="save-part-btn">حفظ</button>
          </div>
        </div>
      </div>

      <!-- Smart FAB -->
      <button class="fab-glass pulse-glow" id="inventory-fab" title="مادة جديدة">
        <span class="material-symbols-outlined text-[28px]" style="font-variation-settings: 'FILL' 1">add</span>
      </button>`
    this.load(c)

    const closeModal = () => {
      const modal = c.querySelector('#create-part-modal') as HTMLElement
      if (modal) { modal.classList.add('hidden'); modal.classList.remove('flex') }
    }

    c.querySelector('#new-part-btn')?.addEventListener('click', () => this.openCreateModal(c))
    c.querySelector('#inventory-fab')?.addEventListener('click', () => this.openCreateModal(c))
    c.querySelector('#create-part-cancel')?.addEventListener('click', closeModal)
    c.querySelector('#save-part-btn')?.addEventListener('click', async () => {
      const nameIn = c.querySelector('#part-name') as HTMLInputElement
      const codeIn = c.querySelector('#part-code') as HTMLInputElement
      const qtyIn = c.querySelector('#part-quantity') as HTMLInputElement
      const priceIn = c.querySelector('#part-price') as HTMLInputElement
      if (!nameIn) return
      try {
        const price = parseInt(priceIn?.value || '0') || 0
        const res = await this.api.post('/api/parts', { name: nameIn.value, partNumber: codeIn?.value || '', quantity: parseInt(qtyIn?.value || '0') || 0, sellingPriceSYP: price, costSYP: price })
        if (res.success || (res as any).id) { closeModal(); this.load(c) }
        else { alert('فشل الإنشاء') }
      } catch { alert('حدث خطأ أثناء الإنشاء') }
    })

    return layout.render(c)
  }
  private openCreateModal(el: HTMLElement) {
    const modal = el.querySelector('#create-part-modal') as HTMLElement
    const nameIn = el.querySelector('#part-name') as HTMLInputElement
    const codeIn = el.querySelector('#part-code') as HTMLInputElement
    const qtyIn = el.querySelector('#part-quantity') as HTMLInputElement
    const priceIn = el.querySelector('#part-price') as HTMLInputElement
    if (!modal || !nameIn) return
    nameIn.value = ''; if (codeIn) codeIn.value = ''; if (qtyIn) qtyIn.value = ''; if (priceIn) priceIn.value = ''
    modal.classList.remove('hidden'); modal.classList.add('flex')
  }
  private async load(el: HTMLElement) {
    try {
      const res = await this.api.get<any>('/api/parts')
      const tbody = el.querySelector('#inventory-tbody')!
      if (res.success && res.data) {
        const items = Array.isArray(res.data) ? res.data : res.data.data || []
        if (items.length === 0) { tbody.innerHTML = '<tr><td colspan="7" class="px-6 py-12 text-center text-on-surface-variant font-body-md"><span class="material-symbols-outlined text-4xl mb-2 opacity-50">inventory_2</span><br/>لا توجد مواد</td></tr>'; return }
        tbody.innerHTML = items.map((p: any) => {
          const isLow = (p.quantity || 0) < (p.minQuantity || 0)
          return `
          <tr class="border-b border-glass-border hover:bg-white/40 hover:translate-y-[-2px] hover:shadow-sm transition-all duration-300 group">
            <td class="px-6 py-4"><span class="inline-flex items-center px-2 py-1 rounded-lg bg-surface-container text-financial-data text-on-surface text-sm">${p.partNumber || p.code || p.id?.slice(0,8)}</span></td>
            <td class="px-6 py-4 font-body-md text-on-surface font-semibold">${p.name}</td>
            <td class="px-6 py-4 font-body-md text-on-surface-variant">${p.category?.name || '-'}</td>
            <td class="px-6 py-4 text-financial-data ${isLow ? 'text-error font-bold pulse-glow-red' : 'text-on-surface'}" style="${isLow ? 'border-radius:8px;' : ''}">${p.quantity || 0}</td>
            <td class="px-6 py-4 text-financial-data text-on-surface-variant">${p.minQuantity || 0}</td>
            <td class="px-6 py-4 text-financial-data text-on-surface font-semibold">${this.fmt(p.sellingPriceSYP || p.unitPrice || 0)} ل.س</td>
            <td class="px-6 py-4">
              <button class="w-8 h-8 rounded-lg hover:bg-info/10 flex items-center justify-center text-on-surface-variant hover:text-info hover:scale-110 transition-all" title="تعديل" data-action="edit" data-id="${p.id}">
                <span class="material-symbols-outlined text-[18px]">edit</span>
              </button>
            </td>
          </tr>
        `}).join('')
        tbody.querySelectorAll('[data-action="edit"]').forEach(btn => {
          btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id')
            if (id) this.router.navigate(`/inventory/parts/${id}`)
          })
        })
      }
    } catch { el.querySelector('#inventory-tbody')!.innerHTML = '<tr><td colspan="7" class="px-6 py-12 text-center text-error font-body-md"><span class="material-symbols-outlined text-4xl mb-2">error</span><br/>حدث خطأ</td></tr>' }
  }
  private fmt(n: number) { return new Intl.NumberFormat('ar-SA',{minimumFractionDigits:2}).format(n) }
}
