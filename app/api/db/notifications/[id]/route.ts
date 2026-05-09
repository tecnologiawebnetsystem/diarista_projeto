import { NextRequest, NextResponse } from 'next/server'
import { execute } from '@/lib/mysql'

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const body = await request.json()

    if (body.read !== undefined) {
      await execute('UPDATE notifications SET `read` = ? WHERE id = ?', [body.read ? 1 : 0, id])
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('PATCH notification error:', error)
    return NextResponse.json({ error: 'Erro ao atualizar notificacao' }, { status: 500 })
  }
}
