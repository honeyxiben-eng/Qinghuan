import { initUsersTable, loginUser, createToken } from "@/server/services/auth"
import { ok, failCode, serverError } from "@/server/api/respond"
import { loginSchema } from "@/shared/validation"

export const maxDuration = 60

export async function POST(req: Request) {
  await initUsersTable()
  try {
    const body = await req.json()
    const parsed = loginSchema.safeParse(body)
    if (!parsed.success) {
      const first = parsed.error.issues[0]
      return failCode("VALIDATION_ERROR", first?.message || "参数错误", String(first?.path[0] ?? ""))
    }
    const r = await loginUser(parsed.data.username, parsed.data.password)
    if (!r.ok || !r.user) return failCode("UNAUTHORIZED", r.error || "用户名或密码错误")
    const token = await createToken(r.user)
    return ok({ token, user: r.user })
  } catch (e) {
    return serverError(e)
  }
}
