'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ReceiptUpload } from '@/components/receipt-upload'
import { Bus, CheckCircle2, Circle, ChevronDown, ChevronUp } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface TransportWeek {
  id: string
  week_number: number
  month: number
  year: number
  transport_fee: number
  receipt_url?: string | null
  paid_at?: string | null
  ironed?: boolean
  washed?: boolean
}

interface TransportSectionProps {
  month: number
  year: number
  diaristaId?: string | null
  onDataChange?: () => void
  diaristaTransportValue?: number
}

// Retorna as semanas do mes com suas datas de inicio e fim
function getWeeksOfMonth(month: number, year: number): { weekNumber: number; startDay: number; endDay: number }[] {
  const lastDay = new Date(year, month, 0).getDate() // Ultimo dia do mes
  const weeks: { weekNumber: number; startDay: number; endDay: number }[] = []
  
  let currentDay = 1
  let weekNumber = 1
  
  while (currentDay <= lastDay) {
    const startDay = currentDay
    const endDay = Math.min(currentDay + 6, lastDay)
    
    weeks.push({ weekNumber, startDay, endDay })
    
    currentDay = endDay + 1
    weekNumber++
  }
  
  return weeks
}

// Formata o nome do mes abreviado
function getMonthAbbr(month: number): string {
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  return months[month - 1]
}

export function TransportSection({ month, year, diaristaId, onDataChange, diaristaTransportValue }: TransportSectionProps) {
  const [transportWeeks, setTransportWeeks] = useState<TransportWeek[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedWeek, setExpandedWeek] = useState<number | null>(null)
  const transportValue = diaristaTransportValue ?? 30

  const weeksOfMonth = getWeeksOfMonth(month, year)
  const weeksCount = weeksOfMonth.length
  const monthAbbr = getMonthAbbr(month)

  // Busca ou cria os registros de transporte para cada semana do mes
  const fetchTransportWeeks = useCallback(async () => {
    if (!month || !year || !diaristaId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      // Busca registros existentes na laundry_weeks
      const { data: existingWeeks, error } = await supabase
        .from('laundry_weeks')
        .select('*')
        .eq('month', month)
        .eq('year', year)
        .eq('diarista_id', diaristaId)
        .order('week_number', { ascending: true })

      if (error) throw error

      // Monta a lista de semanas, criando placeholders para as que nao existem
      const weeks: TransportWeek[] = []
      for (let i = 1; i <= weeksCount; i++) {
        const existing = existingWeeks?.find(w => w.week_number === i)
        if (existing) {
          weeks.push({
            id: existing.id,
            week_number: existing.week_number,
            month: existing.month,
            year: existing.year,
            transport_fee: existing.transport_fee || transportValue,
            receipt_url: existing.receipt_url,
            paid_at: existing.paid_at,
            ironed: existing.ironed,
            washed: existing.washed
          })
        } else {
          // Semana ainda nao existe no banco - sera criada quando marcar como pago
          weeks.push({
            id: `new-${i}`,
            week_number: i,
            month,
            year,
            transport_fee: transportValue,
            receipt_url: null,
            paid_at: null,
            ironed: false,
            washed: false
          })
        }
      }

      setTransportWeeks(weeks)
    } catch (error) {
      console.error('Error fetching transport weeks:', error)
      setTransportWeeks([])
    } finally {
      setLoading(false)
    }
  }, [month, year, diaristaId, weeksCount, transportValue])

  useEffect(() => {
    fetchTransportWeeks()
  }, [fetchTransportWeeks])

  const totalTransport = transportWeeks.length * transportValue
  const totalPaid = transportWeeks
    .filter(w => w.paid_at)
    .reduce((sum, w) => sum + (w.transport_fee || transportValue), 0)
  const totalPending = totalTransport - totalPaid

  const handleTogglePaid = async (week: TransportWeek) => {
    try {
      const isPaid = !!week.paid_at

      if (week.id.startsWith('new-')) {
        // Cria novo registro no banco
        const { data, error } = await supabase
          .from('laundry_weeks')
          .insert([{
            week_number: week.week_number,
            month,
            year,
            diarista_id: diaristaId,
            value: 0,
            ironed: false,
            washed: false,
            transport_fee: transportValue,
            paid_at: new Date().toISOString()
          }])
          .select()
          .single()

        if (error) throw error
        if (data) {
          setTransportWeeks(prev => prev.map(w => 
            w.week_number === week.week_number ? {
              ...w,
              id: data.id,
              paid_at: data.paid_at,
              transport_fee: data.transport_fee
            } : w
          ))
        }
      } else {
        // Atualiza registro existente
        const { data, error } = await supabase
          .from('laundry_weeks')
          .update({ paid_at: isPaid ? null : new Date().toISOString() })
          .eq('id', week.id)
          .select()
          .single()

        if (error) throw error
        if (data) {
          setTransportWeeks(prev => prev.map(w => 
            w.id === week.id ? { ...w, paid_at: data.paid_at } : w
          ))
        }
      }

      onDataChange?.()
    } catch (error) {
      console.error('Error toggling transport paid:', error)
    }
  }

  const handleUploadReceipt = async (week: TransportWeek, url: string) => {
    try {
      if (week.id.startsWith('new-')) {
        // Cria novo registro no banco com o comprovante
        const { data, error } = await supabase
          .from('laundry_weeks')
          .insert([{
            week_number: week.week_number,
            month,
            year,
            diarista_id: diaristaId,
            value: 0,
            ironed: false,
            washed: false,
            transport_fee: transportValue,
            receipt_url: url
          }])
          .select()
          .single()

        if (error) throw error
        if (data) {
          setTransportWeeks(prev => prev.map(w => 
            w.week_number === week.week_number ? {
              ...w,
              id: data.id,
              receipt_url: data.receipt_url,
              transport_fee: data.transport_fee
            } : w
          ))
        }
      } else {
        // Atualiza registro existente
        const { data, error } = await supabase
          .from('laundry_weeks')
          .update({ receipt_url: url })
          .eq('id', week.id)
          .select()
          .single()

        if (error) throw error
        if (data) {
          setTransportWeeks(prev => prev.map(w => 
            w.id === week.id ? { ...w, receipt_url: data.receipt_url } : w
          ))
        }
      }

      onDataChange?.()
    } catch (error) {
      console.error('Error uploading transport receipt:', error)
    }
  }

  const handleRemoveReceipt = async (week: TransportWeek) => {
    try {
      if (week.id.startsWith('new-')) return

      const { data, error } = await supabase
        .from('laundry_weeks')
        .update({ receipt_url: null })
        .eq('id', week.id)
        .select()
        .single()

      if (error) throw error
      if (data) {
        setTransportWeeks(prev => prev.map(w => 
          w.id === week.id ? { ...w, receipt_url: null } : w
        ))
      }

      onDataChange?.()
    } catch (error) {
      console.error('Error removing transport receipt:', error)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Bus className="h-4 w-4 text-primary" />
            Transporte Semanal
          </CardTitle>
          {totalTransport > 0 && (
            <div className="text-right">
              <span className="text-sm font-bold text-primary">R$ {totalPaid.toFixed(2)}</span>
              <span className="text-[10px] text-muted-foreground ml-1">pago</span>
            </div>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground mt-1">
          Marque como pago e anexe o comprovante
        </p>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-3">

        {/* Resumo */}
        <div className="flex gap-2">
          <div className="flex-1 bg-green-500/10 rounded-lg p-2.5 text-center">
            <p className="text-lg font-bold text-green-500">R$ {totalPaid.toFixed(2)}</p>
            <p className="text-[10px] text-muted-foreground">Pago</p>
          </div>
          <div className="flex-1 bg-destructive/10 rounded-lg p-2.5 text-center">
            <p className="text-lg font-bold text-destructive">R$ {totalPending.toFixed(2)}</p>
            <p className="text-[10px] text-muted-foreground">Pendente</p>
          </div>
        </div>

        {/* Semanas */}
        {transportWeeks.map((week) => {
          const isPaid = !!week.paid_at
          const isExpanded = expandedWeek === week.week_number
          const hasLaundry = week.ironed || week.washed
          const weekInfo = weeksOfMonth.find(w => w.weekNumber === week.week_number)
          const weekLabel = weekInfo 
            ? `${weekInfo.startDay}-${weekInfo.endDay} ${monthAbbr}` 
            : `Semana ${week.week_number}`

          return (
            <div key={week.id} className="rounded-xl border border-border overflow-hidden">
              {/* Header da semana */}
              <button
                onClick={() => setExpandedWeek(isExpanded ? null : week.week_number)}
                className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 transition-colors active:bg-muted/50"
              >
                <div className="flex items-center gap-2">
                  {isPaid ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                  <span className="text-sm font-semibold">{weekLabel}</span>
                  {isPaid && (
                    <span className="text-[10px] bg-green-500/15 text-green-500 px-2 py-0.5 rounded-full font-medium">
                      Pago
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold ${isPaid ? 'text-green-500' : 'text-primary'}`}>
                    R$ {(week.transport_fee || transportValue).toFixed(2)}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </button>

              {/* Conteudo expandido */}
              {isExpanded && (
                <div className="px-4 py-3 space-y-3 border-t border-border">
                  {/* Servicos da semana (se houver) */}
                  {hasLaundry && (
                    <div className="text-[11px] text-muted-foreground space-y-0.5 pb-2 border-b border-border">
                      {week.ironed && <p>Passou roupa</p>}
                      {week.washed && <p>Lavou roupa</p>}
                    </div>
                  )}

                  {/* Botao Pago/Pendente */}
                  <button
                    onClick={() => handleTogglePaid(week)}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border-2 transition-all active:scale-[0.98] ${
                      isPaid
                        ? 'border-green-500 bg-green-500/10 text-green-500'
                        : 'border-border bg-background text-muted-foreground'
                    }`}
                  >
                    {isPaid ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <Circle className="h-4 w-4" />
                    )}
                    <span className="text-sm font-medium">
                      {isPaid ? 'Pago' : 'Marcar como Pago'}
                    </span>
                  </button>

                  {/* Upload comprovante */}
                  <ReceiptUpload
                    currentUrl={week.receipt_url}
                    onUpload={(url) => handleUploadReceipt(week, url)}
                    onRemove={() => handleRemoveReceipt(week)}
                    label="Comprovante de Transporte"
                    compact={!!week.receipt_url}
                  />
                </div>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
