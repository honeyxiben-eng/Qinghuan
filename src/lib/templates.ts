export async function downloadTemplate(headers: string[], name: string, sampleRows?: any[][]) {
  const XLSX = await import('xlsx')
  const rows = sampleRows ? [headers, ...sampleRows] : [headers]
  const ws = XLSX.utils.aoa_to_sheet(rows)

  // 列宽自适应
  ws['!cols'] = headers.map((h, i) => {
    const maxLen = rows.reduce((m, r) => Math.max(m, String(r[i] ?? '').length), 0)
    return { wch: Math.max(h.length * 2.2, maxLen) + 4 }
  })

  // 表头样式
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1')
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const addr = XLSX.utils.encode_cell({ r: 0, c: C })
    if (!ws[addr]) continue
    ws[addr].s = {
      font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
      fill: { fgColor: { rgb: '4A9EFF' }, patternType: 'solid' },
      alignment: { horizontal: 'center', vertical: 'center' },
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
  ws['!rows'] = [{ hpx: 26 }]

  const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
  XLSX.writeFile(wb, name + '.xlsx')
}

// ============================================================
// 导入/导出列定义 — 单一事实来源
// 模板表头 = 导出表头；导入时按 aliases 容错匹配（含旧表头）
// ============================================================
export const WELL_TPL = ['井号', '井采线', '片区', '成井时间', '工艺', '备注', '尺寸', '初始水位', '井深', '坐标X', '坐标Y']
export const MON_TPL = ['井号', '日期', '静水位', '动水位', '井深', '流量', '泵深', '泵量', '电机', '厂家', '状态']
export const LAB_TPL = ['井号', '日期', '粘度', '比重', 'pH', '矿化度', 'K⁺', 'Mg²⁺', 'Cl⁻', 'SO₄²⁻', 'Ca²⁺', 'B₂O₃', 'Li⁺', 'Na⁺']

export const WELL_SAMPLE = [['C05001', '新北线', '中部', '2024-01-15', '裸孔', '', '1200', '-15.23', '30.00', '123.456', '67.890']]
export const MON_SAMPLE = [['C05001', '2024-02-01', '-15.20', '-14.80', '30.00', '12.50', '-20.00', '12.50', '7.50', '厂家名', '正常']]
export const LAB_SAMPLE = [['C05001', '2024-02-15', '1.20', '1.2345', '7.20', '250.000', '8.123', '1.234', '120.000', '5.678', '0.456', '0.789', '0.1234', '45.000']]

// 列别名表：导入时任一别名命中即可（兼容平台导出的旧表头/同义表头）
export const WELL_ALIASES: Record<string, string[]> = {
  wellId: ['井号'], shortName: ['井采线', '采线'], completionDate: ['成井时间', '成井日期'],
  technology: ['工艺', '成井工艺'], techNote: ['备注', '工艺备注'], wellSize: ['尺寸', '井口尺寸'],
  initialWaterLevel: ['初始水位', '初见水位'], designDepth: ['井深', '设计井深'],
  coordX: ['坐标X', '坐标x', 'X'], coordY: ['坐标Y', '坐标y', 'Y'],
}
export const MON_ALIASES: Record<string, string[]> = {
  wellId: ['井号'], collectDate: ['日期', '采集日期', '采集时间'], staticWater: ['静水位'],
  dynamicWater: ['动水位', '实测水位'], wellDepth: ['井深'], flowRate: ['流量', '生产流量'],
  pumpDepth: ['泵深', '下泵深度'], pumpFlow: ['泵量', '泵流量'], motorPower: ['电机', '电机功率'],
  manufacturer: ['厂家', '生产厂家'], status: ['状态', '运行情况'],
}
export const LAB_ALIASES: Record<string, string[]> = {
  wellId: ['井号'], shortName: ['井采线'], testDate: ['日期', '测试日期', '化验日期'],
  tester: ['测试员', '化验员'], viscosity: ['粘度'], density: ['比重'], ph: ['pH', 'PH', 'ph'],
  salinity: ['矿化度'], kPlus: ['K⁺', 'K+', 'K'], mg2Plus: ['Mg²⁺', 'Mg2+', 'Mg'],
  clMinus: ['Cl⁻', 'Cl-', 'Cl'], so42Minus: ['SO₄²⁻', 'SO4', 'SO₄'], ca2Plus: ['Ca²⁺', 'Ca2+', 'Ca'],
  b2o3: ['B₂O₃', 'B2O3', 'B'], liPlus: ['Li⁺', 'Li+', 'Li'], naPlus: ['Na⁺', 'Na+', 'Na'],
}

// 运行情况 中文⇄英文 互转（导出显示中文，导入还原英文枚举）
export const STATUS_ZH2EN: Record<string, string> = { 正常: 'normal', 异常: 'abnormal', 停止: 'stopped', 废弃: 'abandoned' }
export const STATUS_EN2ZH: Record<string, string> = { normal: '正常', abnormal: '异常', stopped: '停止', abandoned: '废弃' }

/** 在表头行中定位某字段的列索引（按别名容错） */
export function colFinder(header: any[]) {
  const norm = (s: any) => String(s ?? '').trim()
  const cells = header.map(norm)
  return (aliases: string[]): number => {
    for (const a of aliases) {
      const i = cells.findIndex(c => c === a)
      if (i >= 0) return i
    }
    // 退化为包含匹配
    for (const a of aliases) {
      const i = cells.findIndex(c => c.includes(a))
      if (i >= 0) return i
    }
    return -1
  }
}

/** 解析数值单元格 */
export function num(v: any): number | null {
  if (v === null || v === undefined || v === '' || v === '—') return null
  const n = parseFloat(String(v))
  return Number.isNaN(n) ? null : n
}

/**
 * 解析日期单元格 — 兼容以下场景：
 *   - Excel 日期序列号（数字，如 45382 → 2024-02-28）
 *   - 标准日期字符串 "2024-02-28" / "2024/02/28" / "2024-2-28"
 *   - 中文格式 "2024年2月28日"
 *   - 已经是 YYYY-MM-DD 的直接返回
 * @returns YYYY-MM-DD 格式字符串，或 null
 */
export function parseDate(v: any): string | null {
  if (v === null || v === undefined || v === '') return null

  // 数字：Excel 日期序列号 (epoch: 1899-12-30)
  if (typeof v === 'number') {
    // Excel 认为 1900-01-01 = 1；JS 用 1899-12-30 对齐（兼容 Excel 1900 闰年 bug）
    const excelEpoch = Date.UTC(1899, 11, 30)
    const ms = excelEpoch + v * 86400000
    const d = new Date(ms)
    if (Number.isNaN(d.getTime())) return null
    const y = d.getUTCFullYear()
    // 拒绝超出合理范围的值（年份不在 2010-2099 之间的，可能是误解析）
    if (y < 2010 || y > 2099) {
      // 退化为直接截断，至少不崩
      return String(v).slice(0, 10) || null
    }
    const m = String(d.getUTCMonth() + 1).padStart(2, '0')
    const day = String(d.getUTCDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  const s = String(v).trim()
  if (!s) return null

  // 中文格式：2024年2月28日
  const cn = s.match(/(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日?/)
  if (cn) {
    return `${cn[1]}-${cn[2].padStart(2, '0')}-${cn[3].padStart(2, '0')}`
  }

  // 尝试解析
  const normalized = s.includes('/') ? s.replace(/\//g, '-') : s
  const d = new Date(normalized)
  if (!Number.isNaN(d.getTime())) {
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0')
  }

  // 最后尝试直接截断
  return s.length >= 10 ? s.slice(0, 10) : null
}
