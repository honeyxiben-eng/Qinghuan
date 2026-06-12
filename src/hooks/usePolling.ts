'use client'
import { useEffect, useRef } from 'react'
import { useAppStore } from '@/lib/store'

/**
 * 统一轮询：按全局可配置的刷新频次定时执行 fn。
 * - enabled=false 时不轮询
 * - refreshSec=0 表示关闭自动刷新
 */
export function usePolling(fn: () => void, enabled = true) {
  const refreshSec = useAppStore(s => s.refreshSec)
  const fnRef = useRef(fn)
  fnRef.current = fn

  useEffect(() => {
    if (!enabled || !refreshSec || refreshSec <= 0) return
    const t = setInterval(() => fnRef.current(), refreshSec * 1000)
    return () => clearInterval(t)
  }, [enabled, refreshSec])
}
