import mysql from 'mysql2/promise'

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'sh00022.hostgator.com.br',
  port: Number(process.env.MYSQL_PORT) || 3306,
  database: process.env.MYSQL_DATABASE || 'klebe475_limpp_day',
  user: process.env.MYSQL_USER || 'klebe475_talent',
  password: process.env.MYSQL_PASSWORD || 'D05m09@123',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+00:00',
})

export default pool

export async function query<T = unknown>(sql: string, params?: unknown[]): Promise<T[]> {
  const [rows] = await pool.execute(sql, params)
  return rows as T[]
}

export async function queryOne<T = unknown>(sql: string, params?: unknown[]): Promise<T | null> {
  const rows = await query<T>(sql, params)
  return (rows as unknown[]).length > 0 ? rows[0] : null
}

export async function execute(sql: string, params?: unknown[]): Promise<{ insertId: number; affectedRows: number }> {
  const [result] = await pool.execute(sql, params)
  return result as { insertId: number; affectedRows: number }
}

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}
