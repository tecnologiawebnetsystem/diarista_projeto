import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne, execute, generateUUID } from '@/lib/mysql'

export async function GET() {
  try {
    const rows = await query('SELECT * FROM diaristas ORDER BY name')
    return NextResponse.json(rows)
  } catch (error) {
    console.error('GET diaristas error:', error)
    return NextResponse.json({ error: 'Erro ao buscar diaristas' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, pin, phone, active = true, photo_url, heavy_cleaning_value = 250, light_cleaning_value = 150,
      washing_value = 300, ironing_value = 50, transport_value = 30, work_schedule, laundry_assignments } = body

    const id = generateUUID()
    await execute(
      `INSERT INTO diaristas (id, name, pin, phone, active, photo_url, heavy_cleaning_value, light_cleaning_value, washing_value, ironing_value, transport_value, work_schedule, laundry_assignments)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, name, pin, phone || null, active ? 1 : 0, photo_url || null,
        heavy_cleaning_value, light_cleaning_value, washing_value, ironing_value, transport_value,
        work_schedule ? JSON.stringify(work_schedule) : null,
        laundry_assignments ? JSON.stringify(laundry_assignments) : null]
    )
    const created = await queryOne('SELECT * FROM diaristas WHERE id = ?', [id])
    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error('POST diaristas error:', error)
    return NextResponse.json({ error: 'Erro ao criar diarista' }, { status: 500 })
  }
}
