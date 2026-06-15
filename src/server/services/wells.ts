import "server-only"
import { all, one, run, tx } from "@/server/db"
import { fmtDate } from "@/shared/precision"
import type { Paginated } from "@/shared/types"
import { auditLog } from "./audit"

export async function getWells(o?: { region?: string; lineId?: number; search?: string; page?: number; pageSize?: number }): Promise<Paginated<any>> {
  const p = o?.page || 1; const ps = o?.pageSize || 20; let w = "1=1"; const pr: any[] = []
  if (o?.region) { pr.push(o.region); w += " AND wl.region=$" + pr.length }
  if (o?.lineId) { pr.push(o.lineId); w += " AND wi.lineId=$" + pr.length }
  if (o?.search) { const kw = "%" + o.search + "%"; pr.push(kw, kw, kw); w += " AND (wi.wellId LIKE $" + (pr.length - 2) + " OR wl.name LIKE $" + (pr.length - 1) + " OR wl.shortName LIKE $" + pr.length + ")" }
  const totalRow = await one<{ c: number }>(`SELECT COUNT(*) as c FROM WellInfo wi JOIN WellLineInfo wl ON wi.lineId=wl.id WHERE ${w}`, pr)
  const total = totalRow?.c || 0
  const data = await all(`SELECT wi.*,wl.name as lineName,wl.shortName,wl.region FROM WellInfo wi JOIN WellLineInfo wl ON wi.lineId=wl.id WHERE ${w} ORDER BY wl.regionSeq,wi.wellId LIMIT $${pr.length + 1} OFFSET $${pr.length + 2}`, [...pr, ps, (p - 1) * ps])
  const stats = await one<any>(`SELECT ROUND(AVG(wi.initialWaterLevel),2) as initialWaterLevelAvg, MIN(wi.initialWaterLevel) as initialWaterLevelMin, MAX(wi.initialWaterLevel) as initialWaterLevelMax, ROUND(AVG(wi.designDepth),2) as designDepthAvg, MIN(wi.designDepth) as designDepthMin, MAX(wi.designDepth) as designDepthMax FROM WellInfo wi JOIN WellLineInfo wl ON wi.lineId=wl.id WHERE ${w}`, pr) || null
  return { data, total, page: p, pageSize: ps, totalPages: Math.ceil(total / ps), stats }
}

export async function getWellById(id: string) { return one("SELECT wi.*,wl.name as lineName,wl.shortName,wl.region FROM WellInfo wi JOIN WellLineInfo wl ON wi.lineId=wl.id WHERE wi.wellId=?", [id]) }
export async function createWell(d: any) {
  const result = await run(`INSERT INTO WellInfo(wellId,lineId,completionDate,technology,techNote,wellSize,initialWaterLevel,designDepth,coordX,coordY)
    VALUES(?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(wellId) DO UPDATE SET
      lineId=excluded.lineId,
      completionDate=COALESCE(excluded.completionDate,WellInfo.completionDate),
      technology=COALESCE(excluded.technology,WellInfo.technology),
      techNote=COALESCE(excluded.techNote,WellInfo.techNote),
      wellSize=COALESCE(excluded.wellSize,WellInfo.wellSize),
      initialWaterLevel=COALESCE(excluded.initialWaterLevel,WellInfo.initialWaterLevel),
      designDepth=COALESCE(excluded.designDepth,WellInfo.designDepth),
      coordX=COALESCE(excluded.coordX,WellInfo.coordX),
      coordY=COALESCE(excluded.coordY,WellInfo.coordY)`,
    [d.wellId, d.lineId, d.completionDate ? fmtDate(d.completionDate) : null, d.technology || null, d.techNote || null, d.wellSize || null, d.initialWaterLevel ?? null, d.designDepth ?? null, d.coordX ?? null, d.coordY ?? null])
  await auditLog({ action: 'create', entityType: 'well', entityId: d.wellId, newValues: d })
  return result
}
export async function updateWell(id: string, d: any) {
  const existing = await one('SELECT * FROM WellInfo WHERE wellId = ?', [id])
  const f: string[] = []; const p: any[] = []; let n = 0
  for (const k of ["completionDate", "technology", "techNote", "wellSize", "initialWaterLevel", "designDepth", "coordX", "coordY"]) {
    if (d[k] !== undefined) { n++; f.push(k + "=$" + n); p.push(k === "completionDate" ? (d[k] ? fmtDate(d[k]) : null) : (d[k] ?? null)) }
  }
  if (!f.length) return { changes: 0 }
  p.push(id)
  const result = await run("UPDATE WellInfo SET " + f.join(",") + " WHERE wellId=$" + (n + 1), p)
  await auditLog({ action: 'update', entityType: 'well', entityId: id, oldValues: existing, newValues: d })
  return result
}
export async function deleteWells(ids: string[]) {
  const result = await run("DELETE FROM WellInfo WHERE wellId IN(" + ids.map((_, i) => "$" + (i + 1)).join(",") + ")", ids)
  for (const id of ids) {
    await auditLog({ action: 'delete', entityType: 'well', entityId: id })
  }
  return result
}
export async function exportWells() { return all("SELECT wi.*,wl.name as lineName,wl.shortName,wl.region FROM WellInfo wi JOIN WellLineInfo wl ON wi.lineId=wl.id ORDER BY wl.regionSeq,wi.wellId") }
export async function getLines() { return all("SELECT * FROM WellLineInfo ORDER BY regionSeq,id") }

export async function importWells(recs: any[]): Promise<{ success: boolean; count: number; skipped: number; error?: string }> {
  try {
    const lines = await all<any>("SELECT id,shortName,name FROM WellLineInfo")
    const m = new Map<string, number>(); lines.forEach((l: any) => { m.set(l.shortName, l.id); m.set(l.name, l.id) })
    const valid = recs.filter((r: any) => r.wellId && r.shortName && m.has(r.shortName))
    const skipped = recs.length - valid.length
    const miss = [...new Set(valid.map((r: any) => r.shortName).filter((s: any) => s && !m.has(s)))]
    if (miss.length) return { success: false, count: 0, skipped: 0, error: "井采线不存在: " + miss.join(", ") }
    const n = await tx(async () => { let c = 0; for (const r of valid) { await run(`INSERT INTO WellInfo(wellId,lineId,completionDate,technology,techNote,wellSize,initialWaterLevel,designDepth,coordX,coordY) VALUES(?,?,?,?,?,?,?,?,?,?) ON CONFLICT(wellId) DO UPDATE SET lineId=excluded.lineId,completionDate=COALESCE(excluded.completionDate,WellInfo.completionDate),technology=COALESCE(excluded.technology,WellInfo.technology),techNote=COALESCE(excluded.techNote,WellInfo.techNote),wellSize=COALESCE(excluded.wellSize,WellInfo.wellSize),initialWaterLevel=COALESCE(excluded.initialWaterLevel,WellInfo.initialWaterLevel),designDepth=COALESCE(excluded.designDepth,WellInfo.designDepth),coordX=COALESCE(excluded.coordX,WellInfo.coordX),coordY=COALESCE(excluded.coordY,WellInfo.coordY)`, [r.wellId, m.get(r.shortName) || r.lineId || 0, r.completionDate ? fmtDate(r.completionDate) : null, r.technology || null, r.techNote || null, r.wellSize || null, r.initialWaterLevel ?? null, r.designDepth ?? null, r.coordX ?? null, r.coordY ?? null]); c++ } return c })
    return { success: true, count: n, skipped }
  } catch (e: any) { return { success: false, count: 0, skipped: 0, error: e.message } }
}
