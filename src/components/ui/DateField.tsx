'use client'
import { useState, useRef, useEffect } from 'react'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/style.css'
import { Calendar as CalIcon, X } from 'lucide-react'

interface P {
  label?: string
  value: string
  onChange: (v: string) => void
  w?: number | string
  placeholder?: string
  clearable?: boolean
}

const fmt = (d?: Date) => d ? d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0') : ''

export default function DateField({ label, value, onChange, w = 150, placeholder = '选择日期', clearable }: P) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = value ? new Date(value + 'T00:00:00') : undefined

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  return (
    <div ref={ref} style={{ width: w, flexShrink: 0, position: 'relative' }}>
      {label && <label className="text-[12px] font-medium block mb-2" style={{ color: 'var(--t3)' }}>{label}</label>}
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full h-[40px] pl-3 pr-2 rounded-[var(--r-sm)] text-[13px] flex items-center gap-2 transition-all border"
        style={{ borderColor: open ? 'var(--accent)' : 'var(--glass-border)', background: 'var(--surface-1)', color: value ? 'var(--t1)' : 'var(--t4)', boxShadow: open ? '0 0 0 3px var(--accent-ring)' : undefined, transitionDuration: 'var(--dur-fast)' }}>
        <CalIcon size={14} style={{ color: open || value ? 'var(--accent)' : 'var(--t3)' }} />
        <span className="flex-1 text-left tabular-nums">{value || placeholder}</span>
        {clearable && value && <span onClick={e => { e.stopPropagation(); onChange('') }} className="hover:opacity-70" style={{ color: 'var(--t3)' }}><X size={13} /></span>}
      </button>
      {open && (
        <div className="absolute z-[60] mt-2 pop sl-daypicker" style={{ background: 'var(--surface-3)', border: '1px solid var(--glass-border-strong)', borderRadius: 'var(--r-xl)', boxShadow: 'var(--s-lg)', backdropFilter: 'blur(20px)', padding: 10 }}>
          <DayPicker
            mode="single"
            selected={selected}
            defaultMonth={selected}
            onSelect={(d) => { onChange(fmt(d)); setOpen(false) }}
            captionLayout="dropdown"
            startMonth={new Date(2015, 0)}
            endMonth={new Date(2035, 11)}
          />
        </div>
      )}
    </div>
  )
}
