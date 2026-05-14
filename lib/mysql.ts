import mysql, { type Pool, type FieldPacket, type RowDataPacket, type ResultSetHeader } from 'mysql2/promise'

// HostGator plano compartilhado tem limite restrito de conexoes simultaneas.
// Usamos um Connection Pool com limite de 1 conexao para garantir que nao
// excedemos o limite do servidor.

const DB_CONFIG: mysql.PoolOptions = {
  host: process.env.MYSQL_HOST || 'sh00022.hostgator.com.br',
  port: Number(process.env.MYSQL_PORT) || 3306,
  database: process.env.MYSQL_DATABASE || 'klebe475_limpp_day',
  user: process.env.MYSQL_USER || 'klebe475_talent',
  password: process.env.MYSQL_PASSWORD || 'D05m09@123',
  timezone: '+00:00',
  connectTimeout: 30000,
  waitForConnections: true,
  connectionLimit: 1, // Apenas 1 conexao no pool
  maxIdle: 1,
  idleTimeout: 60000, // Fecha conexao apos 1 minuto de inatividade
  queueLimit: 50, // Maximo de queries aguardando na fila
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  typeCast(field, next) {
    if (field.type === 'TINY' && field.length === 1) {
      return field.string() === '1'
    }
    if (field.type === 'JSON') {
      const val = field.string('utf8')
      if (!val) return null
      try { return JSON.parse(val) } catch { return val }
    }
    return next()
  },
}

// Pool singleton - criado uma unica vez
let pool: Pool | null = null

function getPool(): Pool {
  if (!pool) {
    pool = mysql.createPool(DB_CONFIG)
  }
  return pool
}

export async function query<T = RowDataPacket>(sql: string, params?: unknown[]): Promise<T[]> {
  const p = getPool()
  try {
    const [rows] = await p.execute<T[] & RowDataPacket[]>(sql, params ?? [])
    return rows
  } catch (err: unknown) {
    const error = err as { code?: string; message?: string }
    // Se for erro de conexao, tenta resetar o pool
    if (error?.code === 'ECONNRESET' || error?.code === 'PROTOCOL_CONNECTION_LOST') {
      if (pool) {
        try { await pool.end() } catch { /* ignore */ }
        pool = null
      }
      // Retry uma vez
      const newPool = getPool()
      const [rows] = await newPool.execute<T[] & RowDataPacket[]>(sql, params ?? [])
      return rows
    }
    throw err
  }
}

export async function queryOne<T = RowDataPacket>(sql: string, params?: unknown[]): Promise<T | null> {
  const rows = await query<T>(sql, params)
  return rows.length > 0 ? rows[0] : null
}

export async function execute(sql: string, params?: unknown[]): Promise<{ insertId: number; affectedRows: number }> {
  const p = getPool()
  try {
    const [result] = await p.execute<ResultSetHeader>(sql, params ?? [])
    return { insertId: result.insertId, affectedRows: result.affectedRows }
  } catch (err: unknown) {
    const error = err as { code?: string }
    if (error?.code === 'ECONNRESET' || error?.code === 'PROTOCOL_CONNECTION_LOST') {
      if (pool) {
        try { await pool.end() } catch { /* ignore */ }
        pool = null
      }
      const newPool = getPool()
      const [result] = await newPool.execute<ResultSetHeader>(sql, params ?? [])
      return { insertId: result.insertId, affectedRows: result.affectedRows }
    }
    throw err
  }
}

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}
