'use client'
import { ReactNode } from 'react'

interface Tab { id: string; label: string; icon?: ReactNode; badge?: number | string }

interface DashboardTabsProps {
  tabs: Tab[]
  active: string
  onChange: (id: string) => void
}

export function DashboardTabs({ tabs, active, onChange }: DashboardTabsProps) {
  return (
    <div className="tab-bar" role="tablist">
      {tabs.map(tab => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={active === tab.id}
          className={`tab-item ${active === tab.id ? 'active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.icon && <span>{tab.icon}</span>}
          {tab.label}
          {tab.badge !== undefined && (
            <span className="badge badge-dim">{tab.badge}</span>
          )}
        </button>
      ))}
    </div>
  )
}
