import { ApiClient } from '../api/client'

export interface User {
  id: string
  username: string
  fullName: string
  role: string
  phone: string
}

export interface LoginCredentials {
  username: string
  password: string
}

export class AuthService {
  private api: ApiClient
  private user: User | null = null
  private listeners: ((user: User | null) => void)[] = []

  constructor(api: ApiClient) {
    this.api = api
    this.loadSession()
  }

  private loadSession() {
    const token = localStorage.getItem('token')
    const user = localStorage.getItem('user')
    const tenantId = localStorage.getItem('tenantId')
    const branchId = localStorage.getItem('branchId')
    if (token && user) {
      this.api.setToken(token)
      this.api.setTenantId(tenantId)
      this.api.setBranchId(branchId)
      this.user = JSON.parse(user)
    }
  }

  async login(creds: LoginCredentials): Promise<{ success: boolean; message?: string }> {
    const res = await this.api.post<any>('/api/auth/login', {
      ...creds,
      tenantId: 'default',
    }) as any
    // Backend returns wrapped by client.ts as: { success: true, data: { user, tokens } }
    if (res.data?.user && res.data?.tokens?.accessToken) {
      this.user = res.data.user as User
      this.api.setToken(res.data.tokens.accessToken)
      localStorage.setItem('token', res.data.tokens.accessToken)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      this.notify()
      return { success: true }
    }
    return { success: false, message: res.message || 'اسم المستخدم أو كلمة المرور غير صحيحة' }
  }

  logout() {
    this.user = null
    this.api.setToken(null)
    this.api.setTenantId(null)
    this.api.setBranchId(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('tenantId')
    localStorage.removeItem('branchId')
    this.notify()
  }

  isAuthenticated(): boolean {
    return this.user !== null
  }

  getUser(): User | null {
    return this.user
  }

  onChange(cb: (user: User | null) => void) {
    this.listeners.push(cb)
    return () => {
      this.listeners = this.listeners.filter(l => l !== cb)
    }
  }

  private notify() {
    this.listeners.forEach(l => l(this.user))
  }
}
