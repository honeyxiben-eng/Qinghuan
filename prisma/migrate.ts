#!/usr/bin/env npx tsx
// ============================================
// SQLite → PostgreSQL 数据迁移脚本
// 用法: npx tsx prisma/migrate.ts
// ============================================

import Database from 'better-sqlite3'
import { Pool } from 'pg'
import * as path from 'path'

// ── 配置 ──
const SQLITE_PATH = path.join(__dirname, 'saltlake.db')
const PG_URL = process.env.DATABASE_URL || 'postgresql://postgres:saltlake_dev_2026@localhost:5432/saltlake'

const pool = new Pool({ connectionString: PG_URL, max: 5 })

// ── 精度转换辅助 ──
function toNum(v: any, decimals: number): number | null {
  if (v === null || v === undefined) return null
  const n = Number(v)
  if (isNaN(n)) return null
  return Math.round(n * Math.pow(10, decimals)) / Math.pow(10, decimals)
}

function toDate(v: any): string | null {
  if (!v) return null
  try {
    if (v instanceof Date) {
      const ts = v.getTime()
      if (isNaN(ts) || ts < -62135596800000 || ts > 253402300799999) return null
      return v.toISOString().split('T')[0]
    }
    const s = String(v).trim()
    if (!s || s === '—' || s === '-') return null

    // Handle numbers (Excel serial dates or large timestamps)
    const n = Number(s)
    if (!isNaN(n) && s.length >= 8 && n > 100000) return null

    // Parse date string
    const d = new Date(s.includes('/') ? s.replace(/\//g, '-') : s)
    const ts = d.getTime()
    if (isNaN(ts) || ts < -62135596800000 || ts > 253402300799999) return null

    return d.toISOString().split('T')[0]
  } catch { return null }
}

// ── 状态映射 ──
function mapStatus(s: string): string {
  const m: Record<string, string> = {
    '正常': 'normal', '异常': 'abnormal',
    '停止': 'stopped', '停用': 'stopped',
    '废弃': 'abandoned', 'normal': 'normal',
    'abnormal': 'abnormal', 'stopped': 'stopped', 'abandoned': 'abandoned',
  }
  return m[s] || 'normal'
}

function mapTechnology(t: string): string {
  if (t === '裸孔' || t === 'luo_kong') return 'luo_kong'
  if (t === '全管' || t === 'quan_guan') return 'quan_guan'
  if (t === '双管') return 'shuang_guan'
  return t || 'luo_kong'
}

function mapMaintStatus(s: string): string {
  if (s === '待处理') return 'pending'
  if (s === '处理中') return 'processing'
  if (s === '已完成') return 'completed'
  return 'pending'
}

function mapFaultType(s: string | null): string | null {
  if (!s) return null
  if (s.includes('故障')) return 'fault_repair'
  if (s.includes('定期') || s.includes('检修')) return 'scheduled'
  if (s.includes('应急') || s.includes('抢修')) return 'emergency'
  return 'fault_repair'
}

// ════════════════════════════════════════
// 主迁移流程
// ════════════════════════════════════════
async function migrate() {
  console.log('🔌 连接 SQLite:', SQLITE_PATH)
  const sqlite = new Database(SQLITE_PATH)
  sqlite.pragma('journal_mode = WAL')

  console.log('🔌 连接 PostgreSQL:', PG_URL.replace(/\/\/.*@/, '//***@'))

  // 测试 PG 连接
  await pool.query('SELECT 1')
  console.log('✅ PostgreSQL 连接成功')

  // Add missing enum values
  await pool.query("ALTER TYPE well_tech ADD VALUE IF NOT EXISTS 'shuang_guan'").catch(() => {})
  console.log('   ✅ 已补充 well_tech 枚举值')

  let totalRows = 0

  // ═══ 1. 井采线 ═══
  console.log('\n📦 迁移 well_lines...')
  const lines = sqlite.prepare('SELECT * FROM WellLineInfo ORDER BY id').all() as any[]
  for (const l of lines) {
    await pool.query(
      `INSERT INTO well_lines (id, name, short_name, region, region_seq)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (id) DO UPDATE SET name=$2, short_name=$3, region=$4, region_seq=$5`,
      [l.id, l.name, l.shortName, l.region, l.regionSeq]
    )
  }
  console.log(`   ✅ ${lines.length} 条`); totalRows += lines.length

  // 重置序列
  if (lines.length > 0) {
    await pool.query(`SELECT setval('well_lines_id_seq', $1)`, [lines.length])
  }

  // ═══ 2. 采卤井 ═══
  console.log('📦 迁移 wells...')
  const wells = sqlite.prepare('SELECT * FROM WellInfo ORDER BY wellId').all() as any[]
  let wellCount = 0, wellSkipped = 0
  for (const w of wells) {
    try {
      await pool.query(
        `INSERT INTO wells (well_id, line_id, completion_date, technology, tech_note,
           well_size, initial_water_level, design_depth, coord_x, coord_y)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         ON CONFLICT (well_id) DO UPDATE SET
           line_id=$2, completion_date=$3, technology=$4, tech_note=$5,
           well_size=$6, initial_water_level=$7, design_depth=$8, coord_x=$9, coord_y=$10`,
        [w.wellId, w.lineId, toDate(w.completionDate),
         mapTechnology(w.technology || ''), w.techNote || null, w.wellSize || null,
         toNum(w.initialWaterLevel, 2), toNum(w.designDepth, 2),
         w.coordX ? toNum(w.coordX, 3) : null, w.coordY ? toNum(w.coordY, 3) : null]
      )
      wellCount++
    } catch (rowErr: any) {
      console.log(`   ⚠️ 跳过 ${w.wellId}: ${rowErr.message?.substring(0,60)}`)
      wellSkipped++
    }
  }
  console.log(`   ✅ ${wellCount} 条` + (wellSkipped > 0 ? ` (跳过 ${wellSkipped} 条)` : ''))
  totalRows += wellCount

  // ═══ 3. 动态监测 ═══
  console.log('📦 迁移 dynamic_monitoring...')
  const monitorings = sqlite.prepare('SELECT * FROM DynamicMonitoring ORDER BY id').all() as any[]
  let monCount = 0, monSkipped = 0
  for (const r of monitorings) {
    try {
    await pool.query(
      `INSERT INTO dynamic_monitoring (id, well_id, collect_date, static_water,
         dynamic_water, well_depth, flow_rate, pump_depth, pump_flow,
         motor_power, manufacturer, status, fault_note)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       ON CONFLICT (id) DO UPDATE SET
         well_id=$2, collect_date=$3, static_water=$4, dynamic_water=$5,
         well_depth=$6, flow_rate=$7, pump_depth=$8, pump_flow=$9,
         motor_power=$10, manufacturer=$11, status=$12, fault_note=$13`,
      [r.id, r.wellId, toDate(r.collectDate),
       toNum(r.staticWater, 2), toNum(r.dynamicWater, 2),
       toNum(r.wellDepth, 2), toNum(r.flowRate, 2),
       toNum(r.pumpDepth, 2), toNum(r.pumpFlow, 2),
       toNum(r.motorPower, 2), r.manufacturer || null,
       mapStatus(r.status), r.faultNote || null]
      )
      monCount++
    } catch (rowErr: any) {
      console.log(`   ⚠️ 跳过 monitoring#${r.id}: ${rowErr.message?.substring(0,60)}`)
      monSkipped++
    }
  }
  console.log(`   ✅ ${monCount} 条` + (monSkipped > 0 ? ` (跳过 ${monSkipped} 条)` : ''))
  totalRows += monCount

  if (monitorings.length > 0) {
    await pool.query(`SELECT setval('dynamic_monitoring_id_seq', $1)`, [monitorings.length])
  }

  // ═══ 4. 化验数据 ═══
  console.log('📦 迁移 lab_data...')
  const labData = sqlite.prepare('SELECT * FROM LabData ORDER BY id').all() as any[]
  let labCount = 0, labSkipped = 0
  for (const r of labData) {
    try {
    await pool.query(
      `INSERT INTO lab_data (id, well_id, test_date, tester, viscosity,
         density, ph, salinity, k_plus, mg2_plus, cl_minus, so42_minus,
         ca2_plus, b2o3, li_plus, na_plus)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
       ON CONFLICT (id) DO UPDATE SET
         well_id=$2, test_date=$3, tester=$4, viscosity=$5, density=$6,
         ph=$7, salinity=$8, k_plus=$9, mg2_plus=$10, cl_minus=$11, so42_minus=$12,
         ca2_plus=$13, b2o3=$14, li_plus=$15, na_plus=$16`,
      [r.id, r.wellId, toDate(r.testDate), r.tester || null,
       toNum(r.viscosity, 2), toNum(r.density, 4),
       r.ph != null ? toNum(r.ph, 2) : null,
       toNum(r.salinity, 3), toNum(r.kPlus, 3), toNum(r.mg2Plus, 3),
       toNum(r.clMinus, 3), toNum(r.so42Minus, 3), toNum(r.ca2Plus, 3),
       toNum(r.b2o3, 3), toNum(r.liPlus, 4), toNum(r.naPlus, 3)]
      )
      labCount++
    } catch (rowErr: any) {
      console.log(`   ⚠️ 跳过 lab#${r.id}: ${rowErr.message?.substring(0,60)}`)
      labSkipped++
    }
  }
  console.log(`   ✅ ${labCount} 条` + (labSkipped > 0 ? ` (跳过 ${labSkipped} 条)` : ''))
  totalRows += labCount

  if (labData.length > 0) {
    await pool.query(`SELECT setval('lab_data_id_seq', $1)`, [labData.length])
  }

  // ═══ 5. 维修记录 ═══
  console.log('📦 迁移 maintenance_records...')
  const maintenances = sqlite.prepare('SELECT * FROM MaintenanceRecord ORDER BY id').all() as any[]
  let maintCount = 0, maintSkipped = 0
  for (const r of maintenances) {
    try {
    await pool.query(
      `INSERT INTO maintenance_records (id, well_id, report_time, fault_type,
         status, handler, description)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (id) DO UPDATE SET
         well_id=$2, report_time=$3, fault_type=$4,
         status=$5, handler=$6, description=$7`,
      [r.id, r.wellId, r.reportTime ? new Date(r.reportTime).toISOString() : new Date().toISOString(),
       mapFaultType(r.faultType), mapMaintStatus(r.status), r.handler || null, r.description || null]
      )
      maintCount++
    } catch (rowErr: any) {
      console.log(`   ⚠️ 跳过 maint#${r.id}: ${rowErr.message?.substring(0,60)}`)
      maintSkipped++
    }
  }
  console.log(`   ✅ ${maintCount} 条` + (maintSkipped > 0 ? ` (跳过 ${maintSkipped} 条)` : ''))
  totalRows += maintCount

  if (maintenances.length > 0) {
    await pool.query(`SELECT setval('maintenance_records_id_seq', $1)`, [maintenances.length])
  }

  // ═══ 数据校验 ═══
  console.log('\n🔍 数据完整性校验...')
  const checks = [
    ['well_lines', 'WellLineInfo'],
    ['wells', 'WellInfo'],
    ['dynamic_monitoring', 'DynamicMonitoring'],
    ['lab_data', 'LabData'],
    ['maintenance_records', 'MaintenanceRecord'],
  ]

  let allPassed = true
  for (const [pgTable, sqliteTable] of checks) {
    const pgCount = Number((await pool.query(`SELECT COUNT(*) as cnt FROM ${pgTable}`)).rows[0].cnt)
    const sqliteCount = (sqlite.prepare(`SELECT COUNT(*) as cnt FROM ${sqliteTable}`).get() as any).cnt
    const match = pgCount === sqliteCount
    console.log(`   ${match ? '✅' : '❌'} ${pgTable}: PG=${pgCount} SQLite=${sqliteCount}`)
    if (!match) allPassed = false
  }

  // ═══ 清理 ═══
  sqlite.close()
  await pool.end()

  console.log(`\n${allPassed ? '🎉 迁移完成！' : '⚠️ 迁移完成但存在差异，请检查！'}`)
  console.log(`📊 总计迁移 ${totalRows} 行数据`)
}

migrate().catch((err) => {
  console.error('❌ 迁移失败:', err.message)
  console.error(err.stack)
  process.exit(1)
})
