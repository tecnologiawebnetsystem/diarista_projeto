'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { DollarSign, CheckCircle, Clock, Receipt, ChevronRight } from 'lucide-react'

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

interface MyPaymentsSectionProps {
  diaristaId: string
  month: number
  year: number
}

const MONTHS_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

export function MyPaymentsSection({ diaristaId, month, year }: MyPaymentsSectionProps) {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPayments = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('payment_history')
        .select('*')
        .eq('diarista_id', diaristaId)
        .eq('month', month)
        .eq('year', year)
        .order('created_at', { ascending: false })
      setPayments((data as unknown as Payment[]) || [])
    } catch {
      setPayments([])
    }
    setLoading(false)
  }, [diaristaId, month, year])

  useEffect(() => { fetchPayments() }, [fetchPayments])

  const totalPending = payments.filter(p => p.status === 'pending').reduce((s, p) => s + Number(p.amount), 0)
  const totalPaid = payments.filter(p => p.status === 'paid').reduce((s, p) => s + Number(p.amount), 0)
  const totalAll = totalPending + totalPaid

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

  return (
    <div className="space-y-4">
      {/* Resumo visual */}
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
            <p className="text-lg font-bold text-yellow-500">{'R$ '}{totalPending.toFixed(2)}</p>
          </div>
          <div className="p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <CheckCircle className="h-3.5 w-3.5 text-green-500" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Recebido</span>
            </div>
            <p className="text-lg font-bold text-green-500">{'R$ '}{totalPaid.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Lista de pagamentos */}
      {payments.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm">Nenhum pagamento registrado</p>
          <p className="text-xs mt-1 opacity-60">{MONTHS_SHORT[month - 1]}/{year}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {payments.map(p => {
            const isPaid = p.status === 'paid'
            return (
              <div
                key={p.id}
                className={cn(
                  'rounded-xl border p-4 flex items-center gap-3 transition-colors',
                  isPaid ? 'border-green-500/15 bg-green-500/5' : 'border-border/60 bg-card'
                )}
              >
                <div className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                  isPaid ? 'bg-green-500/10' : 'bg-yellow-500/10'
                )}>
                  {isPaid
                    ? <CheckCircle className="h-5 w-5 text-green-500" />
                    : <Clock className="h-5 w-5 text-yellow-500" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold truncate">{getTypeLabel(p.type)}</p>
                    <p className={cn('text-sm font-bold shrink-0', isPaid ? 'text-green-500' : 'text-foreground')}>
                      {'R$ '}{Number(p.amount).toFixed(2)}
                    </p>
                  </div>
                  {p.description && (
                    <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{p.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1.5">
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[9px] h-5 px-2',
                        isPaid ? 'border-green-500/30 text-green-500' : 'border-yellow-500/30 text-yellow-500'
                      )}
                    >
                      {isPaid ? 'Recebido' : 'Pendente'}
                    </Badge>
                    {isPaid && p.paid_at && (
                      <span className="text-[10px] text-muted-foreground">
                        em {new Date(p.paid_at).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                    {p.receipt_url && (
                      <a
                        href={p.receipt_url}
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
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
