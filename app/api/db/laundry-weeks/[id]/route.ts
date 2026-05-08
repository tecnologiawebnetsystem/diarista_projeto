import { NextRequest, NextResponse } from 'next/server'
import { queryOne, execute } from '@/lib/mysql'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    const allowed = ['value', 'ironed', 'washed', 'transport_fee', 'transport_paid_amount', 'receipt_url', 'paid_at']
    const fields: string[] = []
    const values: unknown[] = []

    for (const key of allowed) {
      if (key in body) {
        fields.push(`${key} = ?`)
        if (key === 'ironed' || key === 'washed') {
          values.push(body[key] ? 1 : 0)
        } else {
          values.push(body[key] ?? null)
        }
      }
    }

    if (fields.length === 0) return NextResponse.json({ error: 'Nenhum campo' }, { status: 400 })
    fields.push('updated_at = NOW()')
    values.push(id)

    await execute(`UPDATE laundry_weeks SET ${fields.join(', ')} WHERE id = ?`, values)
    const updated = await queryOne('SELECT * FROM laundry_weeks WHERE id = ?', [id])
    return NextResponse.json(updated)
  } catch (error) {
    console.error('PATCH laundry-weeks error:', error)
    return NextResponse.json({ error: 'Erro ao atualizar semana de lavanderia' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await execute('DELETE FROM laundry_weeks WHERE id = ?', [id])
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE laundry-weeks error:', error)
    return NextResponse.json({ error: 'Erro ao deletar semana de lavanderia' }, { status: 500 })
  }
}
