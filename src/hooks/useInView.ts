'use client'
import { useEffect, useRef, useState } from 'react'

/** IntersectionObserver — 元素进入视口才返回 true，用于图表懒加载 */
export function useInView(options?: IntersectionObserverInit): [React.RefObject<HTMLDivElement | null>, boolean] {
  const ref = useRef<HTMLDivElement | null>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect() } },
      { rootMargin: '200px', ...options }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return [ref, inView]
}
