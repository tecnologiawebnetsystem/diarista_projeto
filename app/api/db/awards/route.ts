import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne, execute, generateUUID } from '@/lib/mysql'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const diaristaId = searchParams.get('diarista_id')

    let sql = 'SELECT * FROM awards'
    const params: unknown[] = []

    if (diaristaId) {
      sql += ' WHERE diarista_id = ?'
      params.push(diaristaId)
    }

    sql += ' ORDER BY period_start DESC'
    const rows = await query(sql, params)
    return NextResponse.json(rows)
  } catch (error) {
    console.error('GET awards error:', error)
    return NextResponse.json({ error: 'Erro ao buscar premiacoes' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { period_start, period_end, value = 300, status = 'pending', diarista_id } = body
    const id = generateUUID()

    await execute(
      `INSERT INTO awards (id, period_start, period_end, value, status, warnings_count, attendance_score, performance_score, conduct_score, diarista_id)
       VALUES (?, ?, ?, ?, ?, 0, 0, 0, 0, ?)`,
      [id, period_start, period_end, value, status, diarista_id || null]
    )
    const created = await queryOne('SELECT * FROM awards WHERE id = ?', [id])
    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error('POST awards error:', error)
    return NextResponse.json({ error: 'Erro ao criar premiacao' }, { status: 500 })
  }
}
