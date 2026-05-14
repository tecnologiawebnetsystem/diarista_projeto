import { NextRequest, NextResponse } from 'next/server'
import { execute } from '@/lib/mysql'

// DELETE /api/db/clear-month?month=5&year=2026&diarista_id=xxx
// Apaga attendance + laundry_weeks + monthly_payments de um mês específico
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const month = parseInt(searchParams.get('month') || '')
    const year = parseInt(searchParams.get('year') || '')
    const diaristaId = searchParams.get('diarista_id')

    if (!month || !year || isNaN(month) || isNaN(year)) {
      return NextResponse.json({ error: 'month e year sao obrigatorios' }, { status: 400 })
    }

    // Remove presenças do mês
    if (diaristaId) {
      await execute(
        'DELETE FROM attendance WHERE MONTH(date) = ? AND YEAR(date) = ? AND diarista_id = ?',
        [month, year, diaristaId]
      )
      await execute(
        'DELETE FROM laundry_weeks WHERE month = ? AND year = ? AND diarista_id = ?',
        [month, year, diaristaId]
      )
      await execute(
        'DELETE FROM monthly_payments WHERE month = ? AND year = ? AND diarista_id = ?',
        [month, year, diaristaId]
      )
    } else {
      // Sem filtro de diarista — limpa tudo do mês
      await execute(
        'DELETE FROM attendance WHERE MONTH(date) = ? AND YEAR(date) = ?',
        [month, year]
      )
      await execute(
        'DELETE FROM laundry_weeks WHERE month = ? AND year = ?',
        [month, year]
      )
      await execute(
        'DELETE FROM monthly_payments WHERE month = ? AND year = ?',
        [month, year]
      )
    }

    return NextResponse.json({ success: true, message: `Dados de ${month}/${year} removidos` })
  } catch (error) {
    console.error('DELETE clear-month error:', error)
    return NextResponse.json({ error: 'Erro ao limpar mes' }, { status: 500 })
  }
}
