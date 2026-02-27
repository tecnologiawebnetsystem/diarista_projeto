'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useLaundryWeeks } from '@/hooks/use-laundry-weeks'
import { useConfig } from '@/hooks/use-config'
import { supabase } from '@/lib/supabase'
import { Shirt, Wind, CheckCircle2, Circle } from 'lucide-react'

interface LaundrySectionProps {
  month: number
  year: number
  isAdmin?: boolean
  diaristaId?: string | null
  onDataChange?: () => void
}

export function LaundrySection({ month, year, isAdmin = false, diaristaId, onDataChange }: LaundrySectionProps) {
  const { laundryWeeks, loading, updateLaundryService, refetch } = useLaundryWeeks(month, year, diaristaId)
  const { getConfigValue } = useConfig()

  const ironingValue = getConfigValue('ironing') || 50
  const washingValue = getConfigValue('washing') || 75
  const transportValue = getConfigValue('transport') || 30

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
        week_number: weekNumber, month, year, value: washingValue,
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
    const services = (week.ironed ? ironingValue : 0) + (week.washed ? washingValue : 0)
    // Só cobra transporte se houver algum serviço
    const transport = (week.ironed || week.washed) ? (week.transport_fee || transportValue) : 0
    return services + transport
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
    const services = (week.ironed ? ironingValue : 0) + (week.washed ? washingValue : 0)
    const transport = (week.ironed || week.washed) ? (week.transport_fee || transportValue) : 0
    return sum + services + transport
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

  // Calcula semanas totais do mês para o seletor de nova semana
  const totalWeeksInMonth = Math.ceil(
    (new Date(year, month, 0).getDate() + new Date(year, month - 1, 1).getDay()) / 7
  )
  const allWeeks = Array.from({ length: totalWeeksInMonth }, (_, i) => i + 1)
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
                <span className="text-sm font-semibold">Semana {weekNumber}</span>
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
                      <p className="text-[11px] opacity-70">R$ {washingValue.toFixed(2)}</p>
                    </div>
                  </button>
                </div>
              )}

              {(ironed || washed) && (
                <div className="px-4 pb-3">
                  <span className="text-[11px] text-muted-foreground">+ Transporte: R$ {transportValue.toFixed(2)}</span>
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
                  + Semana {w}
                </button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
