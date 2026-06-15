'use client'
import type { ReactNode } from 'react'

interface P {
  icon: ReactNode
  title: string
  description?: string
  action?: ReactNode
}

export default function EmptyState({ icon, title, description, action }: P) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        {icon}
      </div>
      <div className="empty-state-title">{title}</div>
      {description && <div className="empty-state-desc">{description}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function EmptyWellIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="8" width="24" height="20" rx="3" stroke="var(--t3)" strokeWidth="1.5" fill="none"/>
      <path d="M10 8V6C10 4.89543 10.8954 4 12 4H20C21.1046 4 22 4.89543 22 6V8" stroke="var(--t3)" strokeWidth="1.5"/>
      <circle cx="16" cy="18" r="4" stroke="var(--accent)" strokeWidth="1.5" fill="none"/>
      <path d="M16 14V18L19 20" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

export function EmptyChartIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="4" width="24" height="24" rx="3" stroke="var(--t3)" strokeWidth="1.5" fill="none"/>
      <path d="M8 24V16" stroke="var(--t3)" strokeWidth="2" strokeLinecap="round"/>
      <path d="M12 24V12" stroke="var(--t3)" strokeWidth="2" strokeLinecap="round"/>
      <path d="M16 24V18" stroke="var(--t3)" strokeWidth="2" strokeLinecap="round"/>
      <path d="M20 24V10" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round"/>
      <path d="M24 24V14" stroke="var(--t3)" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

export function EmptyDataIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="6" width="24" height="20" rx="3" stroke="var(--t3)" strokeWidth="1.5" fill="none"/>
      <path d="M4 12H28" stroke="var(--t3)" strokeWidth="1.5"/>
      <path d="M12 12V26" stroke="var(--t3)" strokeWidth="1.5"/>
      <circle cx="8" cy="9" r="1" fill="var(--t3)"/>
      <circle cx="12" cy="9" r="1" fill="var(--t3)"/>
      <circle cx="16" cy="9" r="1" fill="var(--t3)"/>
    </svg>
  )
}

export function EmptySearchIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="14" cy="14" r="8" stroke="var(--t3)" strokeWidth="1.5" fill="none"/>
      <path d="M20 20L26 26" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round"/>
      <path d="M11 14H17" stroke="var(--t3)" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}
