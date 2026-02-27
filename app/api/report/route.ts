import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const MONTHS = [
  '', 'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const month = parseInt(searchParams.get('month') || '')
  const year = parseInt(searchParams.get('year') || '')
  const diaristaId = searchParams.get('diarista_id') || null

  if (!month || !year) {
    return NextResponse.json({ error: 'month e year sao obrigatorios' }, { status: 400 })
  }

  try {
    // Buscar dados
    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0]
    const endDate = new Date(year, month, 0).toISOString().split('T')[0]

    // Config
    const { data: configData } = await supabase.from('config').select('key, value')
    const cfg: Record<string, number> = {}
    configData?.forEach(item => { cfg[item.key] = item.value })

    // Diarista info
    let diaristaName = 'Diarista'
    if (diaristaId) {
      const { data: d } = await supabase.from('diaristas').select('name').eq('id', diaristaId).single()
      if (d) diaristaName = d.name
    }

    // Pagamento mensal
    let paymentQuery = supabase.from('monthly_payments').select('*').eq('month', month).eq('year', year)
    if (diaristaId) paymentQuery = paymentQuery.eq('diarista_id', diaristaId)
    const { data: paymentData } = await paymentQuery.maybeSingle()

    // Presenca
    let attendanceQuery = supabase.from('attendance').select('*').gte('date', startDate).lte('date', endDate).order('date')
    if (diaristaId) attendanceQuery = attendanceQuery.eq('diarista_id', diaristaId)
    const { data: attendanceData } = await attendanceQuery

    // Lavanderia
    let laundryQuery = supabase.from('laundry_weeks').select('*').eq('month', month).eq('year', year).order('week_number')
    if (diaristaId) laundryQuery = laundryQuery.eq('diarista_id', diaristaId)
    const { data: laundryData } = await laundryQuery

    // Notas
    let notesQuery = supabase.from('notes').select('*').gte('date', startDate).lte('date', endDate).order('date')
    if (diaristaId) notesQuery = notesQuery.eq('diarista_id', diaristaId)
    const { data: notesData } = await notesQuery

    // Calculos
    const ironingValue = cfg.ironing || 50
    const washingValue = cfg.washing || 75
    const monthlySalary = paymentData?.monthly_value || cfg.monthly_salary || 2000
    const isPaid = !!paymentData?.paid_at

    const laundryTotal = (laundryData || []).reduce((sum, w) => {
      const services = (w.ironed ? ironingValue : 0) + (w.washed ? washingValue : 0)
      const transport = (w.ironed || w.washed) ? (w.transport_fee || 30) : 0
      return sum + services + transport
    }, 0)

    const heavyDays = (attendanceData || []).filter((a: { day_type: string; present: boolean }) => a.day_type === 'heavy_cleaning' && a.present).length
    const lightDays = (attendanceData || []).filter((a: { day_type: string; present: boolean }) => a.day_type === 'light_cleaning' && a.present).length
    const totalDays = heavyDays + lightDays
    const warnings = (notesData || []).filter((n: { is_warning: boolean }) => n.is_warning).length
    const grandTotal = (isPaid ? monthlySalary : 0) + laundryTotal

    // Gerar HTML do relatorio
    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Relatorio ${MONTHS[month]} ${year} - ${diaristaName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #1a1a2e; max-width: 800px; margin: 0 auto; }
    .header { text-align: center; margin-bottom: 32px; border-bottom: 3px solid #4F46E5; padding-bottom: 20px; }
    .header h1 { font-size: 28px; color: #4F46E5; margin-bottom: 4px; }
    .header p { color: #6b7280; font-size: 14px; }
    .period { background: #f5f3ff; padding: 16px; border-radius: 12px; text-align: center; margin-bottom: 24px; }
    .period h2 { font-size: 20px; color: #4F46E5; }
    .total-card { background: linear-gradient(135deg, #4F46E5, #7C3AED); color: white; padding: 24px; border-radius: 16px; text-align: center; margin-bottom: 24px; }
    .total-card .amount { font-size: 36px; font-weight: 800; }
    .total-card .label { opacity: 0.8; font-size: 14px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
    .stat-card { background: #f9fafb; border: 1px solid #e5e7eb; padding: 16px; border-radius: 12px; text-align: center; }
    .stat-card .value { font-size: 24px; font-weight: 700; color: #4F46E5; }
    .stat-card .label { font-size: 12px; color: #6b7280; margin-top: 4px; }
    .section { margin-bottom: 24px; }
    .section h3 { font-size: 16px; font-weight: 700; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { background: #f3f4f6; padding: 10px 12px; text-align: left; font-weight: 600; }
    td { padding: 10px 12px; border-bottom: 1px solid #f3f4f6; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
    .badge-paid { background: #dcfce7; color: #16a34a; }
    .badge-pending { background: #fef3c7; color: #d97706; }
    .badge-warning { background: #fee2e2; color: #dc2626; }
    .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>LIMPP DAY</h1>
    <p>Relatorio Mensal de Servicos</p>
  </div>

  <div class="period">
    <h2>${MONTHS[month]} ${year}</h2>
    <p style="color: #6b7280; font-size: 13px; margin-top: 4px;">Profissional: ${diaristaName}</p>
  </div>

  <div class="total-card">
    <p class="label">Total do Mes</p>
    <p class="amount">R$ ${grandTotal.toFixed(2)}</p>
    <p style="opacity: 0.7; font-size: 13px; margin-top: 8px;">
      Salario: R$ ${isPaid ? monthlySalary.toFixed(2) : '0.00'} ${isPaid ? '(Pago)' : '(Pendente)'} | Lavanderia: R$ ${laundryTotal.toFixed(2)}
    </p>
  </div>

  <div class="grid">
    <div class="stat-card">
      <div class="value">${totalDays}</div>
      <div class="label">Dias Trabalhados</div>
    </div>
    <div class="stat-card">
      <div class="value">${heavyDays}</div>
      <div class="label">Limpeza Pesada</div>
    </div>
    <div class="stat-card">
      <div class="value">${lightDays}</div>
      <div class="label">Limpeza Leve</div>
    </div>
    <div class="stat-card">
      <div class="value" style="color: ${warnings >= 3 ? '#dc2626' : warnings > 0 ? '#d97706' : '#4F46E5'}">${warnings}</div>
      <div class="label">Advertencias</div>
    </div>
  </div>

  ${(attendanceData && attendanceData.length > 0) ? `
  <div class="section">
    <h3>Registro de Presenca</h3>
    <table>
      <thead>
        <tr><th>Data</th><th>Tipo</th><th>Status</th></tr>
      </thead>
      <tbody>
        ${attendanceData.map((a: { date: string; day_type: string; present: boolean }) => `
          <tr>
            <td>${new Date(a.date + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
            <td>${a.day_type === 'heavy_cleaning' ? 'Pesada' : 'Leve'}</td>
            <td><span class="badge ${a.present ? 'badge-paid' : 'badge-warning'}">${a.present ? 'Presente' : 'Ausente'}</span></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  ` : ''}

  ${(laundryData && laundryData.length > 0) ? `
  <div class="section">
    <h3>Lavanderia</h3>
    <table>
      <thead>
        <tr><th>Semana</th><th>Lavagem</th><th>Passagem</th><th>Transporte</th><th>Total</th></tr>
      </thead>
      <tbody>
        ${laundryData.map((w: { week_number: number; washed: boolean; ironed: boolean; transport_fee: number }) => {
          const services = (w.ironed ? ironingValue : 0) + (w.washed ? washingValue : 0)
          const transport = (w.ironed || w.washed) ? (w.transport_fee || 30) : 0
          return `
            <tr>
              <td>Semana ${w.week_number}</td>
              <td>${w.washed ? `R$ ${washingValue.toFixed(2)}` : '-'}</td>
              <td>${w.ironed ? `R$ ${ironingValue.toFixed(2)}` : '-'}</td>
              <td>R$ ${transport.toFixed(2)}</td>
              <td><strong>R$ ${(services + transport).toFixed(2)}</strong></td>
            </tr>
          `
        }).join('')}
      </tbody>
    </table>
  </div>
  ` : ''}

  ${(notesData && notesData.length > 0) ? `
  <div class="section">
    <h3>Anotacoes</h3>
    <table>
      <thead>
        <tr><th>Data</th><th>Tipo</th><th>Descricao</th></tr>
      </thead>
      <tbody>
        ${notesData.map((n: { date: string; is_warning: boolean; note_type: string; content: string }) => `
          <tr>
            <td>${new Date(n.date + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
            <td><span class="badge ${n.is_warning ? 'badge-warning' : 'badge-paid'}">${n.is_warning ? 'Advertencia' : n.note_type}</span></td>
            <td>${n.content}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  ` : ''}

  <div class="footer">
    <p>LIMPP DAY - Gestao de Servicos</p>
    <p>Gerado em ${new Date().toLocaleDateString('pt-BR')} as ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
  </div>
</body>
</html>`

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    })
  } catch (error) {
    console.error('Error generating report:', error)
    return NextResponse.json({ error: 'Erro ao gerar relatorio' }, { status: 500 })
  }
}
