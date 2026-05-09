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
      return NextResponse.json({ error: 'Configuracao admin_pin nao encontrada' }, { status: 500 })
    }

    // O valor vem como numero float do MySQL (ex: "123456.00"), converte para inteiro antes de comparar
    const correctPin = String(Math.round(Number(row.value)))
    const providedPin = pin.toString().trim()

    if (providedPin === correctPin) {
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'PIN incorreto' }, { status: 401 })
  } catch (error) {
    console.error('[v0] PIN verification error:', error)
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: 'Erro interno: ' + msg }, { status: 500 })
  }
}
