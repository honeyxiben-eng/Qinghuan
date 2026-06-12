'use client'
import { RefreshCw, Download, Printer } from 'lucide-react'

interface ToolbarBottomProps {
  onRefresh?: () => void
  onExport?: () => void
  onPrint?: () => void
  loading?: boolean
}

export function ToolbarBottom({ onRefresh, onExport, onPrint, loading }: ToolbarBottomProps) {
  return (
    <div className="float-toolbar">
      {onRefresh && (
        <button onClick={onRefresh} disabled={loading} className="tooltip" data-tip="刷新数据">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          刷新
        </button>
      )}
      <span className="w-px h-4" style={{ background: 'var(--glass-border)' }} />
      {onExport && (
        <button onClick={onExport} className="tooltip" data-tip="导出数据">
          <Download size={15} />
          导出
        </button>
      )}
      <span className="w-px h-4" style={{ background: 'var(--glass-border)' }} />
      {onPrint && (
        <button onClick={onPrint} className="tooltip" data-tip="打印当前页">
          <Printer size={15} />
          打印
        </button>
      )}
    </div>
  )
}
