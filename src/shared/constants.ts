// ============================================================
// 智慧盐湖平台 · 三端共享核心 — 业务常量
// 井采线基础数据、片区映射、状态/角色字典
// ============================================================
import type { Region, WellStatus, UserRole } from './types'

export interface WellLineData {
  id: number
  name: string
  shortName: string
  region: Region
  regionSeq: number
  prefix: string
  numbers: number[]
}

export const REGIONS: { key: Region; name: string }[] = [
  { key: 'N', name: '北部' },
  { key: 'C', name: '中部' },
  { key: 'W', name: '西部' },
  { key: 'E', name: '东部' },
  { key: 'S', name: '南部' },
]

export const REGION_NAMES: Record<Region, string> = { N: '北部', C: '中部', W: '西部', E: '东部', S: '南部' }

// 工业仪表盘配色：每个片区一个强调色
export const REGION_COLORS: Record<Region, string> = {
  N: '#38bdf8', // sky
  C: '#34d399', // emerald
  W: '#fbbf24', // amber
  E: '#a78bfa', // violet
  S: '#fb7185', // rose
}

export const WELL_STATUS_LABELS: Record<WellStatus, string> = {
  normal: '正常',
  abnormal: '异常',
  stopped: '停止',
  abandoned: '废弃',
}

export const WELL_STATUS_COLORS: Record<WellStatus, string> = {
  normal: '#34d399',
  abnormal: '#f87171',
  stopped: '#fbbf24',
  abandoned: '#94a3b8',
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: '综合管理',
  lab: '化验',
  brine: '采卤',
}

export const WELL_LINES: WellLineData[] = [
  { id: 1, name: '湖心线', shortName: 'HX', region: 'N', regionSeq: 1, prefix: 'N01', numbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28] },
  { id: 2, name: '湖心一线', shortName: 'HX1', region: 'N', regionSeq: 2, prefix: 'N02', numbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24] },
  { id: 3, name: '湖心二线', shortName: 'HX2', region: 'N', regionSeq: 3, prefix: 'N03', numbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20] },
  { id: 4, name: '新北线', shortName: 'XB', region: 'C', regionSeq: 4, prefix: 'C05', numbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 23, 24, 25, 26, 27, 29] },
  { id: 5, name: '新北试验线', shortName: 'XBSY', region: 'C', regionSeq: 5, prefix: 'C06', numbers: [1, 2, 3, 4, 5] },
  { id: 6, name: '新北一线', shortName: 'XB1', region: 'C', regionSeq: 6, prefix: 'C04', numbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30] },
  { id: 7, name: '钠七延长线', shortName: 'N7YC', region: 'C', regionSeq: 7, prefix: 'C02', numbers: [1, 2, 3, 4, 5, 6] },
  { id: 8, name: '十八线', shortName: '18', region: 'C', regionSeq: 8, prefix: 'C03', numbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
  { id: 9, name: '二十线', shortName: '20', region: 'C', regionSeq: 9, prefix: 'C01', numbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
  { id: 10, name: '钠一线', shortName: 'N1', region: 'E', regionSeq: 10, prefix: 'E01', numbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15] },
  { id: 11, name: '钠七南坝', shortName: 'N7NB', region: 'E', regionSeq: 11, prefix: 'E02', numbers: [51, 52, 54, 56] },
  { id: 12, name: '十一线', shortName: '11', region: 'W', regionSeq: 12, prefix: 'W01', numbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14] },
  { id: 13, name: '十二线', shortName: '12', region: 'W', regionSeq: 13, prefix: 'W02', numbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
  { id: 14, name: '十三线', shortName: '13', region: 'W', regionSeq: 14, prefix: 'W03', numbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
  { id: 15, name: '十四线', shortName: '14', region: 'W', regionSeq: 15, prefix: 'W04', numbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15] },
  { id: 16, name: '西线', shortName: 'X', region: 'W', regionSeq: 16, prefix: 'W05', numbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14] },
  { id: 17, name: '西一线', shortName: 'X1', region: 'W', regionSeq: 17, prefix: 'W06', numbers: [1, 2, 3, 4, 5, 6, 7] },
  { id: 18, name: '南线', shortName: 'N', region: 'S', regionSeq: 18, prefix: 'S01', numbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37] },
  { id: 19, name: '老北线', shortName: 'LB', region: 'S', regionSeq: 19, prefix: 'S02', numbers: [73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 1, 2] },
  { id: 20, name: '新北延长线', shortName: 'XBYC', region: 'S', regionSeq: 20, prefix: 'S03', numbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
  { id: 21, name: '钠七西线', shortName: 'N7X', region: 'S', regionSeq: 21, prefix: 'S04', numbers: [64, 65, 66, 67, 68, 69, 70, 71, 85, 86, 87, 88, 89] },
  { id: 22, name: '钠一延长线', shortName: 'N1YC', region: 'S', regionSeq: 22, prefix: 'S05', numbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
]

/** 生成某条井采线的所有井号 */
export function lineWellIds(line: WellLineData): string[] {
  return line.numbers.map(n => line.prefix + String(n).padStart(3, '0'))
}

/** 全部井号（扁平） */
export function allWellIds(): string[] {
  return WELL_LINES.flatMap(lineWellIds)
}
