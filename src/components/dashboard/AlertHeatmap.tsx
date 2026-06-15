'use client'
import { useMemo } from 'react'

interface AlertData {
  wellId: string
  lineName: string
  dropPct: number | null
  dropAbs: number | null
  prevValue: number | null
  latestValue: number | null
}

interface Props {
  data: AlertData[]
  type: 'k' | 'li'
}

const SEVERITY = [
  { max: 100, color: '#dc2626', label: '严重', bg: 'rgba(220,38,38,0.15)' },
  { max: 50, color: '#f97316', label: '中度', bg: 'rgba(249,115,22,0.15)' },
  { max: 20, color: '#eab308', label: '轻度', bg: 'rgba(234,179,8,0.15)' },
  { max: 0, color: '#22c55e', label: '正常', bg: 'rgba(34,197,94,0.15)' },
]

function getSeverity(pct: number | null) {
  if (pct == null) return SEVERITY[3]
  for (const s of SEVERITY) if (pct >= s.max) return s
  return SEVERITY[3]
}

export function AlertHeatmap({ data, type }: Props) {
  const byLine = useMemo(() => {
    const groups: Record<string, AlertData[]> = {}
    for (const d of data) {
      const line = d.lineName || '未知'
      if (!groups[line]) groups[line] = []
      groups[line].push(d)
    }
    return groups
  }, [data])

  const lines = Object.keys(byLine).sort()

  if (data.length === 0) return null

  return (
    <div className="mt-4">
      <h4 className="text-[13px] font-semibold mb-3" style={{ color: 'var(--t1)' }}>
        {type === 'k' ? 'K⁺' : 'Li⁺'} 异常分布 · 按井采线
      </h4>
      <div className="space-y-2">
        {lines.map(line => (
          <div key={line} className="flex items-center gap-2">
            <span className="text-[11px] w-16 text-right shrink-0" style={{ color: 'var(--t3)' }}>{line}</span>
            <div className="flex flex-wrap gap-1 flex-1">
              {byLine[line].map(d => {
                const sev = getSeverity(d.dropPct)
                return (
                  <div key={d.wellId} title={`${d.wellId}: ${d.dropPct?.toFixed(1) ?? '?'}%`}
                    className="px-1.5 py-0.5 rounded text-[10px] font-mono cursor-default transition-transform hover:scale-110"
                    style={{ background: sev.bg, color: sev.color, border: '1px solid ' + sev.color + '30' }}>
                    {d.wellId.slice(-2)}
                  </div>
                )
              })}
            </div>
            <span className="text-[10px] shrink-0" style={{ color: 'var(--t4)' }}>{byLine[line].length}口</span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4 mt-3 pt-3" style={{ borderTop: '1px solid var(--border-light)' }}>
        {SEVERITY.slice(0, 3).map(s => (
          <div key={s.label} className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ background: s.color }} />
            <span className="text-[10px]" style={{ color: 'var(--t3)' }}>{s.label} &gt;{s.max}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
