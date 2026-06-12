'use client'

interface GaugeIndicatorProps {
  value: number | null
  max?: number
  threshold?: number
  label: string
  unit?: string
  color?: string
  thresholdColor?: string
  size?: number
}

export function GaugeIndicator({
  value, max = 100, threshold = 6.5,
  label, unit = '', color = '#4a9eff',
  thresholdColor = '#fbbf24', size = 80
}: GaugeIndicatorProps) {
  const strokeWidth = 6
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const center = size / 2

  const pct = value != null ? Math.min(value / max, 1) : 0
  const offset = circumference * (1 - pct)
  const isLow = value != null && value <= threshold
  const activeColor = isLow ? thresholdColor : color
  const displayVal = value != null ? value.toFixed(2) : '—'

  return (
    <div className="gauge-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle
          className="gauge-ring-bg"
          cx={center} cy={center} r={radius}
        />
        <circle
          className="gauge-ring-fg"
          cx={center} cy={center} r={radius}
          stroke={activeColor}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.8s ease, stroke 0.3s ease' }}
        />
      </svg>
      <div className="gauge-ring-text">
        <div className="val" style={{ color: activeColor, fontSize: value != null ? (size > 70 ? 18 : 14) : 14 }}>
          {displayVal}
        </div>
        <div className="lbl">{label}{unit && <span style={{fontSize:8}}> {unit}</span>}</div>
      </div>
    </div>
  )
}
