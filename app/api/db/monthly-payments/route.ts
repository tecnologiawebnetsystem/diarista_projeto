import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne, execute, generateUUID } from '@/lib/mysql'

function calculate5thBusinessDay(month: number, year: number): string {
  let count = 0
  const d = new Date(year, month - 1, 1)
  while (count < 5) {
    const dow = d.getDay()
    if (dow !== 0 && dow !== 6) count++
    if (count < 5) d.setDate(d.getDate() + 1)
  }
  return d.toISOString().split('T')[0]
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month')
    const year = searchParams.get('year')
    const diaristaId = searchParams.get('diarista_id')
    const paidOnly = searchParams.get('paid_only') === '1'

    // Se paid_only: retorna todos os pagamentos pagos (sem exigir month/year)
    if (paidOnly) {
      let sql = 'SELECT * FROM monthly_payments WHERE paid_at IS NOT NULL'
      const params: unknown[] = []
      if (diaristaId) { sql += ' AND diarista_id = ?'; params.push(diaristaId) }
      sql += ' ORDER BY year DESC, month DESC'
      const rows = await query(sql, params)
      return NextResponse.json(rows)
    }

    if (!month || !year) {
      return NextResponse.json({ error: 'month e year sao obrigatorios' }, { status: 400 })
    }

    let sql = 'SELECT * FROM monthly_payments WHERE month = ? AND year = ?'
    const params: unknown[] = [month, year]

    if (diaristaId) {
      sql += ' AND diarista_id = ?'
      params.push(diaristaId)
    }

    sql += ' LIMIT 1'
    const row = await queryOne(sql, params)
    return NextResponse.json(row)
  } catch (error) {
    console.error('GET monthly-payments error:', error)
    return NextResponse.json({ error: 'Erro ao buscar pagamento' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { month, year, diarista_id, monthly_value, payment_date, paid_at, receipt_url, notes: paymentNotes, hour_limit } = body

    // Buscar valor mensal da config se nao fornecido
    let resolvedValue = monthly_value
    if (!resolvedValue) {
      const cfgRows = await query<{ key: string; value: number }>('SELECT `key`, value FROM config WHERE `key` = ?', ['monthly_salary'])
      resolvedValue = cfgRows[0]?.value || 2000
    }

    const dueDate = calculate5thBusinessDay(Number(month), Number(year))
    const id = generateUUID()

    await execute(
      `INSERT INTO monthly_payments (id, month, year, payment_due_date, monthly_value, hour_limit, diarista_id, payment_date, paid_at, receipt_url, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE id = id`,
      [id, month, year, dueDate, resolvedValue, hour_limit || '20:00:00', diarista_id || null, payment_date || null, paid_at || null, receipt_url || null, paymentNotes || null]
    )

    let sql = 'SELECT * FROM monthly_payments WHERE month = ? AND year = ?'
    const params: unknown[] = [month, year]
    if (diarista_id) { sql += ' AND diarista_id = ?'; params.push(diarista_id) }
    const row = await queryOne(sql, params)
    return NextResponse.json(row, { status: 201 })
  } catch (error) {
    console.error('POST monthly-payments error:', error)
    return NextResponse.json({ error: 'Erro ao criar pagamento' }, { status: 500 })
  }
}
