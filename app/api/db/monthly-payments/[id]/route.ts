import { NextRequest, NextResponse } from 'next/server'
import { queryOne, execute } from '@/lib/mysql'

// Convert ISO 8601 date to MySQL DATETIME format (YYYY-MM-DD HH:MM:SS)
function toMySQLDatetime(isoDate: string | null | undefined): string | null {
  if (!isoDate) return null
  try {
    const d = new Date(isoDate)
    if (isNaN(d.getTime())) return null
    return d.toISOString().slice(0, 19).replace('T', ' ')
  } catch {
    return null
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const body = await request.json()

    const allowed = ['month', 'year', 'payment_date', 'payment_due_date', 'monthly_value',
      'loan_deduction', 'receipt_url', 'paid_at', 'hour_limit', 'notes']
    const fields: string[] = []
    const values: unknown[] = []

    for (const key of allowed) {
      if (key in body) {
        fields.push(`${key} = ?`)
        if (key === 'paid_at') {
          values.push(toMySQLDatetime(body[key]))
        } else {
          values.push(body[key] ?? null)
        }
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
