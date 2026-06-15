"use client"
import { useEffect, useState, useRef, useCallback } from "react"
import { WELL_LINES } from "@/lib/well-data"
import { getDashboardStats, getWellLineStats, getWellLineChem, getWellLineWater } from "@/app/actions"
import { LineMarqueeTable } from "@/components/dashboard/LineMarqueeTable"
import { usePolling } from "@/hooks/usePolling"
import { useCountUp } from "@/hooks/useCountUp"
import { useAppStore } from "@/lib/store"
import {
  Beaker, AlertTriangle, TrendingDown, Clock,
  HardDrive, CheckCircle2, RefreshCw
} from "lucide-react"
import { StatCardSkeleton, ChartSkeleton, MarqueeSkeleton } from "@/components/ui/Skeleton"

function ml(ym: string | null) { if (!ym) return ""; const [y, m] = ym.split("-"); return y + "年" + parseInt(m) + "月" }
function same(a: any, b: any) { return JSON.stringify(a) === JSON.stringify(b) }

export default function Dashboard() {
  const [st, setSt] = useState<any>(null)
  const [ls, setLs] = useState<any[] | null>(null)
  const [ch, setCh] = useState<any[] | null>(null)
  const [wt, setWt] = useState<any[] | null>(null)
  const [err, setErr] = useState(false)
  const [errMsg, setErrMsg] = useState("")
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [now, setNow] = useState(new Date())
  const [pollLoading, setPollLoading] = useState(false)
  const refreshSec = useAppStore(s => s.refreshSec)
  const stRef = useRef<any>(null); stRef.current = st
  const lsRef = useRef<any>(null); lsRef.current = ls
  const chRef = useRef<any>(null); chRef.current = ch
  const wtRef = useRef<any>(null); wtRef.current = wt

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const load = useCallback(async (isPoll?: boolean) => {
    if (isPoll) setPollLoading(true)
    const results = await Promise.allSettled([getDashboardStats(), getWellLineStats(), getWellLineChem(), getWellLineWater()])
    const [a, b, c, d] = results.map(r => r.status === "fulfilled" ? r.value : null)
    const errors = results.filter(r => r.status === "rejected")
    if (a && (!isPoll || !same(a, stRef.current))) setSt(a)
    if (b && (!isPoll || !same(b, lsRef.current))) setLs(b)
    if (c && (!isPoll || !same(c, chRef.current))) setCh(c)
    if (d && (!isPoll || !same(d, wtRef.current))) setWt(d)
    setLastUpdate(new Date())
    setPollLoading(false)
    if (errors.length > 0 && !a) {
      setErr(true)
      setErrMsg(errors.map(e => (e as any).reason?.message || "未知错误").join("; "))
    } else setErr(false)
  }, [])

  useEffect(() => { document.title = "清欢 · 中控台"; load() }, [load])
  usePolling(() => load(true), true)

  const handleError = !st && err

  if (!st && !handleError) return (
    <div className="page-container">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[0, 1, 2, 3, 4, 5].map(i => (
          <StatCardSkeleton key={i} index={i} />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-4 mt-5">
        <ChartSkeleton height={340} />
        <ChartSkeleton height={340} />
      </div>
      <div className="mt-5">
        <MarqueeSkeleton />
      </div>
    </div>
  )

  if (handleError) return (
    <div className="page-container"><div className="p-20 text-center">
      <div className="w-16 h-16 mx-auto mb-5 rounded-[var(--r-lg)] flex items-center justify-center" style={{ background: "var(--red-soft)" }}>
        <AlertTriangle size={32} style={{ color: "var(--red)" }} />
      </div>
      <p className="text-[16px] font-bold mb-2" style={{ color: "var(--t1)" }}>数据加载失败</p>
      <p className="text-[13px] mb-1" style={{ color: "var(--t2)" }}>{errMsg || "请检查数据库连接后重试"}</p>
      <button onClick={() => load()} className="btn btn-v-primary mt-5"><RefreshCw size={14} />重新加载</button>
    </div></div>
  )

  const total = (st.activeWells || 0) + (st.stoppedWells || 0) + (st.abandonedWells || 0)
  const activePct = total > 0 ? Math.round((st.activeWells || 0) / total * 100) : 0
  const mm = ml(st.monMonth); const lm = ml(st.labMonth)
  const hour = now.getHours()
  const greet = hour < 6 ? "夜深了" : hour < 9 ? "早上好" : hour < 12 ? "上午好" : hour < 14 ? "中午好" : hour < 18 ? "下午好" : "晚上好"
  const dateStr = now.toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric", weekday: "long" })
  const ageLabel = (ym: string | null) => {
    if (!ym) return ""; const [y, m] = ym.split("-").map(Number)
    const monthsAgo = (new Date().getFullYear() - y) * 12 + (new Date().getMonth() + 1 - m)
    return monthsAgo <= 0 ? "(本月)" : monthsAgo === 1 ? "(1个月前)" : "(" + monthsAgo + "个月前)"
  }

  const KPIS = [
    { icon: HardDrive, color: "var(--accent)", label: "采卤井总数", value: total, unit: "口" },
    { icon: CheckCircle2, color: "#34d399", label: "正常运行", value: st.activeWells || 0, unit: "口", tag: activePct + "% 在线", bar: activePct },
    { icon: AlertTriangle, color: "#f87171", label: "停止/废弃", value: (st.stoppedWells || 0) + (st.abandonedWells || 0), unit: "口", sub: `停${st.stoppedWells || 0} · 废${st.abandonedWells || 0}` },
    { icon: Beaker, color: "#a78bfa", label: "化验记录", value: st.labCount || 0, unit: "条", tag: lm || undefined },
    { icon: TrendingDown, color: "#fbbf24", label: "K⁺<6.5 警示", value: st.kLowCount || 0, unit: "口" },
    { icon: Clock, color: "#60a5fa", label: "超期未监测", value: st.noMonWells || 0, unit: "口", sub: `未化验${st.noLabWells || 0}` },
  ]

  let mergedLines: any[] | null = null
  if (ls) {
    const chMap = new Map<string, any>(); (ch || []).forEach((x: any) => chMap.set(x.name, x))
    const wtMap = new Map<string, any>(); (wt || []).forEach((x: any) => wtMap.set(x.name, x))
    mergedLines = ls.map((x: any) => ({
      name: x.name,
      total: x.total || 0, active: x.active || 0, stopped: x.stopped || 0, abandoned: x.abandoned || 0,
      avgK: chMap.get(x.name)?.avgK ?? null,
      avgLi: chMap.get(x.name)?.avgLi ?? null,
      avgWater: wtMap.get(x.name)?.avgWater ?? null,
    }))
  }

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-3" style={{ animation: "fadeUp 0.4s var(--ease-spring) both" }}>
        <div>
          <h1 className="text-[22px] font-bold tracking-tight" style={{ color: "var(--t1)" }}>{greet}，中控台</h1>
          <p className="text-[12px] mt-1 flex items-center gap-2 flex-wrap" style={{ color: "var(--t2)" }}>
            <span>{dateStr}</span>
            <span style={{ color: "var(--t4)" }}>·</span>
            <span>{total} 口井 · {(WELL_LINES as any)?.length || 22} 条井采线</span>
            {mm && <span className="badge badge-ok">监测 {mm} {ageLabel(st.monMonth)}</span>}
            {lm && <span className="badge" style={{ background: 'var(--sky-soft)', color: 'var(--sky)' }}>化验 {lm} {ageLabel(st.labMonth)}</span>}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => load()} className="btn btn-sm btn-v-secondary">
            {pollLoading ? <span className="w-3 h-3 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" /> : <RefreshCw size={13} />}
            刷新
          </button>
          {lastUpdate && (
            <span className="text-[11px] flex items-center gap-1.5" style={{ color: "var(--t4)" }}>
              <span>{lastUpdate.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}</span>
              {refreshSec > 0 && <span style={{ color: "var(--t3)" }}>· {refreshSec}s</span>}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-6 gap-3 mb-3" style={{ animation: "fadeUp 0.4s var(--ease-spring) both 0.04s" }}>
        {KPIS.map((k, i) => {
          const Icon = k.icon
          return (
            <div key={i} className="stat-card">
              {k.bar !== undefined && <div className="stat-accent-bar" style={{ background: k.color }} />}
              <div className="stat-icon" style={{ background: k.color + "16" }}>
                <Icon size={19} style={{ color: k.color }} />
              </div>
              {k.tag && <div className="text-[11px] font-semibold mb-1.5" style={{ color: k.color }}>{k.tag}</div>}
              <div className="stat-label">{k.label}</div>
              <div className="flex items-baseline gap-1 mt-1">
                <AnimatedValue value={k.value} color={k.color} />
                <span className="text-[12px] font-medium" style={{ color: "var(--t3)" }}>{k.unit}</span>
              </div>
              {k.bar !== undefined && (
                <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--surface-1)" }}>
                  <div className="h-full rounded-full transition-all duration-800" style={{ width: k.bar + "%", background: k.color }} />
                </div>
              )}
              {k.sub && <div className="text-[11px] mt-1.5" style={{ color: "var(--t3)" }}>{k.sub}</div>}
            </div>
          )
        })}
      </div>

      {(st.noMonWells > 0 || st.noLabWells > 0) && (
        <div className="mb-3 flex gap-2.5" style={{ animation: "fadeUp 0.4s var(--ease-spring) both 0.08s" }}>
          {st.noMonWells > 0 && <span className="alert-banner" style={{ background: "var(--amber-soft)", color: "var(--amber)" }}><AlertTriangle size={14} />{st.noMonWells} 口井超过 3 个月未监测</span>}
          {st.noLabWells > 0 && <span className="alert-banner" style={{ background: "var(--amber-soft)", color: "var(--amber)" }}><AlertTriangle size={14} />{st.noLabWells} 口井超过 3 个月未化验</span>}
        </div>
      )}

      <div className="panel mb-4" style={{ animation: "fadeUp 0.4s var(--ease-spring) both 0.12s" }}>
        <div className="panel-head" style={{ justifyContent: "space-between" }}>
          <div className="flex items-center gap-2.5">
            <span className="panel-tick" />
            <span className="panel-title">各井采线综合一览</span>
            <span className="text-[11px] ml-1" style={{ color: "var(--t3)" }}>运行状态 · K⁺/Li⁺含量 · 动水位</span>
          </div>
          <span className="text-[11px] flex items-center gap-1.5" style={{ color: "var(--t4)" }}>
            <span className="led led-on" />自动滚动 · 悬停暂停
          </span>
        </div>
        <div style={{ padding: '16px' }}>
          {mergedLines ? (
            <LineMarqueeTable rows={mergedLines} height={320} />
          ) : <ChartLoading />}
        </div>
      </div>
    </div>
  )
}

function AnimatedValue({ value, color }: { value: number; color: string }) {
  const animated = useCountUp(value, 800)
  return <span className="stat-value" style={{ color }}>{animated}</span>
}

function ChartLoading() {
  return <div className="flex justify-center py-16"><div className="w-6 h-6 border-[3px] border-[var(--accent)] border-t-transparent rounded-full animate-spin" /></div>
}
