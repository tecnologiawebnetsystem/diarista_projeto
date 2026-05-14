import mysql, { type Connection, type FieldPacket, type QueryResult } from 'mysql2/promise'

// HostGator plano compartilhado tem limite restrito de conexoes simultaneas.
// Usamos uma unica conexao reutilizavel com reconexao automatica.

const DB_CONFIG: mysql.ConnectionOptions = {
  host: process.env.MYSQL_HOST || 'sh00022.hostgator.com.br',
  port: Number(process.env.MYSQL_PORT) || 3306,
  database: process.env.MYSQL_DATABASE || 'klebe475_limpp_day',
  user: process.env.MYSQL_USER || 'klebe475_talent',
  password: process.env.MYSQL_PASSWORD || 'D05m09@123',
  timezone: '+00:00',
  connectTimeout: 15000,
  typeCast(field, next) {
    if (field.type === 'TINY' && field.length === 1) {
      return field.string() === '1'
    }
    if (field.type === 'JSON') {
      // Usar utf8 conforme recomendado pelo mysql2 para evitar dados BINARY
      const val = field.string('utf8')
      if (!val) return null
      try { return JSON.parse(val) } catch { return val }
    }
    return next()
  },
}

// Versão do cache de conexão - incrementar para forçar reconexão
const CONNECTION_VERSION = 2
let connection: Connection | null = null
let connectionVersion = 0

async function getConnection(): Promise<Connection> {
  // Invalida conexão se a versão mudou
  if (connectionVersion !== CONNECTION_VERSION) {
    if (connection) {
      try { await connection.end() } catch { /* ignore */ }
    }
    connection = null
    connectionVersion = CONNECTION_VERSION
  }
  
  if (connection) {
    try {
      await connection.ping()
      return connection
    } catch {
      connection = null
    }
  }
  connection = await mysql.createConnection(DB_CONFIG)
  return connection
}

// mysql2 usa um tipo interno para os valores de parametros.
// Usamos um cast via 'as Parameters' para manter compatibilidade de tipos.
type ExecParams = Parameters<Connection['execute']>[1]

export async function query<T = unknown>(sql: string, params?: unknown[]): Promise<T[]> {
  const conn = await getConnection()
  const [rows] = await conn.execute(sql, (params ?? []) as ExecParams) as [QueryResult, FieldPacket[]]
  return rows as T[]
}

export async function queryOne<T = unknown>(sql: string, params?: unknown[]): Promise<T | null> {
  const rows = await query<T>(sql, params)
  return (rows as unknown[]).length > 0 ? rows[0] : null
}

export async function execute(sql: string, params?: unknown[]): Promise<{ insertId: number; affectedRows: number }> {
  const conn = await getConnection()
  const [result] = await conn.execute(sql, (params ?? []) as ExecParams) as [{ insertId: number; affectedRows: number }, FieldPacket[]]
  return result
}

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}
