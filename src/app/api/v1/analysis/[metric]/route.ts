import { requireAuth } from "@/server/api/auth-guard"
import { ok, failCode, serverError } from "@/server/api/respond"
import * as analysis from "@/server/services/analysis"

export const dynamic = "force-dynamic"

type Ctx = { params: Promise<{ metric: string }> }

// 指标名 → 服务函数 + 参数解析
const HANDLERS: Record<string, (sp: URLSearchParams) => unknown | Promise<unknown>> = {
  "dashboard-stats": () => analysis.getDashboardStats(),
  "line-stats": () => analysis.getWellLineStats(),
  "line-chem": () => analysis.getWellLineChem(),
  "line-water": () => analysis.getWellLineWater(),
  "available-months": () => analysis.getAvailableMonths(),
  "wells-with-lab": () => analysis.getWellsWithLab(),
  "compare-lines": sp => analysis.compareLines(Number(sp.get("a")), Number(sp.get("b"))),
  "time-series": sp => analysis.getTimeSeries(Number(sp.get("lineId"))),
  "monthly-report": sp => analysis.getMonthlyReport(sp.get("month") || ""),
  "k-alerts": sp => analysis.checkKAlerts(Number(sp.get("threshold") || 0)),
  "li-alerts": sp => analysis.checkLiAlerts(Number(sp.get("threshold") || 0)),
  "low-k-wells": sp => analysis.getLowKWells(sp.get("month") || ""),
  "li-low-wells": sp => analysis.getLiLowWells(sp.get("month") || ""),
  "ion-ranking": sp => analysis.getIonRanking(sp.get("month") || ""),
  "line-scoring": sp => analysis.getLineScoring(sp.get("month") || ""),
  "prev-month": sp => analysis.getPrevMonthData(Number(sp.get("lineId"))),
  "well-trend": sp => analysis.getWellTrend(sp.get("wellId") || ""),
  "mg-li-ratio": sp => analysis.getMgLiRatio(sp.get("month") || ""),
  "k-li-ratio": sp => analysis.getKLiRatioRank(sp.get("month") || ""),
}

export async function GET(req: Request, { params }: Ctx) {
  const a = await requireAuth(req)
  if (a instanceof Response) return a
  try {
    const { metric } = await params
    const handler = HANDLERS[metric]
    if (!handler) return failCode("NOT_FOUND", "未知的分析指标: " + metric)
    const data = await handler(new URL(req.url).searchParams)
    return ok(data)
  } catch (e) {
    return serverError(e)
  }
}
