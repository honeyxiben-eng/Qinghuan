'use client'
import Button from '@/components/ui/Button'
import { CheckCircle, XCircle } from 'lucide-react'

interface Props {
  success: boolean
  count: number
  error?: string
  onClose: () => void
}

export function ImportResultModal({ success, count, error, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}>
      <div className="pop p-7 w-full max-w-[380px]"
        style={{
          background: 'var(--surface-3)',
          border: '1px solid var(--glass-border-strong)',
          borderRadius: 'var(--r-xl)',
          boxShadow: 'var(--s-lg)',
          backdropFilter: 'blur(24px)',
        }}
        onClick={e => e.stopPropagation()}>
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
          style={{ background: success ? 'var(--green-soft)' : 'var(--red-soft)' }}>
          {success
            ? <CheckCircle size={28} style={{ color: 'var(--green)' }} />
            : <XCircle size={28} style={{ color: 'var(--red)' }} />
          }
        </div>
        <h3 className="text-[17px] font-bold text-center mb-2" style={{ color: 'var(--t1)' }}>
          {success ? '导入成功' : '导入失败'}
        </h3>
        <p className="text-[13px] text-center mb-6" style={{ color: 'var(--t2)' }}>
          {success
            ? `成功导入 ${count} 条记录`
            : error || '导入过程中发生错误'
          }
        </p>
        <div className="flex justify-center">
          <Button variant="primary" onClick={onClose}>确定</Button>
        </div>
      </div>
    </div>
  )
}
