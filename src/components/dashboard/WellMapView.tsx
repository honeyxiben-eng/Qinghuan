'use client'
import { useState, useMemo } from 'react'
import { WELL_LINES, REGIONS } from '@/lib/well-data'

const REGION_DOTS: Record<string, string> = { N: '#2563eb', C: '#0ea5e9', W: '#ea580c', E: '#0ea5e9', S: '#4f46e5' }
const REGION_NAMES: Record<string, string> = { N: '北部', C: '中部', W: '西部', E: '东部', S: '南部' }

interface WellMapViewProps {
  onSelectWell?: (wellId: string) => void
}

export function WellMapView({ onSelectWell }: WellMapViewProps) {
  const [filterRegion, setFilterRegion] = useState<string | null>(null)
  const [hovered, setHovered] = useState<string | null>(null)

  const linesByRegion = useMemo(() => {
    const groups: Record<string, any[]> = {}
    for (const r of REGIONS) groups[r.key] = []
    for (const line of WELL_LINES) {
      if (groups[line.region]) groups[line.region].push(line)
    }
    return groups
  }, [])

  const allWells = useMemo(() => {
    const wells: { wellId: string; region: string; lineName: string; lineColor: string }[] = []
    for (const line of WELL_LINES as any[]) {
      const color = REGION_DOTS[line.region] || '#a8a29e'
      if (line.numbers) {
        for (const n of line.numbers) {
          wells.push({
            wellId: line.prefix + String(n).padStart(3, '0'),
            region: line.region,
            lineName: line.shortName,
            lineColor: color,
          })
        }
      }
    }
    return wells
  }, [])

  const filteredWells = filterRegion
    ? allWells.filter(w => w.region === filterRegion)
    : allWells

  return (
    <div className="card p-5 overflow-hidden">
      {/* Region filter */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <span className="text-[12px] font-semibold" style={{ color: 'var(--t3)' }}>区域筛选</span>
        <button onClick={() => setFilterRegion(null)}
          className={`filter-chip ${filterRegion === null ? 'active' : ''}`}
          style={{ fontSize: 11 }}>
          全部
        </button>
        {REGIONS.map(r => (
          <button key={r.key} onClick={() => setFilterRegion(filterRegion === r.key ? null : r.key)}
            className={`filter-chip ${filterRegion === r.key ? 'active' : ''}`}
            style={{ fontSize: 11, '--chip-color': REGION_DOTS[r.key] } as any}>
            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: REGION_DOTS[r.key], marginRight: 4 }} />
            {r.name}
          </button>
        ))}
        <span className="text-[11px]" style={{ color: 'var(--t4)', marginLeft: 8 }}>
          {filteredWells.length} 口井
        </span>
      </div>

      {/* Well grid */}
      <div className="grid gap-1" style={{
        gridTemplateColumns: 'repeat(auto-fill, minmax(48px, 1fr))',
        maxHeight: '480px',
        overflowY: 'auto',
        padding: '4px',
      }}>
        {filteredWells.map(w => (
          <div key={w.wellId}
            onClick={() => onSelectWell?.(w.wellId)}
            onMouseEnter={() => setHovered(w.wellId)}
            onMouseLeave={() => setHovered(null)}
            className="tooltip"
            data-tip={`${w.wellId} · ${w.lineName}`}
            style={{
              width: '100%',
              aspectRatio: '1',
              borderRadius: '6px',
              background: hovered === w.wellId
                ? `linear-gradient(135deg, ${w.lineColor}, ${w.lineColor}88)`
                : `${w.lineColor}22`,
              border: hovered === w.wellId
                ? `2px solid ${w.lineColor}`
                : `1px solid ${w.lineColor}44`,
              cursor: 'pointer',
              transition: 'all .15s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '9px',
              fontWeight: hovered === w.wellId ? 700 : 500,
              color: hovered === w.wellId ? '#fff' : w.lineColor,
              transform: hovered === w.wellId ? 'scale(1.15)' : 'scale(1)',
              zIndex: hovered === w.wellId ? 2 : 1,
              position: 'relative' as any,
            }}>
            {w.wellId.slice(-2)}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
        {REGIONS.map(r => (
          <div key={r.key} className="flex items-center gap-1.5" style={{ fontSize: 11, color: 'var(--t2)' }}>
            <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: REGION_DOTS[r.key] }} />
            {r.name}
          </div>
        ))}
      </div>
    </div>
  )
}
