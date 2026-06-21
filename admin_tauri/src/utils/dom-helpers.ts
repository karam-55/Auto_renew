// Shared DOM helpers to reduce code duplication across screens

export function showModal(modal: HTMLElement | null) {
  if (!modal) return
  modal.classList.remove('hidden')
  modal.classList.add('flex')
}

export function hideModal(modal: HTMLElement | null) {
  if (!modal) return
  modal.classList.add('hidden')
  modal.classList.remove('flex')
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
