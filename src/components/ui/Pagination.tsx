'use client'
import { ChevronFirst, ChevronLeft, ChevronRight, ChevronLast } from 'lucide-react'

interface P {
  page: number
  totalPages: number
  total: number
  pageSize: number
  onChange: (page: number) => void
}

export default function Pagination({ page, totalPages, total, pageSize, onChange }: P) {
  if (totalPages <= 1) return null

  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)

  const pages: number[] = []
  const first = Math.max(1, page - 3)
  const last = Math.min(totalPages, first + 6)
  for (let i = first; i <= last; i++) pages.push(i)

  return (
    <div className="flex items-center justify-center gap-1 py-3 text-[12px]" style={{ color: 'var(--t3)' }}>
      <span className="mr-3 tabular-nums">{start}{'\u2013'}{end}/{total}</span>

      <button onClick={() => onChange(1)} disabled={page === 1}
        className="w-[34px] h-[34px] rounded-[var(--r-sm)] flex items-center justify-center hover:bg-[var(--surface-1)] disabled:opacity-20 transition-all"
        title={'\u9996\u9875'}>
        <ChevronFirst size={14} />
      </button>

      <button onClick={() => onChange(Math.max(1, page - 1))} disabled={page === 1}
        className="w-[34px] h-[34px] rounded-[var(--r-sm)] flex items-center justify-center hover:bg-[var(--surface-1)] disabled:opacity-20 transition-all"
        title={'\u4e0a\u4e00\u9875'}>
        <ChevronLeft size={14} />
      </button>

      {pages.map(n => (
        <button key={n} onClick={() => onChange(n)}
          className="min-w-[34px] h-[34px] rounded-[var(--r-sm)] flex items-center justify-center transition-all font-semibold tabular-nums"
          style={{
            background: n === page ? 'var(--accent)' : undefined,
            color: n === page ? '#fff' : 'var(--t2)',
          }}>
          {n}
        </button>
      ))}

      <button onClick={() => onChange(Math.min(totalPages, page + 1))} disabled={page === totalPages}
        className="w-[34px] h-[34px] rounded-[var(--r-sm)] flex items-center justify-center hover:bg-[var(--surface-1)] disabled:opacity-20 transition-all"
        title={'\u4e0b\u4e00\u9875'}>
        <ChevronRight size={14} />
      </button>

      <button onClick={() => onChange(totalPages)} disabled={page === totalPages}
        className="w-[34px] h-[34px] rounded-[var(--r-sm)] flex items-center justify-center hover:bg-[var(--surface-1)] disabled:opacity-20 transition-all"
        title={'\u672b\u9875'}>
        <ChevronLast size={14} />
      </button>
    </div>
  )
}
