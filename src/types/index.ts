// 向后兼容：类型已迁移至 @/shared，这里重导出保持现有 import 路径有效
export type {
  Region,
  WellStatus,
  UserRole,
  WellLine,
  WellInfo,
  MonitoringRecord,
  LabRecord,
  AuthUser,
  Paginated,
} from '@/shared/types'
