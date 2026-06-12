export const dynamic = "force-dynamic"
import { one } from "@/server/db"

export async function GET() {
  try {
    const w = await one<{ c: number }>("SELECT COUNT(*) as c FROM WellInfo")
    const m = await one<{ c: number }>("SELECT COUNT(*) as c FROM DynamicMonitoring")
    const l = await one<{ c: number }>("SELECT COUNT(*) as c FROM LabData")
    const ln = await one<{ c: number }>("SELECT COUNT(*) as c FROM WellLineInfo")
    return Response.json({ ok: true, wells: w?.c, monitoring: m?.c, lab: l?.c, lines: ln?.c, db: "saltlake.db" })
  } catch (e: any) { return Response.json({ ok: false, error: e.message }, { status: 500 }) }
}
