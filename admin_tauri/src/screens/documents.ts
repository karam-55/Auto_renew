import { AuthService } from '../services/auth'
import { ApiClient } from '../api/client'
import { Router } from '../router'
import { AppLayout } from '../components/layout'

export class DocumentsScreen {
  private auth: AuthService
  private api: ApiClient
  private router: Router

  constructor(auth: AuthService, api: ApiClient, router: Router) {
    this.auth = auth
    this.api = api
    this.router = router
  }

  render(): HTMLElement {
    const layout = new AppLayout(this.auth, this.router, 'أرشيف المستندات الرقمي', 'folder', this.api)
    const content = document.createElement('div')
    content.className = 'page-enter min-h-screen bg-background p-gutter'
    content.innerHTML = `
      <div class="max-w-7xl mx-auto space-y-stack-lg">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="font-beVietnamPro text-headline-md text-on-surface">أرشيف المستندات الرقمي</h1>
            <p class="text-body-md text-text-secondary mt-1">إدارة وتخزين جميع المستندات والوثائق</p>
          </div>
          <input type="file" id="doc-file-input" class="hidden" />
          <button class="h-[48px] bg-primary text-on-primary font-ibmPlexSans font-body-lg text-body-lg rounded-lg shadow-sm hover:shadow-lg hover:-translate-y-[1px] transition-all duration-200 flex items-center justify-center gap-2 px-6" id="upload-doc-btn">
            <span class="material-symbols-outlined text-[20px]">upload</span>
            رفع مستند
          </button>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-surface-subtle flex flex-col items-center gap-3 group cursor-pointer hover:-translate-y-1 transition-all">
            <div class="w-12 h-12 rounded-full bg-primary/5 text-primary flex items-center justify-center">
              <span class="material-symbols-outlined text-[24px]">folder</span>
            </div>
            <span class="font-label-sm text-on-surface font-semibold">الفواتير</span>
            <span class="text-xs text-text-tertiary" id="doc-count-invoices">--</span>
          </div>
          <div class="bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-surface-subtle flex flex-col items-center gap-3 group cursor-pointer hover:-translate-y-1 transition-all">
            <div class="w-12 h-12 rounded-full bg-secondary/5 text-secondary flex items-center justify-center">
              <span class="material-symbols-outlined text-[24px]">description</span>
            </div>
            <span class="font-label-sm text-on-surface font-semibold">العقود</span>
            <span class="text-xs text-text-tertiary" id="doc-count-contracts">--</span>
          </div>
          <div class="bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-surface-subtle flex flex-col items-center gap-3 group cursor-pointer hover:-translate-y-1 transition-all">
            <div class="w-12 h-12 rounded-full bg-tertiary/5 text-tertiary flex items-center justify-center">
              <span class="material-symbols-outlined text-[24px]">receipt_long</span>
            </div>
            <span class="font-label-sm text-on-surface font-semibold">أوامر الشراء</span>
            <span class="text-xs text-text-tertiary" id="doc-count-orders">--</span>
          </div>
          <div class="bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-surface-subtle flex flex-col items-center gap-3 group cursor-pointer hover:-translate-y-1 transition-all">
            <div class="w-12 h-12 rounded-full bg-info/5 text-info flex items-center justify-center">
              <span class="material-symbols-outlined text-[24px]">image</span>
            </div>
            <span class="font-label-sm text-on-surface font-semibold">الصور</span>
            <span class="text-xs text-text-tertiary" id="doc-count-images">--</span>
          </div>
        </div>
        <div class="bg-surface-container-lowest rounded-xl shadow-md border border-surface-subtle overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="bg-surface-subtle border-b border-outline-variant/10">
                  <th class="px-6 py-4 text-right font-label-sm text-label-sm text-text-tertiary uppercase">اسم الملف</th>
                  <th class="px-6 py-4 text-right font-label-sm text-label-sm text-text-tertiary uppercase">النوع</th>
                  <th class="px-6 py-4 text-right font-label-sm text-label-sm text-text-tertiary uppercase">الحجم</th>
                  <th class="px-6 py-4 text-right font-label-sm text-label-sm text-text-tertiary uppercase">التاريخ</th>
                  <th class="px-6 py-4 text-right font-label-sm text-label-sm text-text-tertiary uppercase">إجراءات</th>
                </tr>
              </thead>
              <tbody id="documents-tbody">
                <tr><td colspan="5" class="px-6 py-8 text-center text-text-secondary"><div class="skeleton-shimmer h-4 rounded w-32 mx-auto"></div></td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `
    this.loadData(content)
    const fileInput = content.querySelector('#doc-file-input') as HTMLInputElement
    content.querySelector('#upload-doc-btn')?.addEventListener('click', () => {
      fileInput?.click()
    })
    fileInput?.addEventListener('change', async () => {
      const file = fileInput.files?.[0]
      if (!file) return
      ;(window as any).toast?.show?.({ message: `جاري رفع ${file.name}...`, type: 'info', duration: 2000 })
      // Placeholder: actual upload would require FormData + backend endpoint
      setTimeout(() => {
        ;(window as any).toast?.show?.({ message: `تم رفع ${file.name} (تجريبي)`, type: 'success' })
        fileInput.value = ''
      }, 1500)
    })
    return layout.render(content)
  }

  private async loadData(el: HTMLElement) {
    try {
      const res = await this.api.get<any>('/api/documents')
      const tbody = el.querySelector('#documents-tbody')!
      if (res.success && res.data) {
        const items = Array.isArray(res.data) ? res.data : res.data.data || []
        if (items.length === 0) { tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-text-secondary font-body-md">لا توجد مستندات</td></tr>'; return }
        tbody.innerHTML = items.map((item: any) => `
          <tr class="border-b border-outline-variant/10 hover:bg-surface-container-low/50 transition-colors">
            <td class="px-6 py-4 flex items-center gap-2">
              <span class="material-symbols-outlined text-primary">description</span>
              <span class="font-body-md text-on-surface">${item.name || '-'}</span>
            </td>
            <td class="px-6 py-4 font-body-md text-text-secondary">${item.type || '-'}</td>
            <td class="px-6 py-4 font-body-md text-text-secondary">${item.size || '-'}</td>
            <td class="px-6 py-4 font-body-md text-text-secondary">${item.createdAt?.split('T')[0] || '-'}</td>
            <td class="px-6 py-4">
              <button class="w-8 h-8 rounded-lg hover:bg-surface-container flex items-center justify-center text-text-tertiary hover:text-primary transition-colors" data-action="download" data-id="${item.id}">
                <span class="material-symbols-outlined text-[18px]">download</span>
              </button>
            </td>
          </tr>
        `).join('')
        tbody.querySelectorAll('[data-action="download"]').forEach(btn => {
          btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id')
            if (id) window.open(`/api/documents/${id}/download`, '_blank')
          })
        })
      }
    } catch { el.querySelector('#documents-tbody')!.innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-error font-body-md">حدث خطأ</td></tr>' }
  }
}
