import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne, execute, generateUUID } from '@/lib/mysql'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month')
    const year = searchParams.get('year')
    const diaristaId = searchParams.get('diarista_id')

    if (!month || !year) {
      return NextResponse.json({ error: 'month e year sao obrigatorios' }, { status: 400 })
    }

    const startDate = new Date(Number(year), Number(month) - 1, 1).toISOString().split('T')[0]
    const endDate = new Date(Number(year), Number(month), 0).toISOString().split('T')[0]

    let sql = 'SELECT * FROM attendance WHERE date >= ? AND date <= ?'
    const params: unknown[] = [startDate, endDate]

    if (diaristaId) {
      sql += ' AND diarista_id = ?'
      params.push(diaristaId)
    }

    sql += ' ORDER BY date DESC'
    const rows = await query(sql, params)
    return NextResponse.json(rows)
  } catch (error) {
    console.error('GET attendance error:', error)
    return NextResponse.json({ error: 'Erro ao buscar presencas' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { date, day_type, present = true, start_time, end_time, notes, diarista_id, checked_in_by_diarista = false } = body
    const id = generateUUID()

    await execute(
      'INSERT INTO attendance (id, date, day_type, present, start_time, end_time, notes, diarista_id, checked_in_by_diarista) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, date, day_type, present ? 1 : 0, start_time || null, end_time || null, notes || null, diarista_id || null, checked_in_by_diarista ? 1 : 0]
    )
    const created = await queryOne('SELECT * FROM attendance WHERE id = ?', [id])
    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error('POST attendance error:', error)
    return NextResponse.json({ error: 'Erro ao registrar presenca' }, { status: 500 })
  }
}
