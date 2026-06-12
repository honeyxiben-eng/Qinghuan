const { Pool } = require("@neondatabase/serverless")
const p = new Pool({ connectionString: "postgresql://neondb_owner:npg_1Fp9zvEBKlfc@ep-winter-voice-aqszajvs-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require" })
p.query("SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema = 'public'").then(r => { console.log(JSON.stringify(r.rows)); p.end() })
