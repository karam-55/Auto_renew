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
      <!-- Add Part Modal -->
      <div id="part-modal" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 hidden items-start justify-center overflow-y-auto py-10 px-4">
        <div class="bg-surface-container-lowest rounded-xl shadow-2xl border border-border w-full max-w-lg max-h-[85vh] overflow-y-auto">
          <div class="p-6 border-b border-outline-variant/10 bg-surface-subtle flex items-center justify-between">
            <h3 class="font-headline-md text-lg text-on-surface font-semibold">إضافة مادة جديدة</h3>
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
    `
    let allParts: any[] = []

    const filterAndRender = () => {
      const searchInput = c.querySelector('#part-search') as HTMLInputElement
      const stockSelect = c.querySelector('#stock-filter') as HTMLSelectElement
      const searchTerm = searchInput?.value?.trim().toLowerCase() || ''
      const stockFilter = stockSelect?.value || ''

      let filtered = allParts
      if (searchTerm) {
        filtered = filtered.filter((p: any) => {
          const name = (p.name || '').toLowerCase()
          const code = (p.partNumber || p.code || '').toLowerCase()
          return name.includes(searchTerm) || code.includes(searchTerm)
        })
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

    this.loadParts(c, (parts) => {
      allParts = parts
      filterAndRender()
    })

    // Event listeners
    c.querySelector('#new-part-btn')?.addEventListener('click', () => this.openModal(c))
    c.querySelector('#part-search')?.addEventListener('input', filterAndRender)
    c.querySelector('#stock-filter')?.addEventListener('change', filterAndRender)
    c.querySelector('#clear-filters')?.addEventListener('click', () => {
      const searchInput = c.querySelector('#part-search') as HTMLInputElement
      const stockSelect = c.querySelector('#stock-filter') as HTMLSelectElement
      if (searchInput) searchInput.value = ''
      if (stockSelect) stockSelect.value = ''
      filterAndRender()
    })

    c.querySelector('#close-part-modal')?.addEventListener('click', () => this.closeModal(c))
    c.querySelector('#cancel-part-modal')?.addEventListener('click', () => this.closeModal(c))
    c.querySelector('#save-part-btn')?.addEventListener('click', async () => {
      await this.savePart(c, () => {
        this.loadParts(c, (parts) => {
          allParts = parts
          filterAndRender()
        })
      })
    })

    // Backdrop click
    const modalEl = c.querySelector('#part-modal') as HTMLElement
    modalEl?.addEventListener('click', (e) => {
      if (e.target === modalEl) this.closeModal(c)
    })

    // Export
    c.querySelector('#export-inventory-btn')?.addEventListener('click', () => {
      const data = allParts.map((p: any) => ({
        الرمز: p.partNumber || p.code || '',
        الاسم: p.name,
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

  private openModal(el: HTMLElement) {
    const modal = el.querySelector('#part-modal') as HTMLElement
    const nameIn = el.querySelector('#part-name') as HTMLInputElement
    const codeIn = el.querySelector('#part-code') as HTMLInputElement
    const qtyIn = el.querySelector('#part-quantity') as HTMLInputElement
    const minQtyIn = el.querySelector('#part-min-qty') as HTMLInputElement
    const priceIn = el.querySelector('#part-price') as HTMLInputElement
    const costIn = el.querySelector('#part-cost') as HTMLInputElement
    const descIn = el.querySelector('#part-description') as HTMLTextAreaElement
    if (!modal || !nameIn) return
    nameIn.value = ''
    if (codeIn) codeIn.value = ''
    if (qtyIn) qtyIn.value = ''
    if (minQtyIn) minQtyIn.value = ''
    if (priceIn) priceIn.value = ''
    if (costIn) costIn.value = ''
    if (descIn) descIn.value = ''
    modal.classList.remove('hidden')
    modal.classList.add('flex')
    setTimeout(() => nameIn.focus(), 100)
  }

  private closeModal(el: HTMLElement) {
    const modal = el.querySelector('#part-modal') as HTMLElement
    if (modal) {
      modal.classList.add('hidden')
      modal.classList.remove('flex')
    }
  }

  private async savePart(el: HTMLElement, onSuccess: () => void) {
    const nameIn = el.querySelector('#part-name') as HTMLInputElement
    const codeIn = el.querySelector('#part-code') as HTMLInputElement
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

    try {
      const res = await this.api.post('/api/parts', {
        name: nameIn.value.trim(),
        partNumber: codeIn?.value?.trim() || '',
        description: descIn?.value?.trim() || '',
        quantity: qty,
        minQuantity: minQty,
        sellingPriceSYP: price,
        costSYP: cost,
      })
      if (res.success || (res as any).id) {
        this.closeModal(el)
        onSuccess()
      } else {
        ;(window as any).toast?.show?.({ message: res.message || 'فشل الإنشاء', type: 'error' })
      }
    } catch (e: any) {
      ;(window as any).toast?.show?.({ message: e?.message || 'حدث خطأ أثناء الإنشاء', type: 'error' })
    }
  }

  private async loadParts(el: HTMLElement, callback?: (parts: any[]) => void) {
    try {
      const res = await this.api.get<any>(`/api/parts`)
      const tbody = el.querySelector('#inventory-tbody')!
      if (res.success !== false && res.data) {
        const parts = Array.isArray(res.data) ? res.data : res.data.data || []
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
        <td class="px-6 py-4 font-body-md text-on-surface">${p.partNumber || p.code || p.id?.slice(0,8)}</td>
        <td class="px-6 py-4">
          <div class="font-body-md text-on-surface font-medium">${p.name}</div>
          <div class="text-sm text-text-tertiary">${p.description || ''}</div>
        </td>
        <td class="px-6 py-4 font-body-md text-on-surface">${p.category?.name || '-'}</td>
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
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id')
        if (id) this.router.navigate(`/inventory/parts/${id}`)
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
