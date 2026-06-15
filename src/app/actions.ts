"use server"

const _m = new Map<string, any>()
async function svc(mod: string, fn: string, ...args: any[]): Promise<any> {
  const key = mod + ":" + fn
  if (!_m.has(key)) { const m = await import("@/server/services/" + mod); _m.set(key, m[fn]) }
  return _m.get(key)(...args)
}

async function safe<T>(fn: () => T): Promise<T> {
  try { return await fn() } catch (e: any) { throw new Error(e.message || "服务器内部错误") }
}

export async function getWells(o?: any) { return safe(() => svc("wells", "getWells", o)) }
export async function createWell(d: any) { return safe(() => svc("wells", "createWell", d)) }
export async function updateWell(id: string, d: any) { return safe(() => svc("wells", "updateWell", id, d)) }
export async function deleteWells(ids: string[]) { return safe(() => svc("wells", "deleteWells", ids)) }
export async function exportWells() { return safe(() => svc("wells", "exportWells")) }
export async function importWells(r: any[]) { return safe(() => svc("wells", "importWells", r)) }

export async function getMonitorings(o?: any) { return safe(() => svc("monitoring", "getMonitorings", o)) }
export async function createMonitoring(d: any) { return safe(() => svc("monitoring", "createMonitoring", d)) }
export async function updateMonitoring(id: number, d: any) { return safe(() => svc("monitoring", "updateMonitoring", id, d)) }
export async function deleteMonitorings(ids: number[]) { return safe(() => svc("monitoring", "deleteMonitorings", ids)) }
export async function exportMonitorings() { return safe(() => svc("monitoring", "exportMonitorings")) }
export async function importMonitorings(r: any[]) { return safe(() => svc("monitoring", "importMonitorings", r)) }

export async function getLabData(o?: any) { return safe(() => svc("lab", "getLabData", o)) }
export async function createLabData(d: any) { return safe(() => svc("lab", "createLabData", d)) }
export async function updateLabData(id: number, d: any) { return safe(() => svc("lab", "updateLabData", id, d)) }
export async function deleteLabDatas(ids: number[]) { return safe(() => svc("lab", "deleteLabDatas", ids)) }
export async function exportLabData() { return safe(() => svc("lab", "exportLabData")) }
export async function importLabDatas(r: any[]) { return safe(() => svc("lab", "importLabDatas", r)) }

export async function getDashboardStats() { return safe(() => svc("analysis", "getDashboardStats")) }
export async function getWellLineStats() { return safe(() => svc("analysis", "getWellLineStats")) }
export async function getWellLineChem() { return safe(() => svc("analysis", "getWellLineChem")) }
export async function getWellLineWater() { return safe(() => svc("analysis", "getWellLineWater")) }
export async function compareLines(a: number, b: number) { return safe(() => svc("analysis", "compareLines", a, b)) }
export async function getTimeSeries(id: number) { return safe(() => svc("analysis", "getTimeSeries", id)) }
export async function getMonthlyReport(m: string) { return safe(() => svc("analysis", "getMonthlyReport", m)) }
export async function getAvailableMonths() { return safe(() => svc("analysis", "getAvailableMonths")) }
export async function checkKAlerts(t: number) { return safe(() => svc("analysis", "checkKAlerts", t)) }
export async function checkLiAlerts(t: number) { return safe(() => svc("analysis", "checkLiAlerts", t)) }
export async function getLowKWells(m: string) { return safe(() => svc("analysis", "getLowKWells", m)) }
export async function getIonRanking(m: string) { return safe(() => svc("analysis", "getIonRanking", m)) }
export async function getLineScoring(m: string) { return safe(() => svc("analysis", "getLineScoring", m)) }
export async function getPrevMonthData(lineId: number) { return safe(() => svc("analysis", "getPrevMonthData", lineId)) }
export async function getWellTrend(wellId: string) { return safe(() => svc("analysis", "getWellTrend", wellId)) }
export async function getWellWaterTrend(wellId: string) { return safe(() => svc("analysis", "getWellWaterTrend", wellId)) }
export async function getWellsWithLab() { return safe(() => svc("analysis", "getWellsWithLab")) }
export async function getLiLowWells(m: string) { return safe(() => svc("analysis", "getLiLowWells", m)) }
export async function getMgLiRatio(m: string) { return safe(() => svc("analysis", "getMgLiRatio", m)) }
export async function getKLiRatioRank(m: string) { return safe(() => svc("analysis", "getKLiRatioRank", m)) }
export async function getAdjacentMonths(type: "monitoring" | "lab", current: string) { return safe(() => svc("analysis", "getAdjacentMonths", type, current)) }

export async function getLabMonths() {
  return safe(async () => {
    const { all } = await import("@/server/db")
    return all<{ mo: string }>("SELECT DISTINCT strftime('%Y-%m',testDate) as mo FROM LabData WHERE testDate IS NOT NULL ORDER BY mo DESC")
  })
}

export async function getMonthDataForLine(lineId: number, month: string) {
  return safe(async () => {
    const { all } = await import("@/server/db")
    const data = await all("SELECT wi.wellId,ld.kPlus,ld.liPlus FROM WellInfo wi JOIN LabData ld ON ld.wellId=wi.wellId AND strftime('%Y-%m',ld.testDate)=? WHERE wi.lineId=? ORDER BY wi.wellId", [month, lineId])
    return { prevMonth: month, data }
  })
}

export async function getCurrentDataMonth() {
  return safe(async () => {
    const { one } = await import("@/server/db")
    const r = await one<{ mo: string }>("SELECT strftime('%Y-%m',testDate) as mo FROM LabData ORDER BY testDate DESC LIMIT 1")
    return r?.mo || null
  })
}

export async function getAuditLogs(o?: any) { return safe(() => svc("audit", "getAuditLogs", o)) }

export async function getLastRecord(wellId: string, type: 'monitoring' | 'lab') {
  return safe(async () => {
    const { one } = await import("@/server/db")
    if (type === 'monitoring') {
      return one(
        'SELECT * FROM DynamicMonitoring WHERE wellId = ? ORDER BY collectDate DESC LIMIT 1',
        [wellId]
      ) || null
    } else {
      return one(
        'SELECT * FROM LabData WHERE wellId = ? ORDER BY testDate DESC LIMIT 1',
        [wellId]
      ) || null
    }
  })
}
