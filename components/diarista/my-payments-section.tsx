'use client'

import { useState, useEffect, useCallback } from 'react'

// Formata datas vindas do MySQL (pode vir como "2026-04-01" ou "2026-04-01T03:00:00.000Z")
function formatDateBR(raw: string | null | undefined): string {
  if (!raw) return ''
  const datePart = raw.includes('T') ? raw.split('T')[0] : raw
  const [year, month, day] = datePart.split('-')
  if (!year || !month || !day) return raw
  return `${day}/${month}/${year}`
}

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { DollarSign, CheckCircle, Clock, Receipt, ChevronRight, Calendar, Bus, FileText } from 'lucide-react'

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

interface MonthlyPaymentRecord {
  id: string
  diarista_id: string
  month: number
  year: number
  monthly_value: number
  paid_at: string | null
  payment_date: string | null
  receipt_url: string | null
  notes: string | null
}

interface TransportPayment {
  month: number
  year: number
  totalPaid: number
  weeksPaid: number
  receiptUrls: string[]
}

interface MyPaymentsSectionProps {
  diaristaId: string
  month: number
  year: number
}

const MONTHS_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
const MONTHS_FULL = ['Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

export function MyPaymentsSection({ diaristaId, month, year }: MyPaymentsSectionProps) {
  const [payments, setPayments] = useState<Payment[]>([])
  const [monthlyPayments, setMonthlyPayments] = useState<MonthlyPaymentRecord[]>([])
  const [transportPayments, setTransportPayments] = useState<TransportPayment[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPayments = useCallback(async () => {
    setLoading(true)
    try {
      // Busca pagamento mensal
      const mpRes = await fetch(`/api/db/monthly-payments?month=${month}&year=${year}&diarista_id=${diaristaId}`)
      const mpData = mpRes.ok ? await mpRes.json() : null

      // Todos pagamentos mensais da diarista (historico)
      const allMpRes = await fetch(`/api/db/payment-history?diarista_id=${diaristaId}`)
      const allMpData: MonthlyPaymentRecord[] = allMpRes.ok ? await allMpRes.json() : []

      // Pagamentos mensais individuais para historico
      const monthlyRes = await fetch(`/api/db/monthly-payments?month=${month}&year=${year}&diarista_id=${diaristaId}`)
      const currentMp = monthlyRes.ok ? await monthlyRes.json() : null

      setPayments([])
      setMonthlyPayments(currentMp ? [currentMp] : [])

      // Busca transporte do mes atual
      const laundryRes = await fetch(`/api/db/laundry-weeks?month=${month}&year=${year}&diarista_id=${diaristaId}`)
      const laundryWeeksData: { transport_paid_amount?: number; receipt_url?: string | null }[] = laundryRes.ok ? await laundryRes.json() : []

      const paidWeeks = laundryWeeksData.filter(w => (w.transport_paid_amount || 0) > 0)
      const totalTransportPaid = paidWeeks.reduce((sum, w) => sum + (w.transport_paid_amount || 0), 0)
      const receiptUrls = paidWeeks.map(w => w.receipt_url).filter((u): u is string => !!u)

      if (totalTransportPaid > 0) {
        setTransportPayments([{ month, year, totalPaid: totalTransportPaid, weeksPaid: paidWeeks.length, receiptUrls }])
      } else {
        setTransportPayments([])
      }

      void mpData
      void allMpData
    } catch {
      setPayments([])
      setMonthlyPayments([])
      setTransportPayments([])
    }
    setLoading(false)
  }, [diaristaId, month, year])

  useEffect(() => { fetchPayments() }, [fetchPayments])

  // Pagamento mensal do mes selecionado
  const currentMonthPayment = monthlyPayments.find(mp => mp.month === month && mp.year === year)
  
  // Totais do payment_history (se houver)
  const totalPending = payments.filter(p => p.status === 'pending').reduce((s, p) => s + Number(p.amount), 0)
  const totalPaid = payments.filter(p => p.status === 'paid').reduce((s, p) => s + Number(p.amount), 0)
  
  // Inclui o pagamento mensal no total se existir
  const monthlyPaidValue = currentMonthPayment?.paid_at ? Number(currentMonthPayment.monthly_value) : 0
  const monthlyPendingValue = currentMonthPayment && !currentMonthPayment.paid_at ? Number(currentMonthPayment.monthly_value) : 0
  
  const totalAllPaid = totalPaid + monthlyPaidValue
  const totalAllPending = totalPending + monthlyPendingValue
  const totalAll = totalAllPaid + totalAllPending

  const getTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      monthly_total: 'Total Mensal',
      cleaning: 'Limpeza',
      laundry: 'Lavanderia',
      transport: 'Transporte',
      heavy_cleaning: 'Limpeza Pesada',
      light_cleaning: 'Limpeza Leve',
    }
    return map[type] || type
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  // Pagamentos mensais pagos (para historico)
  const paidMonthlyPayments = monthlyPayments.filter(mp => mp.paid_at)

  return (
    <div className="space-y-4">
      {/* Pagamento mensal do mes atual (se existir) */}
      {currentMonthPayment && (
        <div className={cn(
          'rounded-xl border p-4 transition-colors',
          currentMonthPayment.paid_at 
            ? 'border-green-500/30 bg-green-500/5' 
            : 'border-yellow-500/30 bg-yellow-500/5'
        )}>
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center shrink-0',
              currentMonthPayment.paid_at ? 'bg-green-500/10' : 'bg-yellow-500/10'
            )}>
              {currentMonthPayment.paid_at 
                ? <CheckCircle className="h-6 w-6 text-green-500" />
                : <Clock className="h-6 w-6 text-yellow-500" />
              }
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">Pagamento Mensal</p>
                  <p className="text-[11px] text-muted-foreground">
                    Referencia: {MONTHS_FULL[month - 1]}/{year}
                  </p>
                </div>
                <p className={cn(
                  'text-lg font-bold shrink-0',
                  currentMonthPayment.paid_at ? 'text-green-500' : 'text-yellow-500'
                )}>
                  {'R$ '}{Number(currentMonthPayment.monthly_value).toFixed(2)}
                </p>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Badge
                  variant="outline"
                  className={cn(
                    'text-[9px] h-5 px-2',
                    currentMonthPayment.paid_at ? 'border-green-500/30 text-green-500' : 'border-yellow-500/30 text-yellow-500'
                  )}
                >
                  {currentMonthPayment.paid_at ? 'Recebido' : 'Pendente'}
                </Badge>
                {currentMonthPayment.paid_at && currentMonthPayment.payment_date && (
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    em {formatDateBR(currentMonthPayment.payment_date)}
                  </span>
                )}
                {currentMonthPayment.receipt_url && (
                  <a
                    href={currentMonthPayment.receipt_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary flex items-center gap-1 text-[11px] font-medium ml-auto hover:underline"
                  >
                    <Receipt className="h-3.5 w-3.5" />
                    Ver Comprovante
                    <ChevronRight className="h-3 w-3" />
                  </a>
                )}
              </div>
              {currentMonthPayment.notes && (
                <p className="text-[10px] text-muted-foreground mt-2 italic">{currentMonthPayment.notes}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Transporte Pago do Mes */}
      {transportPayments.length > 0 && transportPayments.map(tp => (
        <div
          key={`transport-${tp.month}-${tp.year}`}
          className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
              <Bus className="h-6 w-6 text-blue-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">Transporte</p>
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
                <p className="text-lg font-bold shrink-0 text-blue-500">
                  {'R$ '}{tp.totalPaid.toFixed(2)}
                </p>
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>{tp.weeksPaid} semana(s) paga(s)</span>
                </div>
                {tp.receiptUrls.length > 0 && (
                  <a
                    href={tp.receiptUrls[0]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-primary text-[11px] font-medium hover:underline"
                  >
                    <Receipt className="h-3.5 w-3.5" />
                    Ver Comprovante
                    <ChevronRight className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Historico de pagamentos mensais */}
      {paidMonthlyPayments.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground px-1">Historico de Pagamentos</p>
          {paidMonthlyPayments
            .filter(mp => !(mp.month === month && mp.year === year)) // Exclui o mes atual (ja mostrado acima)
            .map(mp => (
              <div
                key={mp.id}
                className="rounded-xl border border-green-500/15 bg-green-500/5 p-3 flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-green-600">
                        {MONTHS_FULL[mp.month - 1]}/{mp.year}
                      </p>
                      {mp.payment_date && (
                        <p className="text-[10px] text-muted-foreground">
                          Pago em {formatDateBR(mp.payment_date)}
                        </p>
                      )}
                    </div>
                    <p className="text-sm font-bold text-green-500 shrink-0">
                      {'R$ '}{Number(mp.monthly_value).toFixed(2)}
                    </p>
                  </div>
                  {mp.receipt_url && (
                    <div className="flex justify-end mt-1">
                      <a
                        href={mp.receipt_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-primary text-[11px] font-medium hover:underline"
                      >
                        <Receipt className="h-3.5 w-3.5" />
                        Ver Comprovante
                        <ChevronRight className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Lista de pagamentos do payment_history (se houver) */}
      {payments.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground px-1">Detalhamento</p>
          {payments.map(p => {
            const isPaid = p.status === 'paid'
            return (
              <div
                key={p.id}
                className={cn(
                  'rounded-xl border p-3 flex items-center gap-3 transition-colors',
                  isPaid ? 'border-green-500/15 bg-green-500/5' : 'border-border/60 bg-card'
                )}
              >
                <div className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                  isPaid ? 'bg-green-500/10' : 'bg-yellow-500/10'
                )}>
                  {isPaid
                    ? <CheckCircle className="h-4 w-4 text-green-500" />
                    : <Clock className="h-4 w-4 text-yellow-500" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold truncate">{getTypeLabel(p.type)}</p>
                    <p className={cn('text-xs font-bold shrink-0', isPaid ? 'text-green-500' : 'text-foreground')}>
                      {'R$ '}{Number(p.amount).toFixed(2)}
                    </p>
                  </div>
                  {p.receipt_url && (
                    <a
                      href={p.receipt_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary flex items-center gap-1 text-[10px] font-medium mt-1 hover:underline"
                    >
                      <Receipt className="h-3 w-3" />
                      Ver Comprovante
                      <ChevronRight className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Mensagem se nao houver nada */}
      {!currentMonthPayment && payments.length === 0 && paidMonthlyPayments.length === 0 && (
        <div className="text-center py-10 text-muted-foreground">
          <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm">Nenhum pagamento registrado</p>
          <p className="text-xs mt-1 opacity-60">{MONTHS_SHORT[month - 1]}/{year}</p>
        </div>
      )}
    </div>
  )
}
