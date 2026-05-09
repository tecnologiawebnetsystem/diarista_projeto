import { NextRequest, NextResponse } from 'next/server'
import { queryOne, execute } from '@/lib/mysql'

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const body = await request.json()

    const allowed = ['content', 'is_warning', 'note_type', 'date']
    const fields: string[] = []
    const values: unknown[] = []

    for (const key of allowed) {
      if (key in body) {
        fields.push(`${key} = ?`)
        values.push(key === 'is_warning' ? (body[key] ? 1 : 0) : (body[key] ?? null))
      }
    }

    if (fields.length === 0) return NextResponse.json({ error: 'Nenhum campo' }, { status: 400 })
    fields.push('updated_at = NOW()')
    values.push(id)

    await execute(`UPDATE notes SET ${fields.join(', ')} WHERE id = ?`, values)
    const updated = await queryOne('SELECT * FROM notes WHERE id = ?', [id])
    return NextResponse.json(updated)
  } catch (error) {
    console.error('PATCH notes error:', error)
    return NextResponse.json({ error: 'Erro ao atualizar anotacao' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    await execute('DELETE FROM notes WHERE id = ?', [id])
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE notes error:', error)
    return NextResponse.json({ error: 'Erro ao deletar anotacao' }, { status: 500 })
  }
}
