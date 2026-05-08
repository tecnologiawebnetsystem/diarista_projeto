import { NextRequest, NextResponse } from 'next/server'
import { queryOne, execute } from '@/lib/mysql'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    const allowed = ['date', 'day_type', 'present', 'start_time', 'end_time', 'notes']
    const fields: string[] = []
    const values: unknown[] = []

    for (const key of allowed) {
      if (key in body) {
        fields.push(`${key} = ?`)
        values.push(key === 'present' ? (body[key] ? 1 : 0) : (body[key] ?? null))
      }
    }

    if (fields.length === 0) return NextResponse.json({ error: 'Nenhum campo' }, { status: 400 })
    fields.push('updated_at = NOW()')
    values.push(id)

    await execute(`UPDATE attendance SET ${fields.join(', ')} WHERE id = ?`, values)
    const updated = await queryOne('SELECT * FROM attendance WHERE id = ?', [id])
    return NextResponse.json(updated)
  } catch (error) {
    console.error('PATCH attendance error:', error)
    return NextResponse.json({ error: 'Erro ao atualizar presenca' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await execute('DELETE FROM attendance WHERE id = ?', [id])
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE attendance error:', error)
    return NextResponse.json({ error: 'Erro ao deletar presenca' }, { status: 500 })
  }
}
