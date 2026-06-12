'use client'
import { create } from 'zustand'
import type { UserRole } from '@/types'

function sc(n: string, v: string, d = 7) {
  if (typeof document === 'undefined') return
  const e = new Date(); e.setTime(e.getTime() + d * 86400000)
  document.cookie = n + '=' + v + ';expires=' + e.toUTCString() + ';path=/'
}
function dc(n: string) {
  if (typeof document === 'undefined') return
  document.cookie = n + '=;expires=Thu,01 Jan 1970 00:00:00 UTC;path=/'
}
function getCookie(n: string): string | null {
  if (typeof document === 'undefined') return null
  const m = document.cookie.match('(^|;)\\s*' + n + '\\s*=\\s*([^;]+)')
  return m ? decodeURIComponent(m[2]) : null
}

interface S {
  userRole: UserRole | null; userName: string | null
  refreshSec: number
  sidebarCollapsed: boolean
  login: (r: UserRole, n: string) => void; logout: () => void
  setRefreshSec: (s: number) => void
  toggleSidebar: () => void
  hydrate: () => void
}

function getRefreshSec(): number {
  if (typeof window === 'undefined') return 30
  const v = Number(localStorage.getItem('sl-refresh'))
  return v && v > 0 ? v : 30
}

function getSidebarCollapsed(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem('sl-sidebar-collapsed') === '1'
}

export const useAppStore = create<S>((set, get) => ({
  userRole: null,
  userName: null,
  refreshSec: 30,
  sidebarCollapsed: false,
  login: (r, n) => { sc('sl_role', r, 7); sc('sl_user', n, 7); set({ userRole: r, userName: n }) },
  logout: () => { dc('sl_role'); dc('sl_user'); set({ userRole: null, userName: null }) },
  setRefreshSec: (s) => { if (typeof window !== 'undefined') localStorage.setItem('sl-refresh', String(s)); set({ refreshSec: s }) },
  toggleSidebar: () => {
    const next = !get().sidebarCollapsed
    if (typeof window !== 'undefined') localStorage.setItem('sl-sidebar-collapsed', next ? '1' : '0')
    set({ sidebarCollapsed: next })
  },
  hydrate: () => {
    const r = getCookie('sl_role') as UserRole | null; const n = getCookie('sl_user')
    const patch: Partial<S> = { refreshSec: getRefreshSec(), sidebarCollapsed: getSidebarCollapsed() }
    if (r && !get().userRole) { patch.userRole = r; patch.userName = n }
    set(patch)
  },
}))