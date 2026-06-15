'use client'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useAppStore } from '@/lib/store'
import {
  LayoutDashboard, Database, Activity, Beaker, BarChart3, MessageSquare, ShieldCheck,
} from 'lucide-react'

const NAV = [
  { label: '中控台', href: '/', icon: LayoutDashboard },
  { label: '基础信息', href: '/wells', icon: Database },
  { label: '监测数据', href: '/monitoring', icon: Activity },
  { label: '化验数据', href: '/lab', icon: Beaker },
  { label: '数据分析', href: '/analysis', icon: BarChart3 },
  { label: '智能问答', href: '/chat', icon: MessageSquare },
  { label: '审计日志', href: '/audit', icon: ShieldCheck },
]

export default function Sidebar() {
  const p = usePathname()
  const collapsed = useAppStore(s => s.sidebarCollapsed)
  const [hoverExpanded, setHoverExpanded] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 769)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  if (p === '/login') return null

  // Mobile: hidden by default, overlay when open
  if (isMobile) {
    if (!mobileOpen) return null
    return (
      <>
        <div className="sidebar-overlay fixed inset-0 z-30" onClick={() => setMobileOpen(false)}
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} />
        <aside className="fixed left-0 z-40 flex flex-col" style={{
          top: 'var(--topbar-h)', bottom: 0, width: 'var(--sidebar-w)',
          background: 'rgba(10,10,15,0.95)', backdropFilter: 'blur(32px)',
          borderRight: '1px solid var(--glass-border)',
        }}>
          <nav className="flex-1 px-3 pt-4 space-y-1">
            {NAV.map(item => {
              const active = item.href === '/' ? p === '/' : p.startsWith(item.href)
              const Icon = item.icon
              return (
                <a key={item.href} href={item.href}
                  className={`sidebar-item flex items-center gap-3 px-3 py-2.5 rounded-[var(--r-sm)] text-[13px] font-medium transition-all whitespace-nowrap ${active ? 'active' : ''}`}
                  style={{ color: active ? 'var(--accent)' : 'var(--t2)', fontWeight: active ? 600 : 500 }}>
                  <Icon size={18} strokeWidth={active ? 2 : 1.5} style={{ flexShrink: 0 }} />
                  <span>{item.label}</span>
                </a>
              )
            })}
          </nav>
        </aside>
      </>
    )
  }

  // Desktop
  const effectiveCollapsed = collapsed && !hoverExpanded
  const navWidth = effectiveCollapsed ? 'var(--sidebar-collapsed-w)' : 'var(--sidebar-w)'

  return (
    <aside
      className="fixed left-0 z-40 flex flex-col transition-all overflow-hidden"
      style={{
        top: 'var(--topbar-h)',
        bottom: 0,
        width: navWidth,
        background: 'rgba(10,10,15,0.75)',
        backdropFilter: 'blur(32px)',
        WebkitBackdropFilter: 'blur(32px)',
        borderRight: '1px solid var(--glass-border)',
        borderRadius: effectiveCollapsed ? '0' : '0 var(--r-xl) var(--r-xl) 0',
        transitionDuration: 'var(--dur-normal)',
        transitionTimingFunction: 'var(--ease-spring)',
      }}
      onMouseEnter={() => { if (collapsed) setHoverExpanded(true) }}
      onMouseLeave={() => { if (collapsed) setHoverExpanded(false) }}
    >
      <nav className="flex-1 px-3 pt-4 space-y-1">
        {NAV.map(item => {
          const active = item.href === '/' ? p === '/' : p.startsWith(item.href)
          const Icon = item.icon
          const showLabel = !effectiveCollapsed
          return (
            <a key={item.href} href={item.href}
              title={effectiveCollapsed ? item.label : undefined}
              className={`sidebar-item flex items-center gap-3 px-3 py-2.5 rounded-[var(--r-sm)] text-[13px] font-medium transition-all whitespace-nowrap ${active ? 'active' : ''}`}
              style={{
                color: active ? 'var(--accent)' : 'var(--t2)',
                fontWeight: active ? 600 : 500,
                justifyContent: effectiveCollapsed ? 'center' : 'flex-start',
              }}>
              <Icon size={18} strokeWidth={active ? 2 : 1.5} style={{ flexShrink: 0 }} />
              <span style={{
                opacity: showLabel ? 1 : 0,
                transition: 'opacity 0.15s ease',
                width: showLabel ? 'auto' : 0,
              }}>{item.label}</span>
            </a>
          )
        })}
      </nav>

      {!effectiveCollapsed && (
        <div className="px-3 pb-3">
          <div className="text-[10px] font-medium" style={{ color: 'var(--t4)' }}>清欢 · 资源保障部</div>
        </div>
      )}
    </aside>
  )
}
