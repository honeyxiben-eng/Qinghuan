const { Pool } = require("@neondatabase/serverless")
const { hashSync, compareSync } = require("bcryptjs")
const p = new Pool({ connectionString: "postgresql://neondb_owner:npg_1Fp9zvEBKlfc@ep-winter-voice-aqszajvs-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require" })

async function main() {
  // Check current users
  let r = await p.query("SELECT * FROM users")
  console.log("BEFORE:", r.rows.length, "users")

  // Delete all and re-insert with known hash
  await p.query("DELETE FROM users")
  const hash = hashSync("admin123", 10)
  await p.query("INSERT INTO users(username,password_hash,display_name,role) VALUES ($1,$2,$3,$4)", ["admin", hash, "¹ÜÀíÔ±", "admin"])

  // Verify
  r = await p.query("SELECT * FROM users WHERE username = $1", ["admin"])
  const u = r.rows[0]
  console.log("INSERTED:", u)
  console.log("HASH MATCHES:", compareSync("admin123", u.password_hash))
  await p.end()
}
main().catch(e => { console.error(e.message); process.exit(1) })
