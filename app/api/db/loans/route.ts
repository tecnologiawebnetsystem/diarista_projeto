import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne, execute, generateUUID } from '@/lib/mysql'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const diaristaId = searchParams.get('diarista_id')
    const status = searchParams.get('status')

    let sql = 'SELECT * FROM loans WHERE 1=1'
    const params: unknown[] = []

    if (diaristaId) { sql += ' AND diarista_id = ?'; params.push(diaristaId) }
    if (status) { sql += ' AND status = ?'; params.push(status) }

    sql += ' ORDER BY date DESC'
    const rows = await query(sql, params)
    return NextResponse.json(rows)
  } catch (error) {
    console.error('GET loans error:', error)
    return NextResponse.json({ error: 'Erro ao buscar emprestimos' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { diarista_id, description, amount, installments = 1, date, notes } = body

    if (!diarista_id || !description || !amount || !date) {
      return NextResponse.json({ error: 'Campos obrigatorios: diarista_id, description, amount, date' }, { status: 400 })
    }

    const installmentValue = parseFloat((amount / installments).toFixed(2))
    const id = generateUUID()

    await execute(
      'INSERT INTO loans (id, diarista_id, description, amount, installments, installments_paid, installment_value, status, date, notes) VALUES (?, ?, ?, ?, ?, 0, ?, \'active\', ?, ?)',
      [id, diarista_id, description, amount, installments, installmentValue, date, notes || null]
    )

    const created = await queryOne('SELECT * FROM loans WHERE id = ?', [id])
    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error('POST loans error:', error)
    return NextResponse.json({ error: 'Erro ao criar emprestimo' }, { status: 500 })
  }
}
