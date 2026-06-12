const Database = require("better-sqlite3")
const { createClient } = require("@libsql/client")
const path = require("path")

const localDb = new Database(path.join(process.cwd(), "prisma", "saltlake.db"))
const turso = createClient({
  url: "libsql://saltlake-jasonxiben.aws-ap-northeast-1.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODAzMTE5MjQsImlkIjoiMDE5ZTgyZGItNWIwMS03OWUwLTg3YmEtZTIzZTlmYjAwMDc3IiwicmlkIjoiODQ0NWU1YzMtMmNjNy00OGVhLTk0NzgtYjA1MjE1YzQ4ZjA4In0.OXBlzFFRDEdcrjP95t8_bqlZqZOmJqoDZUbTbDAncbwN9YtioWs-eYk6Na8UmIzDuGdUjDnVQpTeYiR97HPhCQ"
})

// Tables in dependency order
const tables = ["WellLineInfo", "WellInfo", "DynamicMonitoring", "LabData", "MaintenanceRecord"]

async function migrate() {
  // Skip users table - it was already seeded by initUsersTable
  for (const table of tables) {
    const rows = localDb.prepare(`SELECT * FROM "${table}"`).all()
    if (rows.length === 0) { console.log(`${table}: 0 rows, skip`); continue }
    
    // Get column names from first row
    const cols = Object.keys(rows[0])
    const placeholders = cols.map(() => "?").join(",")
    const sql = `INSERT INTO "${table}" (${cols.map(c => `"${c}"`).join(",")}) VALUES (${placeholders})`
    
    // Insert in batches of 50
    for (let i = 0; i < rows.length; i += 50) {
      const batch = rows.slice(i, i + 50)
      const stmts = batch.map(row => ({ sql, args: cols.map(c => row[c] ?? null) }))
      await turso.batch(stmts, "write")
    }
    console.log(`${table}: ${rows.length} rows migrated`)
  }
  
  console.log("Done!")
  process.exit(0)
}

migrate().catch(e => { console.error(e); process.exit(1) })
