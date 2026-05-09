import { NextRequest, NextResponse } from 'next/server'
import { queryOne, execute } from '@/lib/mysql'

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const body = await request.json()

    const allowed = ['month', 'year', 'payment_date', 'payment_due_date', 'monthly_value',
      'receipt_url', 'paid_at', 'hour_limit', 'notes']
    const fields: string[] = []
    const values: unknown[] = []

    for (const key of allowed) {
      if (key in body) {
        fields.push(`${key} = ?`)
        values.push(body[key] ?? null)
      }
    }

    if (fields.length === 0) return NextResponse.json({ error: 'Nenhum campo' }, { status: 400 })
    fields.push('updated_at = NOW()')
    values.push(id)

    await execute(`UPDATE monthly_payments SET ${fields.join(', ')} WHERE id = ?`, values)
    const updated = await queryOne('SELECT * FROM monthly_payments WHERE id = ?', [id])
    return NextResponse.json(updated)
  } catch (error) {
    console.error('PATCH monthly-payments error:', error)
    return NextResponse.json({ error: 'Erro ao atualizar pagamento' }, { status: 500 })
  }
}
