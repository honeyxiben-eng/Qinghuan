'use client'
import { usePathname } from 'next/navigation'
import { useAppStore } from '@/lib/store'
import {
  PanelLeft, Settings, LogOut, User, ChevronDown
} from 'lucide-react'
import { useState, useEffect, useRef, useMemo } from 'react'
import { SettingsPanel } from './SettingsPanel'
import ConfirmModal from '@/components/ui/ConfirmModal'

const PATH_LABELS: Record<string, string> = {
  '/': '中控台',
  '/wells': '基础信息',
  '/monitoring': '监测数据',
  '/lab': '化验数据',
  '/analysis': '数据分析',
}

function getCrumb(pathname: string): string[] {
  if (pathname === '/') return ['中控台']
  const label = PATH_LABELS[pathname] || pathname.split('/').filter(Boolean).pop() || ''
  return [label]
}

export default function TopHeader() {
  const p = usePathname()
  const r = useAppStore(s => s.userRole)
  const n = useAppStore(s => s.userName)
  const lo = useAppStore(s => s.logout)
  const toggleSidebar = useAppStore(s => s.toggleSidebar)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [logoutConfirm, setLogoutConfirm] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [now, setNow] = useState(new Date())
  const menuRef = useRef<HTMLDivElement>(null)
  const hydrate = useAppStore(s => s.hydrate)
  useEffect(() => { setMounted(true); hydrate() }, [hydrate])
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setUserMenuOpen(false)
    }
    if (userMenuOpen) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [userMenuOpen])

  if (p === '/login') return null

  const crumbs = getCrumb(p)
  const R: Record<string, string> = { admin: '综合管理', lab: '化验', brine: '采卤' }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between"
        style={{
          height: 'var(--topbar-h)',
          background: 'rgba(10,10,15,0.75)',
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)',
          borderBottom: '1px solid var(--glass-border)',
          padding: '0 32px',
        }}>
        <div className="flex items-center gap-4">
          <button onClick={toggleSidebar}
            className="header-btn w-9 h-9 flex items-center justify-center"
            style={{ color: 'var(--t3)' }}>
            <PanelLeft size={18} strokeWidth={1.5} />
          </button>
          <div className="flex items-center gap-2.5">
            <span className="text-[15px] font-bold tracking-tight" style={{ color: 'var(--t1)' }}>清欢</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>智慧盐湖</span>
          </div>
          <div className="flex items-center gap-1.5 ml-4 pl-4" style={{ borderLeft: '1px solid var(--border-light)' }}>
            {crumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1.5">
                <span className="text-[13px] font-medium" style={{ color: i === crumbs.length - 1 ? 'var(--t1)' : 'var(--t3)' }}>
                  {crumb}
                </span>
                {i < crumbs.length - 1 && (
                  <span style={{ color: 'var(--t4)', fontSize: 11 }}>/</span>
                )}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[17px] font-bold tabular-nums" suppressHydrationWarning style={{ color: 'var(--t2)', fontFamily: 'var(--font-mono)' }}>
            {mounted ? now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--:--:--'}
          </span>
          <button onClick={() => setSettingsOpen(true)}
            className="header-btn w-9 h-9 flex items-center justify-center"
            style={{ color: 'var(--t3)' }}>
            <Settings size={17} strokeWidth={1.5} />
          </button>
          {r ? (
            <div ref={menuRef} className="relative">
              <button onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="header-btn flex items-center gap-2.5 px-2.5 py-1.5">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white"
                  style={{ background: 'var(--accent-grad)' }}>
                  {n?.charAt(0) || <User size={12} />}
                </div>
                <span className="text-[13px] font-medium" style={{ color: 'var(--t1)' }}>{n}</span>
                <ChevronDown size={13} style={{ color: 'var(--t3)', transition: 'transform 0.2s', transform: userMenuOpen ? 'rotate(180deg)' : 'none' }} />
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-44 rounded-[var(--r-md)] border border-[var(--glass-border)] py-1.5 animate-[scaleIn_.2s_var(--ease-spring)_both]"
                  style={{ zIndex: 60, background: 'var(--surface-3)', backdropFilter: 'blur(20px)', boxShadow: 'var(--s-4)' }}>
                  <div className="px-3.5 py-2.5 border-b" style={{ borderColor: 'var(--border-light)' }}>
                    <div className="text-[13px] font-medium" style={{ color: 'var(--t1)' }}>{n}</div>
                    <div className="text-[11px] mt-0.5" style={{ color: 'var(--t3)' }}>{R[r] || r}</div>
                  </div>
                  <button onClick={() => { setLogoutConfirm(true); setUserMenuOpen(false) }}
                    className="flex items-center gap-2.5 w-full px-3.5 py-2 text-[13px] transition-colors hover:bg-[var(--surface-1)]"
                    style={{ color: 'var(--t2)' }}>
                    <LogOut size={14} /> 退出登录
                  </button>
                </div>
              )}
            </div>
          ) : (
            <a href="/login" className="text-[13px] font-medium" style={{ color: 'var(--accent)' }}>登录</a>
          )}
        </div>
      </header>

      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      {logoutConfirm && (
        <ConfirmModal
          title="确认退出"
          message="确定要退出登录吗？"
          onConfirm={() => { lo(); setLogoutConfirm(false) }}
          onCancel={() => setLogoutConfirm(false)}
        />
      )}
    </>
  )
}
