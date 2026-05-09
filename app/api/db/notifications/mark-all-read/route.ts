import { NextRequest, NextResponse } from 'next/server'
import { execute } from '@/lib/mysql'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { diarista_id } = body

    if (!diarista_id) {
      return NextResponse.json({ error: 'diarista_id obrigatorio' }, { status: 400 })
    }

    await execute(
      'UPDATE notifications SET `read` = 1 WHERE diarista_id = ? AND `read` = 0',
      [diarista_id]
    )
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('POST mark-all-read error:', error)
    return NextResponse.json({ error: 'Erro ao marcar todas como lidas' }, { status: 500 })
  }
}
