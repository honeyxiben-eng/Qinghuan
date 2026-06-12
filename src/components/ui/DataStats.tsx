'use client'

interface C { key: string; label: string; decimals: number }
interface P { data: any[]; cols: C[] }

export default function DataStats({ data, cols }: P) {
  if (!data || data.length === 0) return null

  return (
    <div className="flex flex-wrap gap-x-6 gap-y-1 px-5 py-3 border-t"
      style={{ borderColor: 'var(--border-light)', background: 'var(--surface-1)' }}>
      <span className="text-[11px] font-semibold mr-2" style={{ color: 'var(--t3)' }}>
        统计 ({data.length} 行)
      </span>
      {cols.map(c => {
        const vals = data.map(d => d[c.key]).filter(v => v != null && v !== '') as number[]
        if (vals.length === 0) return null
        const sum = vals.reduce((a, b) => a + Number(b), 0)
        const avg = sum / vals.length
        const sorted = [...vals].sort((a, b) => a - b)
        const min = sorted[0]
        const max = sorted[sorted.length - 1]
        return (
          <span key={c.key} className="text-[11px] tabular-nums"
            style={{ color: 'var(--t2)', fontFamily: 'var(--font-mono)' }}>
            <b style={{ color: 'var(--t1)' }}>{c.label}</b>
            {' '}avg <b>{avg.toFixed(c.decimals)}</b>
            {' '}min <b style={{ color: 'var(--green)' }}>{Number(min).toFixed(c.decimals)}</b>
            {' '}max <b style={{ color: 'var(--accent)' }}>{Number(max).toFixed(c.decimals)}</b>
          </span>
        )
      })}
    </div>
  )
}
