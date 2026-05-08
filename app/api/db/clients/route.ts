import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne, execute, generateUUID } from '@/lib/mysql'

export async function GET() {
  try {
    const rows = await query('SELECT * FROM clients ORDER BY name')
    return NextResponse.json(rows)
  } catch (error) {
    console.error('GET clients error:', error)
    return NextResponse.json({ error: 'Erro ao buscar clientes' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, address, neighborhood, phone, notes, active = true } = body
    const id = generateUUID()

    await execute(
      'INSERT INTO clients (id, name, address, neighborhood, phone, notes, active) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, name, address || null, neighborhood || null, phone || null, notes || null, active ? 1 : 0]
    )
    const created = await queryOne('SELECT * FROM clients WHERE id = ?', [id])
    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error('POST clients error:', error)
    return NextResponse.json({ error: 'Erro ao criar cliente' }, { status: 500 })
  }
}
