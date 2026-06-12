export async function downloadTemplate(headers: string[], name: string, sampleRows?: any[][]) {
  const XLSX = await import('xlsx')
  const rows = sampleRows ? [headers, ...sampleRows] : [headers]
  const ws = XLSX.utils.aoa_to_sheet(rows)
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

export const WELL_SAMPLE = [['C05001', '新北线', '中部', '2024-01-15', '裸孔', '', '1200', '-15.23', '30.00', '123.45', '67.89']]
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
