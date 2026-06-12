'use client'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { useAppStore } from '@/lib/store'
import { useEffect, useState } from 'react'

export function MainContent({ children }: { children: ReactNode }) {
  const p = usePathname()
  const collapsed = useAppStore(s => s.sidebarCollapsed)
  const isLogin = p === '/login'
  const ml = isLogin ? 0 : (collapsed ? 'var(--sidebar-collapsed-w)' : 'var(--sidebar-w)')
  const [displayPath, setDisplayPath] = useState(p)
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    if (p !== displayPath) {
      setAnimating(true)
      const timer = setTimeout(() => {
        setDisplayPath(p)
        setAnimating(false)
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [p, displayPath])

  return (
    <main style={{
      marginLeft: ml,
      marginTop: 'var(--topbar-h)',
      height: 'calc(100vh - var(--topbar-h))',
      overflow: 'hidden',
      background: 'transparent',
      transition: 'margin-left 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
    }}>
      <div style={{
        height: '100%',
        overflowY: 'auto',
        overflowX: 'hidden',
        opacity: animating ? 0 : 1,
        transform: animating ? 'translateY(8px)' : 'translateY(0)',
        transition: 'opacity 0.15s ease, transform 0.15s ease',
      }}>
        {children}
      </div>
    </main>
  )
}
