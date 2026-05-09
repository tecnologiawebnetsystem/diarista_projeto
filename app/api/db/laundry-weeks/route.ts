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

    let sql = 'SELECT * FROM laundry_weeks WHERE month = ? AND year = ?'
    const params: unknown[] = [month, year]

    if (diaristaId) {
      sql += ' AND diarista_id = ?'
      params.push(diaristaId)
    }

    sql += ' ORDER BY week_number ASC'
    const rows = await query(sql, params)
    return NextResponse.json(rows)
  } catch (error) {
    console.error('GET laundry-weeks error:', error)
    return NextResponse.json({ error: 'Erro ao buscar semanas de lavanderia' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { week_number, month, year, value = 0, ironed = false, washed = false,
      transport_fee = 0, transport_paid_amount = 0, diarista_id, paid_at = null, receipt_url = null } = body
    const id = generateUUID()

    await execute(
      `INSERT INTO laundry_weeks (id, week_number, month, year, value, ironed, washed, transport_fee, transport_paid_amount, diarista_id, paid_at, receipt_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, week_number, month, year, value, ironed ? 1 : 0, washed ? 1 : 0, transport_fee, transport_paid_amount, diarista_id || null, paid_at, receipt_url]
    )
    const created = await queryOne('SELECT * FROM laundry_weeks WHERE id = ?', [id])
    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error('POST laundry-weeks error:', error)
    return NextResponse.json({ error: 'Erro ao criar semana de lavanderia' }, { status: 500 })
  }
}
