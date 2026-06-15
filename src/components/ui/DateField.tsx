'use client'
import { useState, useRef, useEffect } from 'react'
import { DayPicker } from 'react-day-picker'
import { zhCN } from 'date-fns/locale/zh-CN'
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

const MONTHS = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月']

export default function DateField({ label, value, onChange, w = 150, placeholder = '选择日期', clearable }: P) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const [month, setMonth] = useState<Date | undefined>(value ? new Date(value + 'T00:00:00') : new Date())

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  useEffect(() => {
    if (value) setMonth(new Date(value + 'T00:00:00'))
  }, [value])

  const curYear = month?.getFullYear() ?? new Date().getFullYear()
  const curMonth = month?.getMonth() ?? 0
  const years = Array.from({ length: 21 }, (_, i) => 2015 + i)

  return (
    <div ref={ref} style={{ width: w, flexShrink: 0, position: 'relative' }}>
      {label && <label className="text-[11px] font-medium block mb-2" style={{ color: 'var(--t3)' }}>{label}</label>}
      <button type="button" onClick={() => setOpen(o => !o)}
        className={`date-field-btn ${open ? 'open' : ''} ${value ? 'has-value' : ''}`}>
        <CalIcon size={14} style={{ color: open || value ? 'var(--accent)' : 'var(--t3)', flexShrink: 0 }} />
        <span className="flex-1 tabular-nums">{value || placeholder}</span>
        {clearable && value && <span onClick={e => { e.stopPropagation(); onChange('') }} className="hover:opacity-70" style={{ color: 'var(--t3)' }}><X size={13} /></span>}
      </button>
      {open && (
        <div className="absolute z-[60] mt-2 pop" style={{ background: 'var(--surface-3)', border: '1px solid var(--glass-border-strong)', borderRadius: 'var(--r-xl)', boxShadow: 'var(--s-lg)', backdropFilter: 'blur(20px)', padding: 10 }}>
          <div className="flex items-center justify-center gap-2 mb-2 px-1">
            <select value={curYear} onChange={e => {
              const y = parseInt(e.target.value)
              const newMonth = new Date(y, curMonth, 1)
              setMonth(newMonth)
            }} className="dp-select" style={{colorScheme:'dark'}}>
              {years.map(y => <option key={y} value={y}>{y}年</option>)}
            </select>
            <select value={curMonth} onChange={e => {
              const m = parseInt(e.target.value)
              const newMonth = new Date(curYear, m, 1)
              setMonth(newMonth)
            }} className="dp-select" style={{colorScheme:'dark'}}>
              {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
          </div>
          <DayPicker
            mode="single"
            locale={zhCN}
            selected={value ? new Date(value + 'T00:00:00') : undefined}
            month={month}
            onMonthChange={setMonth}
            onSelect={(d) => { if (d) { onChange(fmt(d)); setOpen(false) } }}
            showOutsideDays
            fixedWeeks
          />
        </div>
      )}
    </div>
  )
}
