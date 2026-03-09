'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { DollarSign, CheckCircle, Clock, Receipt, ChevronRight, Calendar } from 'lucide-react'

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
  const [loading, setLoading] = useState(true)

  const fetchPayments = useCallback(async () => {
    setLoading(true)
    try {
      // Busca pagamentos do payment_history
      const { data: historyData } = await supabase
        .from('payment_history')
        .select('*')
        .eq('diarista_id', diaristaId)
        .eq('month', month)
        .eq('year', year)
        .order('created_at', { ascending: false })
      setPayments((historyData as unknown as Payment[]) || [])
      
      // Busca todos os pagamentos mensais desta diarista (para historico)
      const { data: monthlyData } = await supabase
        .from('monthly_payments')
        .select('*')
        .eq('diarista_id', diaristaId)
        .order('year', { ascending: false })
        .order('month', { ascending: false })
      setMonthlyPayments((monthlyData as unknown as MonthlyPaymentRecord[]) || [])
    } catch {
      setPayments([])
      setMonthlyPayments([])
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
      {/* Resumo visual do mes atual */}
      <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
        <div className="p-5 text-center">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
            {MONTHS_SHORT[month - 1]} {year}
          </p>
          <p className="text-3xl font-bold text-foreground mt-1">
            {'R$ '}{totalAll.toFixed(2)}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">Total do periodo</p>
        </div>
        <div className="grid grid-cols-2 border-t border-border/40">
          <div className="p-4 text-center border-r border-border/40">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Clock className="h-3.5 w-3.5 text-yellow-500" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Pendente</span>
            </div>
            <p className="text-lg font-bold text-yellow-500">{'R$ '}{totalAllPending.toFixed(2)}</p>
          </div>
          <div className="p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <CheckCircle className="h-3.5 w-3.5 text-green-500" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Recebido</span>
            </div>
            <p className="text-lg font-bold text-green-500">{'R$ '}{totalAllPaid.toFixed(2)}</p>
          </div>
        </div>
      </div>

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
                    em {new Date(currentMonthPayment.payment_date + 'T00:00:00').toLocaleDateString('pt-BR')}
                  </span>
                )}
                {currentMonthPayment.receipt_url && (
                  <a
                    href={currentMonthPayment.receipt_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary flex items-center gap-0.5 text-[10px] font-medium ml-auto"
                  >
                    <Receipt className="h-3 w-3" />
                    Comprovante
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
                          Pago em {new Date(mp.payment_date + 'T00:00:00').toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </div>
                    <p className="text-sm font-bold text-green-500 shrink-0">
                      {'R$ '}{Number(mp.monthly_value).toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {mp.receipt_url && (
                      <a
                        href={mp.receipt_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary flex items-center gap-0.5 text-[10px] font-medium"
                      >
                        <Receipt className="h-3 w-3" />
                        Ver comprovante
                      </a>
                    )}
                  </div>
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
                      className="text-primary flex items-center gap-0.5 text-[9px] font-medium mt-1"
                    >
                      <Receipt className="h-2.5 w-2.5" />
                      Comprovante
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
