import { NextRequest, NextResponse } from 'next/server'
import { query, execute, generateUUID } from '@/lib/mysql'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const diaristaId = searchParams.get('diarista_id')

    if (!diaristaId) {
      return NextResponse.json([])
    }

    const rows = await query(
      'SELECT * FROM notifications WHERE diarista_id = ? ORDER BY created_at DESC LIMIT 50',
      [diaristaId]
    )
    return NextResponse.json(rows)
  } catch (error) {
    console.error('GET notifications error:', error)
    return NextResponse.json({ error: 'Erro ao buscar notificacoes' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { diarista_id, title, message, type = 'note' } = body
    const id = generateUUID()

    await execute(
      'INSERT INTO notifications (id, diarista_id, title, message, type, `read`) VALUES (?, ?, ?, ?, ?, 0)',
      [id, diarista_id, title, message, type]
    )
    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    console.error('POST notifications error:', error)
    return NextResponse.json({ error: 'Erro ao enviar notificacao' }, { status: 500 })
  }
}
