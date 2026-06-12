'use client'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

type V = 'primary' | 'secondary' | 'danger' | 'ghost' | 'success' | 'warning'
interface P extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: V; size?: 'sm' | 'md' | 'xs'
  children: ReactNode; loading?: boolean; icon?: ReactNode
}

export default function Button({ variant = 'secondary', size = 'md', children, loading, icon, className = '', ...r }: P) {
  const SZ = { xs: { h: 30, px: 12, fs: 11 }, sm: { h: 34, px: 14, fs: 12 }, md: { h: 40, px: 18, fs: 13 } }
  const s = SZ[size]

  const base: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    height: s.h, paddingLeft: s.px, paddingRight: s.px, fontSize: s.fs,
    fontWeight: 600, borderRadius: 9999, cursor: 'pointer',
    border: 'none', outline: 'none', whiteSpace: 'nowrap', userSelect: 'none',
    transition: 'all 0.2s cubic-bezier(0.16,1,0.3,1)',
    fontFamily: 'inherit', letterSpacing: '-0.01em',
  }

  const VS: Record<V, React.CSSProperties> = {
    primary: {
      ...base,
      background: 'var(--accent)',
      color: '#fff',
      boxShadow: '0 2px 12px rgba(74,158,255,0.3)',
    },
    secondary: {
      ...base,
      background: 'var(--surface-2)', color: 'var(--t2)',
      border: '1px solid var(--glass-border)', backdropFilter: 'blur(12px)',
    },
    danger: {
      ...base,
      background: 'var(--red)',
      color: '#fff', boxShadow: '0 2px 10px rgba(248,113,113,0.25)',
    },
    ghost: {
      ...base,
      background: 'transparent', color: 'var(--t3)',
    },
    success: {
      ...base,
      background: 'var(--accent)',
      color: '#fff', boxShadow: '0 2px 10px rgba(74,158,255,0.3)',
    },
    warning: {
      ...base,
      background: 'var(--amber)',
      color: '#000', boxShadow: '0 2px 10px rgba(251,191,36,0.25)',
    },
  }

  const hover: Record<V, React.CSSProperties> = {
    primary: { filter: 'brightness(1.08)', boxShadow: '0 4px 20px rgba(74,158,255,0.4)' },
    secondary: { background: 'var(--surface-3)', color: 'var(--t1)', borderColor: 'var(--glass-border-strong)' },
    danger: { filter: 'brightness(1.08)', boxShadow: '0 4px 18px rgba(248,113,113,0.35)' },
    ghost: { background: 'var(--surface-1)', color: 'var(--t1)' },
    success: { filter: 'brightness(1.08)', boxShadow: '0 4px 18px rgba(74,158,255,0.4)' },
    warning: { filter: 'brightness(1.08)', boxShadow: '0 4px 18px rgba(251,191,36,0.35)' },
  }

  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 font-semibold select-none whitespace-nowrap ${loading ? 'pointer-events-none opacity-70' : ''} ${className}`}
      style={VS[variant]}
      onMouseEnter={e => { const h = hover[variant]; if (h) Object.assign(e.currentTarget.style, h) }}
      onMouseLeave={e => {
        const st = VS[variant]; Object.assign(e.currentTarget.style, st)
      }}
      onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.97)' }}
      onMouseUp={e => { e.currentTarget.style.transform = 'none' }}
      {...r} disabled={r.disabled || loading}>
      {loading ? <Loader2 size={14} className="animate-spin" /> : icon}
      {children}
    </button>
  )
}
