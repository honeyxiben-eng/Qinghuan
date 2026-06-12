const { createClient } = require("@libsql/client")
const t = createClient({ url: "libsql://saltlake-jasonxiben.aws-ap-northeast-1.turso.io", authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODAzMTE5MjQsImlkIjoiMDE5ZTgyZGItNWIwMS03OWUwLTg3YmEtZTIzZTlmYjAwMDc3IiwicmlkIjoiODQ0NWU1YzMtMmNjNy00OGVhLTk0NzgtYjA1MjE1YzQ4ZjA4In0.OXBlzFFRDEdcrjP95t8_bqlZqZOmJqoDZUbTbDAncbwN9YtioWs-eYk6Na8UmIzDuGdUjDnVQpTeYiR97HPhCQ" })
async function main() {
  const r1 = await t.execute("SELECT collectDate FROM DynamicMonitoring LIMIT 3")
  console.log("SAMPLE:", JSON.stringify(r1.rows))
  const r2 = await t.execute("SELECT strftime('%Y-%m',collectDate) as m FROM DynamicMonitoring LIMIT 3")
  console.log("STRFTIME:", JSON.stringify(r2.rows))
  const r3 = await t.execute("SELECT substr(collectDate,1,7) as m FROM DynamicMonitoring LIMIT 3")
  console.log("SUBSTR:", JSON.stringify(r3.rows))
  const r4 = await t.execute("SELECT DISTINCT substr(collectDate,1,7) as m FROM DynamicMonitoring ORDER BY m DESC LIMIT 5")
  console.log("MONTHS:", JSON.stringify(r4.rows))
}
main().catch(e => console.error(e))
