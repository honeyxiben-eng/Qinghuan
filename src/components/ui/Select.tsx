'use client'
import { useState, useRef, useEffect, type KeyboardEvent } from 'react'
import { ChevronDown } from 'lucide-react'

interface P {
  label?: string
  options: { value: string; label: string }[]
  value: string
  onChange: (e: { target: { value: string } }) => void
  w?: number | string
  isLoading?: boolean
  className?: string
}

export default function Select({ label, options, value, onChange, w, isLoading, className = '' }: P) {
  const [open, setOpen] = useState(false)
  const [foc, setFoc] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = options.find(o => o.value === value)

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const handleSelect = (val: string) => {
    onChange({ target: { value: val } })
    setOpen(false)
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') setOpen(false)
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setOpen(o => !o)
    }
  }

  return (
    <div ref={ref} style={w ? { width: w, flexShrink: 0 } : undefined} className={className}>
      {label && (
        <label className="text-[11px] font-medium block mb-2" style={{ color: 'var(--t3)' }}>
          {label}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => { if (!isLoading) setOpen(o => !o) }}
          onFocus={() => setFoc(true)}
          onBlur={() => setFoc(false)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          className={`relative w-full h-[34px] px-3 pr-9 rounded-[var(--r-full)] text-[10.5px] font-medium text-left transition-all outline-none cursor-pointer flex items-center
            ${isLoading ? 'opacity-50 pointer-events-none' : ''}
            ${open ? 'border-[var(--accent)] bg-[var(--surface-2)]' : 'border-[var(--glass-border)] bg-[var(--surface-1)] hover:border-[var(--glass-border-strong)]'}`}
          style={{
            border: `1px solid ${open ? 'var(--accent)' : foc ? 'var(--accent)' : 'var(--glass-border)'}`,
            boxShadow: foc || open ? '0 0 0 3px var(--accent-ring)' : undefined,
            color: selected ? 'var(--t1)' : 'var(--t4)',
          }}>
          <span className="flex-1 truncate">{selected?.label || '请选择'}</span>
          <ChevronDown
            size={14}
            className="absolute right-3 pointer-events-none transition-transform duration-200"
            style={{ color: 'var(--t3)', top: '50%', marginTop: -7, transform: open ? 'rotate(180deg)' : undefined }}
          />
        </button>

        {open && (
          <div
            className="absolute z-[60] left-0 right-0 mt-1.5 overflow-hidden"
            style={{
              background: 'rgba(24,24,32,0.92)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid var(--glass-border-strong)',
              borderRadius: 'var(--r-md)',
              boxShadow: 'var(--s-lg)',
              maxHeight: 260,
              overflowY: 'auto',
              animation: 'scaleIn 0.15s var(--ease-spring) both',
            }}>
            {options.map(o => (
              <button
                key={o.value}
                type="button"
                onClick={() => handleSelect(o.value)}
                className="w-full text-left px-3.5 py-2 text-[11px] transition-colors flex items-center justify-between"
                style={{
                  color: o.value === value ? 'var(--accent)' : 'var(--t1)',
                  background: o.value === value ? 'var(--accent-soft)' : 'transparent',
                  fontWeight: o.value === value ? 600 : 400,
                }}
                onMouseEnter={e => {
                  if (o.value !== value) e.currentTarget.style.background = 'var(--surface-1)'
                }}
                onMouseLeave={e => {
                  if (o.value !== value) e.currentTarget.style.background = 'transparent'
                }}>
                <span>{o.label}</span>
                {o.value === value && <span style={{ color: 'var(--accent)', fontSize: 10 }}>✓</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
