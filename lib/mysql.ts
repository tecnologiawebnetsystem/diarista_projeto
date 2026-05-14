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

let connection: Connection | null = null
let connectionPromise: Promise<Connection> | null = null
let lastConnectionError: number = 0
const CONNECTION_COOLDOWN = 10000 // 10 segundos de espera após erro de conexão

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function createConnectionWithRetry(retries = 3): Promise<Connection> {
  for (let i = 0; i < retries; i++) {
    try {
      const conn = await mysql.createConnection(DB_CONFIG)
      connection = conn
      lastConnectionError = 0
      return conn
    } catch (err: unknown) {
      const error = err as { code?: string }
      console.error(`[v0] Connection attempt ${i + 1}/${retries} failed:`, error?.code || err)
      
      // Se for erro de muitas conexões, esperar mais tempo
      if (error?.code === 'ER_TOO_MANY_USER_CONNECTIONS') {
        lastConnectionError = Date.now()
        if (i < retries - 1) {
          const waitTime = (i + 1) * 5000 // 5s, 10s, 15s
          console.log(`[v0] Waiting ${waitTime}ms before retry...`)
          await sleep(waitTime)
        }
      } else {
        // Outros erros, falhar imediatamente
        throw err
      }
    }
  }
  throw new Error('Failed to connect after multiple retries')
}

async function getConnection(): Promise<Connection> {
  // Se já há uma conexão sendo criada, aguardar ela
  if (connectionPromise) {
    return connectionPromise
  }

  // Se houve erro recente de conexão, aguardar cooldown
  if (lastConnectionError > 0) {
    const elapsed = Date.now() - lastConnectionError
    if (elapsed < CONNECTION_COOLDOWN) {
      const waitTime = CONNECTION_COOLDOWN - elapsed
      console.log(`[v0] Connection cooldown, waiting ${waitTime}ms...`)
      await sleep(waitTime)
    }
  }

  // Se já temos conexão válida, testar e retornar
  if (connection) {
    try {
      await connection.ping()
      return connection
    } catch {
      // Conexão morreu, limpar
      connection = null
    }
  }

  // Criar nova conexão - guarda a Promise ANTES de await
  // para que outras chamadas concorrentes aguardem esta mesma Promise
  connectionPromise = createConnectionWithRetry().catch(err => {
    connectionPromise = null
    connection = null
    throw err
  }).finally(() => {
    connectionPromise = null
  })

  return connectionPromise
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
