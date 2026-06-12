import { requireAuth } from "@/server/api/auth-guard"
import { ok } from "@/server/api/respond"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const a = await requireAuth(req)
  if (a instanceof Response) return a
  return ok({ user: a })
}
