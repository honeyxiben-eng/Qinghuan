import { requireAuth } from "@/server/api/auth-guard"
import { ok, failCode, serverError } from "@/server/api/respond"
import { labCreateSchema } from "@/shared/validation"
import { getLabData, createLabData } from "@/server/services/lab"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const a = await requireAuth(req)
  if (a instanceof Response) return a
  try {
    const sp = new URL(req.url).searchParams
    const r = await getLabData({
      wellId: sp.get("wellId") || undefined,
      region: sp.get("region") || undefined,
      lineId: sp.get("lineId") ? Number(sp.get("lineId")) : undefined,
      search: sp.get("search") || undefined,
      dateFrom: sp.get("dateFrom") || undefined,
      dateTo: sp.get("dateTo") || undefined,
      page: sp.get("page") ? Number(sp.get("page")) : 1,
      pageSize: sp.get("pageSize") ? Number(sp.get("pageSize")) : 20,
    })
    return ok(r.data, { page: r.page, pageSize: r.pageSize, total: r.total, totalPages: r.totalPages })
  } catch (e) {
    return serverError(e)
  }
}

export async function POST(req: Request) {
  const a = await requireAuth(req, ["admin", "lab"])
  if (a instanceof Response) return a
  try {
    const parsed = labCreateSchema.safeParse(await req.json())
    if (!parsed.success) {
      const f = parsed.error.issues[0]
      return failCode("VALIDATION_ERROR", f?.message || "参数错误", String(f?.path[0] ?? ""))
    }
    const r = await createLabData(parsed.data)
    return ok({ id: r.lastInsertRowid, changes: r.changes }, undefined, 201)
  } catch (e) {
    return serverError(e)
  }
}
