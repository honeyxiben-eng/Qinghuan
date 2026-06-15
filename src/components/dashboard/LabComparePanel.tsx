'use client'
import { memo } from 'react'
import { X, ArrowUp, ArrowDown, Minus } from 'lucide-react'
import type { LabRecord } from '@/shared/types'

interface Props {
  recordA: LabRecord
  recordB: LabRecord
  onClose: () => void
}

const FIELDS: { key: keyof LabRecord; label: string; decimals: number; unit: string }[] = [
  { key: 'kPlus', label: 'K⁺', decimals: 3, unit: 'g/L' },
  { key: 'liPlus', label: 'Li⁺', decimals: 4, unit: 'g/L' },
  { key: 'naPlus', label: 'Na⁺', decimals: 3, unit: 'g/L' },
  { key: 'mg2Plus', label: 'Mg²⁺', decimals: 3, unit: 'g/L' },
  { key: 'ca2Plus', label: 'Ca²⁺', decimals: 3, unit: 'g/L' },
  { key: 'clMinus', label: 'Cl⁻', decimals: 3, unit: 'g/L' },
  { key: 'so42Minus', label: 'SO₄²⁻', decimals: 3, unit: 'g/L' },
  { key: 'b2o3', label: 'B₂O₃', decimals: 3, unit: 'g/L' },
  { key: 'density', label: '比重', decimals: 4, unit: '' },
  { key: 'salinity', label: '矿化度', decimals: 3, unit: '' },
  { key: 'ph', label: 'pH', decimals: 2, unit: '' },
  { key: 'viscosity', label: '粘度', decimals: 2, unit: '' },
]

export const LabComparePanel = memo(function LabComparePanel({ recordA, recordB, onClose }: Props) {
  const val = (r: LabRecord, k: keyof LabRecord) => r[k] as number | null | undefined
  const fmt = (v: number | null | undefined, d: number) => v != null ? v.toFixed(d) : '—'
  const arrow = (a: number | null | undefined, b: number | null | undefined) => {
    if (a == null || b == null) return <Minus size={14} style={{ color: 'var(--t4)' }} />
    if (a === b) return <Minus size={14} style={{ color: 'var(--t4)' }} />
    if (a < b) return <ArrowUp size={14} style={{ color: '#60a5fa' }} />
    return <ArrowDown size={14} style={{ color: '#f87171' }} />
  }
  const pct = (a: number | null | undefined, b: number | null | undefined) => {
    if (a == null || b == null || a === 0) return null
    return ((b - a) / Math.abs(a) * 100).toFixed(1)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}>
      <div className="card overflow-hidden w-full max-w-[700px] max-h-[80vh] flex flex-col"
        style={{ animation: 'scaleIn 0.3s var(--ease-spring) both' }}
        onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border-light)' }}>
          <h3 className="text-[16px] font-bold flex items-center gap-2" style={{ color: 'var(--t1)' }}>
            化验数据对比
          </h3>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--t3)', padding: 6, borderRadius: 'var(--r-sm)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-1)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            <X size={18} />
          </button>
        </div>

        <div className="flex gap-6 px-6 py-3 border-b" style={{ borderColor: 'var(--border-light)', background: 'var(--surface-1)' }}>
          <div className="flex-1 text-[12px]">
            <span className="font-bold" style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>{recordA.wellId}</span>
            <span style={{ color: 'var(--t3)', marginLeft: 8 }}>{recordA.testDate?.slice(0, 10)}</span>
            <span style={{ color: 'var(--t4)', marginLeft: 8 }}>{recordA.lineName || ''}</span>
          </div>
          <div className="flex-1 text-[12px]">
            <span className="font-bold" style={{ color: '#60a5fa', fontFamily: 'var(--font-mono)' }}>{recordB.wellId}</span>
            <span style={{ color: 'var(--t3)', marginLeft: 8 }}>{recordB.testDate?.slice(0, 10)}</span>
            <span style={{ color: 'var(--t4)', marginLeft: 8 }}>{recordB.lineName || ''}</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-3">
          <table className="w-full text-[13px]">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                <th className="text-left py-2.5 font-semibold" style={{ color: 'var(--t3)', width: 100 }}>指标</th>
                <th className="text-right py-2.5 font-semibold" style={{ color: 'var(--accent)', width: 120, fontFamily: 'var(--font-mono)' }}>{recordA.wellId}</th>
                <th className="text-right py-2.5 font-semibold" style={{ color: '#60a5fa', width: 120, fontFamily: 'var(--font-mono)' }}>{recordB.wellId}</th>
                <th className="text-center py-2.5 font-semibold" style={{ color: 'var(--t3)', width: 60 }}>趋势</th>
                <th className="text-right py-2.5 font-semibold" style={{ color: 'var(--t3)', width: 80 }}>变化率</th>
              </tr>
            </thead>
            <tbody>
              {FIELDS.map(f => {
                const vA = val(recordA, f.key)
                const vB = val(recordB, f.key)
                const diff = vA != null && vB != null ? (vB - vA) : null
                return (
                  <tr key={f.key} className="hover:bg-[var(--surface-1)] transition-colors"
                    style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td className="py-2.5 font-semibold" style={{ color: 'var(--t2)' }}>{f.label}</td>
                    <td className="py-2.5 text-right tabular-nums" style={{ color: 'var(--t1)', fontFamily: 'var(--font-mono)' }}>
                      {fmt(vA, f.decimals)}
                      {f.unit && <span style={{ color: 'var(--t4)', fontSize: 10, marginLeft: 2 }}>{f.unit}</span>}
                    </td>
                    <td className="py-2.5 text-right tabular-nums" style={{ color: 'var(--t1)', fontFamily: 'var(--font-mono)' }}>
                      {fmt(vB, f.decimals)}
                      {f.unit && <span style={{ color: 'var(--t4)', fontSize: 10, marginLeft: 2 }}>{f.unit}</span>}
                    </td>
                    <td className="py-2.5 text-center">
                      {arrow(vA, vB)}
                    </td>
                    <td className="py-2.5 text-right tabular-nums"
                      style={{ color: diff != null ? (diff > 0 ? '#60a5fa' : '#f87171') : 'var(--t4)' }}>
                      {diff != null ? (diff > 0 ? '+' : '') + diff.toFixed(f.decimals) : '—'}
                      {pct(vA, vB) != null && (
                        <span style={{ fontSize: 10, marginLeft: 4, color: 'var(--t4)' }}>({pct(vA, vB)}%)</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-3 border-t flex justify-end gap-2.5" style={{ borderColor: 'var(--border-light)' }}>
          <button onClick={onClose} className="btn btn-v-secondary btn-sm">关闭对比</button>
        </div>
      </div>
    </div>
  )
})
