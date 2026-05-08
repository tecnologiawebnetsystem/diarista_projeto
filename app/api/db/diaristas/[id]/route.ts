import { NextRequest, NextResponse } from 'next/server'
import { queryOne, execute } from '@/lib/mysql'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const row = await queryOne('SELECT * FROM diaristas WHERE id = ?', [id])
    if (!row) return NextResponse.json({ error: 'Nao encontrado' }, { status: 404 })
    return NextResponse.json(row)
  } catch (error) {
    console.error('GET diarista error:', error)
    return NextResponse.json({ error: 'Erro ao buscar diarista' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    const allowedFields = ['name', 'pin', 'phone', 'active', 'photo_url', 'heavy_cleaning_value',
      'light_cleaning_value', 'washing_value', 'ironing_value', 'transport_value', 'work_schedule', 'laundry_assignments']

    const fields: string[] = []
    const values: unknown[] = []

    for (const key of allowedFields) {
      if (key in body) {
        fields.push(`${key} = ?`)
        if (key === 'work_schedule' || key === 'laundry_assignments') {
          values.push(body[key] != null ? JSON.stringify(body[key]) : null)
        } else if (key === 'active') {
          values.push(body[key] ? 1 : 0)
        } else {
          values.push(body[key] ?? null)
        }
      }
    }

    if (fields.length === 0) return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 })

    fields.push('updated_at = NOW()')
    values.push(id)

    await execute(`UPDATE diaristas SET ${fields.join(', ')} WHERE id = ?`, values)
    const updated = await queryOne('SELECT * FROM diaristas WHERE id = ?', [id])
    return NextResponse.json(updated)
  } catch (error) {
    console.error('PATCH diarista error:', error)
    return NextResponse.json({ error: 'Erro ao atualizar diarista' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await execute('UPDATE diaristas SET active = 0, updated_at = NOW() WHERE id = ?', [id])
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE diarista error:', error)
    return NextResponse.json({ error: 'Erro ao desativar diarista' }, { status: 500 })
  }
}
