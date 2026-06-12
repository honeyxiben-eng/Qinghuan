'use client'
import { ReactNode } from 'react'

interface P {
  icon?: ReactNode
  title: string
  description?: string
  actions?: ReactNode
  compact?: boolean
}

export default function PageHeader({ icon, title, description, actions, compact }: P) {
  return (
    <div className={compact ? 'mb-6' : 'mb-8'} style={{ animation: 'fadeUp 0.4s var(--ease-spring) both' }}>
      <div className="flex items-end justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="flex items-center gap-3 text-[26px] font-bold tracking-tight" style={{ color: 'var(--t1)' }}>
            {icon && (
              <span className="w-10 h-10 rounded-[var(--r-sm)] flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                {icon}
              </span>
            )}
            {title}
          </h1>
          {description && (
            <p className="text-[13px] mt-2" style={{ color: 'var(--t2)' }}>
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2.5 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}
