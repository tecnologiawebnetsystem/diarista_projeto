'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useLaundryWeeks } from '@/hooks/use-laundry-weeks'
import { supabase } from '@/lib/supabase'
import { Shirt, CheckCircle2, Circle, Info, Calculator, Calendar } from 'lucide-react'

const MONTHS_FULL = ['Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
const MONTHS_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

interface LaundrySectionProps {
  month: number
  year: number
  isAdmin?: boolean
  diaristaId?: string | null
  onDataChange?: () => void
  diaristaIroningValue?: number
  diaristaWashingValue?: number
  diaristaTransportValue?: number
}

// Retorna as semanas do mes com suas datas de inicio e fim (igual ao transporte)
function getWeeksOfMonth(month: number, year: number): { weekNumber: number; startDay: number; endDay: number }[] {
  const lastDay = new Date(year, month, 0).getDate()
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

// Formata o periodo da semana (ex: "01-07 Mar")
function formatWeekPeriod(startDay: number, endDay: number, month: number): string {
  const startStr = String(startDay).padStart(2, '0')
  const endStr = String(endDay).padStart(2, '0')
  return `${startStr}-${endStr} ${MONTHS_SHORT[month - 1]}`
}

export function LaundrySection({ month, year, isAdmin = false, diaristaId, onDataChange, diaristaIroningValue, diaristaWashingValue, diaristaTransportValue }: LaundrySectionProps) {
  const { laundryWeeks, loading, updateLaundryService, refetch } = useLaundryWeeks(month, year, diaristaId)

  // Pega todas as semanas do mês com suas datas (igual ao transporte)
  const weeksOfMonth = getWeeksOfMonth(month, year)
  const weeksInMonth = weeksOfMonth.length
  
  // Valor mensal de lavagem (washing_value agora é mensal)
  const monthlyWashingValue = diaristaWashingValue ?? 300
  
  // Calcula o valor por semana baseado no valor mensal dividido pelo numero de semanas
  const washingValuePerWeek = monthlyWashingValue / weeksInMonth
  
  const ironingValue = diaristaIroningValue ?? 50
  const transportValue = diaristaTransportValue ?? 30

  const handleIronedChange = async (weekNumber: number, checked: boolean) => {
    const week = laundryWeeks.find(w => w.week_number === weekNumber)
    if (week) {
      await updateLaundryService(week.id, checked, week.washed)
    } else if (checked) {
      const insertData: Record<string, unknown> = {
        week_number: weekNumber, month, year, value: ironingValue,
        ironed: true, washed: false, transport_fee: transportValue
      }
      if (diaristaId) insertData.diarista_id = diaristaId
      await supabase.from('laundry_weeks').insert([insertData]).select().single()
      await refetch()
    }
    onDataChange?.()
  }

  const handleWashedChange = async (weekNumber: number, checked: boolean) => {
    const week = laundryWeeks.find(w => w.week_number === weekNumber)
    if (week) {
      await updateLaundryService(week.id, week.ironed, checked)
    } else if (checked) {
      const insertData: Record<string, unknown> = {
        week_number: weekNumber, month, year, value: washingValuePerWeek,
        ironed: false, washed: true, transport_fee: transportValue
      }
      if (diaristaId) insertData.diarista_id = diaristaId
      await supabase.from('laundry_weeks').insert([insertData]).select().single()
      await refetch()
    }
    onDataChange?.()
  }

  const getWeekTotal = (weekNumber: number) => {
    const week = laundryWeeks.find(w => w.week_number === weekNumber)
    if (!week) return 0
    return (week.ironed ? ironingValue : 0) + (week.washed ? washingValuePerWeek : 0)
  }

  const isIroned = (weekNumber: number) => {
    const week = laundryWeeks.find(w => w.week_number === weekNumber)
    return week?.ironed || false
  }

  const isWashed = (weekNumber: number) => {
    const week = laundryWeeks.find(w => w.week_number === weekNumber)
    return week?.washed || false
  }

  const totalLaundry = laundryWeeks.reduce((sum, week) => {
    return sum + (week.ironed ? ironingValue : 0) + (week.washed ? washingValuePerWeek : 0)
  }, 0)

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
            <Shirt className="h-4 w-4 text-primary" />
            Lavanderia
          </CardTitle>
          {totalLaundry > 0 && (
            <span className="text-sm font-bold text-primary">
              R$ {totalLaundry.toFixed(2)}
            </span>
          )}
        </div>
        {!isAdmin && (
          <p className="text-[11px] text-muted-foreground mt-1">Toque nos serviços para marcar</p>
        )}
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-3">

        {/* Card Explicativo - Valores da Lavanderia */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-2">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold text-primary">Como funciona o pagamento</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 bg-background/50 rounded-lg px-2.5 py-2">
              <Calculator className="h-3.5 w-3.5 text-muted-foreground" />
              <div>
                <p className="text-[10px] text-muted-foreground">Valor Mensal</p>
                <p className="text-xs font-bold">R$ {monthlyWashingValue.toFixed(2)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-background/50 rounded-lg px-2.5 py-2">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              <div>
                <p className="text-[10px] text-muted-foreground">{MONTHS_FULL[month - 1]} tem</p>
                <p className="text-xs font-bold">{weeksInMonth} semanas</p>
              </div>
            </div>
          </div>
          <div className="bg-background/80 rounded-lg px-3 py-2 text-center">
            <p className="text-[10px] text-muted-foreground">Valor por semana (R$ {monthlyWashingValue.toFixed(2)} / {weeksInMonth})</p>
            <p className="text-sm font-bold text-primary">R$ {washingValuePerWeek.toFixed(2)} por semana</p>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <div className="flex-1 border-t border-border/50" />
            <p className="text-[9px] text-muted-foreground">Passar roupa: R$ {ironingValue.toFixed(2)} / semana</p>
            <div className="flex-1 border-t border-border/50" />
          </div>
        </div>

        {/* TODAS as semanas do mês com datas */}
        {weeksOfMonth.map(({ weekNumber, startDay, endDay }) => {
          const ironed = isIroned(weekNumber)
          const washed = isWashed(weekNumber)
          const weekTotal = getWeekTotal(weekNumber)
          const hasAnyService = ironed || washed
          const weekLabel = formatWeekPeriod(startDay, endDay, month)

          return (
            <div key={weekNumber} className={`rounded-xl border overflow-hidden ${hasAnyService ? 'border-primary/30 bg-primary/5' : 'border-border bg-muted/30'}`}>
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
                <span className="text-sm font-semibold">{weekLabel}</span>
                <span className={`text-sm font-bold ${hasAnyService ? 'text-primary' : 'text-muted-foreground'}`}>
                  R$ {weekTotal.toFixed(2)}
                </span>
              </div>

              {isAdmin ? (
                /* Modo Admin — somente leitura */
                <div className="flex gap-2 px-4 py-3">
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${ironed ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    {ironed ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
                    Passou roupa
                  </div>
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${washed ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    {washed ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
                    Lavou roupa
                  </div>
                </div>
              ) : (
                /* Modo Diarista — interativo */
                <div className="flex gap-2 p-3">
                  <button
                    onClick={() => handleIronedChange(weekNumber, !ironed)}
                    className={`flex-1 flex items-center gap-2 px-3 py-3 rounded-lg border-2 transition-all active:scale-95 ${
                      ironed ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background text-muted-foreground'
                    }`}
                  >
                    {ironed ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <Circle className="h-4 w-4 shrink-0" />}
                    <div className="text-left">
                      <p className="text-xs font-medium leading-tight">Passou roupa</p>
                      <p className="text-[11px] opacity-70">R$ {ironingValue.toFixed(2)}</p>
                    </div>
                  </button>
                  <button
                    onClick={() => handleWashedChange(weekNumber, !washed)}
                    className={`flex-1 flex items-center gap-2 px-3 py-3 rounded-lg border-2 transition-all active:scale-95 ${
                      washed ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background text-muted-foreground'
                    }`}
                  >
                    {washed ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <Circle className="h-4 w-4 shrink-0" />}
                    <div className="text-left">
                      <p className="text-xs font-medium leading-tight">Lavou roupa</p>
                      <p className="text-[11px] opacity-70">R$ {washingValuePerWeek.toFixed(2)}</p>
                    </div>
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
