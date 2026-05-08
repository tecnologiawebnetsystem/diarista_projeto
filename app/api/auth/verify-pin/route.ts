import { NextResponse } from 'next/server'
import { queryOne } from '@/lib/mysql'

export async function POST(request: Request) {
  try {
    const { pin } = await request.json()

    if (!pin) {
      return NextResponse.json({ error: 'PIN nao fornecido' }, { status: 400 })
    }

    const row = await queryOne<{ value: number }>(
      'SELECT value FROM config WHERE `key` = ?',
      ['admin_pin']
    )

    if (!row) {
      return NextResponse.json({ error: 'Erro ao verificar PIN' }, { status: 500 })
    }

    const correctPin = String(row.value) || '123456'
    const providedPin = pin.toString()

    if (providedPin === correctPin) {
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'PIN incorreto' }, { status: 401 })
  } catch (error) {
    console.error('PIN verification error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
