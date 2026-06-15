"use client"
import { useState, useEffect } from "react"
import { getAuditLogs } from "@/app/actions"
import { exportXLSX, exportCSV } from "@/lib/export"
import { addToast } from "@/components/ui/Toast"
import Pagination from "@/components/ui/Pagination"
import Select from "@/components/ui/Select"
import Button from "@/components/ui/Button"
import { Download, ShieldCheck } from "lucide-react"

const PS = 20
const ETYPES = [
  { value: "", label: "全部类型" },
  { value: "well", label: "基础信息" },
  { value: "lab", label: "化验数据" },
  { value: "monitoring", label: "监测数据" },
]
const A_LABELS: Record<string, string> = { create: "创建", update: "修改", delete: "删除" }
const E_LABELS: Record<string, string> = { well: "基础信息", lab: "化验数据", monitoring: "监测数据" }

export default function AuditPage() {
  const [data, setData] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [entityType, setEntityType] = useState("")

  useEffect(() => { document.title = "清欢 · 审计日志" }, [])
  useEffect(() => {
    setLoading(true)
    getAuditLogs({ entityType: entityType || undefined, page, pageSize: PS })
      .then((r: any) => { setData(r.data); setTotal(r.total) })
      .finally(() => setLoading(false))
  }, [page, entityType])

  const tp = Math.max(1, Math.ceil(total / PS))

  const doExp = () => {
    getAuditLogs({ entityType: entityType || undefined, pageSize: 99999 }).then((r: any) => {
      if (!r.data?.length) { addToast("无数据可导出", "warning"); return }
      const rows = r.data.map((x: any) => [x.id, x.userId || "—", A_LABELS[x.action] || x.action, E_LABELS[x.entityType] || x.entityType, x.entityId || "—", x.createdAt?.slice(0, 19) || "—", x.ipAddress || "—"])
      exportXLSX({ filename: "审计日志", headers: ["ID", "用户", "操作", "类型", "实体ID", "时间", "IP"], rows })
    })
  }

  const doExpCSV = () => {
    getAuditLogs({ entityType: entityType || undefined, pageSize: 99999 }).then((r: any) => {
      if (!r.data?.length) { addToast("无数据可导出", "warning"); return }
      const rows = r.data.map((x: any) => [x.id, x.userId || "—", A_LABELS[x.action] || x.action, E_LABELS[x.entityType] || x.entityType, x.entityId || "—", x.createdAt?.slice(0, 19) || "—", x.ipAddress || "—"])
      exportCSV("审计日志", ["ID", "用户", "操作", "类型", "实体ID", "时间", "IP"], rows)
    })
  }

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight" style={{ color: "var(--t1)" }}>审计日志</h1>
          <p className="text-[12px] mt-1" style={{ color: "var(--t2)" }}>{total} 条操作记录</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={entityType} onChange={e => { setEntityType(e.target.value); setPage(1) }} options={ETYPES} w={130} />
          <Button variant="secondary" size="sm" onClick={doExp}><Download size={12} className="mr-1" />Excel</Button>
          <Button variant="secondary" size="sm" onClick={doExpCSV}>CSV</Button>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {loading && data.length === 0 ? (
          <div className="py-16 flex justify-center"><div className="w-6 h-6 border-[3px] border-[var(--accent)] border-t-transparent rounded-full animate-spin" /></div>
        ) : data.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-[var(--r-lg)] flex items-center justify-center" style={{ background: "var(--surface-1)" }}><ShieldCheck size={24} style={{ color: "var(--t3)" }} /></div>
            <p className="text-[13px]" style={{ color: "var(--t3)" }}>暂无审计记录</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {loading && <div className="sticky top-0 left-0 right-0 h-[2px] z-10" style={{ background: "linear-gradient(90deg,transparent,var(--accent),transparent)", backgroundSize: "200% 100%", animation: "shimmer 1s ease-in-out infinite" }} />}
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th><th>用户</th><th>操作</th><th>类型</th><th>实体ID</th><th>时间</th><th>IP</th>
                </tr>
              </thead>
              <tbody>
                {data.map((r: any, i: number) => (
                  <tr key={r.id}>
                    <td className="tabular-nums" style={{ color: "var(--t3)" }}>{(page - 1) * PS + i + 1}</td>
                    <td className="font-semibold" style={{ color: "var(--t1)" }}>{r.userId || "—"}</td>
                    <td>
                      <span className="badge" style={{ background: r.action === "delete" ? "var(--red-soft)" : r.action === "create" ? "var(--green-soft)" : "var(--accent-soft)", color: r.action === "delete" ? "var(--red)" : r.action === "create" ? "var(--green)" : "var(--accent)" }}>
                        {A_LABELS[r.action] || r.action}
                      </span>
                    </td>
                    <td style={{ color: "var(--t2)" }}>{E_LABELS[r.entityType] || r.entityType}</td>
                    <td className="font-mono text-[11px]" style={{ color: "var(--accent)" }}>{r.entityId || "—"}</td>
                    <td className="tabular-nums text-[11px]" style={{ color: "var(--t2)" }}>{r.createdAt?.slice(0, 19) || "—"}</td>
                    <td className="text-[10px]" style={{ color: "var(--t4)" }}>{r.ipAddress || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {tp > 1 && <Pagination page={page} totalPages={tp} total={total} pageSize={PS} onChange={setPage} />}
      </div>
    </div>
  )
}
