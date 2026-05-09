import { NextRequest, NextResponse } from 'next/server'
import { queryOne, execute } from '@/lib/mysql'

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json()
    const { id } = await context.params
    const fields: string[] = []
    const values: unknown[] = []

    const allowed = ['description', 'amount', 'installments', 'installments_paid', 'installment_value', 'status', 'date', 'notes']
    for (const key of allowed) {
      if (key in body) { fields.push(`${key} = ?`); values.push(body[key]) }
    }

    if (fields.length === 0) return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 })

    values.push(id)
    await execute(`UPDATE loans SET ${fields.join(', ')} WHERE id = ?`, values)

    const updated = await queryOne('SELECT * FROM loans WHERE id = ?', [id])
    return NextResponse.json(updated)
  } catch (error) {
    console.error('PATCH loans error:', error)
    return NextResponse.json({ error: 'Erro ao atualizar emprestimo' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    await execute('DELETE FROM loans WHERE id = ?', [id])
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE loans error:', error)
    return NextResponse.json({ error: 'Erro ao deletar emprestimo' }, { status: 500 })
  }
}
