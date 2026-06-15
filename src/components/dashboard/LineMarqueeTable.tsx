'use client'
import { useRef, useEffect, useState, memo } from 'react'

export interface LineRow {
  name: string
  total?: number
  active?: number
  stopped?: number
  abandoned?: number
  avgK?: number | null
  avgLi?: number | null
  avgWater?: number | null
}

export const LineMarqueeTable = memo(function LineMarqueeTable({ rows, height = 340 }: { rows: LineRow[]; height?: number }) {
  const outerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [paused, setPaused] = useState(false)
  const pausedRef = useRef(false)
  const offsetRef = useRef(0)
  const rafRef = useRef(0)

  useEffect(() => { pausedRef.current = paused }, [paused])

  const pct = (r: LineRow) => (r.total ? Math.round((r.active || 0) / r.total * 100) : 0)
  const kBar = (v: number | null | undefined) => v != null ? Math.min(100, (Number(v) / 15) * 100) : 0
  const liBar = (v: number | null | undefined) => v != null ? Math.min(100, (Number(v) / 0.5) * 100) : 0

  const rowH = 44
  const totalH = rows.length * rowH
  const speed = 28

  useEffect(() => {
    if (rows.length === 0 || !outerRef.current) return
    const content = contentRef.current
    if (!content) return

    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1) // cap dt to avoid huge jumps
      last = now
      if (!pausedRef.current) {
        offsetRef.current = (offsetRef.current + dt * speed) % totalH
        content.style.transform = `translate3d(0,${-offsetRef.current}px,0)`
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [rows.length, totalH])

  const renderRow = (r: LineRow, key: string | number) => {
    const p = pct(r)
    const k = r.avgK != null ? Number(r.avgK).toFixed(3) : null
    const li = r.avgLi != null ? Number(r.avgLi).toFixed(4) : null
    const w = r.avgWater != null ? Number(r.avgWater).toFixed(1) : null
    return (
      <div key={key} className="grid items-center px-5"
        style={{ gridTemplateColumns: '140px 110px 1fr 1fr 100px', height: rowH, borderBottom: '1px solid var(--border-light)', contain: 'layout style' }}>
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[13px] font-semibold truncate" style={{ color: 'var(--t1)' }}>{r.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="led" style={{ width: 6, height: 6, borderRadius: '50%', background: p >= 50 ? 'var(--green)' : p >= 20 ? 'var(--amber)' : 'var(--red)', boxShadow: `0 0 5px ${p >= 50 ? 'rgba(74,222,128,0.5)' : p >= 20 ? 'rgba(251,191,36,0.5)' : 'rgba(248,113,113,0.5)'}` }} />
          <span className="text-[14px] font-extrabold tabular-nums" style={{ color: 'var(--t1)', fontFamily: 'var(--font-mono)' }}>{p}%</span>
          <span className="text-[11px] font-medium tabular-nums" style={{ color: 'var(--t3)' }}>{r.active || 0}/{r.total || 0}</span>
        </div>
        <Bar label={k} bar={kBar(r.avgK)} color="#4a9eff" />
        <Bar label={li} bar={liBar(r.avgLi)} color="#34d399" />
        <span className="text-[12px] font-bold tabular-nums text-right" style={{ color: w ? 'var(--sky)' : 'var(--t4)' }}>{w ? w + ' m' : '--'}</span>
      </div>
    )
  }

  return (
    <div style={{ borderRadius: 'var(--r-lg)', border: '1px solid var(--glass-border)', overflow: 'hidden', background: 'var(--surface-1)', contain: 'layout style paint' }}>
      <div className="grid items-center px-5" style={{ gridTemplateColumns: '140px 110px 1fr 1fr 100px', height: 40, background: 'var(--surface-2)', borderBottom: '1px solid var(--glass-border)' }}>
        {['井采线', '在线率', 'K⁺ 含量', 'Li⁺ 含量', '动水位'].map((h, i) => (
          <span key={i} className="text-[11px] font-semibold" style={{ color: 'var(--t3)', textAlign: i === 0 ? 'left' : i >= 4 ? 'right' : 'left' }}>{h}</span>
        ))}
      </div>
      <div ref={outerRef} style={{ height, overflow: 'hidden' }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}>
        <div ref={contentRef} style={{ transform: 'translate3d(0,0,0)', willChange: 'transform', backfaceVisibility: 'hidden' }}>
          {rows.map((r, i) => renderRow(r, i))}
          {rows.map((r, i) => renderRow(r, 'd-' + i))}
        </div>
      </div>
    </div>
  )
})

function Bar({ label, bar, color }: { label: string | null; bar: number; color: string }) {
  return (
    <div className="flex items-center gap-1.5 pr-2">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-1)' }}>
        <div className="h-full rounded-full transition-[width] duration-500 ease-out" style={{ width: bar + '%', background: color }} />
      </div>
      <span className="text-[11px] font-semibold tabular-nums w-[44px] text-right" style={{ color: label ? color : 'var(--t4)' }}>{label ?? '--'}</span>
    </div>
  )
}
