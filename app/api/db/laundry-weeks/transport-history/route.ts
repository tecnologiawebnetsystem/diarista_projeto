import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/mysql'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const diaristaId = searchParams.get('diarista_id')
    const fromMonth = parseInt(searchParams.get('from_month') || '6')
    const fromYear = parseInt(searchParams.get('from_year') || '2026')

    if (!diaristaId) {
      return NextResponse.json({ error: 'diarista_id é obrigatório' }, { status: 400 })
    }

    // Busca todos os registros com transport_paid_amount > 0
    // a partir do mês/ano especificado (padrão: junho/2026)
    const sql = `
      SELECT * FROM laundry_weeks 
      WHERE diarista_id = ? 
        AND transport_paid_amount > 0
        AND (
          year > ? 
          OR (year = ? AND month >= ?)
        )
      ORDER BY year DESC, month DESC, week_number DESC
    `
    
    const rows = await query(sql, [diaristaId, fromYear, fromYear, fromMonth])
    return NextResponse.json(rows)
  } catch (error) {
    console.error('GET transport-history error:', error)
    return NextResponse.json({ error: 'Erro ao buscar histórico de transporte' }, { status: 500 })
  }
}
