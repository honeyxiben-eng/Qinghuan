'use client'
import { exportXLSX, exportCSV } from './export'

type Mapping = (r: any) => string | number | null

/**
 * 大导出异步执行：> 500 行用 Web Worker 预处理，避免主线程卡顿
 * 降级：Worker 不可用时直接同步导出
 */
export async function exportAsync(
  format: 'xlsx' | 'csv',
  filename: string,
  headers: string[],
  rawRows: any[],
  mappings: Mapping[],
  onStart?: () => void,
  onDone?: () => void,
) {
  onStart?.()

  const useWorker = rawRows.length > 500 && typeof Worker !== 'undefined'

  if (useWorker) {
    try {
      const worker = new Worker('/export-worker.js')
      const result = await new Promise<{ headers: string[]; rows: (string | number | null)[][] }>((resolve, reject) => {
        const timeout = setTimeout(() => { worker.terminate(); reject(new Error('timeout')) }, 15000)
        worker.onmessage = (e) => { clearTimeout(timeout); worker.terminate(); resolve(e.data) }
        worker.onerror = (err) => { clearTimeout(timeout); worker.terminate(); reject(err) }
        worker.postMessage({ headers, rawRows, mappings })
      })
      if (format === 'xlsx') exportXLSX({ filename, headers: result.headers, rows: result.rows })
      else exportCSV(filename, result.headers, result.rows)
      onDone?.()
      return
    } catch { /* fallback to sync */ }
  }

  // Sync fallback
  await new Promise(resolve => setTimeout(resolve, 10)) // yield to UI
  const rows = rawRows.map(r => mappings.map(fn => { try { return fn(r) } catch { return '—' } }))
  if (format === 'xlsx') exportXLSX({ filename, headers, rows })
  else exportCSV(filename, headers, rows)
  onDone?.()
}
