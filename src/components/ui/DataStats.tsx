'use client'

interface C { key: string; label: string; decimals: number }
interface P {
  data: any[]
  cols: C[]
  /** 服务端聚合统计（筛选后全量） */
  stats?: Record<string, number | null> | null
  /** 服务端返回的筛选后总行数 */
  total?: number
}

export default function DataStats({ data, cols, stats, total }: P) {
  if (!data || data.length === 0) return null
  const displayTotal = total ?? data.length

  return (
    <div className="flex flex-wrap gap-x-6 gap-y-1 px-5 py-3 border-t"
      style={{ borderColor: 'var(--border-light)', background: 'var(--surface-1)' }}>
      <span className="text-[11px] font-semibold mr-2" style={{ color: 'var(--t3)' }}>
        统计 ({displayTotal} 条)
      </span>
      {cols.map(c => {
        // 优先使用服务端聚合数据（按 key 匹配）
        const sAvg = stats?.[c.key + 'Avg']
        const sMin = stats?.[c.key + 'Min']
        const sMax = stats?.[c.key + 'Max']
        if (sAvg != null || sMin != null || sMax != null) {
          return (
            <span key={c.key} className="text-[11px] tabular-nums"
              style={{ color: 'var(--t2)', fontFamily: 'var(--font-mono)' }}>
              <b style={{ color: 'var(--t1)' }}>{c.label}</b>
              {sAvg != null && <>{' '}avg <b>{Number(sAvg).toFixed(c.decimals)}</b></>}
              {sMin != null && <>{' '}min <b style={{ color: 'var(--green)' }}>{Number(sMin).toFixed(c.decimals)}</b></>}
              {sMax != null && <>{' '}max <b style={{ color: 'var(--accent)' }}>{Number(sMax).toFixed(c.decimals)}</b></>}
            </span>
          )
        }
        // 降级：客户端当前页计算
        const vals = data.map(d => d[c.key]).filter(v => v != null && v !== '') as number[]
        if (vals.length === 0) return null
        const sum = vals.reduce((a, b) => a + Number(b), 0)
        const avg = sum / vals.length
        const sorted = [...vals].sort((a, b) => a - b)
        return (
          <span key={c.key} className="text-[11px] tabular-nums"
            style={{ color: 'var(--t2)', fontFamily: 'var(--font-mono)' }}>
            <b style={{ color: 'var(--t1)' }}>{c.label}</b>
            {' '}avg <b>{avg.toFixed(c.decimals)}</b>
            {' '}min <b style={{ color: 'var(--green)' }}>{Number(sorted[0]).toFixed(c.decimals)}</b>
            {' '}max <b style={{ color: 'var(--accent)' }}>{Number(sorted[sorted.length - 1]).toFixed(c.decimals)}</b>
          </span>
        )
      })}
    </div>
  )
}
