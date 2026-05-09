import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne, execute, generateUUID } from '@/lib/mysql'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month')
    const year = searchParams.get('year')
    const diaristaId = searchParams.get('diarista_id')
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')
    const isWarning = searchParams.get('is_warning')
    const countOnly = searchParams.get('count_only') === '1'

    // Modo por intervalo direto (para awards)
    if (dateFrom && dateTo) {
      let sql = 'SELECT * FROM notes WHERE date >= ? AND date <= ?'
      const params: unknown[] = [dateFrom, dateTo]
      if (diaristaId) { sql += ' AND diarista_id = ?'; params.push(diaristaId) }
      if (isWarning) { sql += ' AND is_warning = ?'; params.push(isWarning === '1' ? 1 : 0) }
      if (countOnly) {
        const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as cnt')
        const rows = await query<{ cnt: number }>(countSql, params)
        return NextResponse.json({ count: rows[0]?.cnt || 0 })
      }
      sql += ' ORDER BY date DESC'
      const rows = await query(sql, params)
      return NextResponse.json(rows)
    }

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
