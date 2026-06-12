const { createClient } = require("@libsql/client")
const turso = createClient({
  url: "libsql://saltlake-jasonxiben.aws-ap-northeast-1.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODAzMTE5MjQsImlkIjoiMDE5ZTgyZGItNWIwMS03OWUwLTg3YmEtZTIzZTlmYjAwMDc3IiwicmlkIjoiODQ0NWU1YzMtMmNjNy00OGVhLTk0NzgtYjA1MjE1YzQ4ZjA4In0.OXBlzFFRDEdcrjP95t8_bqlZqZOmJqoDZUbTbDAncbwN9YtioWs-eYk6Na8UmIzDuGdUjDnVQpTeYiR97HPhCQ"
})

async function setup() {
  // Create tables in dependency order
  await turso.execute("CREATE TABLE IF NOT EXISTS WellLineInfo (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, shortName TEXT NOT NULL UNIQUE, region TEXT NOT NULL, regionSeq INTEGER NOT NULL)")
  
  await turso.execute("CREATE TABLE IF NOT EXISTS WellInfo (wellId TEXT PRIMARY KEY, lineId INTEGER NOT NULL REFERENCES WellLineInfo(id), completionDate TEXT, technology TEXT, techNote TEXT, wellSize TEXT, initialWaterLevel REAL, designDepth REAL, coordX REAL, coordY REAL)")
  
  await turso.execute("CREATE TABLE IF NOT EXISTS DynamicMonitoring (id INTEGER PRIMARY KEY AUTOINCREMENT, wellId TEXT NOT NULL REFERENCES WellInfo(wellId), collectDate TEXT NOT NULL DEFAULT (datetime('now')), staticWater REAL, dynamicWater REAL, wellDepth REAL, flowRate REAL, pumpDepth REAL, pumpFlow REAL, motorPower REAL, manufacturer TEXT, status TEXT DEFAULT 'normal', faultNote TEXT)")
  
  await turso.execute("CREATE TABLE IF NOT EXISTS LabData (id INTEGER PRIMARY KEY AUTOINCREMENT, wellId TEXT NOT NULL REFERENCES WellInfo(wellId), testDate TEXT NOT NULL DEFAULT (datetime('now')), tester TEXT, viscosity REAL, density REAL, salinity REAL, kPlus REAL, mg2Plus REAL, clMinus REAL, so42Minus REAL, ca2Plus REAL, b2o3 REAL, ph REAL, liPlus REAL, naPlus REAL)")
  
  await turso.execute("CREATE TABLE IF NOT EXISTS MaintenanceRecord (id INTEGER PRIMARY KEY AUTOINCREMENT, wellId TEXT NOT NULL REFERENCES WellInfo(wellId), reportTime TEXT NOT NULL DEFAULT (datetime('now')), faultType TEXT, status TEXT DEFAULT 'pending', handler TEXT, description TEXT)")
  
  console.log("Tables created")
  
  // Now seed users
  const { hashSync } = require("bcryptjs")
  await turso.execute("INSERT OR IGNORE INTO users(username,password_hash,display_name,role)VALUES(?,'?',?,'?')", ["admin", hashSync("admin123", 10), "¹ÜÀíÔ±", "admin"])
  console.log("Users seeded")
  process.exit(0)
}
setup().catch(e => { console.error(e); process.exit(1) })
