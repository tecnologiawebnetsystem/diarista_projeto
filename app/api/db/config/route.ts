import { NextRequest, NextResponse } from 'next/server'
import { query, execute } from '@/lib/mysql'

export async function GET() {
  try {
    const rows = await query('SELECT * FROM config ORDER BY `key`')
    return NextResponse.json(rows)
  } catch (error) {
    console.error('GET config error:', error)
    return NextResponse.json({ error: 'Erro ao buscar configuracoes' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { key, value } = body

    if (!key || value === undefined) {
      return NextResponse.json({ error: 'key e value sao obrigatorios' }, { status: 400 })
    }

    await execute('UPDATE config SET value = ?, updated_at = NOW() WHERE `key` = ?', [value, key])
    const rows = await query('SELECT * FROM config ORDER BY `key`')
    return NextResponse.json(rows)
  } catch (error) {
    console.error('PATCH config error:', error)
    return NextResponse.json({ error: 'Erro ao atualizar configuracao' }, { status: 500 })
  }
}
