import "server-only"
import { NextResponse } from "next/server"
import type { ApiMeta, ApiErrorCode } from "@/shared/types"

// ============================================================
// REST API v1 · 统一响应封装
// ============================================================

export function ok<T>(data: T, meta?: ApiMeta, status = 200) {
  return NextResponse.json(
    { success: true, data, ...(meta ? { meta } : {}), timestamp: new Date().toISOString() },
    { status }
  )
}

export function fail(code: ApiErrorCode, message: string, status = 400, field?: string) {
  return NextResponse.json(
    { success: false, error: { code, message, ...(field ? { field } : {}) }, timestamp: new Date().toISOString() },
    { status }
  )
}

const STATUS_BY_CODE: Record<ApiErrorCode, number> = {
  VALIDATION_ERROR: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_ERROR: 500,
}

export function failCode(code: ApiErrorCode, message: string, field?: string) {
  return fail(code, message, STATUS_BY_CODE[code], field)
}

/** 把 service 抛出的异常统一转成 500 */
export function serverError(e: unknown) {
  const msg = e instanceof Error ? e.message : "服务器内部错误"
  return fail("INTERNAL_ERROR", msg, 500)
}
