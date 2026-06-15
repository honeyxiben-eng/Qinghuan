'use client'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

type V = 'primary' | 'secondary' | 'danger' | 'ghost' | 'success' | 'warning'
interface P extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: V; size?: 'sm' | 'md' | 'xs'
  children: ReactNode; loading?: boolean; icon?: ReactNode
}

const SZ = { xs: { h: 30, px: 12, fs: 11 }, sm: { h: 34, px: 14, fs: 12 }, md: { h: 40, px: 18, fs: 13 } }

const VARIANT_CLASS: Record<V, string> = {
  primary: 'btn-v-primary',
  secondary: 'btn-v-secondary',
  danger: 'btn-v-danger',
  ghost: 'btn-v-ghost',
  success: 'btn-v-success',
  warning: 'btn-v-warning',
}

export default function Button({ variant = 'secondary', size = 'md', children, loading, icon, className = '', ...r }: P) {
  const s = SZ[size]
  return (
    <button
      className={`btn ${VARIANT_CLASS[variant]} ${className} ${loading ? 'pointer-events-none opacity-70' : ''}`}
      style={{ height: s.h, paddingLeft: s.px, paddingRight: s.px, fontSize: s.fs }}
      {...r} disabled={r.disabled || loading}>
      {loading ? <Loader2 size={14} className="animate-spin" /> : icon}
      {children}
    </button>
  )
}
