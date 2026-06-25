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

function safeJSONParse<T>(raw: string | null, fallback: T | null = null): T | null {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

// Simple obfuscation wrapper for localStorage — prevents casual inspection
// of sensitive tokens. Not a substitute for real encryption.
const SecureStorage = {
  _encode(v: string) { return btoa(unescape(encodeURIComponent(v))) },
  _decode(v: string) { try { return decodeURIComponent(escape(atob(v))) } catch { return '' } },
  setItem(key: string, value: string) { localStorage.setItem(key, this._encode(value)) },
  getItem(key: string): string | null {
    const raw = localStorage.getItem(key)
    return raw ? this._decode(raw) : null
  },
  removeItem(key: string) { localStorage.removeItem(key) },
}

function isValidUser(u: any): u is User {
  return (
    u &&
    typeof u.id === 'string' &&
    typeof u.username === 'string' &&
    typeof u.fullName === 'string'
  )
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
    const token = SecureStorage.getItem('token')
    const rawUser = SecureStorage.getItem('user')
    const tenantId = SecureStorage.getItem('tenantId')
    const branchId = SecureStorage.getItem('branchId')
    const parsedUser = safeJSONParse<User>(rawUser)
    if (token && parsedUser && isValidUser(parsedUser)) {
      this.api.setToken(token)
      this.api.setTenantId(tenantId)
      this.api.setBranchId(branchId)
      this.user = parsedUser
    } else if (rawUser) {
      // Invalid session — clear stale data
      SecureStorage.removeItem('token')
      SecureStorage.removeItem('user')
      SecureStorage.removeItem('tenantId')
      SecureStorage.removeItem('branchId')
    }
  }

  async login(creds: LoginCredentials): Promise<{ success: boolean; message?: string }> {
    const res = await this.api.post<any>('/api/auth/login', {
      ...creds,
    }) as any
    // Backend returns wrapped by client.ts as: { success: true, data: { user, tokens } }
    if (res.data?.user && res.data?.tokens?.accessToken) {
      this.user = res.data.user as User
      this.api.setToken(res.data.tokens.accessToken)
      SecureStorage.setItem('token', res.data.tokens.accessToken)
      SecureStorage.setItem('user', JSON.stringify(res.data.user))
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
    SecureStorage.removeItem('token')
    SecureStorage.removeItem('user')
    SecureStorage.removeItem('tenantId')
    SecureStorage.removeItem('branchId')
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
