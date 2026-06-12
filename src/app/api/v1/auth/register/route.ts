import { initUsersTable, registerUser } from "@/server/services/auth"
import { ok, failCode, serverError } from "@/server/api/respond"
import { registerSchema } from "@/shared/validation"

export async function POST(req: Request) {
  await initUsersTable()
  try {
    const parsed = registerSchema.safeParse(await req.json())
    if (!parsed.success) {
      const first = parsed.error.issues[0]
      return failCode("VALIDATION_ERROR", first?.message || "参数错误", String(first?.path[0] ?? ""))
    }
    const { username, password, displayName, role } = parsed.data
    const r = await registerUser(username, password, displayName, role)
    if (!r.ok) return failCode("CONFLICT", r.error || "注册失败")
    return ok({ registered: true })
  } catch (e) {
    return serverError(e)
  }
}
