import "server-only"
import { all, one, run, tx } from "@/server/db"
import { fmtDate } from "@/lib/precision"
import type { Paginated } from "@/types"

export function getMonitorings(o?: { wellId?: string; region?: string; lineId?: number; status?: string; search?: string; dateFrom?: string; dateTo?: string; page?: number; pageSize?: number }): Paginated<any> {
  const p = o?.page || 1; const ps = o?.pageSize || 20; let w = "1=1"; const pr: any[] = []
  if (o?.wellId) { pr.push(o.wellId); w += " AND dm.wellId=$" + pr.length }
  if (o?.region) { pr.push(o.region); w += " AND wl.region=$" + pr.length }
  if (o?.lineId) { pr.push(o.lineId); w += " AND wi.lineId=$" + pr.length }
  if (o?.status) { pr.push(o.status); w += " AND dm.status=$" + pr.length }
  if (o?.search) { const kw = "%" + o.search + "%"; pr.push(kw, kw, kw); w += " AND (dm.wellId LIKE $" + (pr.length - 2) + " OR wl.name LIKE $" + (pr.length - 1) + " OR wl.shortName LIKE $" + pr.length + ")" }
  if (o?.dateFrom) { pr.push(o.dateFrom); w += " AND dm.collectDate>=$" + pr.length }
  if (o?.dateTo) { pr.push(o.dateTo + " 23:59:59"); w += " AND dm.collectDate<=$" + pr.length }
  const total = (one<{ c: number }>(`SELECT COUNT(*) as c FROM DynamicMonitoring dm JOIN WellInfo wi ON dm.wellId=wi.wellId JOIN WellLineInfo wl ON wi.lineId=wl.id WHERE ${w}`, pr))?.c || 0
  const data = all(`SELECT dm.*,wl.name as lineName,wl.shortName,wl.region FROM DynamicMonitoring dm JOIN WellInfo wi ON dm.wellId=wi.wellId JOIN WellLineInfo wl ON wi.lineId=wl.id WHERE ${w} ORDER BY wl.regionSeq,dm.wellId,dm.collectDate DESC LIMIT $${pr.length + 1} OFFSET $${pr.length + 2}`, [...pr, ps, (p - 1) * ps])
  return { data, total, page: p, pageSize: ps, totalPages: Math.ceil(total / ps) }
}

export function createMonitoring(d: any) {
  return run("INSERT INTO DynamicMonitoring(wellId,collectDate,staticWater,dynamicWater,wellDepth,flowRate,pumpDepth,pumpFlow,motorPower,manufacturer,status,faultNote)VALUES(?,?,?,?,?,?,?,?,?,?,?,?)", [d.wellId, d.collectDate ? fmtDate(d.collectDate) : null, d.staticWater ?? null, d.dynamicWater ?? null, d.wellDepth ?? null, d.flowRate ?? null, d.pumpDepth ?? null, d.pumpFlow ?? null, d.motorPower ?? null, d.manufacturer || null, d.status || "normal", d.status === "abnormal" ? (d.faultNote || null) : null])
}

export function updateMonitoring(id: number, d: any) { const f: string[] = []; const p: any[] = []; let n = 0; for (const k of ["collectDate", "staticWater", "dynamicWater", "wellDepth", "flowRate", "pumpDepth", "pumpFlow", "motorPower", "manufacturer", "status", "faultNote"]) { if (d[k] !== undefined) { n++; f.push(k + "=$" + n); p.push(k === "collectDate" ? (d[k] ? fmtDate(d[k]) : null) : (d[k] ?? null)) } } if (!f.length) return { changes: 0 }; p.push(id); return run("UPDATE DynamicMonitoring SET " + f.join(",") + " WHERE id=$" + (n + 1), p) }
export function deleteMonitorings(ids: number[]) { return run("DELETE FROM DynamicMonitoring WHERE id IN(" + ids.map((_, i) => "$" + (i + 1)).join(",") + ")", ids) }
export function exportMonitorings() { return all("SELECT dm.*,wl.name as lineName,wl.shortName,wl.region FROM DynamicMonitoring dm JOIN WellInfo wi ON dm.wellId=wi.wellId JOIN WellLineInfo wl ON wi.lineId=wl.id ORDER BY dm.collectDate DESC") }

export function importMonitorings(recs: any[]): { success: boolean; count: number; error?: string } {
  try {
    const n = tx(() => { let c = 0; for (const r of recs) { if (!r.wellId) continue; run("INSERT INTO DynamicMonitoring(wellId,collectDate,staticWater,dynamicWater,wellDepth,flowRate,pumpDepth,pumpFlow,motorPower,manufacturer,status,faultNote)VALUES(?,?,?,?,?,?,?,?,?,?,?,?)", [r.wellId, r.collectDate ? fmtDate(r.collectDate) : null, r.staticWater ?? null, r.dynamicWater ?? null, r.wellDepth ?? null, r.flowRate ?? null, r.pumpDepth ?? null, r.pumpFlow ?? null, r.motorPower ?? null, r.manufacturer || null, r.status || "normal", r.faultNote || null]); c++ } return c })
    return { success: true, count: n }
  } catch (e: any) { return { success: false, count: 0, error: e.message } }
}
