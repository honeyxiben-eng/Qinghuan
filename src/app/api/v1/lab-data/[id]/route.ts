import { requireAuth } from "@/server/api/auth-guard"
import { ok, failCode, serverError } from "@/server/api/respond"
import { labUpdateSchema } from "@/shared/validation"
import { updateLabData, deleteLabDatas } from "@/server/services/lab"

export const dynamic = "force-dynamic"

type Ctx = { params: Promise<{ id: string }> }

export async function PUT(req: Request, { params }: Ctx) {
  const a = await requireAuth(req, ["admin", "lab"])
  if (a instanceof Response) return a
  try {
    const { id } = await params
    const parsed = labUpdateSchema.safeParse(await req.json())
    if (!parsed.success) {
      const f = parsed.error.issues[0]
      return failCode("VALIDATION_ERROR", f?.message || "参数错误", String(f?.path[0] ?? ""))
    }
    const r = await updateLabData(Number(id), parsed.data)
    return ok({ id: Number(id), changes: r.changes })
  } catch (e) {
    return serverError(e)
  }
}

export async function DELETE(req: Request, { params }: Ctx) {
  const a = await requireAuth(req, ["admin", "lab"])
  if (a instanceof Response) return a
  try {
    const { id } = await params
    const r = await deleteLabDatas([Number(id)])
    return ok({ id: Number(id), deleted: r.changes })
  } catch (e) {
    return serverError(e)
  }
}
