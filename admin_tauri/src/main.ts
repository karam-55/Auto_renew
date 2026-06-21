import './style.css'
import { App } from './app.ts'
import { toast } from './services/toast'
import Chart from 'chart.js/auto'

// Expose toast and Chart.js globally for screens to use without importing
;(window as any).toast = toast
;(window as any).Chart = Chart

document.addEventListener('DOMContentLoaded', () => {
  console.log('[DEBUG] DOMContentLoaded fired')
  try {
    const appRoot = document.getElementById('app')
    console.log('[DEBUG] app element:', appRoot)
    if (!appRoot) {
      console.error('[DEBUG] #app element not found!')
      return
    }
    const app = new App()
    console.log('[DEBUG] App created')
    app.mount(appRoot)
    console.log('[DEBUG] App mounted')
  } catch (err: any) {
    console.error('[DEBUG] Fatal error:', err.message, err.stack)
    document.body.innerHTML = '<div style="padding: 40px; font-family: sans-serif; direction: rtl;"><h1 style="color: red;">خطأ في تحميل التطبيق</h1><pre style="background: #f5f5f5; padding: 16px; overflow: auto;">' + (err.message || 'Unknown error') + '</pre></div>'
  }
})
