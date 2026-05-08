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

    let sql = 'SELECT * FROM notes WHERE date >= ? AND date <= ?'
    const params: unknown[] = [startDate, endDate]

    if (diaristaId) {
      sql += ' AND diarista_id = ?'
      params.push(diaristaId)
    }

    sql += ' ORDER BY date DESC'
    const rows = await query(sql, params)
    return NextResponse.json(rows)
  } catch (error) {
    console.error('GET notes error:', error)
    return NextResponse.json({ error: 'Erro ao buscar anotacoes' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { date, note_type, content, is_warning = false, diarista_id } = body
    const id = generateUUID()

    await execute(
      'INSERT INTO notes (id, date, note_type, content, is_warning, diarista_id) VALUES (?, ?, ?, ?, ?, ?)',
      [id, date, note_type, content, is_warning ? 1 : 0, diarista_id || null]
    )
    const created = await queryOne('SELECT * FROM notes WHERE id = ?', [id])
    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error('POST notes error:', error)
    return NextResponse.json({ error: 'Erro ao criar anotacao' }, { status: 500 })
  }
}
