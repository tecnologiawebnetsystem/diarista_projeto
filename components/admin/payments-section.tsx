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

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { DollarSign, CheckCircle, Clock, Receipt, Calendar, FileText, ChevronRight } from 'lucide-react'
import type { Diarista } from '@/types/database'

interface MonthlyPayment {
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
  created_at: string
}

const MONTHS_FULL = ['Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

interface PaymentsSectionProps {
  diaristas: Diarista[]
  selectedDiaristaId: string | null
  month: number
  year: number
}

export function PaymentsSection({ diaristas, selectedDiaristaId, month, year }: PaymentsSectionProps) {
  const [monthlyPayments, setMonthlyPayments] = useState<MonthlyPayment[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPayments = useCallback(async () => {
    setLoading(true)
    try {
      // Busca todos os pagamentos mensais
      const mpParams = new URLSearchParams()
      if (selectedDiaristaId) mpParams.set('diarista_id', selectedDiaristaId)
      const mpRes = await fetch(`/api/db/monthly-payments?${mpParams}`)
      setMonthlyPayments(mpRes.ok ? await mpRes.json() : [])
    } catch (err) {
      console.error('Error fetching payments:', err)
      setMonthlyPayments([])
    }
    setLoading(false)
  }, [selectedDiaristaId])

  useEffect(() => { fetchPayments() }, [fetchPayments])

  const getDiaristaName = (id: string) => diaristas.find(d => d.id === id)?.name || 'Desconhecida'

  // Filtra pagamentos do mes/ano selecionado e anteriores
  const currentMonthPayment = monthlyPayments.find(mp => mp.month === month && mp.year === year)
  const previousPayments = monthlyPayments
    .filter(mp => !(mp.month === month && mp.year === year))
    .sort((a, b) => {
      // Ordena por ano e mes decrescente
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
      {/* Pagamento do Mes Atual */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-primary" />
            Pagamento Mensal - {MONTHS_FULL[month - 1]}/{year}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {currentMonthPayment ? (
            <div className={cn(
              'p-4 rounded-xl border transition-colors',
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
                      <p className="text-sm font-semibold">{getDiaristaName(currentMonthPayment.diarista_id)}</p>
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
            <div className="text-center py-6 text-muted-foreground">
              <Clock className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nenhum pagamento registrado para este mes</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Historico de Pagamentos Anteriores */}
      {previousPayments.length > 0 && (
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Historico de Pagamentos
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="space-y-2">
              {previousPayments.map(mp => (
                <div
                  key={mp.id}
                  className={cn(
                    'p-3 rounded-xl border transition-colors',
                    mp.paid_at 
                      ? 'border-green-500/20 bg-green-500/5' 
                      : 'border-yellow-500/20 bg-yellow-500/5'
                  )}
                >
                  <div className="flex items-center gap-3">
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
                          <p className="text-sm font-semibold">{getDiaristaName(mp.diarista_id)}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                              {MONTHS_FULL[mp.month - 1]}/{mp.year}
                            </span>
                            {mp.paid_at && mp.payment_date && (
                              <span className="text-[10px] text-muted-foreground">
                                Pago em {formatDateBR(mp.payment_date)}
                              </span>
                            )}
                          </div>
                        </div>
                        <p className={cn(
                          'text-base font-bold shrink-0',
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
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
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
