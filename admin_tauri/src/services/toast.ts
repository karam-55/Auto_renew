export type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastOptions {
  message: string
  type?: ToastType
  duration?: number
}

export class ToastService {
  private static instance: ToastService
  private container: HTMLElement | null = null

  static getInstance(): ToastService {
    if (!ToastService.instance) ToastService.instance = new ToastService()
    return ToastService.instance
  }

  private getContainer(): HTMLElement {
    if (this.container) return this.container
    this.container = document.createElement('div')
    this.container.id = 'toast-container'
    this.container.className = 'fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 pointer-events-none'
    this.container.setAttribute('aria-live', 'polite')
    this.container.setAttribute('role', 'status')
    this.container.setAttribute('aria-atomic', 'true')
    document.body.appendChild(this.container)
    return this.container
  }

  show({ message, type = 'info', duration = 3000 }: ToastOptions) {
    const container = this.getContainer()
    const el = document.createElement('div')
    const colors: Record<ToastType, string> = {
      success: 'bg-tertiary text-on-tertiary',
      error: 'bg-error text-on-error',
      warning: 'bg-warning text-on-warning',
      info: 'bg-primary text-on-primary',
    }
    const icons: Record<ToastType, string> = {
      success: 'check_circle',
      error: 'error',
      warning: 'warning',
      info: 'info',
    }
    el.className = `pointer-events-auto flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transform translate-y-[-20px] opacity-0 transition-all duration-300 ${colors[type]}`
    el.innerHTML = `
      <span class="material-symbols-outlined text-[18px]">${icons[type]}</span>
      <span>${message}</span>
    `
    container.appendChild(el)

    // Animate in
    requestAnimationFrame(() => {
      el.classList.remove('translate-y-[-20px]', 'opacity-0')
    })

    // Auto dismiss
    setTimeout(() => {
      el.classList.add('translate-y-[-20px]', 'opacity-0')
      setTimeout(() => el.remove(), 300)
    }, duration)
  }
}

export const toast = ToastService.getInstance()
