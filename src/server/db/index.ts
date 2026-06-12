import Database from "better-sqlite3"
import path from "path"

const DB_PATH = path.resolve(process.cwd(), "prisma", "saltlake.db")
const db = new Database(DB_PATH)
db.pragma("journal_mode = WAL")
db.pragma("foreign_keys = ON")
db.pragma("busy_timeout = 5000")

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_dm_wellId ON DynamicMonitoring(wellId);
  CREATE INDEX IF NOT EXISTS idx_dm_collectDate ON DynamicMonitoring(collectDate);
  CREATE INDEX IF NOT EXISTS idx_ld_wellId ON LabData(wellId);
  CREATE INDEX IF NOT EXISTS idx_ld_testDate ON LabData(testDate);
  CREATE INDEX IF NOT EXISTS idx_wi_lineId ON WellInfo(lineId);
`)

function norm(sql: string): string {
  return sql.replace(/\$\d+/g, "?")
}

export function all<T = any>(sql: string, params: any[] = []): T[] {
  const stmt = db.prepare(norm(sql))
  return params.length > 0 ? stmt.all(params[0], ...params.slice(1)) as T[] : stmt.all() as T[]
}

export function one<T = any>(sql: string, params: any[] = []): T | undefined {
  const stmt = db.prepare(norm(sql))
  return params.length > 0 ? stmt.get(params[0], ...params.slice(1)) as T | undefined : stmt.get() as T | undefined
}

export function run(sql: string, params: any[] = []): { changes: number; lastInsertRowid: number | bigint } {
  const stmt = db.prepare(norm(sql))
  const result = params.length > 0 ? stmt.run(params[0], ...params.slice(1)) : stmt.run()
  return { changes: result.changes, lastInsertRowid: Number(result.lastInsertRowid ?? 0) }
}

export function tx<T>(fn: () => T): T {
  const transaction = db.transaction(fn)
  return transaction()
}

export default db
