'use client'
import type { ReactNode } from 'react'

export function SectionPanel({
  title, icon, extra, children, noPad,
}: {
  title?: ReactNode
  icon?: ReactNode
  extra?: ReactNode
  children: ReactNode
  noPad?: boolean
}) {
  return (
    <div className="panel">
      {title && (
        <div className="panel-head" style={{ justifyContent: 'space-between' }}>
          <div className="flex items-center gap-2.5">
            {icon}
            <span className="panel-title">{title}</span>
          </div>
          {extra}
        </div>
      )}
      <div style={{ padding: noPad ? 0 : 'var(--sp-card)' }}>{children}</div>
    </div>
  )
}
