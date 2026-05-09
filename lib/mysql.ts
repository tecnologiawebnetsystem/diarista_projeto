import mysql, { type Connection } from 'mysql2/promise'

// HostGator plano compartilhado tem limite restrito de conexoes simultaneas.
// Usamos uma unica conexao reutilizavel com reconexao automatica.

const DB_CONFIG = {
  host: process.env.MYSQL_HOST || 'sh00022.hostgator.com.br',
  port: Number(process.env.MYSQL_PORT) || 3306,
  database: process.env.MYSQL_DATABASE || 'klebe475_limpp_day',
  user: process.env.MYSQL_USER || 'klebe475_talent',
  password: process.env.MYSQL_PASSWORD || 'D05m09@123',
  timezone: '+00:00',
  connectTimeout: 15000,
  typeCast(field: { type: string; length: number; string: () => string | null }, next: () => unknown) {
    if (field.type === 'TINY' && field.length === 1) {
      return field.string() === '1'
    }
    if (field.type === 'JSON') {
      const val = field.string()
      if (!val) return null
      try { return JSON.parse(val) } catch { return val }
    }
    return next()
  },
}

let connection: Connection | null = null

async function getConnection(): Promise<Connection> {
  if (connection) {
    try {
      // Ping para verificar se a conexao ainda esta ativa
      await connection.ping()
      return connection
    } catch {
      // Conexao morreu — recria
      connection = null
    }
  }
  connection = await mysql.createConnection(DB_CONFIG)
  return connection
}

export async function query<T = unknown>(sql: string, params?: unknown[]): Promise<T[]> {
  const conn = await getConnection()
  const [rows] = await conn.execute(sql, params ?? [])
  return rows as T[]
}

export async function queryOne<T = unknown>(sql: string, params?: unknown[]): Promise<T | null> {
  const rows = await query<T>(sql, params)
  return (rows as unknown[]).length > 0 ? rows[0] : null
}

export async function execute(sql: string, params?: unknown[]): Promise<{ insertId: number; affectedRows: number }> {
  const conn = await getConnection()
  const [result] = await conn.execute(sql, params ?? [])
  return result as { insertId: number; affectedRows: number }
}

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export default { query, queryOne, execute }
