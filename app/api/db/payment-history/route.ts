import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/mysql'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const diaristaId = searchParams.get('diarista_id')
    const filterYear = searchParams.get('year')

    // Buscar config
    const cfgRows = await query<{ key: string; value: number }>('SELECT `key`, value FROM config')
    const cfg: Record<string, number> = {}
    cfgRows.forEach(r => { cfg[r.key] = r.value })

    const heavyCleaningValue = cfg.heavy_cleaning || 250
    const lightCleaningValue = cfg.light_cleaning || 150
    const ironingValue = cfg.ironing || 50
    const washingValue = cfg.washing || 75

    // Buscar presenca
    let attSql = 'SELECT * FROM attendance WHERE present = 1'
    const attParams: unknown[] = []
    if (diaristaId) { attSql += ' AND diarista_id = ?'; attParams.push(diaristaId) }
    if (filterYear) {
      attSql += ' AND date >= ? AND date <= ?'
      attParams.push(`${filterYear}-01-01`, `${filterYear}-12-31`)
    }
    attSql += ' ORDER BY date DESC'
    const attendanceData = await query<{ date: string; day_type: string; present: number }>(attSql, attParams)

    // Buscar pagamentos mensais
    let paymentSql = 'SELECT * FROM monthly_payments WHERE 1=1'
    const paymentParams: unknown[] = []
    if (diaristaId) { paymentSql += ' AND diarista_id = ?'; paymentParams.push(diaristaId) }
    if (filterYear) { paymentSql += ' AND year = ?'; paymentParams.push(filterYear) }
    const payments = await query<{ month: number; year: number; paid_at: string | null; receipt_url: string | null }>(paymentSql, paymentParams)

    // Buscar lavanderia
    let laundrySql = 'SELECT * FROM laundry_weeks WHERE 1=1'
    const laundryParams: unknown[] = []
    if (diaristaId) { laundrySql += ' AND diarista_id = ?'; laundryParams.push(diaristaId) }
    if (filterYear) { laundrySql += ' AND year = ?'; laundryParams.push(filterYear) }
    laundrySql += ' ORDER BY year DESC, month DESC'
    const laundries = await query<{
      year: number; month: number; ironed: number; washed: number; transport_fee: number; paid_at: string | null
    }>(laundrySql, laundryParams)

    // Montar registros de presenca agrupados por mes
    type Record_ = {
      id: string; month: number; year: number; type: string
      description: string; amount: number; status: string; paid_at: string | null; receipt_url: string | null
    }
    const allRecords: Record_[] = []

    if (attendanceData.length > 0) {
      const grouped: Record<string, typeof attendanceData> = {}
      for (const a of attendanceData) {
        const d = new Date(String(a.date) + 'T00:00:00')
        const key = `${d.getFullYear()}-${d.getMonth() + 1}`
        if (!grouped[key]) grouped[key] = []
        grouped[key].push(a)
      }

      for (const [key, days] of Object.entries(grouped)) {
        const [y, m] = key.split('-').map(Number)
        const heavy = days.filter(a => a.day_type === 'heavy_cleaning').length
        const light = days.filter(a => a.day_type === 'light_cleaning').length
        const total = heavy * heavyCleaningValue + light * lightCleaningValue
        const payment = payments.find(p => p.month === m && p.year === y)
        allRecords.push({
          id: `attendance-${key}`,
          month: m, year: y, type: 'attendance',
          description: `Limpeza (${heavy} pesada, ${light} leve)`,
          amount: total,
          status: payment?.paid_at ? 'paid' : 'pending',
          paid_at: payment?.paid_at || null,
          receipt_url: payment?.receipt_url || null,
        })
      }
    }

    // Montar registros de lavanderia agrupados por mes
    if (laundries.length > 0) {
      const grouped: Record<string, typeof laundries> = {}
      for (const l of laundries) {
        const key = `${l.year}-${l.month}`
        if (!grouped[key]) grouped[key] = []
        grouped[key].push(l)
      }

      for (const [key, weeks] of Object.entries(grouped)) {
        const [y, m] = key.split('-').map(Number)
        const activeWeeks = weeks.filter(w => w.ironed || w.washed)
        if (activeWeeks.length === 0) continue

        const total = activeWeeks.reduce((sum, w) => sum + (w.ironed ? ironingValue : 0) + (w.washed ? washingValue : 0), 0)
        allRecords.push({
          id: `laundry-${key}`, month: m, year: y, type: 'laundry',
          description: `Lavanderia (${activeWeeks.length} semana${activeWeeks.length > 1 ? 's' : ''})`,
          amount: total, status: 'pending', paid_at: null, receipt_url: null,
        })

        const transportWeeks = activeWeeks.filter(w => w.transport_fee > 0)
        if (transportWeeks.length > 0) {
          const transportTotal = transportWeeks.reduce((sum, w) => sum + (w.transport_fee || 0), 0)
          const transportPaid = transportWeeks.filter(w => w.paid_at)
          const allPaid = transportPaid.length === transportWeeks.length
          allRecords.push({
            id: `transport-${key}`, month: m, year: y, type: 'transport',
            description: `Transporte (${transportWeeks.length} semana${transportWeeks.length > 1 ? 's' : ''})`,
            amount: transportTotal,
            status: allPaid ? 'paid' : 'pending',
            paid_at: allPaid ? transportPaid[0].paid_at : null,
            receipt_url: null,
          })
        }
      }
    }

    allRecords.sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year
      if (a.month !== b.month) return b.month - a.month
      return a.type.localeCompare(b.type)
    })

    return NextResponse.json(allRecords)
  } catch (error) {
    console.error('GET payment-history error:', error)
    return NextResponse.json({ error: 'Erro ao buscar historico' }, { status: 500 })
  }
}
