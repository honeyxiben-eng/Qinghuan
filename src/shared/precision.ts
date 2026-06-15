// ============================================================
// 智慧盐湖平台 · 三端共享核心 — 精度与格式化
// SINGLE SOURCE OF TRUTH：所有端的显示/导出/校验精度都来自这里
// ============================================================

export interface PrecisionSpec {
  decimals: number
  unit: string
  /** 是否强制为负值（如水位、泵深） */
  negative?: boolean
}

export const PRECISION = {
  WATER: { decimals: 2, unit: 'm', negative: true },
  WELL_DEPTH: { decimals: 2, unit: 'm' },
  PUMP_DEPTH: { decimals: 2, unit: 'm', negative: true },
  FLOW: { decimals: 2, unit: 'm³/h' },
  PUMP_FLOW: { decimals: 2, unit: 'm³/h' },
  MOTOR: { decimals: 2, unit: 'kW' },
  COORD: { decimals: 3, unit: '' },
  DENSITY: { decimals: 4, unit: '' },
  SALINITY: { decimals: 3, unit: 'g/L' },
  VISCOSITY: { decimals: 2, unit: 'mPa·s' },
  PH: { decimals: 2, unit: '' },
  ION: { decimals: 3, unit: 'g/L' },
  ION_LI: { decimals: 4, unit: 'g/L' },
  ION_B2O3: { decimals: 3, unit: 'g/L' },
} as const satisfies Record<string, PrecisionSpec>

export type PrecisionKey = keyof typeof PRECISION

// 向后兼容：旧代码以 P.WATER 形式取小数位数
export const P: Record<PrecisionKey, number> = Object.fromEntries(
  Object.entries(PRECISION).map(([k, v]) => [k, v.decimals])
) as Record<PrecisionKey, number>

/** 按小数位数格式化，null/undefined → 占位符 */
export function fmt(v: number | null | undefined, d: number): string {
  if (v === null || v === undefined || Number.isNaN(Number(v))) return '—'
  return Number(v).toFixed(d)
}

/** 按精度键格式化（推荐：自动取对应小数位数） */
export function fmtKey(v: number | null | undefined, key: PrecisionKey): string {
  return fmt(v, PRECISION[key].decimals)
}

/** 带单位格式化 */
export function fmtUnit(v: number | null | undefined, key: PrecisionKey): string {
  const s = fmtKey(v, key)
  if (s === '—') return s
  const u = PRECISION[key].unit
  return u ? `${s} ${u}` : s
}

/** 计算用四舍五入，避免浮点误差 */
export function round(v: number, d: number): number {
  const m = Math.pow(10, d)
  return Math.round(v * m) / m
}

/** 负值字段失焦自动转换：正数 → 负数并补齐小数位 */
export function toNegative(v: number, key: PrecisionKey): number {
  const spec = PRECISION[key]
  const n = v > 0 ? -v : v
  return round(n, spec.decimals)
}

/** 统一日期格式化为 YYYY-MM-DD，兼容 Excel 序列号 */
export function fmtDate(v: unknown): string {
  if (v === null || v === undefined || v === '') return '—'
  try {
    // Date 对象
    if (v instanceof Date) {
      if (Number.isNaN(v.getTime())) return '—'
      return v.toISOString().slice(0, 10)
    }
    // 数字：Excel 日期序列号 (epoch: 1899-12-30)
    if (typeof v === 'number' && v > 1000 && v < 100000) {
      const excelEpoch = Date.UTC(1899, 11, 30)
      const d = new Date(excelEpoch + v * 86400000)
      if (!Number.isNaN(d.getTime())) {
        const y = d.getUTCFullYear()
        if (y >= 2010 && y <= 2099) {
          return `${y}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
        }
      }
      return String(v).slice(0, 10)
    }
    const s = String(v).trim()
    if (!s) return '—'
    // 中文格式
    const cn = s.match(/(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日?/)
    if (cn) return `${cn[1]}-${cn[2].padStart(2, '0')}-${cn[3].padStart(2, '0')}`
    // 标准日期字符串
    const d = new Date(s.includes('/') ? s.replace(/\//g, '-') : s)
    if (!Number.isNaN(d.getTime())) {
      const y = d.getFullYear()
      if (y >= 2010 && y <= 2099) {
        return `${y}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      }
    }
    // 退化为截断
    return s.slice(0, 10) || '—'
  } catch {
    return '—'
  }
}
