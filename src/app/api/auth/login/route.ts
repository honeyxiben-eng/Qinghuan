import { initUsersTable, loginUser, createToken } from "@/server/services/auth"

export const maxDuration = 60

export async function POST(req: Request) {
  await initUsersTable()
  try {
    const { username, password } = await req.json()
    if (!username || !password) return Response.json({ ok: false, error: "请输入用户名和密码" }, { status: 400 })
    const r = await loginUser(username, password)
    if (!r.ok || !r.user) return Response.json({ ok: false, error: r.error }, { status: 401 })
    const token = await createToken(r.user)
    return Response.json({ ok: true, token, user: r.user })
  } catch { return Response.json({ ok: false, error: "请求错误" }, { status: 400 }) }
}
