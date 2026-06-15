'use client'
import { useState, useEffect } from 'react'

let showFn: (() => void) | null = null
let hideFn: (() => void) | null = null

export function showProgress() { showFn?.() }
export function hideProgress() { hideFn?.() }

export function GlobalProgress() {
  const [visible, setVisible] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    showFn = () => { setVisible(true); setProgress(30) }
    hideFn = () => { setProgress(100); setTimeout(() => { setVisible(false); setProgress(0) }, 300) }
    return () => { showFn = null; hideFn = null }
  }, [])

  useEffect(() => {
    if (visible && progress < 90) {
      const t = setTimeout(() => setProgress(p => Math.min(p + 10, 90)), 200)
      return () => clearTimeout(t)
    }
  }, [visible, progress])

  if (!visible && progress === 0) return null

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] h-[2px] transition-all duration-300"
      style={{
        opacity: visible ? 1 : 0,
        background: `linear-gradient(90deg, transparent ${100 - progress}%, var(--accent) ${100 - progress}%)`,
      }}
    />
  )
}
