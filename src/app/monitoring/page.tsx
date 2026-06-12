"use client"
import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import { WELL_LINES, REGIONS } from "@/lib/well-data"
import { getMonitorings, createMonitoring, getAdjacentMonths, updateMonitoring, deleteMonitorings, importMonitorings, exportMonitorings } from "@/app/actions"
import { fmt, fmtDate, P } from "@/lib/precision"
import { exportXLSX } from "@/lib/export"
import { addToast } from "@/components/ui/Toast"
import { monitoringCreateSchema } from "@/shared/validation"

import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import Select from "@/components/ui/Select"
import DataStats from "@/components/ui/DataStats"

import { Activity, Gauge, Waves, Droplets, ArrowDown, Factory, Zap, Pencil, Download } from "lucide-react"
import Pagination from "@/components/ui/Pagination"
import ConfirmModal from "@/components/ui/ConfirmModal"
import DateField from "@/components/ui/DateField"

const PS = 15
const SM: Record<string, string> = { normal: "正常", abnormal: "异常", stopped: "停止", abandoned: "废弃" }
const LINE_OPTS_E = [{ value: "", label: "选择" }, ...WELL_LINES.map(l => ({ value: l.shortName, label: l.name }))]
const STATUS_OPTS = [{ value: "normal", label: "正常" }, { value: "abnormal", label: "异常" }]
const bad = (s: string) => s === "abnormal" ? "badge-bad" : s === "stopped" ? "badge-warn" : s === "normal" ? "badge-ok" : "badge-dim"
function hi(t: string, q: string) { if (!q || !t) return t || "-"; const s = String(t); const i = s.toLowerCase().indexOf(q.toLowerCase()); if (i < 0) return s; return <>{s.slice(0, i)}<span className="hl">{s.slice(i, i + q.length)}</span>{s.slice(i + q.length)}</> }
const TI = "w-full bg-transparent text-[10.5px] tabular-nums py-0 h-4 focus:outline-none"
const TS = "w-full bg-transparent text-[10.5px] py-0 h-4 appearance-none cursor-pointer focus:outline-none"

export default function MonitoringPage() {
  const [tab, setTab] = useState<"browse" | "entry">("browse")
  const [search, setSearch] = useState(""); const [region, setRegion] = useState(""); const [df, setDF] = useState(""); const [dt, setDT] = useState("")
  const [page, setPage] = useState(1); const [sel, setSel] = useState(new Set<string>()); const [delOpen, setDelOpen] = useState(false)
  const [eid, setEid] = useState<number | null>(null); const [ev, setEv] = useState<any>({})
  const [data, setData] = useState<any[]>([]); const [total, setTotal] = useState(0); const [loading, setLoading] = useState(false)

  const [mw, setMw] = useState(""); const [ml, setMl] = useState(""); const [md, setMd] = useState(new Date().toISOString().split("T")[0])
  const [sw, setSw] = useState(""); const [dw, setDw] = useState(""); const [wd, setWd] = useState(""); const [fr, setFr] = useState("")
  const [pd, setPd] = useState(""); const [pf, setPf] = useState(""); const [mp, setMp] = useState(""); const [mf, setMf] = useState("")
  const [st, setSt] = useState("normal"); const [fn, setFn] = useState(""); const [is, setIs] = useState<string[]>([])
  const [contEntry, setContEntry] = useState(false)

  const allIds = useMemo(() => { const ids: string[] = []; for (const l of WELL_LINES) { const ln = l as any; if (ln.numbers) for (const n of ln.numbers) ids.push(ln.prefix + String(n).padStart(3, "0")) } return ids }, [])
  const sw_ = (v: string) => { const cn = WELL_LINES.filter(l => l.name.includes(v) || l.shortName.toLowerCase().includes(v.toLowerCase())); const r: string[] = []; for (const l of cn) { const ln = l as any; if (ln.numbers) for (const n of ln.numbers) r.push(ln.prefix + String(n).padStart(3, "0")) } return r }

  const fetchRef = useRef<() => void>(() => {})
  fetchRef.current = () => { setLoading(true); getMonitorings({ region: region || undefined, search: search || undefined, dateFrom: df || undefined, dateTo: dt || undefined, page, pageSize: PS }).then((r: any) => { setData(r.data); setTotal(r.total) }).finally(() => setLoading(false)) }
  const fetch = useCallback(() => fetchRef.current(), [])
  useEffect(() => { document.title = "清欢 · 监测数据"; fetch() }, [region, df, dt, page])
  useEffect(() => { const t = setTimeout(fetch, 300); return () => clearTimeout(t) }, [search])
  const tp = Math.max(1, Math.ceil(total / PS)); const pids = data.map((r: any) => String(r.id))
  const ta = () => setSel(sel.size === pids.length && pids.length > 0 ? new Set() : new Set(pids)); const to = (id: string) => { const n = new Set(sel); n.has(id) ? n.delete(id) : n.add(id); setSel(n) }
  const doDel = async () => { try { await deleteMonitorings(Array.from(sel).map(Number)); addToast("已删除" + sel.size + "条", "success"); setSel(new Set()); setDelOpen(false); setPage(1); fetch() } catch (e: any) { addToast("删除失败:" + e.message, "error") } }
  const se = (r: any) => { setEid(r.id); setEv({ collectDate: r.collectDate || "", staticWater: r.staticWater != null ? Number(r.staticWater).toFixed(2) : "", dynamicWater: r.dynamicWater != null ? Number(r.dynamicWater).toFixed(2) : "", wellDepth: r.wellDepth != null ? Number(r.wellDepth).toFixed(2) : "", flowRate: r.flowRate != null ? Number(r.flowRate).toFixed(2) : "", pumpDepth: r.pumpDepth != null ? Number(r.pumpDepth).toFixed(2) : "", pumpFlow: r.pumpFlow != null ? Number(r.pumpFlow).toFixed(2) : "", motorPower: r.motorPower != null ? Number(r.motorPower).toFixed(2) : "", manufacturer: r.manufacturer || "", status: r.status || "normal" }) }
  const evRef = useRef(ev); evRef.current = ev
  const ce = useCallback(() => { setEid(null); setEv({}) }, [])
  const doSave = useCallback(async () => { const v = evRef.current; if (!eid) return; try { await updateMonitoring(eid, { collectDate: v.collectDate || undefined, staticWater: v.staticWater ? parseFloat(v.staticWater) : undefined, dynamicWater: v.dynamicWater ? parseFloat(v.dynamicWater) : undefined, wellDepth: v.wellDepth ? parseFloat(v.wellDepth) : undefined, flowRate: v.flowRate ? parseFloat(v.flowRate) : undefined, pumpDepth: v.pumpDepth ? parseFloat(v.pumpDepth) : undefined, pumpFlow: v.pumpFlow ? parseFloat(v.pumpFlow) : undefined, motorPower: v.motorPower ? parseFloat(v.motorPower) : undefined, manufacturer: v.manufacturer || undefined, status: v.status }); addToast("已更新", "success"); setEid(null); setEv({}); fetch() } catch (e: any) { addToast("更新失败:" + e.message, "error") } }, [eid, fetch])
  useEffect(() => { if (!eid) return; const h = (e: KeyboardEvent) => { if (e.key === "Escape") ce(); if (e.key === "Enter") { e.preventDefault(); doSave() } }; window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h) }, [eid, ce, doSave])
  const hs = (v: string) => { setMw(v.toUpperCase()); const pool = allIds; const cn = sw_(v); const all = [...new Set([...pool.filter(id => id.toUpperCase().includes(v.toUpperCase())), ...cn])]; setIs(v.length >= 1 ? all.slice(0, 8) : []) }
  const an = (v: string, s: (x: string) => void) => { const n = parseFloat(v); if (!isNaN(n) && n > 0) s(String(Math.round(-n * 100) / 100)) }
  const cf = () => { setMw(""); setMl(""); setMd(new Date().toISOString().split("T")[0]); setSw(""); setDw(""); setWd(""); setFr(""); setPd(""); setPf(""); setMp(""); setMf(""); setSt("normal"); setFn(""); setIs([]) }
  const sub = async (e: React.FormEvent) => { e.preventDefault(); if (!mw) { addToast("请填写井号", "warning"); return } const vResult = monitoringCreateSchema.safeParse({ wellId: mw, collectDate: md || undefined, staticWater: sw ? parseFloat(sw) : undefined, dynamicWater: dw ? parseFloat(dw) : undefined, wellDepth: wd ? parseFloat(wd) : undefined, flowRate: fr ? parseFloat(fr) : undefined, pumpDepth: pd ? parseFloat(pd) : undefined, pumpFlow: pf ? parseFloat(pf) : undefined, motorPower: mp ? parseFloat(mp) : undefined, manufacturer: mf || undefined, status: st, faultNote: st === "abnormal" ? fn || undefined : undefined }); if (!vResult.success) { addToast(vResult.error.issues[0].message, "warning"); return } try { await createMonitoring(vResult.data); addToast("已保存", "success"); cf() } catch (e: any) { addToast("保存失败:" + e.message, "error") } }
  const doExp = async () => { try { const all = await getMonitorings({ region: region || undefined, search: search || undefined, dateFrom: df || undefined, dateTo: dt || undefined, pageSize: 99999 }); const rows = (all as any).data || []; if (!rows.length) { addToast("无数据可导出", "warning"); return }; exportXLSX("监测数据", ["井号", "日期", "静水位", "动水位", "井深", "流量", "泵深", "泵量", "电机", "厂家", "状态"], rows.map((r: any) => [r.wellId, fmtDate(r.collectDate), fmt(r.staticWater, P.WATER), fmt(r.dynamicWater, P.WATER), fmt(r.wellDepth, P.WELL_DEPTH), fmt(r.flowRate, P.FLOW), fmt(r.pumpDepth, P.PUMP_DEPTH), fmt(r.pumpFlow, P.PUMP_FLOW), fmt(r.motorPower, P.MOTOR), r.manufacturer || "--", SM[r.status] || r.status])); addToast("已导出 " + rows.length + " 条", "success") } catch (e: any) { addToast("导出失败: " + e.message, "error") } }

  const goAdj = async (dir: -1 | 1) => {
    const cm = df ? df.slice(0, 7) : new Date().getFullYear() + "-" + String(new Date().getMonth() + 1).padStart(2, "0");
    const adj = await getAdjacentMonths("monitoring", cm);
    const target = dir === -1 ? adj.prev : adj.next;
    if (target) {
      setDF(target + "-01");
      setDT(new Date(parseInt(target.slice(0, 4)), parseInt(target.slice(5, 7)), 0).toISOString().split("T")[0]);
      setPage(1);
    }
  }

  const renderCard = (r: any, i: number) => (
    <div key={r.id} className="data-card-item" style={{ animation: "cardIn 0.35s ease both " + (i * 0.03) + "s" }}>
      <div className="dc-check">
        <input type="checkbox" checked={sel.has(String(r.id))} onChange={() => to(String(r.id))} />
      </div>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: r.status === "abnormal" ? "var(--rose-grad)" : "var(--emerald-grad)" }}>
            <Activity size={18} style={{ color: "#fff" }} />
          </div>
          <div>
            <div className="dc-id">{hi(r.wellId, search)}</div>
            <div className="dc-meta flex items-center gap-2">{fmtDate(r.collectDate)} · <span className={"badge " + bad(r.status)}>{SM[r.status] || r.status}</span></div>
          </div>
        </div>
      </div>
      <div className="dc-values">
        <div className="dc-val"><div className="dc-val-num" style={{ color: "var(--accent)" }}>{fmt(r.staticWater, P.WATER)}</div><div className="dc-val-lbl"><ArrowDown size={10} className="inline mr-0.5" />静水位 m</div></div>
        <div className="dc-val"><div className="dc-val-num" style={{ color: "var(--sky)" }}>{fmt(r.dynamicWater, P.WATER)}</div><div className="dc-val-lbl"><Waves size={10} className="inline mr-0.5" />动水位 m</div></div>
        <div className="dc-val"><div className="dc-val-num" style={{ color: "var(--t1)" }}>{fmt(r.wellDepth, P.WELL_DEPTH)}</div><div className="dc-val-lbl"><Gauge size={10} className="inline mr-0.5" />井深 m</div></div>
        <div className="dc-val"><div className="dc-val-num" style={{ color: "var(--purple)" }}>{fmt(r.flowRate, P.FLOW)}</div><div className="dc-val-lbl"><Droplets size={10} className="inline mr-0.5" />流量 m3/h</div></div>
        <div className="dc-val"><div className="dc-val-num" style={{ color: "var(--t2)" }}>{fmt(r.pumpDepth, P.PUMP_DEPTH)}</div><div className="dc-val-lbl"><ArrowDown size={10} className="inline mr-0.5" />泵深 m</div></div>
        <div className="dc-val"><div className="dc-val-num" style={{ color: "var(--amber)" }}>{fmt(r.pumpFlow, P.PUMP_FLOW)}</div><div className="dc-val-lbl"><Zap size={10} className="inline mr-0.5" />泵量 m3/h</div></div>
        <div className="dc-val"><div className="dc-val-num" style={{ color: "var(--t3)" }}>{fmt(r.motorPower, P.MOTOR)}</div><div className="dc-val-lbl"><Factory size={10} className="inline mr-0.5" />电机 kW</div></div>
        <div className="dc-val"><div className="dc-val-num" style={{ color: "var(--t1)", fontSize: 10.5 }}>{r.manufacturer || "--"}</div><div className="dc-val-lbl"><Factory size={10} className="inline mr-0.5" />厂家</div></div>
      </div>
      <div className="flex justify-end mt-3 pt-3 border-t border-[var(--border-light)]">
        <button onClick={() => se(r)} className="inline-flex items-center gap-1 text-[11px] font-medium hover:text-[var(--accent)] transition-colors" style={{ color: "var(--t3)" }}>
          <Pencil size={12} />编辑
        </button>
      </div>
    </div>
  )

  return <div className="page-container">
    <div className="mb-5 rise flex items-center justify-between">
      <div>
        <h1 className="text-[22px] font-bold tracking-tight" style={{ color: "var(--t1)" }}>监测数据</h1>
        <p className="text-[12px] mt-1" style={{ color: "var(--t2)" }}>{total}条记录</p>
      </div>
      <div className="flex gap-2">
        <Button variant={tab === "browse" ? "primary" : "secondary"} size="sm" onClick={() => setTab("browse")}>浏览</Button>
        <Button variant={tab === "entry" ? "primary" : "secondary"} size="sm" onClick={() => setTab("entry")}>录入</Button>
      </div>
    </div>

    {tab === "browse" && <>
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <Input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder="搜索井号..." w={150} />
        {REGIONS.map(r => <button key={r.key} onClick={() => { setRegion(region === r.key ? "" : r.key); setPage(1) }} className={"filter-chip " + (region === r.key ? "active" : "")}>{r.name}</button>)}
        <DateField value={df} onChange={v => { setDF(v); setPage(1) }} w={150} placeholder="开始日期" clearable />
        <span className="text-[12px]" style={{ color: "var(--t3)" }}>至</span>
        <DateField value={dt} onChange={v => { setDT(v); setPage(1) }} w={150} placeholder="结束日期" clearable />
        <div className="flex-1" />
        <Button variant="secondary" size="sm" onClick={doExp} disabled={!data.length}><Download size={12} className="mr-1" />导出</Button>
        <Button variant="danger" size="sm" onClick={() => { if (sel.size === 0) { addToast("请先选择", "warning"); return } setDelOpen(true) }} disabled={sel.size === 0}>删除{sel.size > 0 ? "(" + sel.size + ")" : ""}</Button>
      </div>
      <div className="overflow-hidden">
        {loading && data.length === 0 ? (
          <div className="py-16 flex justify-center"><div className="w-6 h-6 border-[3px] border-[var(--accent)] border-t-transparent rounded-full animate-spin" /></div>
        ) : data.length === 0 ? (
          <div className="py-16 text-center"><p className="text-[13px]" style={{ color: "var(--t2)" }}>暂无数据</p><Button variant="primary" size="sm" onClick={() => setTab("entry")} className="mt-3">立即录入</Button></div>
        ) : (
          <div className="overflow-x-auto">
            {loading && <div className="sticky top-0 left-0 right-0 h-[2px] z-10" style={{ background: "linear-gradient(90deg,transparent,var(--accent),transparent)", backgroundSize: "200% 100%", animation: "shimmer 1s ease-in-out infinite" }} />}
            <table className="data-table"><thead><tr style={{ borderBottom: "1px solid var(--border)" }}><th className="w-8 py-1"><input type="checkbox" checked={pids.length > 0 && sel.size === pids.length} onChange={ta} /></th><th className="w-10 py-1 font-semibold text-center" style={{ color: "var(--t3)" }}>#</th><th className="w-24 py-1 font-semibold text-center" style={{ color: "var(--t3)" }}>井号</th><th className="w-24 py-1 font-semibold text-center" style={{ color: "var(--t3)" }}>日期</th><th className="w-18 py-1 font-semibold text-center" style={{ color: "var(--t3)" }}>静水位</th><th className="w-18 py-1 font-semibold text-center" style={{ color: "var(--t3)" }}>动水位</th><th className="w-18 py-1 font-semibold text-center" style={{ color: "var(--t3)" }}>井深</th><th className="w-18 py-1 font-semibold text-center" style={{ color: "var(--t3)" }}>流量</th><th className="w-18 py-1 font-semibold text-center" style={{ color: "var(--t3)" }}>泵深</th><th className="w-18 py-1 font-semibold text-center" style={{ color: "var(--t3)" }}>泵量</th><th className="w-18 py-1 font-semibold text-center" style={{ color: "var(--t3)" }}>电机</th><th className="w-20 py-1 font-semibold text-center" style={{ color: "var(--t3)" }}>厂家</th><th className="w-16 py-1 font-semibold text-center" style={{ color: "var(--t3)" }}>状态</th><th className="w-14 py-1 font-semibold text-center" style={{ color: "var(--t3)" }}>操作</th></tr></thead>
              <tbody>{data.map((r: any, i: number) => { const ed = eid === r.id; return <tr key={r.id} className="hover:bg-[var(--surface-1)]" style={{ borderBottom: "1px solid var(--border-light)", background: ed ? "var(--accent-soft)" : undefined }}><td className="text-center"><input type="checkbox" checked={sel.has(String(r.id))} onChange={() => to(String(r.id))} /></td><td className="text-center tabular-nums" style={{ color: "var(--t3)" }}>{(page - 1) * PS + i + 1}</td><td className="text-center font-semibold" style={{ fontFamily: "var(--font-mono)", color: "var(--t1)" }}>{hi(r.wellId, search)}</td><td className="text-center" style={{ color: "var(--t1)" }}>{ed ? <input className={TI} value={ev.collectDate} onChange={e => setEv({ ...ev, collectDate: e.target.value })} /> : fmtDate(r.collectDate)}</td><td className="text-center tabular-nums">{ed ? <input className={TI} value={ev.staticWater} onChange={e => setEv({ ...ev, staticWater: e.target.value })} /> : <span style={{ color: "var(--t1)" }}>{fmt(r.staticWater, P.WATER)}</span>}</td><td className="text-center tabular-nums">{ed ? <input className={TI} value={ev.dynamicWater} onChange={e => setEv({ ...ev, dynamicWater: e.target.value })} /> : <span style={{ color: "var(--t1)" }}>{fmt(r.dynamicWater, P.WATER)}</span>}</td><td className="text-center tabular-nums">{ed ? <input className={TI} value={ev.wellDepth} onChange={e => setEv({ ...ev, wellDepth: e.target.value })} /> : <span style={{ color: "var(--t1)" }}>{fmt(r.wellDepth, P.WELL_DEPTH)}</span>}</td><td className="text-center tabular-nums">{ed ? <input className={TI} value={ev.flowRate} onChange={e => setEv({ ...ev, flowRate: e.target.value })} /> : <span style={{ color: "var(--t1)" }}>{fmt(r.flowRate, P.FLOW)}</span>}</td><td className="text-center tabular-nums">{ed ? <input className={TI} value={ev.pumpDepth} onChange={e => setEv({ ...ev, pumpDepth: e.target.value })} /> : <span style={{ color: "var(--t1)" }}>{fmt(r.pumpDepth, P.PUMP_DEPTH)}</span>}</td><td className="text-center tabular-nums">{ed ? <input className={TI} value={ev.pumpFlow} onChange={e => setEv({ ...ev, pumpFlow: e.target.value })} /> : <span style={{ color: "var(--t1)" }}>{fmt(r.pumpFlow, P.PUMP_FLOW)}</span>}</td><td className="text-center tabular-nums">{ed ? <input className={TI} value={ev.motorPower} onChange={e => setEv({ ...ev, motorPower: e.target.value })} /> : <span style={{ color: "var(--t1)" }}>{fmt(r.motorPower, P.MOTOR)}</span>}</td><td className="text-center">{ed ? <input className={TI} value={ev.manufacturer} onChange={e => setEv({ ...ev, manufacturer: e.target.value })} /> : <span style={{ color: "var(--t1)" }}>{r.manufacturer || "--"}</span>}</td><td className="text-center">{ed ? <select className={TS} value={ev.status} onChange={e => setEv({ ...ev, status: e.target.value })}>{STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select> : <span className={"badge " + bad(r.status)}>{SM[r.status] || r.status}</span>}</td><td className="text-center">{ed ? <div className="flex gap-1.5 justify-center"><button onClick={doSave} className="text-[12px] font-semibold hover:opacity-70" style={{ color: "var(--accent)" }}>保存</button><button onClick={ce} className="text-[12px] hover:opacity-70" style={{ color: "var(--t3)" }}>取消</button></div> : <button onClick={() => se(r)} className="text-[12px] font-semibold hover:text-[var(--accent)] transition-colors" style={{ color: "var(--t3)" }}>编辑</button>}</td></tr> })}</tbody></table>
          </div>
        )}
        <DataStats data={data} cols={[{ key: "staticWater", label: "静水位", decimals: 2 }, { key: "dynamicWater", label: "动水位", decimals: 2 }, { key: "flowRate", label: "流量", decimals: 2 }]} />
        {tp > 1 && <Pagination page={page} totalPages={tp} total={total} pageSize={PS} onChange={setPage} />}
      </div>
    </>}

    {tab === "entry" && <div className="card p-6 rise"><form onSubmit={sub}>
      <div className="flex items-center gap-2 mb-5">
        <label className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full text-[13px] font-semibold cursor-pointer transition-all duration-200 hover:bg-[var(--surface-1)] active:scale-[0.97]" style={{ color: "var(--t2)", border: "1px solid var(--border)" }}>📂导入Excel<input type="file" accept=".xlsx,.xls" className="hidden" onChange={async e => { const f = e.target.files?.[0]; if (!f) return; try { const XLSX = await import("xlsx"); const T = await import("@/lib/templates"); const d = new Uint8Array(await f.arrayBuffer()); const wb = XLSX.read(d, { type: "array" }); const raw = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 }) as any[][]; const rows = raw.filter((r: any[]) => r.some((c: any) => c !== "")); const find = T.colFinder(rows[0]); const A = T.MON_ALIASES; const cell = (r: any[], al: string[]) => { const i = find(al); return i >= 0 ? r[i] : undefined }; const recs = rows.slice(1).map((r: any) => { const rawSt = String(cell(r, A.status) || "").trim(); const status = T.STATUS_ZH2EN[rawSt] || (["normal","abnormal","stopped","abandoned"].includes(rawSt) ? rawSt : "normal"); return { wellId: String(cell(r, A.wellId) || "").trim(), collectDate: cell(r, A.collectDate) || null, staticWater: T.num(cell(r, A.staticWater)), dynamicWater: T.num(cell(r, A.dynamicWater)), wellDepth: T.num(cell(r, A.wellDepth)), flowRate: T.num(cell(r, A.flowRate)), pumpDepth: T.num(cell(r, A.pumpDepth)), pumpFlow: T.num(cell(r, A.pumpFlow)), motorPower: T.num(cell(r, A.motorPower)), manufacturer: cell(r, A.manufacturer) || null, status } }).filter((x: any) => x.wellId); const result = await importMonitorings(recs); if (result.success) { addToast("导入" + result.count + "条", "success"); fetch() } else { addToast("导入失败:" + result.error, "error") } } catch (err: any) { addToast("导入异常:" + (err?.message || ""), "error") } e.target.value = "" }} /></label>
        <button type="button" onClick={() => { import("@/lib/templates").then(m => m.downloadTemplate(m.MON_TPL, "监测数据导入模板", m.MON_SAMPLE)) }} className="h-9 px-3 rounded-full text-[12px] font-medium border transition-colors hover:bg-[var(--surface-1)]" style={{ color: "var(--t2)", borderColor: "var(--glass-border)" }}>📋 下载模板</button>
        <div className="flex-1" />
        <Button variant="ghost" size="sm" type="button" onClick={cf}>清除</Button>
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--t3)", borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>基本信息</div>
          <div className="relative">
            <Input label="井号" value={mw} onChange={e => hs(e.target.value)} placeholder="C05001" w="100%" autoComplete="off" />
            {is.length > 0 && <div className="absolute z-50 top-full left-0 right-0 mt-1 pop" style={{ background: "var(--surface-3)", border: "1px solid var(--glass-border-strong)", borderRadius: "var(--r-md)", boxShadow: "var(--s-lg)", backdropFilter: "blur(20px)" }}>{is.map(id => <div key={id} className="px-3 py-2 text-[12px] hover:bg-[var(--surface-1)] cursor-pointer" style={{ fontFamily: "var(--font-mono)" }} onClick={() => { setMw(id); setIs([]) }}>{id}</div>)}</div>}
          </div>
          <div className="flex gap-3">
            <Select label="井采线" value={ml} onChange={e => { setMl(e.target.value); setMw("") }} options={LINE_OPTS_E} w="100%" />
            <DateField label="日期" value={md} onChange={v => setMd(v)} w="100%" />
          </div>
          <div className="flex gap-3">
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--t3)", display: "block", marginBottom: 4 }}>状态</label>
              <select value={st} onChange={e => setSt(e.target.value)} style={{ height: 40, padding: "0 12px", borderRadius: "var(--r-sm)", fontSize: 10.5, border: "1px solid var(--glass-border)", background: "var(--surface-1)", color: "var(--t1)", outline: "none", width: "100%" }}>
                {STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <Input label="厂家" value={mf} onChange={e => setMf(e.target.value)} w="100%" />
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--t3)", borderBottom: "1px solid var(--border)", paddingBottom: 8, marginBottom: 12 }}>水位数据</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Input label="静水位 m" value={sw} onChange={e => setSw(e.target.value)} onBlur={() => an(sw, setSw)} placeholder="-15.00" />
              <Input label="动水位 m" value={dw} onChange={e => setDw(e.target.value)} onBlur={() => an(dw, setDw)} placeholder="-20.00" />
              <Input label="井深 m" value={wd} onChange={e => setWd(e.target.value)} placeholder="30" />
              <Input label="流量 m3/h" value={fr} onChange={e => setFr(e.target.value)} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--t3)", borderBottom: "1px solid var(--border)", paddingBottom: 8, marginBottom: 12 }}>泵参数</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <Input label="泵深 m" value={pd} onChange={e => setPd(e.target.value)} onBlur={() => an(pd, setPd)} placeholder="-50" />
              <Input label="泵量 m3/h" value={pf} onChange={e => setPf(e.target.value)} />
              <Input label="电机 kW" value={mp} onChange={e => setMp(e.target.value)} />
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, paddingTop: 12, borderTop: "1px solid var(--border)", gridColumn: "1/-1", marginTop: 4 }}>
          <Button variant="primary" size="sm" type="submit">提交</Button>
          <label className="flex items-center gap-1.5 text-[12px] cursor-pointer select-none" style={{ color: "var(--t2)" }}>
            <input type="checkbox" checked={contEntry} onChange={e => setContEntry(e.target.checked)} className="w-3.5 h-3.5" />连续录入
          </label>
          <span style={{ flex: 1 }} />
          <span style={{ fontSize: 10, color: "var(--t4)" }}>Ctrl+Enter 提交 · Esc 取消</span>
        </div>
      </div>{st === "abnormal" && <div className="mt-3"><Input label="异常说明" value={fn} onChange={e => setFn(e.target.value)} placeholder="描述异常原因..." w={320} /></div>}
    </form></div>
}
    {delOpen && <ConfirmModal title="确认删除" message={"确定删除" + sel.size + "条监测记录？"} onConfirm={doDel} onCancel={() => setDelOpen(false)} />}
  </div>
}
