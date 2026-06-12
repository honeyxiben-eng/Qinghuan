'use client'
import Button from '@/components/ui/Button'
import { AlertTriangle } from 'lucide-react'

interface P {
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
}

export default function ConfirmModal({ title, message, onConfirm, onCancel, loading }: P) {
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(6px)' }}
      onClick={onCancel}>
      <div className="pop p-7 w-full max-w-[420px]"
        style={{
          background: 'var(--surface-3)',
          border: '1px solid var(--glass-border-strong)',
          borderRadius: 'var(--r-xl)',
          boxShadow: 'var(--s-lg)',
          backdropFilter: 'blur(24px)',
        }}
        onClick={e => e.stopPropagation()}>
        <div className="w-12 h-12 rounded-full flex items-center justify-center mb-5"
          style={{ background: 'var(--red-soft)' }}>
          <AlertTriangle size={24} style={{ color: 'var(--red)' }} />
        </div>

        <h3 className="text-[17px] font-bold mb-2" style={{ color: 'var(--t1)' }}>{title}</h3>
        <p className="text-[13px] mb-6 leading-relaxed" style={{ color: 'var(--t2)' }}>{message}</p>

        <div className="flex justify-end gap-2.5">
          <Button variant="secondary" onClick={onCancel}>取消</Button>
          <Button variant="danger" onClick={onConfirm} loading={loading}>
            确定删除
          </Button>
        </div>
      </div>
    </div>
  )
}
