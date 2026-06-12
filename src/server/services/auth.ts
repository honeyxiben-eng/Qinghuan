import "server-only"
import { one, run } from "@/server/db"
import { hashSync, compareSync } from "bcryptjs"
import { SignJWT, jwtVerify } from "jose"

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "saltlake-secret-2026")

export interface User { id: number; username: string; displayName: string; role: string }

export async function initUsersTable() {
  await run(`CREATE TABLE IF NOT EXISTS users(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    display_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'brine',
    created_at TEXT DEFAULT (datetime('now'))
  )`)
  const exists = await one<{ c: number }>("SELECT COUNT(*) as c FROM users")
  if (!exists?.c) {
    await run("INSERT INTO users(username,password_hash,display_name,role)VALUES(?,?,?,?)", ["admin", hashSync("admin123", 10), "管理员", "admin"])
    await run("INSERT INTO users(username,password_hash,display_name,role)VALUES(?,?,?,?)", ["lab01", hashSync("lab123", 10), "化验员", "lab"])
    await run("INSERT INTO users(username,password_hash,display_name,role)VALUES(?,?,?,?)", ["brine01", hashSync("brine123", 10), "采卤员", "brine"])
  }
}

export async function registerUser(username: string, password: string, displayName: string, role: string): Promise<{ ok: boolean; error?: string }> {
  const exists = await one<{ c: number }>("SELECT COUNT(*) as c FROM users WHERE username=?", [username])
  if (exists?.c) return { ok: false, error: "用户名已存在" }
  if (password.length < 4) return { ok: false, error: "密码至少4位" }
  await run("INSERT INTO users(username,password_hash,display_name,role)VALUES(?,?,?,?)", [username, hashSync(password, 10), displayName, role])
  return { ok: true }
}

export async function loginUser(username: string, password: string): Promise<{ ok: boolean; user?: User; error?: string }> {
  const u = await one<any>("SELECT * FROM users WHERE username=?", [username])
  if (!u) return { ok: false, error: "用户名或密码错误" }
  if (!compareSync(password, u.password_hash)) return { ok: false, error: "用户名或密码错误" }
  return { ok: true, user: { id: u.id, username: u.username, displayName: u.display_name, role: u.role } }
}

export async function createToken(user: User): Promise<string> {
  return new SignJWT({ sub: String(user.id), role: user.role, name: user.displayName })
    .setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("12h").sign(SECRET)
}

export async function verifyToken(token: string): Promise<User | null> {
  try { const { payload } = await jwtVerify(token, SECRET); return { id: Number(payload.sub), username: "", displayName: payload.name as string, role: payload.role as string } } catch { return null }
}
