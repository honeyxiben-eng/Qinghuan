import { requireAuth } from "@/server/api/auth-guard"
import { ok, failCode, serverError } from "@/server/api/respond"
import { wellUpdateSchema } from "@/shared/validation"
import { getWellById, updateWell, deleteWells } from "@/server/services/wells"

export const dynamic = "force-dynamic"

type Ctx = { params: Promise<{ wellId: string }> }

export async function GET(req: Request, { params }: Ctx) {
  const a = await requireAuth(req)
  if (a instanceof Response) return a
  try {
    const { wellId } = await params
    const w = await getWellById(wellId)
    if (!w) return failCode("NOT_FOUND", "井不存在")
    return ok(w)
  } catch (e) {
    return serverError(e)
  }
}

export async function PUT(req: Request, { params }: Ctx) {
  const a = await requireAuth(req, ["admin", "brine"])
  if (a instanceof Response) return a
  try {
    const { wellId } = await params
    const parsed = wellUpdateSchema.safeParse(await req.json())
    if (!parsed.success) {
      const f = parsed.error.issues[0]
      return failCode("VALIDATION_ERROR", f?.message || "参数错误", String(f?.path[0] ?? ""))
    }
    const r = await updateWell(wellId, parsed.data)
    return ok({ wellId, changes: r.changes })
  } catch (e) {
    return serverError(e)
  }
}

export async function DELETE(req: Request, { params }: Ctx) {
  const a = await requireAuth(req, ["admin"])
  if (a instanceof Response) return a
  try {
    const { wellId } = await params
    const r = await deleteWells([wellId])
    return ok({ wellId, deleted: r.changes })
  } catch (e) {
    return serverError(e)
  }
}
