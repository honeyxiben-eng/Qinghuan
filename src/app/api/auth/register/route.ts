import { initUsersTable, registerUser } from "@/server/services/auth"

export async function POST(req: Request) {
  await initUsersTable()
  try {
    const { username, password, displayName, role } = await req.json()
    if (!username || !password || !displayName) return Response.json({ ok: false, error: "请填写完整信息" }, { status: 400 })
    const r = await registerUser(username, password, displayName, role || "brine")
    return Response.json(r, r.ok ? { status: 200 } : { status: 400 })
  } catch { return Response.json({ ok: false, error: "请求错误" }, { status: 400 }) }
}
