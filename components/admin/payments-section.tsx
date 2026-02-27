'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { DollarSign, CheckCircle, Clock, AlertCircle, Upload, Receipt, Filter, ChevronRight } from 'lucide-react'
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

interface PaymentsSectionProps {
  diaristas: Diarista[]
  selectedDiaristaId: string | null
  month: number
  year: number
}

export function PaymentsSection({ diaristas, selectedDiaristaId, month, year }: PaymentsSectionProps) {
  const supabase = createClient()
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'paid'>('all')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const fetchPayments = useCallback(async () => {
    setLoading(true)
    let query = supabase.from('payment_history').select('*').eq('month', month).eq('year', year).order('created_at', { ascending: false })
    if (selectedDiaristaId) query = query.eq('diarista_id', selectedDiaristaId)
    const { data } = await query
    setPayments((data as unknown as Payment[]) || [])
    setLoading(false)
  }, [month, year, selectedDiaristaId, supabase])

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
