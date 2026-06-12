'use client'
import { useEffect, useRef, useState } from 'react'

interface KPICardProps {
  label: string
  value: number | string
  unit?: string
  sublabel?: string
  icon?: 'indigo' | 'emerald' | 'rose' | 'sky' | 'amber' | 'purple'
  bar?: number
  children?: React.ReactNode
}

const ICON_GRADIENTS: Record<string, { grad: string; color: string }> = {
  indigo: { grad: 'rgba(74,158,255,0.12)', color: '#4a9eff' },
  emerald: { grad: 'rgba(52,211,153,0.12)', color: '#34d399' },
  rose: { grad: 'rgba(248,113,113,0.12)', color: '#f87171' },
  sky: { grad: 'rgba(96,165,250,0.12)', color: '#60a5fa' },
  amber: { grad: 'rgba(251,191,36,0.12)', color: '#fbbf24' },
  purple: { grad: 'rgba(167,139,250,0.12)', color: '#a78bfa' },
}

export function KPICard({ label, value, unit, sublabel, icon = 'indigo', bar, children }: KPICardProps) {
  const [displayValue, setDisplayValue] = useState(typeof value === 'number' ? 0 : value)
  const animRef = useRef<number | undefined>(undefined)
  const startRef = useRef<number | undefined>(undefined)
  const ico = ICON_GRADIENTS[icon]

  useEffect(() => {
    if (typeof value !== 'number') { setDisplayValue(value); return }
    const from = 0; const to = value; const duration = 800
    startRef.current = performance.now()
    const animate = (now: number) => {
      const elapsed = now - (startRef.current || 0)
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayValue(Math.round(from + (to - from) * eased))
      if (progress < 1) animRef.current = requestAnimationFrame(animate)
    }
    animRef.current = requestAnimationFrame(animate)
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current) }
  }, [value])

  return (
    <div className="stat-card" style={{ position: 'relative', overflow: 'hidden' }}>
      {children ? children : (
        <>
          <div className="stat-icon" style={{ background: ico.grad, borderRadius: 'var(--r-sm)' }}>
            <span className="stat-value" style={{ fontSize: 16, color: ico.color }}>{unit}</span>
          </div>
          {sublabel && <div className="text-[11px] font-medium mb-1.5" style={{ color: ico.color }}>{sublabel}</div>}
          <div className="stat-label">{label}</div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="stat-value" style={{ color: ico.color }}>{displayValue}</span>
            {unit && <span className="text-[12px] font-medium" style={{ color: 'var(--t3)' }}>{unit}</span>}
          </div>
          {bar !== undefined && (
            <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-1)' }}>
              <div className="h-full rounded-full transition-all duration-1000"
                style={{ width: Math.min(bar, 100) + '%', background: ico.color }} />
            </div>
          )}
        </>
      )}
    </div>
  )
}
