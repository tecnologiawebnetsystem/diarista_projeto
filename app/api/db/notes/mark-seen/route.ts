import { NextRequest, NextResponse } from 'next/server'
import { execute } from '@/lib/mysql'

// Convert ISO 8601 date to MySQL DATETIME format (YYYY-MM-DD HH:MM:SS)
function toMySQLDatetime(isoDate: string): string {
  const d = new Date(isoDate)
  return d.toISOString().slice(0, 19).replace('T', ' ')
}

export async function POST(request: NextRequest) {
  try {
    const { noteIds } = await request.json()

    if (!noteIds || !Array.isArray(noteIds) || noteIds.length === 0) {
      return NextResponse.json({ error: 'noteIds is required' }, { status: 400 })
    }

    const now = toMySQLDatetime(new Date().toISOString())
    const placeholders = noteIds.map(() => '?').join(',')
    
    await execute(
      `UPDATE notes SET seen_at = ? WHERE id IN (${placeholders}) AND seen_at IS NULL`,
      [now, ...noteIds]
    )

    return NextResponse.json({ success: true, marked: noteIds.length })
  } catch (error) {
    console.error('Error marking notes as seen:', error)
    return NextResponse.json({ error: 'Erro ao marcar notas como vistas' }, { status: 500 })
  }
}
