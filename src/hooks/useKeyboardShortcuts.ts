'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

const SHORTCUTS = [
  { key: 'k', ctrl: true, action: 'search', label: '搜索' },
  { key: '/', ctrl: true, action: 'help', label: '快捷键帮助' },
  { key: '1', ctrl: true, action: 'nav', path: '/', label: '中控台' },
  { key: '2', ctrl: true, action: 'nav', path: '/wells', label: '基础信息' },
  { key: '3', ctrl: true, action: 'nav', path: '/monitoring', label: '监测数据' },
  { key: '4', ctrl: true, action: 'nav', path: '/lab', label: '化验数据' },
  { key: '5', ctrl: true, action: 'nav', path: '/analysis', label: '数据分析' },
]

export function useKeyboardShortcuts() {
  const router = useRouter()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isInput = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement
      if (isInput) return

      for (const s of SHORTCUTS) {
        const ctrlMatch = s.ctrl ? (e.ctrlKey || e.metaKey) : true
        const keyMatch = e.key.toLowerCase() === s.key.toLowerCase()
        if (ctrlMatch && keyMatch) {
          e.preventDefault()
          if (s.action === 'nav' && s.path) {
            router.push(s.path)
          } else if (s.action === 'search') {
            document.dispatchEvent(new CustomEvent('open-search'))
          }
          return
        }
      }

      if (e.key === 'Escape') {
        document.dispatchEvent(new CustomEvent('close-overlays'))
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [router])
}
