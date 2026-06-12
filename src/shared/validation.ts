// ============================================================
// 智慧盐湖平台 · 三端共享核心 — Zod 校验 Schema
// 服务端 API 与各端表单共用，保证录入规则一致
// ============================================================
import { z } from 'zod'

// 比重：最多 4 位小数
const density = z.number().refine(v => /^-?\d+(\.\d{1,4})?$/.test(String(v)), '比重最多 4 位小数')
// 离子/矿化度：最多 3 位小数
const ion3 = z.number().refine(v => /^-?\d+(\.\d{1,3})?$/.test(String(v)), '最多 3 位小数')
// Li⁺：最多 4 位小数
const ion4 = z.number().refine(v => /^-?\d+(\.\d{1,4})?$/.test(String(v)), '最多 4 位小数')
// 水位类：必须为负值（地下深度）
const negWater = z.number().max(0, '水位应为负值')

const wellIdSchema = z.string().regex(/^[A-Z]\d{2}\d{3}$/i, '井号格式应为如 C05001')
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}/, '日期格式应为 YYYY-MM-DD').or(z.string().length(0))

export const wellCreateSchema = z.object({
  wellId: wellIdSchema,
  lineId: z.number().int().positive().optional(),
  shortName: z.string().optional(),
  completionDate: dateSchema.nullable().optional(),
  technology: z.string().nullable().optional(),
  techNote: z.string().nullable().optional(),
  wellSize: z.string().nullable().optional(),
  initialWaterLevel: negWater.nullable().optional(),
  designDepth: z.number().nullable().optional(),
  coordX: z.number().nullable().optional(),
  coordY: z.number().nullable().optional(),
})
export const wellUpdateSchema = wellCreateSchema.partial().omit({ wellId: true })

export const monitoringCreateSchema = z.object({
  wellId: wellIdSchema,
  collectDate: dateSchema.nullable().optional(),
  staticWater: negWater.nullable().optional(),
  dynamicWater: negWater.nullable().optional(),
  wellDepth: z.number().nullable().optional(),
  flowRate: z.number().nullable().optional(),
  pumpDepth: negWater.nullable().optional(),
  pumpFlow: z.number().nullable().optional(),
  motorPower: z.number().nullable().optional(),
  manufacturer: z.string().nullable().optional(),
  status: z.enum(['normal', 'abnormal', 'stopped', 'abandoned']).default('normal'),
  faultNote: z.string().nullable().optional(),
})
export const monitoringUpdateSchema = monitoringCreateSchema.partial().omit({ wellId: true })

export const labCreateSchema = z.object({
  wellId: wellIdSchema,
  testDate: dateSchema.nullable().optional(),
  tester: z.string().nullable().optional(),
  viscosity: z.number().nullable().optional(),
  density: density.nullable().optional(),
  ph: z.number().min(0).max(14).nullable().optional(),
  salinity: ion3.nullable().optional(),
  kPlus: ion3.nullable().optional(),
  mg2Plus: ion3.nullable().optional(),
  clMinus: ion3.nullable().optional(),
  so42Minus: ion3.nullable().optional(),
  ca2Plus: ion3.nullable().optional(),
  b2o3: ion3.nullable().optional(),
  liPlus: ion4.nullable().optional(),
  naPlus: ion3.nullable().optional(),
})
export const labUpdateSchema = labCreateSchema.partial().omit({ wellId: true })

export const loginSchema = z.object({
  username: z.string().min(1, '请输入用户名'),
  password: z.string().min(1, '请输入密码'),
})
export const registerSchema = z.object({
  username: z.string().min(3, '用户名至少 3 位'),
  password: z.string().min(4, '密码至少 4 位'),
  displayName: z.string().min(1, '请输入显示名称'),
  role: z.enum(['admin', 'lab', 'brine']).default('brine'),
})

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(20),
})

export type WellCreate = z.infer<typeof wellCreateSchema>
export type MonitoringCreate = z.infer<typeof monitoringCreateSchema>
export type LabCreate = z.infer<typeof labCreateSchema>
