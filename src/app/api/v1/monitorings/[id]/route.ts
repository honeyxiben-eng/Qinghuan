import { requireAuth } from "@/server/api/auth-guard"
import { ok, failCode, serverError } from "@/server/api/respond"
import { monitoringUpdateSchema } from "@/shared/validation"
import { updateMonitoring, deleteMonitorings } from "@/server/services/monitoring"

export const dynamic = "force-dynamic"

type Ctx = { params: Promise<{ id: string }> }

export async function PUT(req: Request, { params }: Ctx) {
  const a = await requireAuth(req, ["admin", "brine"])
  if (a instanceof Response) return a
  try {
    const { id } = await params
    const parsed = monitoringUpdateSchema.safeParse(await req.json())
    if (!parsed.success) {
      const f = parsed.error.issues[0]
      return failCode("VALIDATION_ERROR", f?.message || "参数错误", String(f?.path[0] ?? ""))
    }
    const r = await updateMonitoring(Number(id), parsed.data)
    return ok({ id: Number(id), changes: r.changes })
  } catch (e) {
    return serverError(e)
  }
}

export async function DELETE(req: Request, { params }: Ctx) {
  const a = await requireAuth(req, ["admin", "brine"])
  if (a instanceof Response) return a
  try {
    const { id } = await params
    const r = await deleteMonitorings([Number(id)])
    return ok({ id: Number(id), deleted: r.changes })
  } catch (e) {
    return serverError(e)
  }
}
