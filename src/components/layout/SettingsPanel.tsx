'use client'
import { useAppStore } from '@/lib/store'
import { RefreshCw, X } from 'lucide-react'

const OPTIONS = [
  { sec: 0, label: '关闭' },
  { sec: 10, label: '10 秒' },
  { sec: 30, label: '30 秒' },
  { sec: 60, label: '1 分钟' },
  { sec: 300, label: '5 分钟' },
]

export function SettingsPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const refreshSec = useAppStore(s => s.refreshSec)
  const setRefreshSec = useAppStore(s => s.setRefreshSec)
  if (!open) return null
  return (
    <div className="search-overlay" onClick={onClose}>
      <div className="card" onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 400, animation: 'scaleIn .3s var(--ease-spring) both', padding: 0, overflow: 'hidden' }}>
        <div className="panel-head" style={{ justifyContent: 'space-between' }}>
          <div className="flex items-center gap-2.5">
            <span className="panel-tick" />
            <span className="panel-title">系统设置</span>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-[var(--r-sm)] flex items-center justify-center transition-colors"
            style={{ color: 'var(--t3)', background: 'none', border: 'none', cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>
        <div style={{ padding: 'var(--sp-card)' }}>
          <div className="flex items-center gap-2.5 mb-3">
            <RefreshCw size={15} style={{ color: 'var(--accent)' }} />
            <span className="text-[14px] font-semibold" style={{ color: 'var(--t1)' }}>数据自动刷新频次</span>
          </div>
          <p className="text-[12px] mb-4" style={{ color: 'var(--t3)' }}>影响中控台与各数据列表的后台自动刷新间隔，设置全局生效。</p>
          <div className="grid grid-cols-3 gap-2.5">
            {OPTIONS.map(o => {
              const active = refreshSec === o.sec
              return (
                <button key={o.sec} onClick={() => setRefreshSec(o.sec)}
                  className="py-2.5 rounded-[var(--r-full)] text-[13px] font-semibold transition-all"
                  style={{
                    background: active ? 'var(--accent)' : 'var(--surface-1)',
                    color: active ? '#ffffff' : 'var(--t2)',
                    border: '1px solid ' + (active ? 'var(--accent)' : 'var(--glass-border)'),
                    transitionDuration: 'var(--dur-fast)',
                  }}>
                  {o.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
