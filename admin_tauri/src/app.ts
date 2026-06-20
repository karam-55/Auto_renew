import { Router } from './router'
import { AuthService } from './services/auth'
import { ApiClient } from './api/client'

export class App {
  private router: Router
  private auth: AuthService
  private api: ApiClient
  private container: HTMLElement | null = null

  constructor() {
    console.log('[DEBUG] App constructor start')
    const baseUrl = 'http://178.105.209.59'
    console.log('[DEBUG] baseUrl:', baseUrl, 'port:', window.location.port)
    this.api = new ApiClient(baseUrl)
    this.auth = new AuthService(this.api)
    this.router = new Router(this.auth, this.api)
    console.log('[DEBUG] App constructor done')
  }

  mount(container: HTMLElement) {
    console.log('[DEBUG] App mount start')
    this.container = container
    this.container.innerHTML = `
      <div id="app-root" class="app-root">
        <div id="router-view"></div>
      </div>
    `
    const routerView = document.getElementById('router-view')
    console.log('[DEBUG] router-view element:', routerView)
    if (!routerView) {
      console.error('[DEBUG] router-view not found!')
      return
    }
    try {
      this.router.init(routerView)
      console.log('[DEBUG] router.init done')
    } catch (err: any) {
      console.error('[DEBUG] router.init error:', err.message, err.stack)
      throw err
    }
  }
}
