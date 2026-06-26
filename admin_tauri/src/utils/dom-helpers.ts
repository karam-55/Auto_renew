// Shared DOM helpers to reduce code duplication across screens

interface FocusTrap {
  element: HTMLElement
  previousActiveElement: Element | null
  keydownHandler: (e: KeyboardEvent) => void
}

let activeTrap: FocusTrap | null = null

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selectors = [
    'button:not([disabled])',
    'a[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ]
  return Array.from(container.querySelectorAll(selectors.join(', ')))
    .filter(el => {
      const style = window.getComputedStyle(el as HTMLElement)
      return style.display !== 'none' && style.visibility !== 'hidden'
    }) as HTMLElement[]
}

function trapFocus(modal: HTMLElement): FocusTrap {
  const focusable = getFocusableElements(modal)
  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  const previousActiveElement = document.activeElement

  const keydownHandler = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      hideModal(modal)
      return
    }
    if (e.key !== 'Tab' || !first || !last) return
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  modal.addEventListener('keydown', keydownHandler)
  if (first) first.focus()

  return { element: modal, previousActiveElement, keydownHandler }
}

function releaseFocus(trap: FocusTrap | null) {
  if (!trap) return
  trap.element.removeEventListener('keydown', trap.keydownHandler)
  if (trap.previousActiveElement instanceof HTMLElement) {
    trap.previousActiveElement.focus()
  }
}

export function showModal(modal: HTMLElement | null) {
  if (!modal) return
  if (activeTrap && activeTrap.element !== modal) {
    releaseFocus(activeTrap)
  }
  modal.classList.remove('hidden')
  modal.classList.add('flex')
  activeTrap = trapFocus(modal)
}

export function hideModal(modal: HTMLElement | null) {
  if (!modal) return
  modal.classList.add('hidden')
  modal.classList.remove('flex')
  if (activeTrap && activeTrap.element === modal) {
    releaseFocus(activeTrap)
    activeTrap = null
  }
}

export function skeletonRow(cols: number): string {
  return `<tr><td colspan="${cols}" class="px-6 py-8 text-center text-text-secondary"><div class="skeleton-shimmer h-4 rounded w-32 mx-auto"></div></td></tr>`
}

export function skeletonTableBody(cols: number, rows: number = 3): string {
  return Array.from({ length: rows }, () => skeletonRow(cols)).join('')
}

// Status badge helper used across multiple screens
export function statusBadge(status: string, labels: Record<string, string>, classes: Record<string, string>): string {
  const label = labels[status] || status
  const cls = classes[status] || 'bg-surface-container-high text-on-surface-variant'
  return `<span class="inline-flex items-center px-3 py-1 rounded-full font-label-sm text-label-sm ${cls}">${label}</span>`
}

// Common customer status badge
export function customerStatusBadge(s: string): string {
  const map: Record<string, { label: string; cls: string }> = {
    ACTIVE: { label: 'نشط', cls: 'bg-tertiary/10 text-tertiary' },
    INACTIVE: { label: 'غير نشط', cls: 'bg-surface-container-high text-text-secondary' },
  }
  const m = map[s] || { label: s, cls: 'bg-surface-container-high text-text-secondary' }
  return `<span class="inline-flex items-center px-3 py-1 rounded-full font-label-sm text-label-sm ${m.cls}">${m.label}</span>`
}

// Common booking status badge
export function bookingStatusBadge(s: string): string {
  const map: Record<string, { label: string; cls: string }> = {
    PENDING: { label: 'معلّق', cls: 'bg-warning/10 text-warning' },
    CONFIRMED: { label: 'مؤكد', cls: 'bg-primary/10 text-primary' },
    IN_PROGRESS: { label: 'قيد التنفيذ', cls: 'bg-info/10 text-info' },
    COMPLETED: { label: 'مكتمل', cls: 'bg-tertiary/10 text-tertiary' },
    CANCELLED: { label: 'ملغى', cls: 'bg-error/10 text-error' },
  }
  const m = map[s] || { label: s, cls: 'bg-surface-container-high text-text-secondary' }
  return `<span class="inline-flex items-center px-3 py-1 rounded-full font-label-sm text-label-sm ${m.cls}">${m.label}</span>`
}

// Generic error toast helper
export function showError(message: string) {
  ;(window as any).toast?.show?.({ message, type: 'error' })
}

export function showSuccess(message: string) {
  ;(window as any).toast?.show?.({ message, type: 'success' })
}

export function showWarning(message: string) {
  ;(window as any).toast?.show?.({ message, type: 'warning' })
}

// Unified empty state for tables, cards, and lists
export function emptyState(options: { icon: string; title: string; description?: string; action?: { label: string; route: string } }): string {
  const actionHtml = options.action
    ? `<a href="${options.action.route}" data-route="${options.action.route}" class="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary-container/10 text-primary rounded-lg hover:bg-primary-container/20 transition-colors text-sm font-medium touch-safe">${options.action.label}</a>`
    : ''
  return `
    <div class="empty-state flex flex-col items-center justify-center py-12 px-4 text-center">
      <span class="material-symbols-outlined text-5xl mb-3 text-on-surface-variant/50" aria-hidden="true">${options.icon}</span>
      <h3 class="font-body-md font-semibold text-on-surface-variant mb-1">${options.title}</h3>
      ${options.description ? `<p class="text-sm text-on-surface-variant/70 max-w-xs">${options.description}</p>` : ''}
      ${actionHtml}
    </div>
  `
}

export function emptyTableRow(cols: number, options: { icon: string; title: string; description?: string; action?: { label: string; route: string } }): string {
  return `<tr><td colspan="${cols}" class="px-6 py-8">
    ${emptyState(options)}
  </td></tr>`
}

// Export data as CSV
export function debounce<T extends (...args: any[]) => void>(fn: T, delay: number): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

export function exportToCSV(filename: string, rows: Record<string, string | number>[]) {
  if (!rows.length) {
    ;(window as any).toast?.show?.({ message: 'لا توجد بيانات للتصدير', type: 'warning' })
    return
  }
  const headers = Object.keys(rows[0])
  const escape = (val: string | number) => {
    const s = String(val ?? '').replace(/"/g, '""')
    return /[\,\n\"]/.test(s) ? `"${s}"` : s
  }
  const csv = [
    headers.join(','),
    ...rows.map(row => headers.map(h => escape(row[h])).join(','))
  ].join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(link.href)
}
