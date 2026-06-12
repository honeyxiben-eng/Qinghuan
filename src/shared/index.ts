// ============================================================
// 智慧盐湖平台 · 三端共享核心 — 统一出口
// ============================================================
export * from './types'
export * from './precision'
export * from './constants'
export * from './api-client'
// validation 单独导出（依赖 zod，移动端按需引入）
export * as schemas from './validation'
