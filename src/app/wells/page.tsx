"use client"
import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import { WELL_LINES, REGIONS } from "@/lib/well-data"
import { getWells, createWell, updateWell, deleteWells, importWells } from "@/app/actions"
import { fmt, fmtDate, P } from "@/lib/precision"
import { addToast } from "@/components/ui/Toast"
import { exportXLSX } from "@/lib/export"
import { wellCreateSchema } from "@/shared/validation"

import Button from "@/components/ui/Button"
import DataStats from "@/components/ui/DataStats"
import Input from "@/components/ui/Input"
import Select from "@/components/ui/Select"
import Pagination from "@/components/ui/Pagination"

import ConfirmModal from "@/components/ui/ConfirmModal"
import DateField from "@/components/ui/DateField"
import { Download } from "lucide-react"

const RNAMES: Record<string, string> = { N: "北部", C: "中部", W: "西部", E: "东部", S: "南部" }
const REGION_DOTS: Record<string, string> = { N: "#4a9eff", C: "#60a5fa", W: "#fbbf24", E: "#60a5fa", S: "#a78bfa" }
const REG_OPTS = [{ value: "", label: "全部片区" }, ...REGIONS.map(r => ({ value: r.key, label: r.name }))]
const LINE_OPTS = [{ value: "", label: "全部井采线" }, ...WELL_LINES.map(l => ({ value: l.shortName, label: l.name }))]
const LINE_OPTS_E = [{ value: "", label: "选择" }, ...WELL_LINES.map(l => ({ value: l.shortName, label: l.name }))]
const TECHS = [{ value: "裸孔", label: "裸孔" }, { value: "全管", label: "全管" }, { value: "双管", label: "双管" }]
const SIZES = [{ value: "1200", label: "1200mm" }, { value: "800", label: "800mm" }]
const PS = 15

function hi(t: string, q: string) { if (!q || !t) return t || "-"; const s = String(t); const i = s.toLowerCase().indexOf(q.toLowerCase()); if (i < 0) return s; return <>{s.slice(0, i)}<span className="hl">{s.slice(i, i + q.length)}</span>{s.slice(i + q.length)}</> }

export default function WellsPage() {
  const [tab, setTab] = useState<"browse" | "entry">("browse")
  const [search, setSearch] = useState(""); const [region, setRegion] = useState(""); const [line, setLine] = useState("")
  const [page, setPage] = useState(1); const [sel, setSel] = useState(new Set<string>()); const [delOpen, setDelOpen] = useState(false)
  const [edId, setEdId] = useState<string | null>(null); const [ev, setEv] = useState<any>({})
  const [data, setData] = useState<any[]>([]); const [total, setTotal] = useState(0); const [loading, setLoading] = useState(false)
  const [flashId, setFlashId] = useState(""); const [sortKey, setSortKey] = useState(""); const [sortDir, setSortDir] = useState(1)
  const [contEntry, setContEntry] = useState(false)
  const wRef = useRef<HTMLInputElement>(null)

  const [ew, setEw] = useState(""); const [el, setEl] = useState(""); const [ed, setEd] = useState(""); const [et, setEt] = useState("裸孔")
  const [es, setEs] = useState("1200"); const [ewl, setEwl] = useState(""); const [edp, setEdp] = useState("")
  const [ex, setEx] = useState(""); const [ey, setEy] = useState(""); const [etn, setEtn] = useState(""); const [esg, setEsg] = useState<string[]>([])

  const allIds = useMemo(() => { const ids: string[] = []; for (const l of WELL_LINES) { const ln = l as any; if (ln.numbers) for (const n of ln.numbers) ids.push(ln.prefix + String(n).padStart(3, "0")) } return ids }, [])
  const sw = (v: string) => { const cn = WELL_LINES.filter(l => l.name.includes(v) || l.shortName.toLowerCase().includes(v.toLowerCase())); const r: string[] = []; for (const l of cn) { const ln = l as any; if (ln.numbers) for (const n of ln.numbers) r.push(ln.prefix + String(n).padStart(3, "0")) } return r }

  const fetchRef = useRef<() => void>(() => {})
  fetchRef.current = () => { setLoading(true); getWells({ region: region || undefined, lineId: line ? WELL_LINES.find(l => l.shortName === line)?.id : undefined, search: search || undefined, page, pageSize: PS }).then((r: any) => { setData(r.data); setTotal(r.total) }).finally(() => setLoading(false)) }
  const fetch = useCallback(() => fetchRef.current(), [])
  useEffect(() => { document.title = "清欢 · 基础信息"; fetch() }, [region, line, page])
  useEffect(() => { const t = setTimeout(fetch, 300); return () => clearTimeout(t) }, [search])

  const tp = Math.max(1, Math.ceil(total / PS))
  const ta = () => setSel(sel.size === data.length && data.length > 0 ? new Set() : new Set(data.map((w: any) => w.wellId)))
  const to = (id: string) => { const n = new Set(sel); n.has(id) ? n.delete(id) : n.add(id); setSel(n) }
  const doDel = async () => { try { await deleteWells(Array.from(sel)); addToast("已删除" + sel.size + "条", "success"); setSel(new Set()); setDelOpen(false); setPage(1); fetch() } catch (e: any) { addToast("删除失败:" + e.message, "error") } }
  const doExp = async () => { try { const all = await getWells({ region: region || undefined, lineId: line ? WELL_LINES.find(l => l.shortName === line)?.id : undefined, search: search || undefined, pageSize: 99999 }); const rows = (all as any).data || []; if (!rows.length) { addToast("无数据可导出", "warning"); return }; exportXLSX("基础信息", ["井号", "井采线", "片区", "成井时间", "工艺", "备注", "尺寸", "初始水位", "井深", "坐标X", "坐标Y"], rows.map((r: any) => [r.wellId, r.lineName || "--", RNAMES[r.region] || "--", fmtDate(r.completionDate), r.technology || "--", r.techNote || "--", r.wellSize || "--", fmt(r.initialWaterLevel, P.WATER), fmt(r.designDepth, P.WELL_DEPTH), fmt(r.coordX, P.COORD), fmt(r.coordY, P.COORD)])); addToast("已导出 " + rows.length + " 条", "success") } catch (e: any) { addToast("导出失败: " + e.message, "error") } }
  const se = (w: any) => { setEdId(w.wellId); setEv({ completionDate: w.completionDate || "", technology: w.technology || "裸孔", techNote: w.techNote || "", wellSize: w.wellSize || "1200", initialWaterLevel: w.initialWaterLevel != null ? Number(w.initialWaterLevel).toFixed(2) : "", designDepth: w.designDepth != null ? Number(w.designDepth).toFixed(2) : "", coordX: w.coordX != null ? Number(w.coordX).toFixed(2) : "", coordY: w.coordY != null ? Number(w.coordY).toFixed(2) : "" }) }
  const evRef = useRef(ev); evRef.current = ev; const idRef = useRef(edId); idRef.current = edId
  const ce = useCallback(() => { setEdId(null); setEv({}) }, [])
  const doSave = useCallback(async () => { const id = idRef.current; if (!id) return; try { const v = evRef.current; await updateWell(id, { completionDate: v.completionDate || undefined, technology: v.technology, techNote: v.techNote || undefined, wellSize: v.wellSize, initialWaterLevel: v.initialWaterLevel ? parseFloat(v.initialWaterLevel) : undefined, designDepth: v.designDepth ? parseFloat(v.designDepth) : undefined, coordX: v.coordX ? parseFloat(v.coordX) : undefined, coordY: v.coordY ? parseFloat(v.coordY) : undefined }); setFlashId(id); setTimeout(() => setFlashId(""), 600); addToast("已更新", "success"); setEdId(null); setEv({}); fetch() } catch (e: any) { addToast("更新失败:" + e.message, "error") } }, [fetch])
  useEffect(() => { if (!edId) return; const h = (e: KeyboardEvent) => { if (e.key === "Escape") ce(); if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); doSave() } }; window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h) }, [edId, ce, doSave])
  const hs = (v: string) => { setEw(v.toUpperCase()); const pool = allIds; const cn = sw(v); const all = [...new Set([...pool.filter(id => id.toUpperCase().includes(v.toUpperCase())), ...cn])]; setEsg(v.length >= 1 ? all.slice(0, 8) : []) }
  const cf = () => { setEw(""); setEl(""); setEd(""); setEt("裸孔"); setEs("1200"); setEwl(""); setEdp(""); setEx(""); setEy(""); setEtn(""); setEsg([]) }
  const sub = async (e: React.FormEvent) => { e.preventDefault(); if (!ew) { addToast("请填写井号", "warning"); return } const vResult = wellCreateSchema.safeParse({ wellId: ew, lineId: WELL_LINES.find(l => l.shortName === el)?.id || 0, completionDate: ed || undefined, technology: et, techNote: etn || undefined, wellSize: es, initialWaterLevel: ewl ? parseFloat(ewl) : undefined, designDepth: edp ? parseFloat(edp) : undefined, coordX: ex ? parseFloat(ex) : undefined, coordY: ey ? parseFloat(ey) : undefined }); if (!vResult.success) { addToast(vResult.error.issues[0].message, "warning"); return } try { await createWell(vResult.data); addToast("录入成功", "success"); if (contEntry) { cf(); setTimeout(() => wRef.current?.focus(), 100) } else { cf() } fetch() } catch (e: any) { addToast("录入失败:" + e.message, "error") } }
  useEffect(() => { const h = (e: KeyboardEvent) => { if (e.ctrlKey && e.key === "Enter" && tab === "entry") { e.preventDefault(); sub(e as any) } }; window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h) }, [tab, contEntry, ew, el, ed, et, es, ewl, edp, ex, ey, etn])
  const sortData = (d: any[]) => { if (!sortKey) return d; return [...d].sort((a, b) => { const va = a[sortKey] ?? ""; const vb = b[sortKey] ?? ""; return (va > vb ? 1 : -1) * sortDir }) }
  const toggleSort = (k: string) => { if (sortKey === k) setSortDir(-sortDir); else { setSortKey(k); setSortDir(1) } }
  const sorted = sortData(data)
  const TI = "w-full bg-transparent text-[10.5px] tabular-nums py-0 h-4 focus:outline-none"
  const TS = "w-full bg-transparent text-[10.5px] py-0 h-4 appearance-none cursor-pointer focus:outline-none"

  return <div className="page-container">
    {/* Header */}
    <div className="mb-5 rise flex items-center justify-between">
      <div>
        <h1 className="text-[22px] font-bold tracking-tight" style={{ color: "var(--t1)" }}>基础信息</h1>
        <p className="text-[12px] mt-1" style={{ color: "var(--t2)" }}>{total}条记录 · {WELL_LINES.length}条井采线</p>
      </div>
      <div className="flex gap-2">
        <Button variant={tab === "browse" ? "primary" : "secondary"} size="sm" onClick={() => setTab("browse")}>浏览</Button>
        <Button variant={tab === "entry" ? "primary" : "secondary"} size="sm" onClick={() => setTab("entry")}>录入</Button>
      </div>
    </div>

    {tab === "browse" && <>
      {/* Filter bar */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <Select value={region} onChange={e => { setRegion(e.target.value); setPage(1) }} options={REG_OPTS} w={120} />
        <Select value={line} onChange={e => { setLine(e.target.value); setPage(1) }} options={LINE_OPTS} w={150} />
        <Input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder="搜索井号或名称.." w={180} />
        {REGIONS.map(r => (
          <button key={r.key} onClick={() => { setRegion(region === r.key ? "" : r.key); setPage(1) }}
            className={`filter-chip ${region === r.key ? "active" : ""}`} style={{ fontSize: 11 }}>
            {r.name}
          </button>
        ))}
        <div className="flex-1" />
        <Button variant="secondary" size="sm" onClick={doExp} disabled={!data.length}><Download size={12} className="mr-1" />导出</Button>
        <Button variant="danger" size="sm" onClick={() => { if (sel.size === 0) { addToast("请先选择", "warning"); return } setDelOpen(true) }} disabled={sel.size === 0}>删除{sel.size > 0 ? `(${sel.size})` : ""}</Button>
      </div>

      {/* Data display */}
      <div className="overflow-hidden">
        {loading && data.length === 0 ? (
          <div className="py-16 flex justify-center"><div className="w-6 h-6 border-[3px] border-[var(--accent)] border-t-transparent rounded-full animate-spin" /></div>
        ) : data.length === 0 ? (
          <div className="py-16 text-center"><p className="text-[13px]" style={{ color: "var(--t2)" }}>暂无数据</p><Button variant="primary" size="sm" onClick={() => setTab("entry")} className="mt-3">立即录入</Button></div>
        ) : (
          /* Table View */
          <div className="overflow-x-auto">
            {loading && <div className="sticky top-0 left-0 right-0 h-[2px] z-10" style={{ background: "linear-gradient(90deg,transparent,var(--accent),transparent)", backgroundSize: "200% 100%", animation: "shimmer 1s ease-in-out infinite" }} />}
            <table className="data-table">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  <th className="w-8 py-1"><input type="checkbox" checked={data.length > 0 && sel.size === data.length} onChange={ta} /></th>
                  <th className="w-10 py-1 font-semibold text-center" style={{ color: "var(--t3)" }}>#</th>
                  <th className="w-24 py-1 font-semibold text-center" style={{ color: "var(--t3)" }}>井号</th>
                  <th className="w-22 py-1 font-semibold text-center" style={{ color: "var(--t3)" }}>井采线</th>
                  <th className="w-20 py-1 font-semibold text-center" style={{ color: "var(--t3)" }}>片区</th>
                  <th className="w-24 py-1 font-semibold text-center" style={{ color: "var(--t3)" }}>成井时间</th>
                  <th className="w-18 py-1 font-semibold text-center" style={{ color: "var(--t3)" }}>工艺</th>
                  <th className="w-16 py-1 font-semibold text-center" style={{ color: "var(--t3)" }}>备注</th>
                  <th className="w-16 py-1 font-semibold text-center" style={{ color: "var(--t3)" }}>尺寸</th>
                  <th className="w-20 py-1 font-semibold text-center cursor-pointer hover:text-[var(--accent)]" style={{ color: "var(--t3)" }} onClick={() => toggleSort("initialWaterLevel")}>初始水位{sortKey === "initialWaterLevel" ? (sortDir > 0 ? "—" : "—") : ""}</th>
                  <th className="w-18 py-1 font-semibold text-center cursor-pointer hover:text-[var(--accent)]" style={{ color: "var(--t3)" }} onClick={() => toggleSort("designDepth")}>井深{sortKey === "designDepth" ? (sortDir > 0 ? "—" : "—") : ""}</th>
                  <th className="w-20 py-1 font-semibold text-center" style={{ color: "var(--t3)" }}>坐标X</th>
                  <th className="w-20 py-1 font-semibold text-center" style={{ color: "var(--t3)" }}>坐标Y</th>
                  <th className="w-16 py-1 font-semibold text-center" style={{ color: "var(--t3)" }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((w: any, i: number) => {
                  const ed = edId === w.wellId
                  return <tr key={w.wellId} className="hover:bg-[var(--surface-1)]" style={{ borderBottom: "1px solid var(--border-light)", borderLeft: w.region ? "3px solid " + REGION_DOTS[w.region] : undefined, background: edId === w.wellId ? "var(--accent-soft)" : flashId === w.wellId ? "var(--green-soft)" : undefined }}>
                    <td className="text-center"><input type="checkbox" checked={sel.has(w.wellId)} onChange={() => to(w.wellId)} /></td>
                    <td className="text-center tabular-nums" style={{ color: "var(--t3)" }}>{(page - 1) * PS + i + 1}</td>
                    <td className="text-center font-semibold" style={{ fontFamily: "var(--font-mono)", color: "var(--t1)" }}><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", marginRight: 6, verticalAlign: "middle", background: REGION_DOTS[w.region] || "var(--t4)" }} />{hi(w.wellId, search)}</td>
                    <td className="text-center" style={{ color: "var(--t1)" }}>{w.lineName || "—"}</td>
                    <td className="text-center" style={{ color: "var(--t2)" }}>{RNAMES[w.region] || "—"}</td>
                    <td className="text-center" style={{ color: "var(--t1)" }}>{fmtDate(w.completionDate)}</td>
                    <td className="text-center">{ed ? <select className={TS} value={ev.technology} onChange={e => setEv({ ...ev, technology: e.target.value })}>{TECHS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select> : <span style={{ color: "var(--t1)" }}>{w.technology || "—"}</span>}</td>
                    <td className="text-center">{ed ? <input className={TI} value={ev.techNote} onChange={e => setEv({ ...ev, techNote: e.target.value })} /> : <span style={{ color: "var(--t1)" }}>{w.techNote || "—"}</span>}</td>
                    <td className="text-center">{ed ? <select className={TS} value={ev.wellSize} onChange={e => setEv({ ...ev, wellSize: e.target.value })}>{SIZES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select> : <span style={{ color: "var(--t1)" }}>{w.wellSize || "—"}</span>}</td>
                    <td className="text-center tabular-nums">{ed ? <input className={TI} value={ev.initialWaterLevel} onChange={e => setEv({ ...ev, initialWaterLevel: e.target.value })} onBlur={() => { const n = parseFloat(ev.initialWaterLevel); if (!isNaN(n) && n > 0) setEv({ ...ev, initialWaterLevel: String(Math.round(-n * 100) / 100) }) }} /> : <span style={{ color: "var(--t1)" }}>{fmt(w.initialWaterLevel, P.WATER)}</span>}</td>
                    <td className="text-center tabular-nums">{ed ? <input className={TI} value={ev.designDepth} onChange={e => setEv({ ...ev, designDepth: e.target.value })} /> : <span style={{ color: "var(--t1)" }}>{fmt(w.designDepth, P.WELL_DEPTH)}</span>}</td>
                    <td className="text-center tabular-nums">{ed ? <input className={TI} value={ev.coordX} onChange={e => setEv({ ...ev, coordX: e.target.value })} /> : <span style={{ color: "var(--t1)" }}>{fmt(w.coordX, P.COORD)}</span>}</td>
                    <td className="text-center tabular-nums">{ed ? <input className={TI} value={ev.coordY} onChange={e => setEv({ ...ev, coordY: e.target.value })} /> : <span style={{ color: "var(--t1)" }}>{fmt(w.coordY, P.COORD)}</span>}</td>
                    <td className="text-center">{ed ? <div className="flex gap-1.5 justify-center"><button onClick={doSave} className="text-[12px] font-semibold hover:opacity-70" style={{ color: "var(--accent)" }}>保存</button><button onClick={ce} className="text-[12px] hover:opacity-70" style={{ color: "var(--t3)" }}>取消</button></div> : <button onClick={() => se(w)} className="text-[12px] font-semibold hover:text-[var(--accent)] transition-colors" style={{ color: "var(--t3)" }}>编辑</button>}</td>
                  </tr>
                })}
              </tbody>
            </table>
          </div>
        )}
        <DataStats data={data} cols={[{ key: "initialWaterLevel", label: "水位", decimals: 2 }, { key: "designDepth", label: "井深", decimals: 2 }]} />
        {tp > 1 && <Pagination page={page} totalPages={tp} total={total} pageSize={PS} onChange={setPage} />}
      </div>
    </>}

    {tab === "entry" && <div className="card p-7 rise"><form onSubmit={sub}>
      <div className="flex items-center gap-2 mb-5">
        <label className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full text-[13px] font-semibold cursor-pointer transition-all duration-200 hover:bg-[var(--surface-1)] active:scale-[0.97]" style={{ color: "var(--t2)", border: "1px solid var(--glass-border)" }}>📥导入Excel<input type="file" accept=".xlsx,.xls" className="hidden" onChange={async e => { const f = e.target.files?.[0]; if (!f) return; try { const XLSX = await import("xlsx"); const T = await import("@/lib/templates"); const d = new Uint8Array(await f.arrayBuffer()); const wb = XLSX.read(d, { type: "array" }); const raw = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 }) as any[][]; const rows = raw.filter((r: any[]) => r.some((c: any) => c !== "")); const find = T.colFinder(rows[0]); const A = T.WELL_ALIASES; const cell = (r: any[], al: string[]) => { const i = find(al); return i >= 0 ? r[i] : undefined }; const recs = rows.slice(1).map((r: any) => ({ wellId: String(cell(r, A.wellId) || "").trim(), shortName: cell(r, A.shortName) || "", completionDate: cell(r, A.completionDate) || null, technology: cell(r, A.technology) || "裸孔", techNote: cell(r, A.techNote) || null, wellSize: cell(r, A.wellSize) || "1200", initialWaterLevel: T.num(cell(r, A.initialWaterLevel)), designDepth: T.num(cell(r, A.designDepth)), coordX: T.num(cell(r, A.coordX)), coordY: T.num(cell(r, A.coordY)) })).filter((x: any) => x.wellId); const result = await importWells(recs); if (result.success) { addToast("导入" + result.count + "—", "success"); fetch() } else { addToast("导入失败:" + result.error, "error") } } catch (err: any) { addToast("导入异常:" + (err?.message || ""), "error") } e.target.value = "" }} /></label>
        <button type="button" onClick={() => { import("@/lib/templates").then(m => m.downloadTemplate(m.WELL_TPL, "基础信息导入模板", m.WELL_SAMPLE)) }} className="h-9 px-3 rounded-full text-[12px] font-medium border transition-colors hover:bg-[var(--surface-1)]" style={{ color: "var(--t2)", borderColor: "var(--glass-border)" }}>📋 下载模板</button>

        <div className="flex-1" />
        <Button variant="ghost" size="sm" type="button" onClick={cf}>清除</Button>
      </div>
      <div className="flex items-end gap-3 flex-wrap">
        <div className="relative"><Input ref={wRef} label="井号" value={ew} onChange={e => hs(e.target.value)} placeholder="C05001" w={150} autoComplete="off" />{esg.length > 0 && <div className="absolute z-50 top-full left-0 right-0 mt-2 pop" style={{ background: "var(--surface-3)", border: "1px solid var(--glass-border-strong)", borderRadius: "var(--r-md)", boxShadow: "var(--s-lg)", backdropFilter: "blur(20px)" }}>{esg.map(id => <div key={id} className="px-3 py-2 text-[12px] hover:bg-[var(--surface-1)] cursor-pointer" style={{ fontFamily: "var(--font-mono)" }} onClick={() => { setEw(id); setEsg([]) }}>{id}</div>)}</div>}</div>
        <Select label="井采线" value={el} onChange={e => { setEl(e.target.value); setEw("") }} options={LINE_OPTS_E} w={150} />
        <DateField label="成井时间" value={ed} onChange={v => setEd(v)} w={150} />
        <Select label="工艺" value={et} onChange={e => setEt(e.target.value)} options={TECHS} w={100} />
        <Input label="备注" value={etn} onChange={e => setEtn(e.target.value)} w={100} />
        <Select label="尺寸" value={es} onChange={e => setEs(e.target.value)} options={SIZES} w={110} />
        <Input label="初始水位 m" value={ewl} onChange={e => setEwl(e.target.value)} onBlur={() => { const n = parseFloat(ewl); if (!isNaN(n) && n > 0) setEwl(String(Math.round(-n * 100) / 100)) }} placeholder="-15.00" w={120} />
        <Input label="设计井深 m" value={edp} onChange={e => setEdp(e.target.value)} placeholder="30.00" w={120} />
        <Input label="坐标X" value={ex} onChange={e => setEx(e.target.value)} w={120} />
        <Input label="坐标Y" value={ey} onChange={e => setEy(e.target.value)} w={120} />
        <label className="flex items-center gap-1.5 text-[12px] cursor-pointer select-none self-end mb-2" style={{ color: "var(--t2)" }}><input type="checkbox" checked={contEntry} onChange={e => setContEntry(e.target.checked)} className="w-3.5 h-3.5" />连续录入</label>
        <Button variant="primary" size="sm" type="submit">提交</Button>
      </div>
    </form></div>}

    {delOpen && <ConfirmModal title="确认删除" message={`确定删除${sel.size}条基础信息？不可撤销。`} onConfirm={doDel} onCancel={() => setDelOpen(false)} />}
  </div>
}




