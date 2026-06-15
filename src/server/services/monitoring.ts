import "server-only"
import { all, one, run, tx } from "@/server/db"
import { fmtDate } from "@/shared/precision"
import type { Paginated } from "@/shared/types"
import { auditLog } from "./audit"

export async function getMonitorings(o?: { wellId?: string; region?: string; lineId?: number; status?: string; search?: string; dateFrom?: string; dateTo?: string; page?: number; pageSize?: number }): Promise<Paginated<any>> {
  const p = o?.page || 1; const ps = o?.pageSize || 20; let w = "1=1"; const pr: any[] = []
  if (o?.wellId) { pr.push(o.wellId); w += " AND dm.wellId=$" + pr.length }
  if (o?.region) { pr.push(o.region); w += " AND wl.region=$" + pr.length }
  if (o?.lineId) { pr.push(o.lineId); w += " AND wi.lineId=$" + pr.length }
  if (o?.status) { pr.push(o.status); w += " AND dm.status=$" + pr.length }
  if (o?.search) { const kw = "%" + o.search + "%"; pr.push(kw, kw, kw); w += " AND (dm.wellId LIKE $" + (pr.length - 2) + " OR wl.name LIKE $" + (pr.length - 1) + " OR wl.shortName LIKE $" + pr.length + ")" }
  if (o?.dateFrom) { pr.push(o.dateFrom); w += " AND dm.collectDate>=$" + pr.length }
  if (o?.dateTo) { pr.push(o.dateTo + " 23:59:59"); w += " AND dm.collectDate<=$" + pr.length }
  const totalRow = await one<{ c: number }>(`SELECT COUNT(*) as c FROM DynamicMonitoring dm JOIN WellInfo wi ON dm.wellId=wi.wellId JOIN WellLineInfo wl ON wi.lineId=wl.id WHERE ${w}`, pr)
  const total = totalRow?.c || 0
  const data = await all(`SELECT dm.*,wl.name as lineName,wl.shortName,wl.region FROM DynamicMonitoring dm JOIN WellInfo wi ON dm.wellId=wi.wellId JOIN WellLineInfo wl ON wi.lineId=wl.id WHERE ${w} ORDER BY wl.regionSeq,dm.wellId,dm.collectDate DESC LIMIT $${pr.length + 1} OFFSET $${pr.length + 2}`, [...pr, ps, (p - 1) * ps])
  const stats = await one<any>(`SELECT ROUND(AVG(dm.staticWater),2) as staticWaterAvg, MIN(dm.staticWater) as staticWaterMin, MAX(dm.staticWater) as staticWaterMax, ROUND(AVG(dm.dynamicWater),2) as dynamicWaterAvg, MIN(dm.dynamicWater) as dynamicWaterMin, MAX(dm.dynamicWater) as dynamicWaterMax, ROUND(AVG(dm.flowRate),2) as flowRateAvg FROM DynamicMonitoring dm JOIN WellInfo wi ON dm.wellId=wi.wellId JOIN WellLineInfo wl ON wi.lineId=wl.id WHERE ${w}`, pr) || null
  return { data, total, page: p, pageSize: ps, totalPages: Math.ceil(total / ps), stats }
}

/**
 * 监测数据自动追溯填充：空字段从上一次记录继承
 * 静水位/动水位互斥：填了一个另一个不追溯；
 * 都没填则只继承一个（优先静水位，静水位无则取动水位）
 */
async function fillFromLast(d: any) {
  const last = await one<any>("SELECT * FROM DynamicMonitoring WHERE wellId=? ORDER BY collectDate DESC, id DESC LIMIT 1", [d.wellId])
  if (!last) return d
  const hasStatic = d.staticWater !== undefined && d.staticWater !== null && d.staticWater !== ''
  const hasDynamic = d.dynamicWater !== undefined && d.dynamicWater !== null && d.dynamicWater !== ''
  let sw = d.staticWater ?? null
  let dw = d.dynamicWater ?? null
  if (!hasStatic && !hasDynamic) {
    if (last.staticWater != null) { sw = last.staticWater; dw = null }
    else if (last.dynamicWater != null) { sw = null; dw = last.dynamicWater }
  } else if (hasStatic) { dw = null }
  else if (hasDynamic) { sw = null }
  return {
    wellId: d.wellId,
    collectDate: d.collectDate ?? last.collectDate,
    staticWater: sw,
    dynamicWater: dw,
    wellDepth: d.wellDepth ?? last.wellDepth,
    flowRate: d.flowRate ?? last.flowRate,
    pumpDepth: d.pumpDepth ?? last.pumpDepth,
    pumpFlow: d.pumpFlow ?? last.pumpFlow,
    motorPower: d.motorPower ?? last.motorPower,
    manufacturer: d.manufacturer ?? last.manufacturer,
    status: d.status ?? last.status ?? 'normal',
    faultNote: d.faultNote ?? (d.status === 'abnormal' ? last.faultNote : null),
  }
}

export async function createMonitoring(d: any) {
  const filled = await fillFromLast(d)
  const result = await run("INSERT INTO DynamicMonitoring(wellId,collectDate,staticWater,dynamicWater,wellDepth,flowRate,pumpDepth,pumpFlow,motorPower,manufacturer,status,faultNote)VALUES(?,?,?,?,?,?,?,?,?,?,?,?)", [filled.wellId, filled.collectDate ? fmtDate(filled.collectDate) : null, filled.staticWater ?? null, filled.dynamicWater ?? null, filled.wellDepth ?? null, filled.flowRate ?? null, filled.pumpDepth ?? null, filled.pumpFlow ?? null, filled.motorPower ?? null, filled.manufacturer || null, filled.status || "normal", filled.status === "abnormal" ? (filled.faultNote || null) : null])
  await auditLog({ action: 'create', entityType: 'monitoring', entityId: d.wellId, newValues: filled })
  return result
}

export async function updateMonitoring(id: number, d: any) {
  const existing = await one('SELECT * FROM DynamicMonitoring WHERE id = ?', [id])
  const f: string[] = []; const p: any[] = []; let n = 0
  for (const k of ["collectDate", "staticWater", "dynamicWater", "wellDepth", "flowRate", "pumpDepth", "pumpFlow", "motorPower", "manufacturer", "status", "faultNote"]) {
    if (d[k] !== undefined) { n++; f.push(k + "=$" + n); p.push(k === "collectDate" ? (d[k] ? fmtDate(d[k]) : null) : (d[k] ?? null)) }
  }
  if (!f.length) return { changes: 0 }
  p.push(id)
  const result = await run("UPDATE DynamicMonitoring SET " + f.join(",") + " WHERE id=$" + (n + 1), p)
  await auditLog({ action: 'update', entityType: 'monitoring', entityId: String(id), oldValues: existing, newValues: d })
  return result
}
export async function deleteMonitorings(ids: number[]) {
  const result = await run("DELETE FROM DynamicMonitoring WHERE id IN(" + ids.map((_, i) => "$" + (i + 1)).join(",") + ")", ids)
  for (const id of ids) {
    await auditLog({ action: 'delete', entityType: 'monitoring', entityId: String(id) })
  }
  return result
}
export async function exportMonitorings() { return all("SELECT dm.*,wl.name as lineName,wl.shortName,wl.region FROM DynamicMonitoring dm JOIN WellInfo wi ON dm.wellId=wi.wellId JOIN WellLineInfo wl ON wi.lineId=wl.id ORDER BY dm.collectDate DESC") }

export async function importMonitorings(recs: any[]): Promise<{ success: boolean; count: number; skipped: number; error?: string }> {
  try {
    const wells = await all<{ wellId: string }>("SELECT wellId FROM WellInfo")
    const validWells = new Set(wells.map(r => r.wellId))
    const valid = recs.filter(r => r.wellId && validWells.has(String(r.wellId).trim()))
    const skipped = recs.length - valid.length
    const n = await tx(async () => { let c = 0; for (const r of valid) { const filled = await fillFromLast({...r, wellId: String(r.wellId).trim()}); await run("INSERT INTO DynamicMonitoring(wellId,collectDate,staticWater,dynamicWater,wellDepth,flowRate,pumpDepth,pumpFlow,motorPower,manufacturer,status,faultNote)VALUES(?,?,?,?,?,?,?,?,?,?,?,?)", [filled.wellId, filled.collectDate ? fmtDate(filled.collectDate) : null, filled.staticWater ?? null, filled.dynamicWater ?? null, filled.wellDepth ?? null, filled.flowRate ?? null, filled.pumpDepth ?? null, filled.pumpFlow ?? null, filled.motorPower ?? null, filled.manufacturer || null, filled.status || "normal", filled.faultNote || null]); c++ } return c })
    return { success: true, count: n, skipped }
  } catch (e: any) { return { success: false, count: 0, skipped: 0, error: e.message } }
}
