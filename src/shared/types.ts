// ============================================================
// 智慧盐湖平台 · 三端共享核心 — 类型定义
// 纯 TypeScript，无任何框架依赖，可被 Web / uni-app / App 复用
// ============================================================

export type Region = 'N' | 'C' | 'E' | 'S' | 'W'
export type WellStatus = 'normal' | 'abnormal' | 'stopped' | 'abandoned'
export type UserRole = 'admin' | 'lab' | 'brine'

export interface WellLine {
  id: number
  name: string
  shortName: string
  region: Region
  regionSeq: number
}

export interface WellInfo {
  wellId: string
  lineId: number
  completionDate: string | null
  technology: string | null
  techNote: string | null
  wellSize: string | null
  initialWaterLevel: number | null
  designDepth: number | null
  coordX: number | null
  coordY: number | null
  lineName?: string
  shortName?: string
  region?: Region
}

export interface MonitoringRecord {
  id: number
  wellId: string
  collectDate: string
  staticWater: number | null
  dynamicWater: number | null
  wellDepth: number | null
  flowRate: number | null
  pumpDepth: number | null
  pumpFlow: number | null
  motorPower: number | null
  manufacturer: string | null
  status: WellStatus
  faultNote: string | null
  lineName?: string
  region?: Region
}

export interface LabRecord {
  id: number
  wellId: string
  testDate: string
  tester: string | null
  viscosity: number | null
  density: number | null
  ph: number | null
  salinity: number | null
  kPlus: number | null
  mg2Plus: number | null
  clMinus: number | null
  so42Minus: number | null
  ca2Plus: number | null
  naPlus: number | null
  liPlus: number | null
  b2o3: number | null
  lineName?: string
  region?: Region
}

export interface AuthUser {
  id: number
  username: string
  displayName: string
  role: UserRole
}

export interface Paginated<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// ============================================================
// REST API 统一响应封装
// ============================================================
export interface ApiMeta {
  page?: number
  pageSize?: number
  total?: number
  totalPages?: number
}

export interface ApiSuccess<T> {
  success: true
  data: T
  meta?: ApiMeta
  timestamp: string
}

export interface ApiErrorResponse {
  success: false
  error: { code: string; message: string; field?: string }
  timestamp: string
}

export type ApiResponse<T> = ApiSuccess<T> | ApiErrorResponse

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'INTERNAL_ERROR'
