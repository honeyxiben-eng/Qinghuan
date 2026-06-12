'use client'
import { useRef, useEffect, useState } from 'react'

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

export function LineMarqueeTable({ rows, height = 340 }: { rows: LineRow[]; height?: number }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [paused, setPaused] = useState(false)

  const pct = (r: LineRow) => (r.total ? Math.round((r.active || 0) / r.total * 100) : 0)
  const kBar = (v: number | null | undefined) => v != null ? Math.min(100, (Number(v) / 15) * 100) : 0
  const liBar = (v: number | null | undefined) => v != null ? Math.min(100, (Number(v) / 0.5) * 100) : 0

  const rowH = 48
  const totalH = rows.length * rowH
  const duration = Math.max(rows.length * 2.5, 15)

  return (
    <div style={{ borderRadius: 'var(--r-lg)', border: '1px solid var(--glass-border)', overflow: 'hidden', background: 'var(--surface-1)' }}>
      <div className="grid items-center px-6" style={{ gridTemplateColumns: '150px 120px 1fr 1fr 110px', height: 44, background: 'var(--surface-2)', borderBottom: '1px solid var(--glass-border)' }}>
        {['井采线', '在线率', 'K⁺ 含量', 'Li⁺ 含量', '动水位'].map((h, i) => (
          <span key={i} className="text-[12px] font-semibold tracking-wide" style={{ color: 'var(--t3)', letterSpacing: '0.04em', textAlign: i === 0 ? 'left' : i >= 4 ? 'right' : 'left' }}>{h}</span>
        ))}
      </div>
      <div ref={scrollRef} style={{ height, overflow: 'hidden', position: 'relative' }}>
        <div
          style={{
            animation: `marqueeScroll ${duration}s linear infinite`,
            animationPlayState: paused ? 'paused' : 'running',
          }}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {rows.map((r, i) => {
            const p = pct(r)
            const k = r.avgK != null ? Number(r.avgK).toFixed(3) : null
            const li = r.avgLi != null ? Number(r.avgLi).toFixed(4) : null
            const w = r.avgWater != null ? Number(r.avgWater).toFixed(1) : null
            return (
              <div key={i} className="grid items-center px-6 transition-colors"
                style={{ gridTemplateColumns: '150px 120px 1fr 1fr 110px', height: rowH, borderBottom: '1px solid var(--border-light)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[14px] font-semibold truncate" style={{ color: 'var(--t1)' }}>{r.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="led" style={{ width: 7, height: 7, background: p >= 50 ? 'var(--green)' : p >= 20 ? 'var(--amber)' : 'var(--red)', boxShadow: `0 0 6px ${p >= 50 ? 'rgba(74,222,128,0.5)' : p >= 20 ? 'rgba(251,191,36,0.5)' : 'rgba(248,113,113,0.5)'}` }} />
                  <span className="text-[15px] font-extrabold tabular-nums" style={{ color: 'var(--t1)', fontFamily: 'var(--font-mono)' }}>{p}%</span>
                  <span className="text-[12px] font-medium tabular-nums" style={{ color: 'var(--t3)' }}>{r.active || 0}/{r.total || 0}</span>
                </div>
                <Bar label={k} bar={kBar(r.avgK)} color="#4a9eff" />
                <Bar label={li} bar={liBar(r.avgLi)} color="#34d399" />
                <span className="text-[13px] font-bold tabular-nums text-right" style={{ color: w ? 'var(--sky)' : 'var(--t4)' }}>{w ? w + ' m' : '--'}</span>
              </div>
            )
          })}
          {rows.map((r, i) => {
            const p = pct(r)
            const k = r.avgK != null ? Number(r.avgK).toFixed(3) : null
            const li = r.avgLi != null ? Number(r.avgLi).toFixed(4) : null
            const w = r.avgWater != null ? Number(r.avgWater).toFixed(1) : null
            return (
              <div key={'dup-' + i} className="grid items-center px-6 transition-colors"
                style={{ gridTemplateColumns: '150px 120px 1fr 1fr 110px', height: rowH, borderBottom: '1px solid var(--border-light)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[14px] font-semibold truncate" style={{ color: 'var(--t1)' }}>{r.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="led" style={{ width: 7, height: 7, background: p >= 50 ? 'var(--green)' : p >= 20 ? 'var(--amber)' : 'var(--red)', boxShadow: `0 0 6px ${p >= 50 ? 'rgba(74,222,128,0.5)' : p >= 20 ? 'rgba(251,191,36,0.5)' : 'rgba(248,113,113,0.5)'}` }} />
                  <span className="text-[15px] font-extrabold tabular-nums" style={{ color: 'var(--t1)', fontFamily: 'var(--font-mono)' }}>{p}%</span>
                  <span className="text-[12px] font-medium tabular-nums" style={{ color: 'var(--t3)' }}>{r.active || 0}/{r.total || 0}</span>
                </div>
                <Bar label={k} bar={kBar(r.avgK)} color="#4a9eff" />
                <Bar label={li} bar={liBar(r.avgLi)} color="#34d399" />
                <span className="text-[13px] font-bold tabular-nums text-right" style={{ color: w ? 'var(--sky)' : 'var(--t4)' }}>{w ? w + ' m' : '--'}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function Bar({ label, bar, color }: { label: string | null; bar: number; color: string }) {
  return (
    <div className="flex items-center gap-2 pr-3">
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface-1)' }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: bar + '%', background: color }} />
      </div>
      <span className="text-[12px] font-semibold tabular-nums w-[48px] text-right" style={{ color: label ? color : 'var(--t4)' }}>{label ?? '--'}</span>
    </div>
  )
}
