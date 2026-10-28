import { Pool, type QueryResultRow } from 'pg'

type Params = unknown[]

function withExplicitSslMode(connectionString: string | undefined): string | undefined {
  if (!connectionString) return connectionString

  try {
    const url = new URL(connectionString)
    url.searchParams.set('sslmode', 'verify-full')
    return url.toString()
  } catch {
    return connectionString
  }
}

const pool = new Pool({
  connectionString: withExplicitSslMode(process.env.DATABASE_URL),
  max: 5,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
})

function toPostgresSql(sql: string): string {
  let index = 0
  return sql
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\?/g, () => `$${++index}`)
    .replace(/MONTH\(([^)]+)\)/gi, 'EXTRACT(MONTH FROM $1)')
    .replace(/YEAR\(([^)]+)\)/gi, 'EXTRACT(YEAR FROM $1)')
    .replace(/\bNOW\(\)/gi, 'now()')
    .replace(/\bTRUE\b/gi, 'true')
    .replace(/\bFALSE\b/gi, 'false')
    .replace(/\bON DUPLICATE KEY UPDATE id = id/gi, 'ON CONFLICT DO NOTHING')
}

function normalizeParams(params: Params): Params {
  return params.map((value) => {
    if (typeof value === 'boolean') return value
    if (value === undefined) return null
    return value
  })
}

export async function query<T extends QueryResultRow = QueryResultRow>(sql: string, params: Params = []): Promise<T[]> {
  const result = await pool.query<T>(toPostgresSql(sql), normalizeParams(params))
  return result.rows
}

export async function queryOne<T extends QueryResultRow = QueryResultRow>(sql: string, params: Params = []): Promise<T | null> {
  const rows = await query<T>(sql, params)
  return rows[0] ?? null
}

export async function execute(sql: string, params: Params = []): Promise<{ insertId: number; affectedRows: number }> {
  const result = await pool.query(toPostgresSql(sql), normalizeParams(params))
  return { insertId: 0, affectedRows: result.rowCount ?? 0 }
}

export function generateUUID(): string {
  return crypto.randomUUID()
}

export async function closeDatabase(): Promise<void> {
  await pool.end()
}
