"use client"
import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import { WELL_LINES, REGIONS } from "@/lib/well-data"
import { getLabData, createLabData, getAdjacentMonths, updateLabData, deleteLabDatas, importLabDatas } from "@/app/actions"
import { fmt, fmtDate, P } from "@/lib/precision"
import { addToast } from "@/components/ui/Toast"
import { exportXLSX } from "@/lib/export"
import { labCreateSchema } from "@/shared/validation"

import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import Select from "@/components/ui/Select"
import DataStats from "@/components/ui/DataStats"

import { Calendar, Beaker, Pencil, Download } from "lucide-react"
import { GaugeIndicator } from "@/components/dashboard/GaugeIndicator"
import Pagination from "@/components/ui/Pagination"
import ConfirmModal from "@/components/ui/ConfirmModal"
import { LabComparePanel } from "@/components/dashboard/LabComparePanel"
import DateField from "@/components/ui/DateField"

const PS = 15
const LINE_OPTS = [{ value: "", label: "全部井采线" }, ...WELL_LINES.map(l => ({ value: l.shortName, label: l.name }))]
const LINE_OPTS_E = [{ value: "", label: "选择" }, ...WELL_LINES.map(l => ({ value: l.shortName, label: l.name }))]
function hi(t: string, q: string) { if (!q || !t) return t || "-"; const s = String(t); const i = s.toLowerCase().indexOf(q.toLowerCase()); if (i < 0) return s; return <>{s.slice(0, i)}<span className="hl">{s.slice(i, i + q.length)}</span>{s.slice(i + q.length)}</> }
const TI = "w-full bg-transparent text-[10.5px] tabular-nums py-0 h-4 focus:outline-none"

export default function LabPage() {
  const [tab, setTab] = useState<"browse" | "entry">("browse")

  const [search, setSearch] = useState(""); const [region, setRegion] = useState(""); const [line, setLine] = useState(""); const [df, setDF] = useState(""); const [dt, setDT] = useState("")
  const [page, setPage] = useState(1); const [sel, setSel] = useState(new Set<string>()); const [delOpen, setDelOpen] = useState(false)
  const [comparePair, setComparePair] = useState<any[] | null>(null)
  const [eid, setEid] = useState<number | null>(null); const [ev, setEv] = useState<any>({})
  const [data, setData] = useState<any[]>([]); const [total, setTotal] = useState(0); const [loading, setLoading] = useState(false)
  const [lw, setLw] = useState(""); const [ll, setLl] = useState(""); const [ld, setLd] = useState(new Date().toISOString().split("T")[0])
  const [lv, setLv] = useState(""); const [ln, setLn] = useState(""); const [lp, setLp] = useState(""); const [ls, setLs] = useState("")
  const [lk, setLk] = useState(""); const [lm, setLm] = useState(""); const [lc, setLc] = useState(""); const [lo, setLo] = useState("")
  const [la, setLa] = useState(""); const [lb, setLb] = useState(""); const [li, setLi] = useState(""); const [lna, setLna] = useState(""); const [is, setIs] = useState<string[]>([])

  const allIds = useMemo(() => { const ids: string[] = []; for (const l of WELL_LINES) { const ln = l as any; if (ln.numbers) for (const n of ln.numbers) ids.push(ln.prefix + String(n).padStart(3, "0")) } return ids }, [])
  const sw = (v: string) => { const cn = WELL_LINES.filter(l => l.name.includes(v) || l.shortName.toLowerCase().includes(v.toLowerCase())); const r: string[] = []; for (const l of cn) { const ln = l as any; if (ln.numbers) for (const n of ln.numbers) r.push(ln.prefix + String(n).padStart(3, "0")) } return r }

  const fetchRef = useRef<() => void>(() => {})
  fetchRef.current = () => { setLoading(true); getLabData({ region: region || undefined, lineId: line ? WELL_LINES.find(ll => ll.shortName === line)?.id : undefined, search: search || undefined, dateFrom: df || undefined, dateTo: dt || undefined, page, pageSize: PS }).then((r: any) => { setData(r.data); setTotal(r.total) }).finally(() => setLoading(false)) }
  const fetch = useCallback(() => fetchRef.current(), [])
  useEffect(() => { document.title = "清欢 · 化验数据"; fetch() }, [region, line, df, dt, page])
  useEffect(() => { const t = setTimeout(fetch, 300); return () => clearTimeout(t) }, [search])
  const tp = Math.max(1, Math.ceil(total / PS))
  const ta = () => setSel(sel.size === data.length ? new Set() : new Set(data.map((r: any) => String(r.id)))); const to = (id: string) => { const n = new Set(sel); n.has(id) ? n.delete(id) : n.add(id); setSel(n) }
  const doDel = async () => { try { await deleteLabDatas(Array.from(sel).map(Number)); addToast("已删除" + sel.size + "条", "success"); setSel(new Set()); setDelOpen(false); setPage(1); fetch() } catch (e: any) { addToast("删除失败:" + e.message, "error") } }
  const se = (r: any) => { const f3 = (v: any) => v != null ? Number(v).toFixed(3) : ""; const f4 = (v: any) => v != null ? Number(v).toFixed(4) : ""; setEid(r.id); setEv({ testDate: r.testDate || "", viscosity: f3(r.viscosity), density: f4(r.density), ph: r.ph != null ? Number(r.ph).toFixed(2) : "", salinity: f3(r.salinity), kPlus: f3(r.kPlus), mg2Plus: f3(r.mg2Plus), clMinus: f3(r.clMinus), so42Minus: f3(r.so42Minus), ca2Plus: f3(r.ca2Plus), b2o3: f3(r.b2o3), liPlus: f4(r.liPlus), naPlus: f3(r.naPlus) }) }
  const evRef = useRef(ev); evRef.current = ev
  const ce = useCallback(() => { setEid(null); setEv({}) }, [])
  const doSave = useCallback(async () => { const v = evRef.current; if (!eid) return; try { await updateLabData(eid, { testDate: v.testDate || undefined, viscosity: v.viscosity ? parseFloat(v.viscosity) : undefined, density: v.density ? parseFloat(v.density) : undefined, ph: v.ph ? parseFloat(v.ph) : undefined, salinity: v.salinity ? parseFloat(v.salinity) : undefined, kPlus: v.kPlus ? parseFloat(v.kPlus) : undefined, mg2Plus: v.mg2Plus ? parseFloat(v.mg2Plus) : undefined, clMinus: v.clMinus ? parseFloat(v.clMinus) : undefined, so42Minus: v.so42Minus ? parseFloat(v.so42Minus) : undefined, ca2Plus: v.ca2Plus ? parseFloat(v.ca2Plus) : undefined, b2o3: v.b2o3 ? parseFloat(v.b2o3) : undefined, liPlus: v.liPlus ? parseFloat(v.liPlus) : undefined, naPlus: v.naPlus ? parseFloat(v.naPlus) : undefined }); addToast("已更新", "success"); setEid(null); setEv({}); fetch() } catch (e: any) { addToast("更新失败:" + e.message, "error") } }, [eid, fetch])
  useEffect(() => { if (!eid) return; const h = (e: KeyboardEvent) => { if (e.key === "Escape") ce(); if (e.key === "Enter") { e.preventDefault(); doSave() } }; window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h) }, [eid, ce, doSave])
  const hs = (v: string) => { setLw(v.toUpperCase()); const pool = allIds; const cn = sw(v); const all = [...new Set([...pool.filter(id => id.toUpperCase().includes(v.toUpperCase())), ...cn])]; setIs(v.length >= 1 ? all.slice(0, 8) : []) }
  const cf = () => { setLw(""); setLl(""); setLd(new Date().toISOString().split("T")[0]); setLv(""); setLn(""); setLp(""); setLs(""); setLk(""); setLm(""); setLc(""); setLo(""); setLa(""); setLb(""); setLi(""); setLna(""); setIs([]) }
  const sub = async (e: React.FormEvent) => { e.preventDefault(); if (!lw) { addToast("请填写井号", "warning"); return } const vResult = labCreateSchema.safeParse({ wellId: lw, testDate: ld || undefined, viscosity: lv ? parseFloat(lv) : undefined, density: ln ? parseFloat(ln) : undefined, ph: lp ? parseFloat(lp) : undefined, salinity: ls ? parseFloat(ls) : undefined, kPlus: lk ? parseFloat(lk) : undefined, mg2Plus: lm ? parseFloat(lm) : undefined, clMinus: lc ? parseFloat(lc) : undefined, so42Minus: lo ? parseFloat(lo) : undefined, ca2Plus: la ? parseFloat(la) : undefined, b2o3: lb ? parseFloat(lb) : undefined, liPlus: li ? parseFloat(li) : undefined, naPlus: lna ? parseFloat(lna) : undefined }); if (!vResult.success) { addToast(vResult.error.issues[0].message, "warning"); return } try { await createLabData(vResult.data); addToast("已保存", "success"); cf() } catch (e: any) { addToast("保存失败:" + e.message, "error") } }
  const goAdj = async (dir: -1 | 1) => {
    const cm = df ? df.slice(0, 7) : new Date().getFullYear() + "-" + String(new Date().getMonth() + 1).padStart(2, "0");
    const adj = await getAdjacentMonths("lab", cm);
    const target = dir === -1 ? adj.prev : adj.next;
    if (target) {
      setDF(target + "-01");
      setDT(new Date(parseInt(target.slice(0, 4)), parseInt(target.slice(5, 7)), 0).toISOString().split("T")[0]);
      setPage(1);
    }
  }


  const doExp = async () => {
    try {
      const all = await getLabData({ region: region || undefined, lineId: line ? WELL_LINES.find(l => l.shortName === line)?.id : undefined, search: search || undefined, dateFrom: df || undefined, dateTo: dt || undefined, pageSize: 99999 })
      const rows = (all as any).data || []
      if (!rows.length) { addToast("无数据可导出", "warning"); return }
      exportXLSX("化验数据", ["井号", "日期", "粘度", "比重", "pH", "矿化度", "K⁺", "Mg²⁺", "Cl⁻", "SO₄²⁻", "Ca²⁺", "B₂O₃", "Li⁺", "Na⁺"], rows.map((r: any) => [r.wellId, fmtDate(r.testDate), fmt(r.viscosity, P.VISCOSITY), fmt(r.density, P.DENSITY), fmt(r.ph, P.PH), fmt(r.salinity, P.SALINITY), fmt(r.kPlus, P.ION), fmt(r.mg2Plus, P.ION), fmt(r.clMinus, P.ION), fmt(r.so42Minus, P.ION), fmt(r.ca2Plus, P.ION), fmt(r.b2o3, P.ION_B2O3), fmt(r.liPlus, P.ION_LI), fmt(r.naPlus, P.ION)]))
      addToast("已导出 " + rows.length + " 条", "success")
    } catch (e: any) { addToast("导出失败: " + e.message, "error") }
  }

  const renderCard = (r: any, i: number) => {
    const kVal = r.kPlus != null ? Number(r.kPlus).toFixed(3) : null
    const liVal = r.liPlus != null ? Number(r.liPlus).toFixed(4) : null
    const kLow = kVal && parseFloat(kVal) <= 6.5
    return (
      <div key={r.id} className="data-card-item" style={{ animation: `cardIn 0.35s ease both ${i * 0.03}s` }}>
        <div className="dc-check">
          <input type="checkbox" checked={sel.has(String(r.id))} onChange={() => to(String(r.id))} />
        </div>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: kLow ? "var(--amber-grad)" : "var(--sky-grad)" }}>
            <Beaker size={18} style={{ color: "#fff" }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="dc-id">{hi(r.wellId, search)}</div>
            <div className="dc-meta">{fmtDate(r.testDate)} · {r.lineName || "—"}</div>
          </div>
        </div>
        {/* K⁺/ Li⁺/ density gauge indicators */}
        <div className="flex gap-4 mt-4 mb-3 justify-center">
          <GaugeIndicator
            value={kVal != null ? parseFloat(kVal) : null}
            max={15}
            threshold={6.5}
label="K⁺3?"
            unit="g/L"
            color="#4a9eff"
            thresholdColor="#fbbf24"
            size={90}
          />
          <GaugeIndicator
            value={liVal != null ? parseFloat(liVal) : null}
            max={0.5}
            threshold={0.15}
label="Li⁺4?"
            unit="g/L"
            color="#60a5fa"
            thresholdColor="#fbbf24"
            size={90}
          />
          <GaugeIndicator
            value={r.density != null ? Number(r.density) : null}
            max={2.0}
            threshold={1.0}
            label="比重"
            unit=""
            color="#60a5fa"
            thresholdColor="#fbbf24"
            size={90}
          />
        </div>
        <div className="dc-values" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
          {[{ v: fmt(r.density, P.DENSITY), l: "比重" }, { v: fmt(r.ph, P.PH), l: "pH" }, { v: fmt(r.salinity, P.SALINITY), l: "矿化度" }, { v: fmt(r.viscosity, P.VISCOSITY), l: "粘度" },
            { v: fmt(r.mg2Plus, P.ION), l: "Mg²⁺" }, { v: fmt(r.clMinus, P.ION), l: "Cl⁻" }, { v: fmt(r.so42Minus, P.ION), l: "SO₄²⁻" }, { v: fmt(r.ca2Plus, P.ION), l: "Ca²⁺" },
            { v: fmt(r.b2o3, P.ION_B2O3), l: "B₂O₃" }, { v: fmt(r.naPlus, P.ION), l: "Na⁺" }].map((dv, j) => (
            <div key={j} className="dc-val">
              <div className="dc-val-num" style={{ color: "var(--t2)", fontSize: 14 }}>{dv.v}</div>
              <div className="dc-val-lbl">{dv.l}</div>
            </div>
          ))}
        </div>
        <div className="flex justify-end mt-3 pt-3 border-t border-[var(--border-light)]">
          <button onClick={() => se(r)} className="inline-flex items-center gap-1 text-[11px] font-medium hover:text-[var(--accent)] transition-colors" style={{ color: "var(--t3)" }}>
            <Pencil size={12} />编辑
          </button>
        </div>
      </div>
    )
  }

  return <div className="page-container">
    <div className="mb-5 rise flex items-center justify-between">
      <div>
        <h1 className="text-[22px] font-bold tracking-tight" style={{ color: "var(--t1)" }}>化验数据</h1>
        <p className="text-[12px] mt-1" style={{ color: "var(--t2)" }}>{total}条记录</p>
      </div>
      <div className="flex gap-2">
        <Button variant={tab === "browse" ? "primary" : "secondary"} size="sm" onClick={() => setTab("browse")}>浏览</Button>
        <Button variant={tab === "entry" ? "primary" : "secondary"} size="sm" onClick={() => setTab("entry")}>录入</Button>
      </div>
    </div>

    {tab === "browse" && <>
      <div className="flex items-center gap-2 mb-3 flex-wrap">
       <Select value={line} onChange={e => { setLine(e.target.value); setPage(1) }} options={LINE_OPTS} w={150} />
        <Input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder="搜索井号..." w={150} />
        {REGIONS.map(r => <button key={r.key} onClick={() => { setRegion(region === r.key ? "" : r.key); setPage(1) }} className={`filter-chip ${region === r.key ? "active" : ""}`}>{r.name}</button>)}
        <DateField value={df} onChange={v => { setDF(v); setPage(1) }} w={150} placeholder="开始日期" clearable />
        <span className="text-[12px]" style={{ color: "var(--t3)" }}>至</span>
        <DateField value={dt} onChange={v => { setDT(v); setPage(1) }} w={150} placeholder="结束日期" clearable />
        <div className="flex-1" />
        <Button variant="secondary" size="sm" onClick={doExp} disabled={!data.length}><Download size={12} className="mr-1" />导出</Button>
        {sel.size === 2 && (
          <Button variant="primary" size="sm" onClick={() => {
            const ids = Array.from(sel).map(Number)
            const recs = data.filter((r: any) => ids.includes(r.id))
            if (recs.length === 2) setComparePair(recs)
          }}>对比</Button>
        )}
        <Button variant="danger" size="sm" onClick={() => { if (sel.size === 0) { addToast("请先选择", "warning"); return } setDelOpen(true) }} disabled={sel.size === 0}>删除{sel.size > 0 ? `(${sel.size})` : ""}</Button>
      </div>
      <div className="overflow-hidden">
        {loading && data.length === 0 ? (
          <div className="py-16 flex justify-center"><div className="w-6 h-6 border-[3px] border-[var(--accent)] border-t-transparent rounded-full animate-spin" /></div>
        ) : data.length === 0 ? (
          <div className="py-16 text-center"><p className="text-[13px]" style={{ color: "var(--t2)" }}>暂无数据</p><Button variant="primary" size="sm" onClick={() => setTab("entry")} className="mt-3">立即录入</Button></div>
        ) : (
          <div className="overflow-x-auto">
            {loading && <div className="sticky top-0 left-0 right-0 h-[2px] z-10" style={{ background: "linear-gradient(90deg,transparent,var(--accent),transparent)", backgroundSize: "200% 100%", animation: "shimmer 1s ease-in-out infinite" }} />}
            <table className="data-table"><thead><tr style={{ borderBottom: "1px solid var(--border)" }}><th className="w-8 py-1"><input type="checkbox" checked={data.length > 0 && sel.size === data.length} onChange={ta} /></th><th className="w-10 py-1 font-semibold text-center" style={{ color: "var(--t3)" }}>#</th><th className="w-24 py-1 font-semibold text-center" style={{ color: "var(--t3)" }}>井号</th><th className="w-24 py-1 font-semibold text-center" style={{ color: "var(--t3)" }}>日期</th><th className="w-16 py-1 font-semibold text-center" style={{ color: "var(--t3)" }}>粘度</th><th className="w-16 py-1 font-semibold text-center" style={{ color: "var(--t3)" }}>比重</th><th className="w-14 py-1 font-semibold text-center" style={{ color: "var(--t3)" }}>pH</th><th className="w-20 py-1 font-semibold text-center" style={{ color: "var(--t3)" }}>矿化度</th><th className="w-16 py-1 font-semibold text-center" style={{ color: "var(--t3)" }}>K⁺</th><th className="w-16 py-1 font-semibold text-center" style={{ color: "var(--t3)" }}>Mg²⁺</th><th className="w-16 py-1 font-semibold text-center" style={{ color: "var(--t3)" }}>Cl⁻</th><th className="w-16 py-1 font-semibold text-center" style={{ color: "var(--t3)" }}>SO₄²⁻</th><th className="w-16 py-1 font-semibold text-center" style={{ color: "var(--t3)" }}>Ca²⁺</th><th className="w-16 py-1 font-semibold text-center" style={{ color: "var(--t3)" }}>B₂O₃</th><th className="w-16 py-1 font-semibold text-center" style={{ color: "var(--t3)" }}>Li⁺</th><th className="w-18 py-1 font-semibold text-center" style={{ color: "var(--t3)" }}>Na⁺</th><th className="w-14 py-1 font-semibold text-center" style={{ color: "var(--t3)" }}>操作</th></tr></thead>
              <tbody>{data.map((r: any, i: number) => { const ed = eid === r.id; return <tr key={r.id} className="hover:bg-[var(--surface-1)]" style={{ borderBottom: "1px solid var(--border-light)", background: ed ? "var(--accent-soft)" : undefined }}><td className="text-center"><input type="checkbox" checked={sel.has(String(r.id))} onChange={() => to(String(r.id))} /></td><td className="text-center tabular-nums" style={{ color: "var(--t3)" }}>{(page - 1) * PS + i + 1}</td><td className="text-center font-semibold" style={{ fontFamily: "var(--font-mono)", color: "var(--t1)" }}>{hi(r.wellId, search)}</td><td className="text-center" style={{ color: "var(--t1)" }}>{ed ? <input className={TI} value={ev.testDate} onChange={e => setEv({ ...ev, testDate: e.target.value })} /> : fmtDate(r.testDate)}</td><td className="text-center tabular-nums">{ed ? <input className={TI} value={ev.viscosity} onChange={e => setEv({ ...ev, viscosity: e.target.value })} /> : <span style={{ color: "var(--t1)" }}>{fmt(r.viscosity, P.VISCOSITY)}</span>}</td><td className="text-center tabular-nums">{ed ? <input className={TI} value={ev.density} onChange={e => setEv({ ...ev, density: e.target.value })} /> : <span style={{ color: "var(--t1)" }}>{fmt(r.density, P.DENSITY)}</span>}</td><td className="text-center tabular-nums">{ed ? <input className={TI} value={ev.ph} onChange={e => setEv({ ...ev, ph: e.target.value })} /> : <span style={{ color: "var(--t1)" }}>{fmt(r.ph, P.PH)}</span>}</td><td className="text-center tabular-nums">{ed ? <input className={TI} value={ev.salinity} onChange={e => setEv({ ...ev, salinity: e.target.value })} /> : <span style={{ color: "var(--t1)" }}>{fmt(r.salinity, P.SALINITY)}</span>}</td><td className="text-center tabular-nums" style={{ color: r.kPlus != null && Number(r.kPlus) <= 6.5 ? "var(--amber)" : "var(--t1)", fontWeight: r.kPlus != null && Number(r.kPlus) <= 6.5 ? 700 : undefined }}>{ed ? <input className={TI} value={ev.kPlus} onChange={e => setEv({ ...ev, kPlus: e.target.value })} /> : fmt(r.kPlus, P.ION)}</td><td className="text-center tabular-nums">{ed ? <input className={TI} value={ev.mg2Plus} onChange={e => setEv({ ...ev, mg2Plus: e.target.value })} /> : <span style={{ color: "var(--t1)" }}>{fmt(r.mg2Plus, P.ION)}</span>}</td><td className="text-center tabular-nums">{ed ? <input className={TI} value={ev.clMinus} onChange={e => setEv({ ...ev, clMinus: e.target.value })} /> : <span style={{ color: "var(--t1)" }}>{fmt(r.clMinus, P.ION)}</span>}</td><td className="text-center tabular-nums">{ed ? <input className={TI} value={ev.so42Minus} onChange={e => setEv({ ...ev, so42Minus: e.target.value })} /> : <span style={{ color: "var(--t1)" }}>{fmt(r.so42Minus, P.ION)}</span>}</td><td className="text-center tabular-nums">{ed ? <input className={TI} value={ev.ca2Plus} onChange={e => setEv({ ...ev, ca2Plus: e.target.value })} /> : <span style={{ color: "var(--t1)" }}>{fmt(r.ca2Plus, P.ION)}</span>}</td><td className="text-center tabular-nums">{ed ? <input className={TI} value={ev.b2o3} onChange={e => setEv({ ...ev, b2o3: e.target.value })} /> : <span style={{ color: "var(--t1)" }}>{fmt(r.b2o3, P.ION_B2O3)}</span>}</td><td className="text-center tabular-nums" style={{ color: r.liPlus != null && Number(r.liPlus) < 0.15 ? "var(--green)" : "var(--t1)", fontWeight: r.liPlus != null && Number(r.liPlus) < 0.15 ? 600 : undefined }}>{ed ? <input className={TI} value={ev.liPlus} onChange={e => setEv({ ...ev, liPlus: e.target.value })} /> : fmt(r.liPlus, P.ION_LI)}</td><td className="text-center tabular-nums">{ed ? <input className={TI} value={ev.naPlus} onChange={e => setEv({ ...ev, naPlus: e.target.value })} /> : <span style={{ color: "var(--t1)" }}>{fmt(r.naPlus, P.ION)}</span>}</td><td className="text-center">{ed ? <div className="flex gap-1.5 justify-center"><button onClick={doSave} className="text-[12px] font-semibold hover:opacity-70" style={{ color: "var(--accent)" }}>保存</button><button onClick={ce} className="text-[12px] hover:opacity-70" style={{ color: "var(--t3)" }}>取消</button></div> : <button onClick={() => se(r)} className="text-[12px] font-semibold hover:text-[var(--accent)] transition-colors" style={{ color: "var(--t3)" }}>编辑</button>}</td></tr> })}</tbody></table>
          </div>
        )}
        <DataStats data={data} cols={[{ key: "kPlus", label: "K", decimals: 3 }, { key: "liPlus", label: "Li", decimals: 4 }, { key: "density", label: "比重", decimals: 4 }, { key: "salinity", label: "矿化度", decimals: 3 }]} />
        {tp > 1 && <Pagination page={page} totalPages={tp} total={total} pageSize={PS} onChange={setPage} />}
      </div>
    </>}

    {tab === "entry" && <div className="card p-6 rise"><form onSubmit={sub}>
      <div className="flex items-center gap-2 mb-5">
        <label className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full text-[13px] font-semibold cursor-pointer transition-all duration-200 hover:bg-[var(--surface-1)] active:scale-[0.97]" style={{ color: "var(--t2)", border: "1px solid var(--border)" }}>📥导入Excel<input type="file" accept=".xlsx,.xls" className="hidden" onChange={async e => { const f = e.target.files?.[0]; if (!f) return; try { const XLSX = await import("xlsx"); const T = await import("@/lib/templates"); const d = new Uint8Array(await f.arrayBuffer()); const wb = XLSX.read(d, { type: "array" }); const raw = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 }) as any[][]; const rows = raw.filter((r: any[]) => r.some((c: any) => c !== "")); const find = T.colFinder(rows[0]); const A = T.LAB_ALIASES; const cell = (r: any[], al: string[]) => { const i = find(al); return i >= 0 ? r[i] : undefined }; const recs = rows.slice(1).map((r: any) => ({ wellId: String(cell(r, A.wellId) || "").trim(), testDate: cell(r, A.testDate) || null, viscosity: T.num(cell(r, A.viscosity)), density: T.num(cell(r, A.density)), ph: T.num(cell(r, A.ph)), salinity: T.num(cell(r, A.salinity)), kPlus: T.num(cell(r, A.kPlus)), mg2Plus: T.num(cell(r, A.mg2Plus)), clMinus: T.num(cell(r, A.clMinus)), so42Minus: T.num(cell(r, A.so42Minus)), ca2Plus: T.num(cell(r, A.ca2Plus)), b2o3: T.num(cell(r, A.b2o3)), liPlus: T.num(cell(r, A.liPlus)), naPlus: T.num(cell(r, A.naPlus)) })).filter((x: any) => x.wellId); const result = await importLabDatas(recs); if (result.success) { addToast("导入" + result.count + "条", "success"); fetch() } else { addToast("导入失败:" + result.error, "error") } } catch (err: any) { addToast("导入异常:" + (err?.message || ""), "error") } e.target.value = "" }} /></label>
        <button type="button" onClick={() => { import("@/lib/templates").then(m => m.downloadTemplate(m.LAB_TPL, "化验数据导入模板", m.LAB_SAMPLE)) }} className="h-9 px-3 rounded-full text-[12px] font-medium border transition-colors hover:bg-[var(--surface-1)]" style={{ color: "var(--t2)", borderColor: "var(--glass-border)" }}>📋 下载模板</button>

        <div className="flex-1" />
        <Button variant="ghost" size="sm" type="button" onClick={cf}>清除</Button>
      </div>
      <div className="flex items-end gap-3 flex-wrap">
        <div className="relative"><Input label="井号" value={lw} onChange={e => hs(e.target.value)} placeholder="C05001" w={150} autoComplete="off" />{is.length > 0 && <div className="absolute z-50 top-full left-0 right-0 mt-1 pop" style={{ background: "var(--surface-3)", border: "1px solid var(--glass-border-strong)", borderRadius: "var(--r-md)", boxShadow: "var(--s-lg)", backdropFilter: "blur(20px)" }}>{is.map(id => <div key={id} className="px-3 py-2 text-[12px] hover:bg-[var(--surface-1)] cursor-pointer" style={{ fontFamily: "var(--font-mono)" }} onClick={() => { setLw(id); setIs([]) }}>{id}</div>)}</div>}</div>
        <Select label="井采线" value={ll} onChange={e => { setLl(e.target.value); setLw("") }} options={LINE_OPTS_E} w={150} />
        <DateField label="日期" value={ld} onChange={v => setLd(v)} w={150} />
        <Input label="粘度" value={lv} onChange={e => setLv(e.target.value)} w={90} />
        <Input label="比重(4?" value={ln} onChange={e => setLn(e.target.value)} placeholder="1.2345" w={110} />
        <Input label="pH" value={lp} onChange={e => setLp(e.target.value)} placeholder="7.00" w={80} />
        <Input label="矿化度(3位)" value={ls} onChange={e => setLs(e.target.value)} w={120} />
        <Input label="K⁺(3位)" value={lk} onChange={e => setLk(e.target.value)} w={100} />
        <Input label="Mg²⁺" value={lm} onChange={e => setLm(e.target.value)} w={100} />
        <Input label="Cl⁻" value={lc} onChange={e => setLc(e.target.value)} w={100} />
        <Input label="SO₄²⁻" value={lo} onChange={e => setLo(e.target.value)} w={100} />
        <Input label="Ca²⁺" value={la} onChange={e => setLa(e.target.value)} w={100} />
        <Input label="B₂O₃" value={lb} onChange={e => setLb(e.target.value)} w={100} />
        <Input label="Li⁺(4位)" value={li} onChange={e => setLi(e.target.value)} w={100} />
        <Input label="Na⁺" value={lna} onChange={e => setLna(e.target.value)} w={100} />
        <Button variant="primary" size="sm" type="submit">提交</Button>
      </div>
    </form></div>}
    {delOpen && <ConfirmModal title="确认删除" message={`确定删除${sel.size}条化验记录？`} onConfirm={doDel} onCancel={() => setDelOpen(false)} />}
    {comparePair && comparePair.length === 2 && <LabComparePanel recordA={comparePair[0]} recordB={comparePair[1]} onClose={() => setComparePair(null)} />}
  </div>
}
