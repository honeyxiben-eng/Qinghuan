'use client'
import { useState, type SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'

interface P extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string; options: { value: string; label: string }[]; w?: number|string; isLoading?: boolean
}

export default function Select({ label, options, w, isLoading, className = '', onFocus, onBlur, ...r }: P) {
  const [foc, setFoc] = useState(false)
  return (
    <div style={w ? { width: w, flexShrink: 0 } : undefined}>
      {label && (
        <label className="text-[12px] font-medium block mb-2" style={{ color: 'var(--t3)' }}>
          {label}
        </label>
      )}
      <div className="relative">
        <select
          className={`w-full h-[32px] px-3 pr-9 rounded-[var(--r-full)] text-[10.5px] font-medium transition-all outline-none appearance-none cursor-pointer
            ${isLoading ? 'opacity-50' : ''} ${className}`}
          style={{
            color: 'var(--t1)',
            background: 'var(--surface-1)',
            border: `1px solid ${foc ? 'var(--accent)' : 'var(--glass-border)'}`,
            boxShadow: foc ? '0 0 0 3px var(--accent-ring)' : undefined,
            transitionDuration: 'var(--dur-fast)',
          }}
          onFocus={e => { setFoc(true); onFocus?.(e) }}
          onBlur={e => { setFoc(false); onBlur?.(e) }}
          disabled={isLoading}
          {...r}>
          {options.map(o => <option key={o.value} value={o.value} style={{ background: '#1a1a24', color: '#f5f5f7' }}>{o.label.trim()}</option>)}
        </select>
        <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: 'var(--t4)' }} />
      </div>
    </div>
  )
}
