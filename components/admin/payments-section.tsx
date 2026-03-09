'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { DollarSign, CheckCircle, Clock, AlertCircle, Upload, Receipt, Filter, ChevronRight, Calendar, FileText, ExternalLink, Bus } from 'lucide-react'
import type { Diarista } from '@/types/database'

interface Payment {
  id: string
  diarista_id: string
  month: number
  year: number
  type: string
  description: string | null
  amount: number
  status: string
  paid_at: string | null
  receipt_url: string | null
  created_at: string
}

interface MonthlyPayment {
  id: string
  diarista_id: string
  month: number
  year: number
  monthly_value: number
  paid_at: string | null
  payment_date: string | null
  receipt_url: string | null
  notes: string | null
  created_at: string
}

const MONTHS_FULL = ['Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

interface PaymentsSectionProps {
  diaristas: Diarista[]
  selectedDiaristaId: string | null
  month: number
  year: number
}

interface CurrentMonthTotal {
  diaristaId: string
  diaristaName: string
  attendanceTotal: number
  laundryTotal: number
  grandTotal: number
}

interface TransportPayment {
  diaristaId: string
  diaristaName: string
  month: number
  year: number
  totalPaid: number
  weeksPaid: number
}

export function PaymentsSection({ diaristas, selectedDiaristaId, month, year }: PaymentsSectionProps) {
  const [payments, setPayments] = useState<Payment[]>([])
  const [monthlyPayments, setMonthlyPayments] = useState<MonthlyPayment[]>([])
  const [currentMonthTotals, setCurrentMonthTotals] = useState<CurrentMonthTotal[]>([])
  const [transportPayments, setTransportPayments] = useState<TransportPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'paid'>('all')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  // Calcula semanas do mes para o valor de lavagem
  const getWeeksInMonth = (m: number, y: number) => {
    const lastDay = new Date(y, m, 0).getDate()
    let weeks = 0, currentDay = 1
    while (currentDay <= lastDay) { weeks++; currentDay += 7 }
    return weeks
  }

  const fetchPayments = useCallback(async () => {
    setLoading(true)
    try {
      // Busca payment_history
      let query = supabase.from('payment_history').select('*').eq('month', month).eq('year', year).order('created_at', { ascending: false })
      if (selectedDiaristaId) query = query.eq('diarista_id', selectedDiaristaId)
      const { data } = await query
      setPayments((data as unknown as Payment[]) || [])
      
      // Busca monthly_payments (pagamentos mensais registrados) - apenas pagos
      let monthlyQuery = supabase.from('monthly_payments').select('*').not('paid_at', 'is', null).order('year', { ascending: false }).order('month', { ascending: false })
      if (selectedDiaristaId) monthlyQuery = monthlyQuery.eq('diarista_id', selectedDiaristaId)
      const { data: monthlyData } = await monthlyQuery
      setMonthlyPayments((monthlyData as unknown as MonthlyPayment[]) || [])
      
      // Calcula totais do mes atual para cada diarista
      const totals: CurrentMonthTotal[] = []
      const targetDiaristas = selectedDiaristaId 
        ? diaristas.filter(d => d.id === selectedDiaristaId)
        : diaristas.filter(d => d.active)
      
      for (const diarista of targetDiaristas) {
        // Busca presencas do mes
        const { data: attendanceData } = await supabase
          .from('attendance')
          .select('*')
          .eq('diarista_id', diarista.id)
          .gte('date', `${year}-${String(month).padStart(2, '0')}-01`)
          .lte('date', `${year}-${String(month).padStart(2, '0')}-31`)
        
        // Busca lavanderia do mes
        const { data: laundry } = await supabase
          .from('laundry_weeks')
          .select('*')
          .eq('diarista_id', diarista.id)
          .eq('month', month)
          .eq('year', year)
        
        // Calcula valores
        const heavyValue = diarista.heavy_cleaning_value ?? 250
        const lightValue = diarista.light_cleaning_value ?? 150
        const ironingValue = diarista.ironing_value ?? 50
        const monthlyWashingValue = diarista.washing_value ?? 300
        const weeksInMonth = getWeeksInMonth(month, year)
        const washingValuePerWeek = monthlyWashingValue / weeksInMonth
        
        const attendanceTotal = (attendanceData || [])
          .filter((a: { present: boolean }) => a.present)
          .reduce((sum: number, a: { day_type: string }) => {
            return sum + (a.day_type === 'heavy_cleaning' ? heavyValue : lightValue)
          }, 0)
        
        const laundryTotal = (laundry || []).reduce((sum: number, w: { ironed: boolean; washed: boolean }) => {
          return sum + (w.ironed ? ironingValue : 0) + (w.washed ? washingValuePerWeek : 0)
        }, 0)
        
        totals.push({
          diaristaId: diarista.id,
          diaristaName: diarista.name,
          attendanceTotal,
          laundryTotal,
          grandTotal: attendanceTotal + laundryTotal
        })
      }
      
      setCurrentMonthTotals(totals)
      
      // Busca transporte pago para cada diarista
      const transportPaid: TransportPayment[] = []
      for (const diarista of targetDiaristas) {
        const { data: laundryWeeksData } = await supabase
          .from('laundry_weeks')
          .select('*')
          .eq('diarista_id', diarista.id)
          .eq('month', month)
          .eq('year', year)
        
        const paidWeeks = (laundryWeeksData || []).filter((w: { transport_paid_amount?: number }) => 
          (w.transport_paid_amount || 0) > 0
        )
        const totalPaid = paidWeeks.reduce((sum: number, w: { transport_paid_amount?: number }) => 
          sum + (w.transport_paid_amount || 0), 0
        )
        
        if (totalPaid > 0) {
          transportPaid.push({
            diaristaId: diarista.id,
            diaristaName: diarista.name,
            month,
            year,
            totalPaid,
            weeksPaid: paidWeeks.length
          })
        }
      }
      setTransportPayments(transportPaid)
    } catch (err) {
      console.error('[v0] Error fetching payments:', err)
      setPayments([])
      setMonthlyPayments([])
      setCurrentMonthTotals([])
      setTransportPayments([])
    }
    setLoading(false)
  }, [month, year, selectedDiaristaId, diaristas])

  useEffect(() => { fetchPayments() }, [fetchPayments])

  const markAsPaid = async (paymentId: string) => {
    setUpdatingId(paymentId)
    await supabase.from('payment_history').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', paymentId)
    await fetchPayments()
    setUpdatingId(null)
  }

  const markAsPending = async (paymentId: string) => {
    setUpdatingId(paymentId)
    await supabase.from('payment_history').update({ status: 'pending', paid_at: null }).eq('id', paymentId)
    await fetchPayments()
    setUpdatingId(null)
  }

  const uploadReceipt = async (paymentId: string, file: File) => {
    setUpdatingId(paymentId)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (res.ok) {
        await supabase.from('payment_history').update({ receipt_url: data.url }).eq('id', paymentId)
        await fetchPayments()
      }
    } catch { /* ignore */ }
    setUpdatingId(null)
  }

  const getDiaristaName = (id: string) => diaristas.find(d => d.id === id)?.name || 'Desconhecida'

  const filtered = payments.filter(p => filterStatus === 'all' || p.status === filterStatus)
  const totalPending = payments.filter(p => p.status === 'pending').reduce((s, p) => s + Number(p.amount), 0)
  const totalPaid = payments.filter(p => p.status === 'paid').reduce((s, p) => s + Number(p.amount), 0)

  const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="border-primary/20">
          <CardContent className="p-3 text-center">
            <p className="text-lg font-bold text-primary">{payments.length}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Total</p>
          </CardContent>
        </Card>
        <Card className="border-yellow-500/20">
          <CardContent className="p-3 text-center">
            <p className="text-lg font-bold text-yellow-500">R$ {totalPending.toFixed(0)}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Pendente</p>
          </CardContent>
        </Card>
        <Card className="border-green-500/20">
          <CardContent className="p-3 text-center">
            <p className="text-lg font-bold text-green-500">R$ {totalPaid.toFixed(0)}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Pago</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <div className="flex gap-1.5">
          {([['all', 'Todos'], ['pending', 'Pendentes'], ['paid', 'Pagos']] as const).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilterStatus(val)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                filterStatus === val ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Pagamentos */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-primary" />
            Pagamentos Mensais
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="space-y-2">
            {/* Mes Atual - Valor Calculado Dinamicamente */}
            {currentMonthTotals.map(total => (
              <div
                key={`current-${total.diaristaId}`}
                className="p-3 rounded-xl border border-yellow-500/30 bg-yellow-500/5"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-yellow-500/10">
                    <Clock className="h-5 w-5 text-yellow-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold">{total.diaristaName}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {MONTHS_FULL[month - 1]}/{year}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            Em andamento
                          </span>
                        </div>
                      </div>
                      <p className="text-base font-bold shrink-0 text-yellow-500">
                        R$ {total.grandTotal.toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                      <span>Presencas: R$ {total.attendanceTotal.toFixed(2)}</span>
                      <span>Lavanderia: R$ {total.laundryTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Pagamentos Anteriores Pagos */}
            {monthlyPayments.map(mp => {
              const diarista = diaristas.find(d => d.id === mp.diarista_id)
              return (
                <div
                  key={mp.id}
                  className="p-3 rounded-xl border border-green-500/30 bg-green-500/5"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-green-500/10">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold">{diarista?.name || 'Diarista'}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              {MONTHS_FULL[mp.month - 1]}/{mp.year}
                            </span>
                            {mp.payment_date && (
                              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Pago em {new Date(mp.payment_date + 'T00:00:00').toLocaleDateString('pt-BR')}
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-base font-bold shrink-0 text-green-500">
                          R$ {Number(mp.monthly_value).toFixed(2)}
                        </p>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        {mp.notes && (
                          <p className="text-[10px] text-muted-foreground italic truncate max-w-[200px]">{mp.notes}</p>
                        )}
                        {mp.receipt_url && (
                          <a
                            href={mp.receipt_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-primary text-[11px] font-medium hover:underline ml-auto"
                          >
                            <Receipt className="h-3.5 w-3.5" />
                            Ver Recibo
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
            
            {/* Transporte Pago */}
            {transportPayments.map(tp => (
              <div
                key={`transport-${tp.diaristaId}-${tp.month}-${tp.year}`}
                className="p-3 rounded-xl border border-blue-500/30 bg-blue-500/5"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-blue-500/10">
                    <Bus className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold">{tp.diaristaName}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                            <Bus className="h-3 w-3" />
                            Transporte
                          </span>
                          <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {MONTHS_FULL[tp.month - 1]}/{tp.year}
                          </span>
                        </div>
                      </div>
                      <p className="text-base font-bold shrink-0 text-blue-500">
                        R$ {tp.totalPaid.toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span>{tp.weeksPaid} semana(s) paga(s)</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Mensagem se nao houver nada */}
            {currentMonthTotals.length === 0 && monthlyPayments.length === 0 && transportPayments.length === 0 && !loading && (
              <div className="text-center py-6 text-muted-foreground">
                <p className="text-sm">Nenhum pagamento registrado</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm">{'Nenhum pagamento encontrado'}</p>
          <p className="text-xs mt-1 opacity-60">{MONTHS[month - 1]}/{year}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(p => {
            const isPaid = p.status === 'paid'
            const isUpdating = updatingId === p.id
            return (
              <Card key={p.id} className={cn('transition-colors', isPaid && 'border-green-500/20 bg-green-500/5')}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                      isPaid ? 'bg-green-500/10' : 'bg-yellow-500/10'
                    )}>
                      {isPaid ? <CheckCircle className="h-5 w-5 text-green-500" /> : <Clock className="h-5 w-5 text-yellow-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold truncate">{getDiaristaName(p.diarista_id)}</p>
                        <p className={cn('text-sm font-bold', isPaid ? 'text-green-500' : 'text-foreground')}>
                          R$ {Number(p.amount).toFixed(2)}
                        </p>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {p.type === 'monthly_total' ? 'Total Mensal' : p.type === 'cleaning' ? 'Limpeza' : p.type === 'laundry' ? 'Lavanderia' : p.type === 'transport' ? 'Transporte' : p.type}
                        {p.description && ` - ${p.description}`}
                      </p>
                      {isPaid && p.paid_at && (
                        <p className="text-[10px] text-green-500/70 mt-0.5">
                          Pago em {new Date(p.paid_at).toLocaleDateString('pt-BR')}
                        </p>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2 mt-2.5">
                        {isPaid ? (
                          <Button variant="outline" size="sm" className="h-7 px-2.5 text-[11px] border-muted" onClick={() => markAsPending(p.id)} disabled={isUpdating}>
                            Desfazer
                          </Button>
                        ) : (
                          <Button size="sm" className="h-7 px-2.5 text-[11px] bg-green-600 hover:bg-green-700" onClick={() => markAsPaid(p.id)} disabled={isUpdating}>
                            {isUpdating ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><CheckCircle className="h-3 w-3 mr-1" />Pagar</>}
                          </Button>
                        )}
                        <label className="cursor-pointer">
                          <Button variant="outline" size="sm" className="h-7 px-2.5 text-[11px] pointer-events-none" asChild>
                            <span>
                              {p.receipt_url ? <Receipt className="h-3 w-3 mr-1 text-primary" /> : <Upload className="h-3 w-3 mr-1" />}
                              {p.receipt_url ? 'Comprovante' : 'Anexar'}
                            </span>
                          </Button>
                          <input type="file" className="sr-only" accept="image/*,application/pdf" onChange={e => { const f = e.target.files?.[0]; if (f) uploadReceipt(p.id, f) }} />
                        </label>
                        {p.receipt_url && (
                          <a href={p.receipt_url} target="_blank" rel="noopener noreferrer" className="text-primary">
                            <ChevronRight className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
