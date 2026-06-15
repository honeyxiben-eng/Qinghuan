import { one } from "@/server/db"

export const maxDuration = 30

export async function GET() {
  try {
    await one("SELECT 1")
    return Response.json({ ok: true, time: new Date().toISOString() })
  } catch (e: any) {
    return Response.json({ ok: false, error: e.message }, { status: 500 })
  }
}
