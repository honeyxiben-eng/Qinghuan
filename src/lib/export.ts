import * as XLSX from 'xlsx'

interface ExportOptions {
  filename: string
  headers: string[]
  rows: (string | number | null)[][]
  colWidths?: number[]
  summaryRow?: (string | number | null)[]
}

/** 自动计算列宽：取表头×2 与数据最大宽度中较大者，加 4 留白 */
function autoWidth(headers: string[], rows: (string | number | null)[][]): number[] {
  return headers.map((h, i) => {
    const dataMax = rows.reduce((m, r) => Math.max(m, String(r[i] ?? '').length), 0)
    return Math.max(h.length * 2.2, dataMax) + 4
  })
}

export function exportXLSX(opts: ExportOptions) {
  const { filename, headers, rows, colWidths, summaryRow } = opts
  const wb = XLSX.utils.book_new()
  const data = [headers, ...rows]
  if (summaryRow) data.push(summaryRow)
  const ws = XLSX.utils.aoa_to_sheet(data)

  // 列宽
  ws['!cols'] = (colWidths || autoWidth(headers, rows)).map(w => ({ wch: Math.min(w, 55) }))

  // 表头范围引用
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1')
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const addr = XLSX.utils.encode_cell({ r: 0, c: C })
    if (!ws[addr]) continue
    ws[addr].s = {
      font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
      fill: { fgColor: { rgb: '4A9EFF' }, patternType: 'solid' },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: false },
    }
  }

  // 数据行居中
  for (let R = 1; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const addr = XLSX.utils.encode_cell({ r: R, c: C })
      if (!ws[addr]) continue
      ws[addr].s = {
        alignment: { horizontal: 'center', vertical: 'center' },
        font: { sz: 10.5 },
      }
    }
  }

  // 行高
  ws['!rows'] = [{ hpx: 28 }]

  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
  XLSX.writeFile(wb, new Date().toISOString().slice(0, 10) + '_' + filename + '.xlsx')
}

export function exportXLSXSimple(filename: string, headers: string[], rows: (string | number | null)[][]) {
  exportXLSX({ filename, headers, rows })
}

/** BOM + CSV 导出，Excel 直接打开不乱码 */
export function exportCSV(filename: string, headers: string[], rows: (string | number | null)[][]) {
  const BOM = '﻿'
  const escape = (v: any) => { const s = String(v ?? ''); return s.includes(',') || s.includes('"') || s.includes('\n') ? '"' + s.replace(/"/g, '""') + '"' : s }
  const csv = BOM + [headers.join(','), ...rows.map(r => r.map(escape).join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = new Date().toISOString().slice(0, 10) + '_' + filename + '.csv'
  a.click(); URL.revokeObjectURL(url)
}
