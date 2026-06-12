'use client'
import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

export function useGlobalShortcuts() {
  const router = useRouter()
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const tag = (e.target as HTMLElement).tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) { case '1':e.preventDefault();router.push('/');break; case '2':e.preventDefault();router.push('/wells');break; case '3':e.preventDefault();router.push('/monitoring');break; case '4':e.preventDefault();router.push('/lab');break; case '5':e.preventDefault();router.push('/analysis');break }
    }
  }, [router])
  useEffect(() => { window.addEventListener('keydown', handleKeyDown); return () => window.removeEventListener('keydown', handleKeyDown) }, [handleKeyDown])
}
