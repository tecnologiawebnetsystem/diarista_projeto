import { NextRequest, NextResponse } from 'next/server'
import { queryOne, execute, generateUUID } from '@/lib/mysql'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const body = await request.json()
    const { payment_date, notes } = body

    const loan = await queryOne<{
      id: string; diarista_id: string; installments: number
      installments_paid: number; installment_value: number; status: string
    }>('SELECT * FROM loans WHERE id = ?', [id])

    if (!loan) return NextResponse.json({ error: 'Emprestimo nao encontrado' }, { status: 404 })
    if (loan.status !== 'active') return NextResponse.json({ error: 'Emprestimo nao esta ativo' }, { status: 400 })

    const newPaid = loan.installments_paid + 1
    const newStatus = newPaid >= loan.installments ? 'paid' : 'active'

    // Registra pagamento
    const payId = generateUUID()
    await execute(
      'INSERT INTO loan_payments (id, loan_id, diarista_id, amount, payment_date, notes) VALUES (?, ?, ?, ?, ?, ?)',
      [payId, id, loan.diarista_id, loan.installment_value, payment_date || new Date().toISOString().split('T')[0], notes || null]
    )

    // Atualiza parcelas pagas e status
    await execute(
      'UPDATE loans SET installments_paid = ?, status = ? WHERE id = ?',
      [newPaid, newStatus, id]
    )

    const updated = await queryOne('SELECT * FROM loans WHERE id = ?', [id])
    return NextResponse.json({ loan: updated, paid_installment: newPaid, new_status: newStatus })
  } catch (error) {
    console.error('POST loans pay error:', error)
    return NextResponse.json({ error: 'Erro ao registrar pagamento' }, { status: 500 })
  }
}
