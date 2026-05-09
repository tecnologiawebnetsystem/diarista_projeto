import { NextRequest, NextResponse } from 'next/server'
import { query, execute } from '@/lib/mysql'
import { randomUUID } from 'crypto'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const diaristaId = searchParams.get('diarista_id')

  let sql = 'SELECT * FROM contract_agreements'
  const params: unknown[] = []
  if (diaristaId) {
    sql += ' WHERE diarista_id = ?'
    params.push(diaristaId)
  }
  sql += ' ORDER BY agreed_at DESC LIMIT 1'

  const rows = await query(sql, params)
  return NextResponse.json(rows)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const id = randomUUID()
  const agreedAt = body.agreed_at || new Date().toISOString()

  await execute(
    'INSERT INTO contract_agreements (id, agreed_at, ip_address, user_agent, diarista_id, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    [id, agreedAt, body.ip_address ?? null, body.user_agent ?? null, body.diarista_id ?? null, agreedAt]
  )

  const rows = await query('SELECT * FROM contract_agreements WHERE id = ?', [id])
  return NextResponse.json(rows[0], { status: 201 })
}
