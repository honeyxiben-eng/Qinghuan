'use client'

import Button from '@/components/ui/Button'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div className="w-14 h-14 rounded-full flex items-center justify-center mb-5"
        style={{ background: 'var(--red-soft)' }}>
        <AlertTriangle size={28} style={{ color: 'var(--red)' }} />
      </div>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--t1)', marginBottom: 8 }}>
        加载出错
      </h2>
      <p style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 20, maxWidth: 360, textAlign: 'center' }}>
        {error.message || '页面数据加载失败，请检查网络后重试'}
      </p>
      <Button variant="primary" onClick={reset}>
        <RefreshCw size={14} />
        重新加载
      </Button>
    </div>
  )
}
