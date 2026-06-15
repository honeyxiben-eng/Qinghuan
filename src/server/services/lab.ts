import "server-only"
import { all, one, run, tx } from "@/server/db"
import { fmtDate } from "@/shared/precision"
import type { Paginated } from "@/shared/types"
import { auditLog } from "./audit"

export function getLabData(o?: { wellId?: string; region?: string; lineId?: number; search?: string; dateFrom?: string; dateTo?: string; page?: number; pageSize?: number }): Paginated<any> {
  const p = o?.page || 1; const ps = o?.pageSize || 20; let w = "1=1"; const pr: any[] = []
  if (o?.wellId) { pr.push(o.wellId); w += " AND ld.wellId=$" + pr.length }
  if (o?.region) { pr.push(o.region); w += " AND wl.region=$" + pr.length }
  if (o?.lineId) { pr.push(o.lineId); w += " AND wi.lineId=$" + pr.length }
  if (o?.search) { const kw = "%" + o.search + "%"; pr.push(kw, kw, kw); w += " AND (ld.wellId LIKE $" + (pr.length - 2) + " OR wl.name LIKE $" + (pr.length - 1) + " OR wl.shortName LIKE $" + pr.length + ")" }
  if (o?.dateFrom) { pr.push(o.dateFrom); w += " AND ld.testDate>=$" + pr.length }
  if (o?.dateTo) { pr.push(o.dateTo + " 23:59:59"); w += " AND ld.testDate<=$" + pr.length }
  const total = (one<{ c: number }>(`SELECT COUNT(*) as c FROM LabData ld JOIN WellInfo wi ON ld.wellId=wi.wellId JOIN WellLineInfo wl ON wi.lineId=wl.id WHERE ${w}`, pr))?.c || 0
  const data = all(`SELECT ld.*,wl.name as lineName,wl.shortName,wl.region FROM LabData ld JOIN WellInfo wi ON ld.wellId=wi.wellId JOIN WellLineInfo wl ON wi.lineId=wl.id WHERE ${w} ORDER BY wl.regionSeq,ld.wellId,ld.testDate DESC LIMIT $${pr.length + 1} OFFSET $${pr.length + 2}`, [...pr, ps, (p - 1) * ps])
  const stats = one<any>(`SELECT ROUND(AVG(ld.kPlus),3) as kPlusAvg, MIN(ld.kPlus) as kPlusMin, MAX(ld.kPlus) as kPlusMax, ROUND(AVG(ld.liPlus),4) as liPlusAvg, MIN(ld.liPlus) as liPlusMin, MAX(ld.liPlus) as liPlusMax, ROUND(AVG(ld.density),4) as densityAvg, ROUND(AVG(ld.salinity),3) as salinityAvg FROM LabData ld JOIN WellInfo wi ON ld.wellId=wi.wellId JOIN WellLineInfo wl ON wi.lineId=wl.id WHERE ${w}`, pr) || null
  return { data, total, page: p, pageSize: ps, totalPages: Math.ceil(total / ps), stats }
}

export function createLabData(d: any) {
  const result = run("INSERT INTO LabData(wellId,testDate,tester,viscosity,density,ph,salinity,kPlus,mg2Plus,clMinus,so42Minus,ca2Plus,b2o3,liPlus,naPlus)VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", [d.wellId, d.testDate ? fmtDate(d.testDate) : null, d.tester || null, d.viscosity ?? null, d.density ?? null, d.ph ?? null, d.salinity ?? null, d.kPlus ?? null, d.mg2Plus ?? null, d.clMinus ?? null, d.so42Minus ?? null, d.ca2Plus ?? null, d.b2o3 ?? null, d.liPlus ?? null, d.naPlus ?? null])
  auditLog({ action: 'create', entityType: 'lab', entityId: d.wellId, newValues: d })
  return result
}
export function updateLabData(id: number, d: any) {
  const existing = one('SELECT * FROM LabData WHERE id = ?', [id])
  const f: string[] = []; const p: any[] = []; let n = 0
  for (const k of ["testDate", "tester", "viscosity", "density", "ph", "salinity", "kPlus", "mg2Plus", "clMinus", "so42Minus", "ca2Plus", "b2o3", "liPlus", "naPlus"]) {
    if (d[k] !== undefined) { n++; f.push(k + "=$" + n); p.push(k === "testDate" ? (d[k] ? fmtDate(d[k]) : null) : (d[k] ?? null)) }
  }
  if (!f.length) return { changes: 0 }
  p.push(id)
  const result = run("UPDATE LabData SET " + f.join(",") + " WHERE id=$" + (n + 1), p)
  auditLog({ action: 'update', entityType: 'lab', entityId: String(id), oldValues: existing, newValues: d })
  return result
}
export function deleteLabDatas(ids: number[]) {
  const result = run("DELETE FROM LabData WHERE id IN(" + ids.map((_, i) => "$" + (i + 1)).join(",") + ")", ids)
  for (const id of ids) {
    auditLog({ action: 'delete', entityType: 'lab', entityId: String(id) })
  }
  return result
}
export function exportLabData() { return all("SELECT ld.*,wl.name as lineName,wl.shortName,wl.region FROM LabData ld JOIN WellInfo wi ON ld.wellId=wi.wellId JOIN WellLineInfo wl ON wi.lineId=wl.id ORDER BY ld.testDate DESC") }

export function importLabDatas(recs: any[]): { success: boolean; count: number; skipped: number; error?: string } {
  try {
    const validWells = new Set(all<{ wellId: string }>("SELECT wellId FROM WellInfo").map(r => r.wellId))
    const valid = recs.filter(r => r.wellId && validWells.has(String(r.wellId).trim()))
    const skipped = recs.length - valid.length
    const n = tx(() => { let c = 0; for (const r of valid) { run("INSERT INTO LabData(wellId,testDate,tester,viscosity,density,ph,salinity,kPlus,mg2Plus,clMinus,so42Minus,ca2Plus,b2o3,liPlus,naPlus)VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", [String(r.wellId).trim(), r.testDate ? fmtDate(r.testDate) : null, r.tester || null, r.viscosity ?? null, r.density ?? null, r.ph ?? null, r.salinity ?? null, r.kPlus ?? null, r.mg2Plus ?? null, r.clMinus ?? null, r.so42Minus ?? null, r.ca2Plus ?? null, r.b2o3 ?? null, r.liPlus ?? null, r.naPlus ?? null]); c++ } return c })
    return { success: true, count: n, skipped }
  } catch (e: any) { return { success: false, count: 0, skipped: 0, error: e.message } }
}
