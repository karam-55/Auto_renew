export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  meta?: {
    total: number
    page: number
    limit: number
  }
}

export class ApiClient {
  private baseUrl: string
  private token: string | null = null
  private tenantId: string | null = null
  private branchId: string | null = null

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  setToken(token: string | null) {
    this.token = token
  }

  setTenantId(tenantId: string | null) {
    this.tenantId = tenantId
  }

  setBranchId(branchId: string | null) {
    this.branchId = branchId
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }
    if (this.tenantId) {
      headers['x-tenant-id'] = this.tenantId
    }
    if (this.branchId) {
      headers['x-branch-id'] = this.branchId
    }
    return headers
  }

  async get<T>(path: string): Promise<ApiResponse<T>> {
    try {
      const res = await fetch(`${this.baseUrl}${path}`, {
        method: 'GET',
        headers: this.getHeaders(),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        const msg = data.message || (data.error && data.error.message) || data.error || data.msg || `خطأ ${res.status}: ${res.statusText}`
        return { success: false, message: msg }
      }
      // Backend formats vary: some return {success, data, meta}, others return raw objects like {user, tokens}
      if (data && typeof data === 'object' && 'success' in data) {
        return data as ApiResponse<T>
      }
      return { success: true, data: data as T } as ApiResponse<T>
    } catch (e) {
      return { success: false, message: 'لا يمكن الاتصال بالخادم. تأكد أن الباك-اند يعمل على المنفذ 8080.' }
    }
  }

  async post<T>(path: string, body: unknown): Promise<ApiResponse<T>> {
    try {
      const res = await fetch(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        const msg = data.message || (data.error && data.error.message) || data.error || data.msg || `خطأ ${res.status}: ${res.statusText}`
        return { success: false, message: msg }
      }
      // Backend formats vary: some return {success, data, meta}, others return raw objects like {user, tokens}
      if (data && typeof data === 'object' && 'success' in data) {
        return data as ApiResponse<T>
      }
      return { success: true, data: data as T } as ApiResponse<T>
    } catch (e) {
      return { success: false, message: 'لا يمكن الاتصال بالخادم. تأكد أن الباك-اند يعمل على المنفذ 8080.' }
    }
  }

  async put<T>(path: string, body: unknown): Promise<ApiResponse<T>> {
    try {
      const res = await fetch(`${this.baseUrl}${path}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        const msg = data.message || (data.error && data.error.message) || data.error || data.msg || `خطأ ${res.status}: ${res.statusText}`
        return { success: false, message: msg }
      }
      // Backend formats vary: some return {success, data, meta}, others return raw objects like {user, tokens}
      if (data && typeof data === 'object' && 'success' in data) {
        return data as ApiResponse<T>
      }
      return { success: true, data: data as T } as ApiResponse<T>
    } catch (e) {
      return { success: false, message: 'لا يمكن الاتصال بالخادم. تأكد أن الباك-اند يعمل على المنفذ 8080.' }
    }
  }

  async patch<T>(path: string, body: unknown): Promise<ApiResponse<T>> {
    try {
      const res = await fetch(`${this.baseUrl}${path}`, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        const msg = data.message || (data.error && data.error.message) || data.error || data.msg || `خطأ ${res.status}: ${res.statusText}`
        return { success: false, message: msg }
      }
      if (data && typeof data === 'object' && 'success' in data) {
        return data as ApiResponse<T>
      }
      return { success: true, data: data as T } as ApiResponse<T>
    } catch (e) {
      return { success: false, message: 'لا يمكن الاتصال بالخادم. تأكد أن الباك-اند يعمل على المنفذ 8080.' }
    }
  }

  async delete<T>(path: string): Promise<ApiResponse<T>> {
    try {
      const res = await fetch(`${this.baseUrl}${path}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        const msg = data.message || (data.error && data.error.message) || data.error || data.msg || `خطأ ${res.status}: ${res.statusText}`
        return { success: false, message: msg }
      }
      // Backend formats vary: some return {success, data, meta}, others return raw objects like {user, tokens}
      if (data && typeof data === 'object' && 'success' in data) {
        return data as ApiResponse<T>
      }
      return { success: true, data: data as T } as ApiResponse<T>
    } catch (e) {
      return { success: false, message: 'لا يمكن الاتصال بالخادم. تأكد أن الباك-اند يعمل على المنفذ 8080.' }
    }
  }
}
