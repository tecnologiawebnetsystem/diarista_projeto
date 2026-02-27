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
    const heavyCleaningValue = cfg.heavy_cleaning || 0
    const lightCleaningValue = cfg.light_cleaning || 0

    const heavyDays = (attendanceData || []).filter((a: { day_type: string; present: boolean }) => a.day_type === 'heavy_cleaning' && a.present).length
    const lightDays = (attendanceData || []).filter((a: { day_type: string; present: boolean }) => a.day_type === 'light_cleaning' && a.present).length
    const totalDays = heavyDays + lightDays
    const attendanceTotal = (heavyDays * heavyCleaningValue) + (lightDays * lightCleaningValue)

    const laundryTotal = (laundryData || []).reduce((sum, w) => {
      return sum + (w.ironed ? ironingValue : 0) + (w.washed ? washingValue : 0)
    }, 0)

    const transportTotal = (laundryData || []).reduce((sum, w) => {
      return sum + ((w.ironed || w.washed) ? (w.transport_fee || 0) : 0)
    }, 0)
    const transportPaidTotal = (laundryData || []).filter((w: { ironed: boolean; washed: boolean; paid_at: string | null }) => (w.ironed || w.washed) && w.paid_at).reduce((sum, w) => sum + (w.transport_fee || 0), 0)

    const warnings = (notesData || []).filter((n: { is_warning: boolean }) => n.is_warning).length
    const grandTotal = attendanceTotal + laundryTotal

    // Dados do pagamento mensal
    const isPaid = !!paymentData?.paid_at
    const paidDate = paymentData?.paid_at ? new Date(paymentData.paid_at).toLocaleDateString('pt-BR') : null

    // Calcular transporte pendente
    const transportPendingTotal = transportTotal - transportPaidTotal

    // Nota type labels
    const noteTypeLabels: Record<string, string> = {
      general: 'Nota Geral',
      warning: 'Observacao',
      extra_work: 'Trabalho Extra',
      missed_task: 'Tarefa Nao Realizada',
    }

    // Gerar HTML do relatorio
    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Relatorio ${MONTHS[month]} ${year} - ${diaristaName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 0;
      color: #1C1917;
      background: #FAFAF9;
      max-width: 800px;
      margin: 0 auto;
      -webkit-font-smoothing: antialiased;
    }

    /* Header */
    .report-header {
      background: linear-gradient(135deg, #EA580C 0%, #F97316 50%, #FB923C 100%);
      color: white;
      padding: 40px 32px 32px;
      position: relative;
      overflow: hidden;
    }
    .report-header::before {
      content: '';
      position: absolute;
      top: -40%;
      right: -20%;
      width: 300px;
      height: 300px;
      background: rgba(255,255,255,0.08);
      border-radius: 50%;
    }
    .report-header::after {
      content: '';
      position: absolute;
      bottom: -30%;
      left: -10%;
      width: 200px;
      height: 200px;
      background: rgba(255,255,255,0.05);
      border-radius: 50%;
    }
    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      position: relative;
      z-index: 1;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .brand-icon {
      width: 44px;
      height: 44px;
      background: rgba(255,255,255,0.2);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      backdrop-filter: blur(10px);
    }
    .brand h1 {
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.5px;
    }
    .brand p {
      font-size: 12px;
      opacity: 0.8;
      font-weight: 500;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .report-date {
      text-align: right;
      font-size: 12px;
      opacity: 0.7;
      position: relative;
      z-index: 1;
    }
    .period-bar {
      margin-top: 24px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      position: relative;
      z-index: 1;
    }
    .period-info h2 {
      font-size: 28px;
      font-weight: 900;
      letter-spacing: -0.5px;
    }
    .period-info span {
      font-size: 13px;
      opacity: 0.8;
    }
    .payment-status {
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.3px;
    }
    .status-paid {
      background: rgba(255,255,255,0.25);
      backdrop-filter: blur(10px);
    }
    .status-pending {
      background: rgba(0,0,0,0.15);
      backdrop-filter: blur(10px);
    }

    /* Content */
    .content {
      padding: 24px;
    }

    /* Total Cards Row */
    .totals-row {
      display: flex;
      gap: 12px;
      margin-bottom: 24px;
    }
    .total-main {
      flex: 2;
      background: #1C1917;
      color: white;
      border-radius: 16px;
      padding: 24px;
      position: relative;
      overflow: hidden;
    }
    .total-main::after {
      content: '';
      position: absolute;
      top: -20px;
      right: -20px;
      width: 100px;
      height: 100px;
      background: rgba(249,115,22,0.15);
      border-radius: 50%;
    }
    .total-main .label { font-size: 12px; color: #A8A29E; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; }
    .total-main .amount { font-size: 36px; font-weight: 900; margin-top: 4px; letter-spacing: -1px; color: #F97316; }
    .total-side {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .total-card-sm {
      flex: 1;
      border-radius: 12px;
      padding: 16px;
      text-align: center;
    }
    .total-card-sm .amount { font-size: 20px; font-weight: 800; letter-spacing: -0.5px; }
    .total-card-sm .label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 2px; }
    .card-transport { background: #FFF7ED; border: 1px solid #FDBA74; }
    .card-transport .amount { color: #EA580C; }
    .card-transport .label { color: #C2410C; }
    .card-laundry { background: #F0FDF4; border: 1px solid #86EFAC; }
    .card-laundry .amount { color: #16A34A; }
    .card-laundry .label { color: #15803D; }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 28px;
    }
    .stat-card {
      background: white;
      border: 1px solid #E7E5E4;
      border-radius: 12px;
      padding: 16px 12px;
      text-align: center;
      transition: box-shadow 0.2s;
    }
    .stat-card .icon {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 8px;
      font-size: 16px;
    }
    .stat-card .value { font-size: 22px; font-weight: 800; color: #1C1917; letter-spacing: -0.5px; }
    .stat-card .label { font-size: 10px; color: #78716C; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; margin-top: 2px; }

    /* Section */
    .section {
      margin-bottom: 28px;
    }
    .section-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 14px;
      padding-bottom: 10px;
      border-bottom: 2px solid #F5F5F4;
    }
    .section-icon {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
    }
    .section-header h3 { font-size: 15px; font-weight: 700; color: #1C1917; letter-spacing: -0.3px; }
    .section-header .count { font-size: 11px; color: #78716C; font-weight: 500; margin-left: auto; }

    /* Table */
    table { width: 100%; border-collapse: separate; border-spacing: 0; font-size: 13px; }
    thead th {
      background: #F5F5F4;
      padding: 10px 14px;
      text-align: left;
      font-weight: 600;
      font-size: 11px;
      color: #78716C;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    thead th:first-child { border-radius: 8px 0 0 8px; }
    thead th:last-child { border-radius: 0 8px 8px 0; }
    tbody td {
      padding: 12px 14px;
      border-bottom: 1px solid #F5F5F4;
      font-weight: 500;
    }
    tbody tr:last-child td { border-bottom: none; }
    tbody tr:hover { background: #FAFAF9; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .font-bold { font-weight: 700; }

    /* Badges */
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.2px;
    }
    .badge-paid { background: #DCFCE7; color: #16A34A; }
    .badge-pending { background: #FEF3C7; color: #D97706; }
    .badge-warning { background: #FEE2E2; color: #DC2626; }
    .badge-info { background: #E0F2FE; color: #0284C7; }
    .badge-present { background: #DCFCE7; color: #16A34A; }
    .badge-absent { background: #FEE2E2; color: #DC2626; }
    .badge-heavy { background: #FFF7ED; color: #EA580C; }
    .badge-light { background: #F0FDF4; color: #16A34A; }

    /* Breakdown row */
    .breakdown {
      display: flex;
      gap: 16px;
      padding: 16px;
      background: #F5F5F4;
      border-radius: 10px;
      margin-top: 8px;
    }
    .breakdown-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 500;
      color: #57534E;
    }
    .breakdown-item strong { color: #1C1917; }

    /* Note cards */
    .note-card {
      background: white;
      border: 1px solid #E7E5E4;
      border-radius: 12px;
      padding: 14px 16px;
      margin-bottom: 10px;
    }
    .note-card.warning {
      border-color: #FBBF24;
      background: #FFFBEB;
    }
    .note-meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 6px;
    }
    .note-meta .date { font-size: 11px; color: #A8A29E; font-weight: 500; }
    .note-content { font-size: 13px; color: #44403C; line-height: 1.5; }

    /* Footer */
    .report-footer {
      margin-top: 36px;
      padding: 24px;
      background: #F5F5F4;
      border-radius: 12px;
      text-align: center;
    }
    .report-footer p { font-size: 11px; color: #A8A29E; line-height: 1.8; }
    .report-footer strong { color: #78716C; }
    .divider { width: 40px; height: 3px; background: #E7E5E4; margin: 12px auto; border-radius: 2px; }

    /* Print */
    @media print {
      body { padding: 0; background: white; }
      .report-header { padding: 24px; }
      .content { padding: 20px; }
      .stat-card, .note-card { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="report-header">
    <div class="header-top">
      <div class="brand">
        <div class="brand-icon">&#x2728;</div>
        <div>
          <h1>LIMPP DAY</h1>
          <p>Relatorio Mensal de Servicos</p>
        </div>
      </div>
      <div class="report-date">
        Gerado em<br>
        <strong>${new Date().toLocaleDateString('pt-BR')}</strong>
      </div>
    </div>
    <div class="period-bar">
      <div class="period-info">
        <h2>${MONTHS[month]} ${year}</h2>
        <span>Profissional: ${diaristaName}</span>
      </div>
      <div class="payment-status ${isPaid ? 'status-paid' : 'status-pending'}">
        ${isPaid ? `&#x2713; Pago em ${paidDate}` : '&#x25CF; Pagamento pendente'}
      </div>
    </div>
  </div>

  <div class="content">
    <!-- Totals -->
    <div class="totals-row">
      <div class="total-main">
        <div class="label">Total do Mes</div>
        <div class="amount">R$ ${grandTotal.toFixed(2)}</div>
        <div style="display:flex;gap:16px;margin-top:12px;">
          <span style="font-size:12px;color:#A8A29E;">Limpeza <strong style="color:#F5F5F4;">R$ ${attendanceTotal.toFixed(2)}</strong></span>
          <span style="font-size:12px;color:#A8A29E;">Lavanderia <strong style="color:#F5F5F4;">R$ ${laundryTotal.toFixed(2)}</strong></span>
        </div>
      </div>
      <div class="total-side">
        <div class="total-card-sm card-transport">
          <div class="amount">R$ ${transportPaidTotal.toFixed(2)}</div>
          <div class="label">Transporte pago</div>
        </div>
        <div class="total-card-sm card-laundry">
          <div class="amount">R$ ${transportPendingTotal.toFixed(2)}</div>
          <div class="label">Transp. pendente</div>
        </div>
      </div>
    </div>

    <!-- Stats -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="icon" style="background:#FFF7ED;">&#x1F4C5;</div>
        <div class="value">${totalDays}</div>
        <div class="label">Dias</div>
      </div>
      <div class="stat-card">
        <div class="icon" style="background:#FEF2F2;">&#x1F9F9;</div>
        <div class="value">${heavyDays}</div>
        <div class="label">Pesada</div>
      </div>
      <div class="stat-card">
        <div class="icon" style="background:#F0FDF4;">&#x2728;</div>
        <div class="value">${lightDays}</div>
        <div class="label">Leve</div>
      </div>
      <div class="stat-card">
        <div class="icon" style="background:${warnings >= 3 ? '#FEE2E2' : warnings > 0 ? '#FEF3C7' : '#F0FDF4'};">&#x26A0;</div>
        <div class="value" style="color:${warnings >= 3 ? '#DC2626' : warnings > 0 ? '#D97706' : '#16A34A'}">${warnings}</div>
        <div class="label">Advertencias</div>
      </div>
    </div>

    <!-- Presenca -->
    ${(attendanceData && attendanceData.length > 0) ? `
    <div class="section">
      <div class="section-header">
        <div class="section-icon" style="background:#FFF7ED;">&#x1F4CB;</div>
        <h3>Registro de Presenca</h3>
        <span class="count">${attendanceData.length} registro${attendanceData.length > 1 ? 's' : ''}</span>
      </div>
      <table>
        <thead>
          <tr>
            <th>Data</th>
            <th>Dia</th>
            <th>Tipo</th>
            <th>Valor</th>
            <th class="text-center">Status</th>
          </tr>
        </thead>
        <tbody>
          ${attendanceData.map((a: { date: string; day_type: string; present: boolean }) => {
            const d = new Date(a.date + 'T00:00:00')
            const dayName = d.toLocaleDateString('pt-BR', { weekday: 'short' })
            const isHeavy = a.day_type === 'heavy_cleaning'
            const val = a.present ? (isHeavy ? heavyCleaningValue : lightCleaningValue) : 0
            return `
            <tr>
              <td>${d.toLocaleDateString('pt-BR')}</td>
              <td style="text-transform:capitalize;">${dayName}</td>
              <td><span class="badge ${isHeavy ? 'badge-heavy' : 'badge-light'}">${isHeavy ? 'Pesada' : 'Leve'}</span></td>
              <td class="font-bold">R$ ${val.toFixed(2)}</td>
              <td class="text-center"><span class="badge ${a.present ? 'badge-present' : 'badge-absent'}">${a.present ? 'Presente' : 'Ausente'}</span></td>
            </tr>`
          }).join('')}
        </tbody>
      </table>
      <div class="breakdown">
        <div class="breakdown-item">&#x1F9F9; Pesada: <strong>${heavyDays}x R$ ${heavyCleaningValue.toFixed(2)} = R$ ${(heavyDays * heavyCleaningValue).toFixed(2)}</strong></div>
        <div class="breakdown-item">&#x2728; Leve: <strong>${lightDays}x R$ ${lightCleaningValue.toFixed(2)} = R$ ${(lightDays * lightCleaningValue).toFixed(2)}</strong></div>
      </div>
    </div>
    ` : ''}

    <!-- Lavanderia -->
    ${(laundryData && laundryData.length > 0) ? `
    <div class="section">
      <div class="section-header">
        <div class="section-icon" style="background:#EFF6FF;">&#x1F455;</div>
        <h3>Lavanderia</h3>
        <span class="count">${(laundryData || []).filter((w: { ironed: boolean; washed: boolean }) => w.ironed || w.washed).length} semana${(laundryData || []).filter((w: { ironed: boolean; washed: boolean }) => w.ironed || w.washed).length > 1 ? 's' : ''} ativa${(laundryData || []).filter((w: { ironed: boolean; washed: boolean }) => w.ironed || w.washed).length > 1 ? 's' : ''}</span>
      </div>
      <table>
        <thead>
          <tr>
            <th>Semana</th>
            <th>Lavagem</th>
            <th>Passagem</th>
            <th>Transporte</th>
            <th class="text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          ${laundryData.map((w: { week_number: number; washed: boolean; ironed: boolean; transport_fee: number; paid_at: string | null }) => {
            const services = (w.ironed ? ironingValue : 0) + (w.washed ? washingValue : 0)
            const hasServices = w.ironed || w.washed
            const tPaid = hasServices && !!w.paid_at
            return `
            <tr>
              <td class="font-bold">Semana ${w.week_number}</td>
              <td>${w.washed ? `<span class="badge badge-info">R$ ${washingValue.toFixed(2)}</span>` : '<span style="color:#D6D3D1">-</span>'}</td>
              <td>${w.ironed ? `<span class="badge badge-info">R$ ${ironingValue.toFixed(2)}</span>` : '<span style="color:#D6D3D1">-</span>'}</td>
              <td>${hasServices ? `R$ ${(w.transport_fee || 0).toFixed(2)} <span class="badge ${tPaid ? 'badge-paid' : 'badge-pending'}">${tPaid ? 'Pago' : 'Pendente'}</span>` : '<span style="color:#D6D3D1">-</span>'}</td>
              <td class="text-right font-bold">R$ ${services.toFixed(2)}</td>
            </tr>`
          }).join('')}
        </tbody>
      </table>
    </div>
    ` : ''}

    <!-- Anotacoes -->
    ${(notesData && notesData.length > 0) ? `
    <div class="section">
      <div class="section-header">
        <div class="section-icon" style="background:${warnings > 0 ? '#FEF3C7' : '#F0FDF4'};">&#x1F4DD;</div>
        <h3>Anotacoes</h3>
        <span class="count">${notesData.length} registro${notesData.length > 1 ? 's' : ''}${warnings > 0 ? ` | ${warnings} advertencia${warnings > 1 ? 's' : ''}` : ''}</span>
      </div>
      ${notesData.map((n: { date: string; is_warning: boolean; note_type: string; content: string }) => `
        <div class="note-card ${n.is_warning ? 'warning' : ''}">
          <div class="note-meta">
            <span class="badge ${n.is_warning ? 'badge-warning' : n.note_type === 'extra_work' ? 'badge-paid' : n.note_type === 'missed_task' ? 'badge-warning' : 'badge-info'}">
              ${n.is_warning ? '&#x26A0; Advertencia' : (noteTypeLabels[n.note_type] || n.note_type)}
            </span>
            <span class="date">${new Date(n.date + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })}</span>
          </div>
          <div class="note-content">${n.content}</div>
        </div>
      `).join('')}
    </div>
    ` : ''}

    <!-- Footer -->
    <div class="report-footer">
      <strong>LIMPP DAY</strong>
      <div class="divider"></div>
      <p>
        Documento gerado automaticamente pelo sistema LIMPP DAY.<br>
        ${new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
        as ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
      </p>
    </div>
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
