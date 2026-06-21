import { invoke } from '@tauri-apps/api/core'

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

interface CacheEntry {
  data: any
  expiry: number
}

// API constants
const DEFAULT_TIMEOUT_MS = 30000
const DEFAULT_RETRIES = 2
const CACHE_TTL_MS = 30000
const BACKOFF_BASE_MS = 500

export class ApiClient {
  private baseUrl: string
  private token: string | null = null
  private tenantId: string | null = null
  private branchId: string | null = null
  private cache = new Map<string, CacheEntry>()
  private cacheTtlMs = CACHE_TTL_MS

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  clearCache() {
    this.cache.clear()
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

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
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

  private async nativeRequestWithTimeout<T>(
    method: string,
    path: string,
    body?: string,
    timeoutMs: number = 30000
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${path}`
    const reqPromise = invoke<{ status: number; body: unknown }>('native_http_request', {
      method,
      url,
      headers: this.getHeaders(),
      body: body || null,
    })
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Request timed out')), timeoutMs)
    )
    const result = await Promise.race([reqPromise, timeoutPromise])

    const data = result.body
    if (result.status >= 400) {
      const msg =
        (data && typeof data === 'object' && (data as any).message) ||
        (data && typeof data === 'object' && (data as any).error?.message) ||
        (data && typeof data === 'object' && (data as any).error) ||
        (data && typeof data === 'object' && (data as any).msg) ||
        `خطأ ${result.status}`
      return { success: false, message: msg }
    }

    if (data && typeof data === 'object' && 'success' in data) {
      return data as ApiResponse<T>
    }
    return { success: true, data: data as T }
  }

  private async nativeRequest<T>(
    method: string,
    path: string,
    body?: string,
    timeoutMs: number = DEFAULT_TIMEOUT_MS,
    retries: number = DEFAULT_RETRIES
  ): Promise<ApiResponse<T>> {
    let lastError: string = 'لا يمكن الاتصال بالخادم.'
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await this.nativeRequestWithTimeout<T>(method, path, body, timeoutMs)
      } catch (e: any) {
        lastError = e?.toString() || 'لا يمكن الاتصال بالخادم.'
        if (import.meta.env?.DEV) {
          console.warn(`[ApiClient] ${method} ${path} attempt ${attempt + 1}/${retries + 1} failed:`, lastError)
        }
        if (attempt < retries) {
          await new Promise((res) => setTimeout(res, Math.pow(2, attempt) * BACKOFF_BASE_MS))
        }
      }
    }
    if (import.meta.env?.DEV) {
      console.error('[ApiClient] Native request failed after retries:', lastError)
    }
    return { success: false, message: lastError }
  }

  private cacheKey(path: string): string {
    return `${path}|t=${this.token || ''}|tn=${this.tenantId || ''}|b=${this.branchId || ''}`
  }

  async get<T>(path: string, useCache = true): Promise<ApiResponse<T>> {
    const key = this.cacheKey(path)
    if (useCache) {
      const cached = this.cache.get(key)
      if (cached && Date.now() < cached.expiry) {
        return cached.data as ApiResponse<T>
      }
    }
    const res = await this.nativeRequest<T>('GET', path)
    if (useCache && res.success) {
      this.cache.set(key, { data: res, expiry: Date.now() + this.cacheTtlMs })
    }
    return res
  }

  async post<T>(path: string, body: unknown): Promise<ApiResponse<T>> {
    return this.nativeRequest<T>('POST', path, JSON.stringify(body))
  }

  async put<T>(path: string, body: unknown): Promise<ApiResponse<T>> {
    return this.nativeRequest<T>('PUT', path, JSON.stringify(body))
  }

  async patch<T>(path: string, body: unknown): Promise<ApiResponse<T>> {
    return this.nativeRequest<T>('PATCH', path, JSON.stringify(body))
  }

  async delete<T>(path: string): Promise<ApiResponse<T>> {
    return this.nativeRequest<T>('DELETE', path)
  }
}
