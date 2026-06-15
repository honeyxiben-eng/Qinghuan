'use client'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { useAppStore } from '@/lib/store'
import { useEffect, useState, useRef } from 'react'

export function MainContent({ children }: { children: ReactNode }) {
  const p = usePathname()
  const collapsed = useAppStore(s => s.sidebarCollapsed)
  const isLogin = p === '/login'
  const [isMobile, setIsMobile] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 769)
    let timeout: ReturnType<typeof setTimeout>
    const debounce = () => { clearTimeout(timeout); timeout = setTimeout(check, 100) }
    check()
    window.addEventListener('resize', debounce)
    return () => { window.removeEventListener('resize', debounce); clearTimeout(timeout) }
  }, [])

  // Reset scroll to top on page change
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [p])

  const ml = isLogin || isMobile ? 0 : (collapsed ? 'var(--sidebar-collapsed-w)' : 'var(--sidebar-w)')

  return (
    <main style={{
      marginLeft: ml,
      marginTop: 'var(--topbar-h)',
      height: 'calc(100vh - var(--topbar-h))',
      overflow: 'hidden',
      background: 'transparent',
      transition: 'margin-left 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
    }}>
      <div ref={scrollRef} style={{
        height: '100%',
        overflowY: 'auto',
        overflowX: 'hidden',
        backfaceVisibility: 'hidden',
      }}
      key={p}>
        {children}
      </div>
    </main>
  )
}
