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

import { cn } from '@/lib/utils'
import { DollarSign, CheckCircle, Clock, Receipt, ChevronRight, Calendar } from 'lucide-react'

interface MonthlyPaymentRecord {
  id: string
  diarista_id: string
  month: number
  year: number
  monthly_value: number
  loan_deduction: number
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

const MONTHS_FULL = ['Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

export function MyPaymentsSection({ diaristaId, month, year }: MyPaymentsSectionProps) {
  const [monthlyPayments, setMonthlyPayments] = useState<MonthlyPaymentRecord[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPayments = useCallback(async () => {
    setLoading(true)
    try {
      // Busca todos os pagamentos mensais da diarista
      const mpRes = await fetch(`/api/db/monthly-payments?diarista_id=${diaristaId}`)
      setMonthlyPayments(mpRes.ok ? await mpRes.json() : [])
    } catch {
      setMonthlyPayments([])
    }
    setLoading(false)
  }, [diaristaId])

  useEffect(() => { fetchPayments() }, [fetchPayments])

  // Pagamento do mes selecionado
  const currentMonthPayment = monthlyPayments.find(mp => mp.month === month && mp.year === year)
  
  // Pagamentos anteriores
  const previousPayments = monthlyPayments
    .filter(mp => !(mp.month === month && mp.year === year))
    .sort((a, b) => {
      if (b.year !== a.year) return b.year - a.year
      return b.month - a.month
    })

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Pagamento do mes atual */}
      {currentMonthPayment ? (
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
                <div className="text-right shrink-0">
                  {Number(currentMonthPayment.loan_deduction) > 0 && (
                    <p className="text-[10px] text-muted-foreground line-through">
                      R$ {(Number(currentMonthPayment.monthly_value) + Number(currentMonthPayment.loan_deduction)).toFixed(2)}
                    </p>
                  )}
                  <p className={cn(
                    'text-lg font-bold',
                    currentMonthPayment.paid_at ? 'text-green-500' : 'text-yellow-500'
                  )}>
                    R$ {Number(currentMonthPayment.monthly_value).toFixed(2)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2">
                {currentMonthPayment.paid_at && currentMonthPayment.payment_date && (
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Pago em {formatDateBR(currentMonthPayment.payment_date)}
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
      ) : (
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center shrink-0">
              <Clock className="h-6 w-6 text-yellow-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">Pagamento Mensal</p>
              <p className="text-[11px] text-muted-foreground">
                {MONTHS_FULL[month - 1]}/{year} - Aguardando fechamento
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Historico de pagamentos mensais */}
      {previousPayments.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground px-1">Historico de Pagamentos</p>
          {previousPayments.map(mp => (
            <div
              key={mp.id}
              className={cn(
                'rounded-xl border p-3 flex items-center gap-3',
                mp.paid_at ? 'border-green-500/15 bg-green-500/5' : 'border-yellow-500/15 bg-yellow-500/5'
              )}
            >
              <div className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                mp.paid_at ? 'bg-green-500/10' : 'bg-yellow-500/10'
              )}>
                {mp.paid_at 
                  ? <CheckCircle className="h-5 w-5 text-green-500" />
                  : <Clock className="h-5 w-5 text-yellow-500" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className={cn(
                      'text-sm font-semibold',
                      mp.paid_at ? 'text-green-600' : 'text-yellow-600'
                    )}>
                      {MONTHS_FULL[mp.month - 1]}/{mp.year}
                    </p>
                    {mp.payment_date && (
                      <p className="text-[10px] text-muted-foreground">
                        Pago em {formatDateBR(mp.payment_date)}
                      </p>
                    )}
                  </div>
                  <p className={cn(
                    'text-sm font-bold shrink-0',
                    mp.paid_at ? 'text-green-500' : 'text-yellow-500'
                  )}>
                    R$ {Number(mp.monthly_value).toFixed(2)}
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

      {/* Mensagem se nao houver nenhum pagamento */}
      {!currentMonthPayment && previousPayments.length === 0 && (
        <div className="text-center py-10 text-muted-foreground">
          <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm">Nenhum pagamento registrado</p>
        </div>
      )}
    </div>
  )
}
