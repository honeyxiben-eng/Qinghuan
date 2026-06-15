import "server-only"
import { all, one } from "@/server/db"

async function lm(table: string, col: string): Promise<string | null> {
  const r = await one<{ mo: string }>(`SELECT strftime('%Y-%m',${col}) as mo FROM ${table} WHERE ${col} IS NOT NULL ORDER BY ${col} DESC LIMIT 1`)
  return r?.mo || null
}

export async function getDashboardStats() {
  const twRow = await one<{ c: number }>("SELECT COUNT(*) as c FROM WellInfo")
  const tw = twRow?.c || 0
  const mm = await lm("DynamicMonitoring", "collectDate"); let aw = 0, sw = 0, ab = 0
  if (mm) {
    const rows = await all<{ status: string; cnt: number }>("SELECT status,COUNT(DISTINCT wellId) as cnt FROM DynamicMonitoring WHERE strftime('%Y-%m',collectDate)=? GROUP BY status", [mm])
    rows.forEach(r => { if (r.status === "normal") aw = r.cnt; else if (r.status === "stopped") sw = r.cnt; else if (r.status === "abandoned") ab = r.cnt })
  }
  const lbm = await lm("LabData", "testDate"); let lc = 0, kl = 0
  if (lbm) {
    const lcRow = await one<{ c: number }>("SELECT COUNT(*) as c FROM LabData WHERE strftime('%Y-%m',testDate)=?", [lbm])
    lc = lcRow?.c || 0
    const klRow = await one<{ c: number }>("SELECT COUNT(*) as c FROM LabData WHERE kPlus<=6.5 AND strftime('%Y-%m',testDate)=?", [lbm])
    kl = klRow?.c || 0
  }
  const threeMonthsAgo = new Date(); threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
  const cutoff = threeMonthsAgo.toISOString().slice(0, 10)
  const noMonRow = await one<{ c: number }>("SELECT COUNT(*) as c FROM WellInfo wi WHERE NOT EXISTS(SELECT 1 FROM DynamicMonitoring dm WHERE dm.wellId=wi.wellId AND dm.collectDate>=?)", [cutoff])
  const noMonWells = noMonRow?.c || 0
  const noLabRow = await one<{ c: number }>("SELECT COUNT(*) as c FROM WellInfo wi WHERE NOT EXISTS(SELECT 1 FROM LabData ld WHERE ld.wellId=wi.wellId AND ld.testDate>=?)", [cutoff])
  const noLabWells = noLabRow?.c || 0
  return { totalWells: tw, activeWells: aw, stoppedWells: sw, abandonedWells: ab, labCount: lc, kLowCount: kl, monMonth: mm, labMonth: lbm, noMonWells, noLabWells }
}

export async function getWellLineStats() {
  const m = await lm("DynamicMonitoring", "collectDate")
  if (!m) return all("SELECT wl.name,wl.shortName,COUNT(wi.wellId) as total,0 as active,0 as stopped,0 as abandoned FROM WellLineInfo wl LEFT JOIN WellInfo wi ON wi.lineId=wl.id GROUP BY wl.id ORDER BY wl.regionSeq")
  return all("SELECT wl.name,wl.shortName,COUNT(DISTINCT wi.wellId) as total,COUNT(DISTINCT CASE WHEN dm.status='normal' THEN dm.wellId END) as active,COUNT(DISTINCT CASE WHEN dm.status='stopped' THEN dm.wellId END) as stopped,COUNT(DISTINCT CASE WHEN dm.status='abandoned' THEN dm.wellId END) as abandoned FROM WellLineInfo wl LEFT JOIN WellInfo wi ON wi.lineId=wl.id LEFT JOIN DynamicMonitoring dm ON dm.wellId=wi.wellId AND strftime('%Y-%m',dm.collectDate)=? GROUP BY wl.id ORDER BY wl.regionSeq", [m])
}

export async function getWellLineChem() {
  const m = await lm("LabData", "testDate")
  if (!m) return all("SELECT wl.name,wl.shortName,NULL as avgK,NULL as avgLi FROM WellLineInfo wl ORDER BY wl.regionSeq")
  return all("SELECT wl.name,wl.shortName,ROUND(AVG(ld.kPlus),3) as avgK,ROUND(AVG(ld.liPlus),3) as avgLi FROM WellLineInfo wl LEFT JOIN WellInfo wi ON wi.lineId=wl.id LEFT JOIN LabData ld ON ld.wellId=wi.wellId AND strftime('%Y-%m',ld.testDate)=? GROUP BY wl.id ORDER BY wl.regionSeq", [m])
}

export async function getWellLineWater() {
  const m = await lm("DynamicMonitoring", "collectDate")
  if (!m) return all("SELECT wl.name,wl.shortName,NULL as avgWater FROM WellLineInfo wl ORDER BY wl.regionSeq")
  return all("SELECT wl.name,wl.shortName,ROUND(AVG(dm.dynamicWater),1) as avgWater FROM WellLineInfo wl JOIN WellInfo wi ON wi.lineId=wl.id JOIN DynamicMonitoring dm ON dm.wellId=wi.wellId AND strftime('%Y-%m',dm.collectDate)=? WHERE dm.dynamicWater IS NOT NULL GROUP BY wl.id ORDER BY wl.regionSeq", [m])
}

export async function compareLines(a: number, b: number) {
  const q = async (lid: number) => one("SELECT ROUND(AVG(ld.kPlus),3) as avgK,ROUND(AVG(ld.liPlus),3) as avgLi,ROUND(AVG(dm.dynamicWater),1) as avgW FROM WellInfo wi LEFT JOIN LabData ld ON ld.wellId=wi.wellId LEFT JOIN DynamicMonitoring dm ON dm.wellId=wi.wellId WHERE wi.lineId=?", [lid])
  return { a: await q(a), b: await q(b) }
}

export async function getTimeSeries(id: number) { return all("SELECT wi.wellId,ld.testDate,ld.kPlus,ld.liPlus FROM WellInfo wi JOIN LabData ld ON ld.wellId=wi.wellId WHERE wi.lineId=? ORDER BY wi.wellId,ld.testDate", [id]) }
export async function getMonthlyReport(m: string) { return all("SELECT wl.name,ROUND(AVG(ld.kPlus),3) as avgK,ROUND(AVG(ld.liPlus),3) as avgLi,COUNT(ld.id) as cnt FROM WellLineInfo wl JOIN WellInfo wi ON wi.lineId=wl.id JOIN LabData ld ON ld.wellId=wi.wellId AND strftime('%Y-%m',ld.testDate)=? GROUP BY wl.id ORDER BY wl.regionSeq", [m]) }

export async function checkKAlerts(t: number) {
  return all<{ wellId: string; lineName: string; prevK: number; latestK: number; drop: number; dropAbs: number }>(`
    WITH latest AS (
      SELECT wellId, kPlus, testDate,
        ROW_NUMBER() OVER (PARTITION BY wellId ORDER BY testDate DESC) as rn
      FROM LabData WHERE kPlus IS NOT NULL
    )
    SELECT l.wellId, wl.name as lineName, p.kPlus as prevK, l.kPlus as latestK,
      ROUND((p.kPlus - l.kPlus) / p.kPlus * 100, 2) as dropPct,
      ROUND(p.kPlus - l.kPlus, 3) as dropAbs
    FROM latest l
    JOIN latest p ON l.wellId = p.wellId AND p.rn = 2
    JOIN WellInfo wi ON wi.wellId = l.wellId
    JOIN WellLineInfo wl ON wi.lineId = wl.id
    WHERE l.rn = 1 AND p.kPlus > 0
      AND (p.kPlus - l.kPlus) / p.kPlus * 100 >= ?
    ORDER BY dropPct DESC LIMIT 100
  `, [t])
}

export async function checkLiAlerts(t: number) {
  return all<{ wellId: string; lineName: string; prevLi: number; latestLi: number; drop: number; dropAbs: number }>(`
    WITH latest AS (
      SELECT wellId, liPlus, testDate,
        ROW_NUMBER() OVER (PARTITION BY wellId ORDER BY testDate DESC) as rn
      FROM LabData WHERE liPlus IS NOT NULL
    )
    SELECT l.wellId, wl.name as lineName, p.liPlus as prevLi, l.liPlus as latestLi,
      ROUND((p.liPlus - l.liPlus) / p.liPlus * 100, 2) as dropPct,
      ROUND(p.liPlus - l.liPlus, 4) as dropAbs
    FROM latest l
    JOIN latest p ON l.wellId = p.wellId AND p.rn = 2
    JOIN WellInfo wi ON wi.wellId = l.wellId
    JOIN WellLineInfo wl ON wi.lineId = wl.id
    WHERE l.rn = 1 AND p.liPlus > 0
      AND (p.liPlus - l.liPlus) / p.liPlus * 100 >= ?
    ORDER BY dropPct DESC LIMIT 100
  `, [t])
}

export async function getLowKWells(m: string) { return all("SELECT wl.name as lineName,wi.wellId,ld.kPlus FROM WellLineInfo wl JOIN WellInfo wi ON wi.lineId=wl.id JOIN LabData ld ON ld.wellId=wi.wellId AND strftime('%Y-%m',ld.testDate)=? WHERE ld.kPlus IS NOT NULL AND ld.kPlus<6.5 ORDER BY wl.regionSeq,wi.wellId", [m]) }
export async function getAvailableMonths() { return all<{ mo: string }>("SELECT DISTINCT strftime('%Y-%m',testDate) as mo FROM LabData WHERE testDate IS NOT NULL ORDER BY mo DESC") }
export async function getIonRanking(m: string) { return all("SELECT wi.wellId,wl.name as lineName,ld.kPlus,ld.liPlus FROM WellInfo wi JOIN WellLineInfo wl ON wi.lineId=wl.id JOIN LabData ld ON ld.wellId=wi.wellId AND strftime('%Y-%m',ld.testDate)=? WHERE ld.kPlus IS NOT NULL ORDER BY ld.kPlus ASC", [m]) }
export async function getLineScoring(m: string) { return all("SELECT wl.name as lineName,wl.shortName,ROUND(AVG(ld.kPlus),3) as avgK,ROUND(AVG(ld.liPlus),3) as avgLi,ROUND(AVG(ld.mg2Plus),3) as avgMg,ROUND(AVG(ld.density),4) as avgDensity,ROUND(AVG(ld.salinity),3) as avgSalinity,COUNT(ld.id) as cnt FROM WellLineInfo wl JOIN WellInfo wi ON wi.lineId=wl.id JOIN LabData ld ON ld.wellId=wi.wellId AND strftime('%Y-%m',ld.testDate)=? WHERE ld.kPlus IS NOT NULL GROUP BY wl.id ORDER BY avgK DESC", [m]) }

export async function getAdjacentMonths(type: "monitoring" | "lab", current: string): Promise<{ prev: string | null; next: string | null }> {
  const table = type === "monitoring" ? "DynamicMonitoring" : "LabData"
  const col = type === "monitoring" ? "collectDate" : "testDate"
  const prev = await one<{ mo: string }>(`SELECT DISTINCT strftime('%Y-%m',${col}) as mo FROM ${table} WHERE strftime('%Y-%m',${col})<? ORDER BY mo DESC LIMIT 1`, [current])
  const next = await one<{ mo: string }>(`SELECT DISTINCT strftime('%Y-%m',${col}) as mo FROM ${table} WHERE strftime('%Y-%m',${col})>? ORDER BY mo ASC LIMIT 1`, [current])
  return { prev: prev?.mo || null, next: next?.mo || null }
}

export async function getPrevMonthData(lineId: number) {
  const months = await all<{ mo: string }>("SELECT DISTINCT strftime('%Y-%m',testDate) as mo FROM LabData ORDER BY mo DESC LIMIT 2")
  if (months.length < 2) return { prevMonth: null, data: [] }
  const prev = months[1].mo
  const data = await all("SELECT wi.wellId,ld.kPlus,ld.liPlus FROM WellInfo wi JOIN LabData ld ON ld.wellId=wi.wellId AND strftime('%Y-%m',ld.testDate)=? WHERE wi.lineId=? ORDER BY wi.wellId", [prev, lineId])
  return { prevMonth: prev, data }
}

export async function getWellTrend(wellId: string) {
  return all<{ testDate: string; kPlus: number | null; liPlus: number | null }>("SELECT testDate,kPlus,liPlus FROM LabData WHERE wellId=? AND testDate>=datetime('now','-18 months') ORDER BY testDate ASC", [wellId])
}

export async function getWellWaterTrend(wellId: string) {
  return all<{ collectDate: string; dynamicWater: number | null }>("SELECT collectDate,dynamicWater FROM DynamicMonitoring WHERE wellId=? AND collectDate>=datetime('now','-18 months') ORDER BY collectDate ASC", [wellId])
}

export async function getLiLowWells(month: string) { return all("SELECT wl.name as lineName,wi.wellId,ld.liPlus FROM WellLineInfo wl JOIN WellInfo wi ON wi.lineId=wl.id JOIN LabData ld ON ld.wellId=wi.wellId AND strftime('%Y-%m',ld.testDate)=? WHERE ld.liPlus<0.15 ORDER BY wl.regionSeq,wi.wellId", [month]) }
export async function getMgLiRatio(month: string) { return all("SELECT wl.name as lineName,ROUND(AVG(ld.mg2Plus/NULLIF(ld.liPlus,0)),2) as ratio,COUNT(ld.id) as cnt FROM WellLineInfo wl JOIN WellInfo wi ON wi.lineId=wl.id JOIN LabData ld ON ld.wellId=wi.wellId AND strftime('%Y-%m',ld.testDate)=? WHERE ld.liPlus>0 GROUP BY wl.id ORDER BY ratio DESC", [month]) }
export async function getKLiRatioRank(month: string) { return all("SELECT wl.name as lineName,ROUND(AVG(ld.kPlus/NULLIF(ld.liPlus,0)),2) as ratio,COUNT(ld.id) as cnt FROM WellLineInfo wl JOIN WellInfo wi ON wi.lineId=wl.id JOIN LabData ld ON ld.wellId=wi.wellId AND strftime('%Y-%m',ld.testDate)=? WHERE ld.liPlus>0 GROUP BY wl.id ORDER BY ratio DESC", [month]) }
export async function getWellsWithLab() { return all<{ wellId: string }>("SELECT DISTINCT wellId FROM LabData ORDER BY wellId") }
