import { AuthService } from '../services/auth'
import { ApiClient } from '../api/client'
import { Router } from '../router'
import { AppLayout } from '../components/layout'

export class AuditScreen {
  private auth: AuthService
  private api: ApiClient
  private router: Router

  constructor(auth: AuthService, api: ApiClient, router: Router) {
    this.auth = auth
    this.api = api
    this.router = router
  }

  render(): HTMLElement {
    const layout = new AppLayout(this.auth, this.router, 'سجل التدقيق', 'settings', this.api)
    const content = document.createElement('div')
    content.className = 'page-enter min-h-screen bg-background p-gutter'
    content.innerHTML = `
      <div class="max-w-7xl mx-auto space-y-stack-lg">
        <div>
          <h1 class="font-headline-lg text-on-surface font-bold">سجل التدقيق</h1>
          <p class="text-text-secondary text-sm mt-1">سجل العمليات والتغييرات في النظام</p>
        </div>

        <div class="bg-surface-container-lowest rounded-xl shadow-md border border-surface-subtle overflow-hidden">
          <div class="p-4 border-b border-outline-variant/10 bg-surface-subtle flex justify-between items-center">
            <h3 class="font-headline-md text-on-surface font-semibold">الأحداث</h3>
            <div class="flex items-center gap-2">
              <select id="audit-action-filter" class="bg-surface-container-high border border-outline-variant/20 rounded-lg px-3 py-1.5 text-sm text-on-surface outline-none focus:border-primary">
                <option value="">كل الأحداث</option>
                <option value="CREATE">إنشاء</option>
                <option value="UPDATE">تحديث</option>
                <option value="DELETE">حذف</option>
                <option value="LOGIN">تسجيل دخول</option>
              </select>
            </div>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-surface-subtle text-text-tertiary">
                <tr>
                  <th class="text-right px-4 py-3 font-medium">التاريخ</th>
                  <th class="text-right px-4 py-3 font-medium">المستخدم</th>
                  <th class="text-right px-4 py-3 font-medium">العملية</th>
                  <th class="text-right px-4 py-3 font-medium">الكيان</th>
                  <th class="text-right px-4 py-3 font-medium">IP</th>
                </tr>
              </thead>
              <tbody id="audit-table-body">
                <tr><td colspan="5"><div class="p-6 space-y-3"><div class="skeleton-shimmer h-10 rounded"></div><div class="skeleton-shimmer h-10 rounded"></div><div class="skeleton-shimmer h-10 rounded"></div></div></td></tr>
              </tbody>
            </table>
          </div>
          <!-- Pagination -->
          <div class="p-3 border-t border-outline-variant/10 bg-surface-subtle flex items-center justify-between" id="audit-pagination">
            <span class="text-text-tertiary text-xs" id="audit-page-info">-</span>
            <div class="flex items-center gap-2">
              <button id="audit-prev" class="px-3 py-1 rounded-lg bg-surface-container-high text-on-surface text-sm hover:bg-primary-container/20 disabled:opacity-40" disabled>السابق</button>
              <button id="audit-next" class="px-3 py-1 rounded-lg bg-surface-container-high text-on-surface text-sm hover:bg-primary-container/20 disabled:opacity-40" disabled>التالي</button>
            </div>
          </div>
        </div>
      </div>
    `
    this.loadAudit(content)

    content.querySelector('#audit-action-filter')?.addEventListener('change', (e) => {
      const action = (e.target as HTMLSelectElement).value
      this.currentAuditPage = 1
      this.filterAudit(content, action)
    })
    content.querySelector('#audit-prev')?.addEventListener('click', () => {
      if (this.currentAuditPage > 1) {
        this.currentAuditPage--
        const action = (content.querySelector('#audit-action-filter') as HTMLSelectElement)?.value || ''
        this.filterAudit(content, action)
      }
    })
    content.querySelector('#audit-next')?.addEventListener('click', () => {
      const action = (content.querySelector('#audit-action-filter') as HTMLSelectElement)?.value || ''
      const filtered = action ? this.allAudit.filter((l: any) => l.action === action) : this.allAudit
      const maxPage = Math.ceil(filtered.length / this.auditPageSize)
      if (this.currentAuditPage < maxPage) {
        this.currentAuditPage++
        this.filterAudit(content, action)
      }
    })

    return layout.render(content)
  }

  private allAudit: any[] = []
  private currentAuditPage = 1
  private auditPageSize = 25

  private async loadAudit(content: HTMLElement) {
    const tbody = content.querySelector('#audit-table-body')
    if (!tbody) return

    try {
      const res = await this.api.get<any>('/api/audit')
      let logs: any[] = []
      if (res.success && res.data) {
        if (Array.isArray(res.data.data)) logs = res.data.data
        else if (Array.isArray(res.data.logs)) logs = res.data.logs
        else if (Array.isArray(res.data)) logs = res.data
        else if (res.data.auditLogs && Array.isArray(res.data.auditLogs)) logs = res.data.auditLogs
      }

      this.allAudit = logs

      if (logs.length === 0) {
        tbody.innerHTML = `
          <tr><td colspan="5">
            <div class="text-center py-12">
              <span class="material-symbols-outlined text-text-tertiary text-4xl mb-3">history</span>
              <p class="text-text-tertiary text-sm">لا توجد أحداث مسجلة</p>
            </div>
          </td></tr>
        `
        return
      }

      this.renderAuditTable(content, logs)

    } catch (e) {
      console.error('Failed to load audit:', e)
      tbody.innerHTML = `
        <tr><td colspan="5">
          <div class="text-center py-12 bg-error/5 rounded-xl">
            <span class="material-symbols-outlined text-error text-4xl mb-3">error</span>
            <p class="text-error text-sm font-medium">فشل تحميل السجل</p>
            <button class="mt-3 text-primary text-sm font-medium retry-audit-btn">إعادة المحاولة</button>
          </div>
        </td></tr>
      `
      tbody.querySelector('.retry-audit-btn')?.addEventListener('click', () => this.loadAudit(content))
    }
  }

  private renderAuditTable(content: HTMLElement, logs: any[]) {
    const tbody = content.querySelector('#audit-table-body')
    if (!tbody) return

    const actionMap: Record<string, { label: string; color: string }> = {
      CREATE: { label: 'إنشاء', color: 'tertiary' },
      UPDATE: { label: 'تحديث', color: 'primary' },
      DELETE: { label: 'حذف', color: 'error' },
      LOGIN: { label: 'تسجيل دخول', color: 'info' },
      LOGOUT: { label: 'تسجيل خروج', color: 'text-tertiary' },
    }

    const start = (this.currentAuditPage - 1) * this.auditPageSize
    const pageLogs = logs.slice(start, start + this.auditPageSize)
    const maxPage = Math.max(1, Math.ceil(logs.length / this.auditPageSize))

    const fragment = document.createDocumentFragment()
    pageLogs.forEach((log: any) => {
      const a = actionMap[log.action] || { label: log.action, color: 'text-tertiary' }
      const date = log.createdAt ? new Date(log.createdAt).toLocaleString('ar-SY', { hour: '2-digit', minute: '2-digit', year: 'numeric', month: 'short', day: 'numeric' }) : '-'
      const userName = log.user?.fullName || log.user?.username || log.userName || '-'
      const entity = log.entity || '-'
      const entityId = log.entityId ? log.entityId.slice(0, 8) + '...' : '-'
      const tr = document.createElement('tr')
      tr.className = 'border-b border-outline-variant/5 hover:bg-surface-subtle/50 transition-colors'
      tr.innerHTML = `
          <td class="px-4 py-3 text-text-tertiary whitespace-nowrap">${date}</td>
          <td class="px-4 py-3 text-on-surface">${userName}</td>
          <td class="px-4 py-3"><span class="${a.color} bg-${a.color}/10 px-2 py-0.5 rounded-full text-xs font-medium">${a.label}</span></td>
          <td class="px-4 py-3 text-text-tertiary">${entity} <span class="text-xs">${entityId}</span></td>
          <td class="px-4 py-3 text-text-tertiary text-xs font-mono">${log.ipAddress || '-'}</td>
      `
      fragment.appendChild(tr)
    })
    tbody.innerHTML = ''
    tbody.appendChild(fragment)

    // Update pagination controls
    const pageInfo = content.querySelector('#audit-page-info') as HTMLElement
    const prevBtn = content.querySelector('#audit-prev') as HTMLButtonElement
    const nextBtn = content.querySelector('#audit-next') as HTMLButtonElement
    if (pageInfo) pageInfo.textContent = `صفحة ${this.currentAuditPage} من ${maxPage} (${logs.length} سجل)`
    if (prevBtn) prevBtn.disabled = this.currentAuditPage <= 1
    if (nextBtn) nextBtn.disabled = this.currentAuditPage >= maxPage
  }

  private filterAudit(content: HTMLElement, action: string) {
    let filtered = this.allAudit
    if (action) {
      filtered = filtered.filter((log: any) => log.action === action)
    }
    this.renderAuditTable(content, filtered)
  }
}
