import { NextRequest, NextResponse } from 'next/server'
import { execute } from '@/lib/mysql'

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

type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const body = await request.json()
    const { id } = await context.params

    // id format: "attendance-YEAR-MONTH" | "laundry-YEAR-MONTH" | "transport-YEAR-MONTH"
    const [type, yearStr, monthStr] = id.split('-')
    const year = Number(yearStr)
    const month = Number(monthStr)

    if (!year || !month) {
      return NextResponse.json({ error: 'ID invalido' }, { status: 400 })
    }

    if (type === 'attendance') {
      const setClauses: string[] = []
      const setParams: unknown[] = []

      if (body.status !== undefined) {
        setClauses.push('paid_at = ?')
        setParams.push(body.status === 'paid' ? toMySQLDatetime(body.paid_at || new Date().toISOString()) : null)
      }
      if (body.paid_at !== undefined && body.status === undefined) {
        setClauses.push('paid_at = ?')
        setParams.push(toMySQLDatetime(body.paid_at))
      }
      if (body.receipt_url !== undefined) {
        setClauses.push('receipt_url = ?')
        setParams.push(body.receipt_url)
      }

      if (setClauses.length > 0) {
        setParams.push(month, year)
        await execute(
          `UPDATE monthly_payments SET ${setClauses.join(', ')} WHERE month = ? AND year = ?`,
          setParams
        )
      }
    }

    return NextResponse.json({ id, updated: true })
  } catch (error) {
    console.error('PATCH payment-history error:', error)
    return NextResponse.json({ error: 'Erro ao atualizar pagamento' }, { status: 500 })
  }
}
