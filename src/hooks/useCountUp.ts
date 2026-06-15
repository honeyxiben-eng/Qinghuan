'use client'
import { useState, useEffect, useRef } from 'react'

export function useCountUp(target: number, duration: number = 800): number {
  const [count, setCount] = useState(0)
  const prevTarget = useRef(0)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const start = prevTarget.current
    const diff = target - start
    if (diff === 0) return

    const startTime = performance.now()
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(start + diff * eased))
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      } else {
        prevTarget.current = target
      }
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [target, duration])

  return count
}
