// ============================================================
// 智慧盐湖平台 · 三端共享核心 — REST API 客户端
// 与平台无关：注入 fetch 与 token 提供器即可在 Web / uni-app 复用
// ============================================================
import type { ApiResponse, Paginated } from './types'

export interface ApiClientOptions {
  baseUrl: string
  /** 获取当前 JWT（各端自行从 cookie / storage 取） */
  getToken?: () => string | null | undefined
  /** 自定义 fetch（uni-app 可适配 uni.request） */
  fetchFn?: typeof fetch
  /** 401 回调（各端跳转登录） */
  onUnauthorized?: () => void
}

export class ApiError extends Error {
  code: string
  field?: string
  status: number
  constructor(code: string, message: string, status: number, field?: string) {
    super(message)
    this.code = code
    this.field = field
    this.status = status
  }
}

export function createApiClient(opts: ApiClientOptions) {
  const f = opts.fetchFn || fetch

  async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    const token = opts.getToken?.()
    if (token) headers['Authorization'] = `Bearer ${token}`

    const res = await f(opts.baseUrl + path, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
    const json = (await res.json()) as ApiResponse<T>
    if (!json.success) {
      if (res.status === 401) opts.onUnauthorized?.()
      throw new ApiError(json.error.code, json.error.message, res.status, json.error.field)
    }
    return json.data
  }

  async function requestPaged<T>(path: string): Promise<Paginated<T>> {
    const headers: Record<string, string> = {}
    const token = opts.getToken?.()
    if (token) headers['Authorization'] = `Bearer ${token}`
    const res = await f(opts.baseUrl + path, { headers })
    const json = (await res.json()) as ApiResponse<T[]>
    if (!json.success) {
      if (res.status === 401) opts.onUnauthorized?.()
      throw new ApiError(json.error.code, json.error.message, res.status, json.error.field)
    }
    const m = json.meta || {}
    return {
      data: json.data,
      total: m.total ?? json.data.length,
      page: m.page ?? 1,
      pageSize: m.pageSize ?? json.data.length,
      totalPages: m.totalPages ?? 1,
    }
  }

  function qs(params: Record<string, unknown>): string {
    const p = new URLSearchParams()
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') p.set(k, String(v))
    }
    const s = p.toString()
    return s ? `?${s}` : ''
  }

  return { request, requestPaged, qs }
}

export type ApiClient = ReturnType<typeof createApiClient>
