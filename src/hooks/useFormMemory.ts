'use client'
import { useEffect, useRef } from 'react'

/**
 * 录入表单自动记忆
 * - mount 时从 localStorage 恢复上次值
 * - 表单变化时自动保存（300ms 防抖）
 * - 成功提交后通过 onPersist 持久化
 */
export function useFormMemory<T extends Record<string, string>>(
  key: string,
  defaults: T,
): { restore: () => T; save: (vals: Partial<T>) => void; clear: () => void } {
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    return () => clearTimeout(timerRef.current)
  }, [])

  const storageKey = 'sl-form-' + key

  function restore(): T {
    try {
      if (typeof window === 'undefined') return defaults
      const raw = localStorage.getItem(storageKey)
      if (!raw) return defaults
      return { ...defaults, ...JSON.parse(raw) }
    } catch { return defaults }
  }

  function save(vals: Partial<T>) {
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      try {
        const prev = JSON.parse(localStorage.getItem(storageKey) || '{}')
        localStorage.setItem(storageKey, JSON.stringify({ ...prev, ...vals }))
      } catch { /* quota exceeded or corrupt */ }
    }, 300)
  }

  function clear() {
    try { localStorage.removeItem(storageKey) } catch { /* */ }
  }

  return { restore, save, clear }
}
