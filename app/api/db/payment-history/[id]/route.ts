import { NextRequest, NextResponse } from 'next/server'
import { execute } from '@/lib/mysql'

// Tabela virtual (nao existe payment_history como tabela real).
// Os registros vem de attendance + monthly_payments + laundry_weeks.
// Este endpoint apenas atualiza monthly_payments baseado no id virtual.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json()
    const { id } = await params

    // id format: "attendance-YEAR-MONTH" | "laundry-YEAR-MONTH" | "transport-YEAR-MONTH"
    const [type, yearStr, monthStr] = id.split('-')
    const year = Number(yearStr)
    const month = Number(monthStr)

    if (!year || !month) {
      return NextResponse.json({ error: 'ID invalido' }, { status: 400 })
    }

    if (type === 'attendance') {
      // Atualiza monthly_payments correspondente
      const setClauses: string[] = []
      const setParams: unknown[] = []

      if (body.status !== undefined) { setClauses.push('paid_at = ?'); setParams.push(body.status === 'paid' ? (body.paid_at || new Date().toISOString()) : null) }
      if (body.paid_at !== undefined && body.status === undefined) { setClauses.push('paid_at = ?'); setParams.push(body.paid_at) }
      if (body.receipt_url !== undefined) { setClauses.push('receipt_url = ?'); setParams.push(body.receipt_url) }

      if (setClauses.length > 0) {
        setParams.push(month, year)
        await execute(`UPDATE monthly_payments SET ${setClauses.join(', ')} WHERE month = ? AND year = ?`, setParams)
      }
    }

    return NextResponse.json({ id, updated: true })
  } catch (error) {
    console.error('PATCH payment-history error:', error)
    return NextResponse.json({ error: 'Erro ao atualizar pagamento' }, { status: 500 })
  }
}
