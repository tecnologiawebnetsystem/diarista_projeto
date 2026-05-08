import { NextRequest, NextResponse } from 'next/server'
import { queryOne, execute } from '@/lib/mysql'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    const allowed = ['name', 'address', 'neighborhood', 'phone', 'notes', 'active']
    const fields: string[] = []
    const values: unknown[] = []

    for (const key of allowed) {
      if (key in body) {
        fields.push(`${key} = ?`)
        values.push(key === 'active' ? (body[key] ? 1 : 0) : (body[key] ?? null))
      }
    }

    if (fields.length === 0) return NextResponse.json({ error: 'Nenhum campo' }, { status: 400 })
    fields.push('updated_at = NOW()')
    values.push(id)

    await execute(`UPDATE clients SET ${fields.join(', ')} WHERE id = ?`, values)
    const updated = await queryOne('SELECT * FROM clients WHERE id = ?', [id])
    return NextResponse.json(updated)
  } catch (error) {
    console.error('PATCH client error:', error)
    return NextResponse.json({ error: 'Erro ao atualizar cliente' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await execute('UPDATE clients SET active = 0, updated_at = NOW() WHERE id = ?', [id])
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE client error:', error)
    return NextResponse.json({ error: 'Erro ao desativar cliente' }, { status: 500 })
  }
}
