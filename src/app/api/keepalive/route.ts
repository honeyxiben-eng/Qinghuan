import { Pool } from "@neondatabase/serverless"

export const maxDuration = 30

export async function GET() {
  try {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL!, max: 1, idleTimeoutMillis: 5000, connectionTimeoutMillis: 25000 })
    await pool.query("SELECT 1")
    await pool.end()
    return Response.json({ ok: true, time: new Date().toISOString() })
  } catch (e: any) {
    return Response.json({ ok: false, error: e.message }, { status: 500 })
  }
}
