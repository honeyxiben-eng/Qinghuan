const local = require("better-sqlite3")("prisma/saltlake.db")
const { createClient } = require("@libsql/client")
const { hashSync } = require("bcryptjs")
const turso = createClient({ url: "libsql://saltlake-jasonxiben.aws-ap-northeast-1.turso.io", authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODAzMTE5MjQsImlkIjoiMDE5ZTgyZGItNWIwMS03OWUwLTg3YmEtZTIzZTlmYjAwMDc3IiwicmlkIjoiODQ0NWU1YzMtMmNjNy00OGVhLTk0NzgtYjA1MjE1YzQ4ZjA4In0.OXBlzFFRDEdcrjP95t8_bqlZqZOmJqoDZUbTbDAncbwN9YtioWs-eYk6Na8UmIzDuGdUjDnVQpTeYiR97HPhCQ" })

async function main() {
  // 1. Add prefix column
  await turso.execute("ALTER TABLE WellLineInfo ADD COLUMN prefix TEXT")
  console.log("prefix column added")

  // 2. Migrate WellLineInfo (all columns including prefix)
  const wli = local.prepare("SELECT * FROM WellLineInfo").all()
  for (const r of wli) {
    await turso.execute({
      sql: "INSERT INTO WellLineInfo(id,name,shortName,region,regionSeq,prefix) VALUES (?,?,?,?,?,?)",
      args: [r.id, r.name, r.shortName, r.region, r.regionSeq, r.prefix]
    })
  }
  console.log(`WellLineInfo: ${wli.length} rows`)

  // 3. Migrate WellInfo (no prefix column issue)
  const wi = local.prepare("SELECT * FROM WellInfo").all()
  for (const r of wi) {
    await turso.execute({
      sql: "INSERT INTO WellInfo(wellId,lineId,completionDate,technology,techNote,wellSize,initialWaterLevel,designDepth,coordX,coordY) VALUES (?,?,?,?,?,?,?,?,?,?)",
      args: [r.wellId, r.lineId, r.completionDate, r.technology, r.techNote, r.wellSize, r.initialWaterLevel, r.designDepth, r.coordX, r.coordY]
    })
  }
  console.log(`WellInfo: ${wi.length} rows`)

  // 4. Migrate DynamicMonitoring
  const dm = local.prepare("SELECT * FROM DynamicMonitoring").all()
  for (const r of dm) {
    await turso.execute({
      sql: "INSERT INTO DynamicMonitoring(id,wellId,collectDate,staticWater,dynamicWater,wellDepth,flowRate,pumpDepth,pumpFlow,motorPower,manufacturer,status,faultNote) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
      args: [r.id, r.wellId, r.collectDate, r.staticWater, r.dynamicWater, r.wellDepth, r.flowRate, r.pumpDepth, r.pumpFlow, r.motorPower, r.manufacturer, r.status, r.faultNote]
    })
  }
  console.log(`DynamicMonitoring: ${dm.length} rows`)

  // 5. Migrate LabData
  const ld = local.prepare("SELECT * FROM LabData").all()
  for (const r of ld) {
    await turso.execute({
      sql: "INSERT INTO LabData(id,wellId,testDate,tester,viscosity,density,salinity,kPlus,mg2Plus,clMinus,so42Minus,ca2Plus,b2o3,ph,liPlus,naPlus) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
      args: [r.id, r.wellId, r.testDate, r.tester, r.viscosity, r.density, r.salinity, r.kPlus, r.mg2Plus, r.clMinus, r.so42Minus, r.ca2Plus, r.b2o3, r.ph, r.liPlus, r.naPlus]
    })
  }
  console.log(`LabData: ${ld.length} rows`)

  // 6. Migrate MaintenanceRecord
  const mr = local.prepare("SELECT * FROM MaintenanceRecord").all()
  for (const r of mr) {
    await turso.execute({
      sql: "INSERT INTO MaintenanceRecord(id,wellId,reportTime,faultType,status,handler,description) VALUES (?,?,?,?,?,?,?)",
      args: [r.id, r.wellId, r.reportTime, r.faultType, r.status, r.handler, r.description]
    })
  }
  console.log(`MaintenanceRecord: ${mr.length} rows`)

  // 7. Seed users
  const exists = (await turso.execute("SELECT COUNT(*) as c FROM users")).rows[0]
  if (!exists || Number(exists[0]) === 0) {
    const h = hashSync("admin123", 10)
    await turso.execute({ sql: "INSERT INTO users(username,password_hash,display_name,role) VALUES (?,?,?,?)", args: ["admin", h, "管理员", "admin"] })
    await turso.execute({ sql: "INSERT INTO users(username,password_hash,display_name,role) VALUES (?,?,?,?)", args: ["lab01", hashSync("lab123", 10), "化验员", "lab"] })
    await turso.execute({ sql: "INSERT INTO users(username,password_hash,display_name,role) VALUES (?,?,?,?)", args: ["brine01", hashSync("brine123", 10), "采卤员", "brine"] })
    console.log("Users seeded")
  }

  console.log("ALL DONE")
  process.exit(0)
}
main().catch(e => { console.error(e); process.exit(1) })
