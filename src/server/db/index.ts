import { createClient, type Client } from "@libsql/client"
import path from "path"

const TURSO_URL = process.env.TURSO_DATABASE_URL
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN
const isTurso = !!(TURSO_URL && TURSO_TOKEN)

let client: Client | null = null

function getClient(): Client {
  if (!client) {
    if (isTurso) {
      client = createClient({ url: TURSO_URL!, authToken: TURSO_TOKEN! })
    } else {
      const dbPath = path.resolve(process.cwd(), "prisma", "saltlake.db")
      client = createClient({ url: `file:${dbPath}` })
    }
  }
  return client
}

function toObj(columns: string[], row: any[]): any {
  const obj: any = {}
  for (let i = 0; i < columns.length; i++) {
    obj[columns[i]] = row[i]
  }
  return obj
}

function norm(sql: string): string {
  return sql.replace(/\$\d+/g, "?")
}

export async function all<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const c = getClient()
  const result = await c.execute({ sql: norm(sql), args: params })
  return result.rows.map(row => toObj(result.columns, row as unknown as any[])) as T[]
}

export async function one<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
  const c = getClient()
  const result = await c.execute({ sql: norm(sql), args: params })
  if (result.rows.length === 0) return undefined
  return toObj(result.columns, result.rows[0] as unknown as any[]) as T
}

export async function run(sql: string, params: any[] = []): Promise<{ changes: number; lastInsertRowid: number }> {
  const c = getClient()
  const result = await c.execute({ sql: norm(sql), args: params })
  return {
    changes: result.rowsAffected,
    lastInsertRowid: Number(result.lastInsertRowid ?? 0),
  }
}

export async function tx<T>(fn: () => Promise<T>): Promise<T> {
  const c = getClient()
  await c.execute("BEGIN")
  try {
    const result = await fn()
    await c.execute("COMMIT")
    return result
  } catch (e) {
    await c.execute("ROLLBACK")
    throw e
  }
}

// Initialize pragmas and indexes
async function init() {
  const c = getClient()
  // WAL and other pragmas are handled by libsql/Turso automatically
  // Create indexes if they don't exist
  await c.execute(`
    CREATE INDEX IF NOT EXISTS idx_dm_wellId ON DynamicMonitoring(wellId)
  `)
  await c.execute(`
    CREATE INDEX IF NOT EXISTS idx_dm_collectDate ON DynamicMonitoring(collectDate)
  `)
  await c.execute(`
    CREATE INDEX IF NOT EXISTS idx_ld_wellId ON LabData(wellId)
  `)
  await c.execute(`
    CREATE INDEX IF NOT EXISTS idx_ld_testDate ON LabData(testDate)
  `)
  await c.execute(`
    CREATE INDEX IF NOT EXISTS idx_wi_lineId ON WellInfo(lineId)
  `)
}

// Run init on module load
init().catch(console.error)

export default getClient
