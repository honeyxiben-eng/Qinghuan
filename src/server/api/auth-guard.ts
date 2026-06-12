import "server-only"
import { verifyToken } from "@/server/services/auth"
import type { AuthUser, UserRole } from "@/shared/types"
import { failCode } from "./respond"

// ============================================================
// REST API v1 · JWT Bearer 鉴权
// ============================================================

export async function getAuthUser(req: Request): Promise<AuthUser | null> {
  const h = req.headers.get("authorization") || req.headers.get("Authorization")
  let token: string | null = null
  if (h && h.startsWith("Bearer ")) token = h.slice(7)
  // 兼容 Web 端 cookie 携带（演示期）
  if (!token) {
    const cookie = req.headers.get("cookie") || ""
    const m = cookie.match(/sl_token=([^;]+)/)
    if (m) token = decodeURIComponent(m[1])
  }
  if (!token) return null
  const u = await verifyToken(token)
  if (!u) return null
  return { id: u.id, username: u.username, displayName: u.displayName, role: u.role as UserRole }
}

/**
 * 鉴权守卫：返回 user 或一个 401/403 响应。
 * 用法：const a = await requireAuth(req, ['admin']); if (a instanceof Response) return a
 */
export async function requireAuth(req: Request, roles?: UserRole[]): Promise<AuthUser | Response> {
  const user = await getAuthUser(req)
  if (!user) return failCode("UNAUTHORIZED", "未登录或登录已过期")
  if (roles && roles.length && !roles.includes(user.role)) {
    return failCode("FORBIDDEN", "无权访问该资源")
  }
  return user
}
