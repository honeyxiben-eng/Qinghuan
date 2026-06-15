import { run, one, all } from '@/server/db'

interface AuditEntry {
  userId?: string
  action: string
  entityType: string
  entityId?: string
  oldValues?: any
  newValues?: any
  ipAddress?: string
}

export async function auditLog(entry: AuditEntry) {
  try {
    await run(
      `INSERT INTO AuditLog (userId, action, entityType, entityId, oldValues, newValues, ipAddress)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        entry.userId || null,
        entry.action,
        entry.entityType,
        entry.entityId || null,
        entry.oldValues ? JSON.stringify(entry.oldValues) : null,
        entry.newValues ? JSON.stringify(entry.newValues) : null,
        entry.ipAddress || null,
      ]
    )
  } catch {
    // Silent fail - audit should never break the main flow
  }
}

export async function getAuditLogs(opts: {
  entityType?: string
  entityId?: string
  userId?: string
  page?: number
  pageSize?: number
}) {
  const conditions: string[] = []
  const params: any[] = []

  if (opts.entityType) {
    conditions.push('entityType = ?')
    params.push(opts.entityType)
  }
  if (opts.entityId) {
    conditions.push('entityId = ?')
    params.push(opts.entityId)
  }
  if (opts.userId) {
    conditions.push('userId = ?')
    params.push(opts.userId)
  }

  const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''
  const page = opts.page || 1
  const pageSize = opts.pageSize || 20

  const countResult = await one<{ count: number }>(
    `SELECT COUNT(*) as count FROM AuditLog ${where}`,
    params
  )
  const total = countResult?.count || 0

  const data = await all(
    `SELECT * FROM AuditLog ${where} ORDER BY createdAt DESC LIMIT ? OFFSET ?`,
    [...params, pageSize, (page - 1) * pageSize]
  )

  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}
