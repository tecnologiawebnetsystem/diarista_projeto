'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useLaundryWeeks } from '@/hooks/use-laundry-weeks'
import { supabase } from '@/lib/supabase'
import { Shirt, CheckCircle2, Circle, Info, Calculator, Calendar } from 'lucide-react'

const MONTHS_FULL = ['Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

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

// Calcula quantas semanas tem no mes
function getWeeksInMonth(month: number, year: number): number {
  const lastDay = new Date(year, month, 0).getDate()
  let weeks = 0
  let currentDay = 1
  while (currentDay <= lastDay) {
    weeks++
    currentDay += 7
  }
  return weeks
}

// Retorna o periodo de cada semana do mes (ex: "01-07 Mar")
function getWeekPeriod(weekNumber: number, month: number, year: number): string {
  const MONTHS_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  const lastDayOfMonth = new Date(year, month, 0).getDate()
  
  const startDay = (weekNumber - 1) * 7 + 1
  let endDay = startDay + 6
  if (endDay > lastDayOfMonth) endDay = lastDayOfMonth
  
  const startStr = String(startDay).padStart(2, '0')
  const endStr = String(endDay).padStart(2, '0')
  
  return `${startStr}-${endStr} ${MONTHS_SHORT[month - 1]}`
}

export function LaundrySection({ month, year, isAdmin = false, diaristaId, onDataChange, diaristaIroningValue, diaristaWashingValue, diaristaTransportValue }: LaundrySectionProps) {
  const { laundryWeeks, loading, updateLaundryService, refetch } = useLaundryWeeks(month, year, diaristaId)

  // Calcula o numero de semanas do mes
  const weeksInMonth = getWeeksInMonth(month, year)
  
  // Valor mensal de lavagem (washing_value agora é mensal)
  const monthlyWashingValue = diaristaWashingValue ?? 300
  
  // Calcula o valor por semana baseado no valor mensal dividido pelo numero de semanas
  const washingValuePerWeek = monthlyWashingValue / weeksInMonth
  
  const ironingValue = diaristaIroningValue ?? 50
  const transportValue = diaristaTransportValue ?? 30

  // Só mostra semanas que têm serviços cadastrados (igual ao AttendanceSection)
  const weeksWithServices = laundryWeeks.filter(w => w.ironed || w.washed)

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

  // Usa a mesma função para calcular semanas totais do mês
  const allWeeks = Array.from({ length: weeksInMonth }, (_, i) => i + 1)
  // Semanas sem nenhum serviço ativo (ironed ou washed) devem aparecer como "não registradas"
  const unregisteredWeeks = allWeeks.filter(w => !weeksWithServices.find(lw => lw.week_number === w))

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

        {/* Estado vazio — só mostra no modo leitura (isAdmin) ou quando não há semanas não registradas */}
        {weeksWithServices.length === 0 && isAdmin && (
          <p className="text-center text-muted-foreground py-4 text-sm">
            Nenhum serviço registrado neste mês
          </p>
        )}

        {/* Semanas com serviços */}
        {weeksWithServices.map((week) => {
          const weekNumber = week.week_number
          const ironed = week.ironed
          const washed = week.washed
          const weekTotal = getWeekTotal(weekNumber)

          return (
            <div key={weekNumber} className="rounded-xl border border-border bg-muted/30 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
                <span className="text-sm font-semibold">{getWeekPeriod(weekNumber, month, year)}</span>
                <span className="text-sm font-bold text-primary">R$ {weekTotal.toFixed(2)}</span>
              </div>

              {isAdmin ? (
                /* Modo Admin — somente leitura */
                <div className="flex gap-2 px-4 py-3">
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${ironed ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Passou roupa
                  </div>
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${washed ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    <CheckCircle2 className="h-3.5 w-3.5" />
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

        {/* Botões para adicionar semanas — modo interativo */}
        {!isAdmin && unregisteredWeeks.length > 0 && (
          <div className="space-y-2">
            <p className="text-[11px] text-muted-foreground font-medium">
              {weeksWithServices.length === 0 ? 'Selecione a semana para registrar serviço:' : 'Adicionar semana:'}
            </p>
            <div className="flex flex-wrap gap-2">
              {unregisteredWeeks.map(w => (
                <button
                  key={w}
                  onClick={() => handleIronedChange(w, true)}
                  className="px-4 py-2.5 rounded-xl border-2 border-dashed border-border text-sm text-muted-foreground active:scale-95 transition-all hover:border-primary hover:text-primary"
                >
                  + {getWeekPeriod(w, month, year)}
                </button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
