'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Building2, ChevronLeft, ChevronRight } from 'lucide-react'
import type { Diarista, Client } from '@/types/database'

const WDAY_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']
const MONTHS_FULL = ['Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
const DOW_MAP: Record<number, string> = { 0: 'sunday', 1: 'monday', 2: 'tuesday', 3: 'wednesday', 4: 'thursday', 5: 'friday', 6: 'saturday' }

interface MyCalendarSectionProps {
  diarista: Diarista
  clients: Client[]
  month: number
  year: number
  onChangeMonth: (m: number, y: number) => void
  attendances?: { date: string; present: boolean; day_type?: string }[]
}

interface DayInfo {
  type: 'heavy_cleaning' | 'light_cleaning'
  clientName?: string
  clientAddress?: string
  present?: boolean
}

export function MyCalendarSection({ diarista, clients, month, year, onChangeMonth, attendances = [] }: MyCalendarSectionProps) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  const calendarData = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1)
    const startDow = firstDay.getDay()
    const daysInMonth = new Date(year, month, 0).getDate()
    const today = new Date()
    const isCurrentMonth = today.getMonth() + 1 === month && today.getFullYear() === year

    // Attendance map
    const attMap: Record<string, { present: boolean; day_type?: string }> = {}
    for (const a of attendances) {
      attMap[a.date] = { present: a.present, day_type: a.day_type }
    }

    // Build day -> info map
    const dayMap: Record<number, DayInfo> = {}
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, month - 1, d)
      const dow = dateObj.getDay()
      const dayName = DOW_MAP[dow]
      const sched = diarista.work_schedule?.find(s => s.day === dayName)
      if (sched) {
        const client = sched.client_id ? clients.find(c => c.id === sched.client_id) : null
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
        const att = attMap[dateStr]
        dayMap[d] = {
          type: sched.type,
          clientName: client?.name,
          clientAddress: client?.address || undefined,
          present: att?.present,
        }
      }
    }

    return { startDow, daysInMonth, dayMap, isCurrentMonth, todayDate: today.getDate() }
  }, [diarista, clients, month, year, attendances])

  const prevMonth = () => {
    const m = month === 1 ? 12 : month - 1
    const y = month === 1 ? year - 1 : year
    onChangeMonth(m, y)
    setSelectedDay(null)
  }
  const nextMonth = () => {
    const m = month === 12 ? 1 : month + 1
    const y = month === 12 ? year + 1 : year
    onChangeMonth(m, y)
    setSelectedDay(null)
  }

  const { startDow, daysInMonth, dayMap, isCurrentMonth, todayDate } = calendarData
  const cells: (number | null)[] = []
  for (let i = 0; i < startDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const selectedInfo = selectedDay ? dayMap[selectedDay] : null
  const WDAY_FULL: Record<string, string> = { sunday: 'Domingo', monday: 'Segunda', tuesday: 'Terca', wednesday: 'Quarta', thursday: 'Quinta', friday: 'Sexta', saturday: 'Sabado' }

  // Stats
  const workDays = Object.keys(dayMap).length
  const pastWorkDays = Object.entries(dayMap).filter(([d]) => {
    const day = parseInt(d)
    return isCurrentMonth ? day <= todayDate : true
  })
  const presentDays = pastWorkDays.filter(([, info]) => info.present === true).length

  return (
    <div className="space-y-4">
      {/* Month nav */}
      <div className="flex items-center justify-between">
        <button onClick={prevMonth} className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="text-center">
          <p className="text-base font-bold">{MONTHS_FULL[month - 1]}</p>
          <p className="text-[11px] text-muted-foreground">{year}</p>
        </div>
        <button onClick={nextMonth} className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Mini stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-border/60 bg-card p-3 text-center">
          <p className="text-lg font-bold text-primary">{workDays}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Dias agenda</p>
        </div>
        <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-3 text-center">
          <p className="text-lg font-bold text-green-500">{presentDays}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Presentes</p>
        </div>
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-center">
          <p className="text-lg font-bold text-destructive">{pastWorkDays.length - presentDays}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Faltas</p>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-7 border-b border-border/40">
          {WDAY_SHORT.map(d => (
            <div key={d} className="py-2.5 text-center text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              {d}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7">
          {cells.map((day, i) => {
            if (day === null) return <div key={`empty-${i}`} className="aspect-square" />
            const info = dayMap[day]
            const isToday = isCurrentMonth && day === todayDate
            const isSelected = selectedDay === day
            const isPast = isCurrentMonth ? day < todayDate : month < new Date().getMonth() + 1

            return (
              <button
                key={day}
                onClick={() => setSelectedDay(isSelected ? null : day)}
                className={cn(
                  'aspect-square flex flex-col items-center justify-center gap-0.5 relative transition-all border-b border-r border-border/20',
                  isSelected ? 'bg-primary/10 ring-1 ring-primary/40' : 'hover:bg-muted/50',
                  isToday && 'font-bold'
                )}
              >
                <span className={cn(
                  'text-xs leading-none',
                  isToday && 'w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center',
                  !info && 'text-muted-foreground/40'
                )}>
                  {day}
                </span>
                {info && (
                  <div className="flex items-center gap-0.5 mt-0.5">
                    <div className={cn(
                      'w-1.5 h-1.5 rounded-full',
                      info.type === 'heavy_cleaning' ? 'bg-destructive' : 'bg-primary'
                    )} />
                    {isPast && info.present !== undefined && (
                      <div className={cn(
                        'w-1.5 h-1.5 rounded-full',
                        info.present ? 'bg-green-500' : 'bg-red-500'
                      )} />
                    )}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-3 flex-wrap text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-destructive" />Pesada</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-primary" />Leve</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500" />Presente</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500" />Falta</span>
      </div>

      {/* Selected day detail */}
      {selectedDay !== null && (
        <Card className={cn(
          'border-primary/20',
          selectedInfo?.present === true && 'border-green-500/20',
          selectedInfo?.present === false && 'border-destructive/20'
        )}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                {selectedDay} de {MONTHS_FULL[month - 1]}
              </p>
              {selectedInfo?.present !== undefined && (
                <Badge
                  variant="outline"
                  className={cn(
                    'text-[9px]',
                    selectedInfo.present ? 'border-green-500/30 text-green-500' : 'border-destructive/30 text-destructive'
                  )}
                >
                  {selectedInfo.present ? 'Presente' : 'Falta'}
                </Badge>
              )}
            </div>
            {selectedInfo ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                    selectedInfo.type === 'heavy_cleaning' ? 'bg-destructive/10' : 'bg-primary/10'
                  )}>
                    <span className={cn(
                      'text-xs font-bold',
                      selectedInfo.type === 'heavy_cleaning' ? 'text-destructive' : 'text-primary'
                    )}>
                      {WDAY_SHORT[new Date(year, month - 1, selectedDay).getDay()]}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">
                      {selectedInfo.type === 'heavy_cleaning' ? 'Limpeza Pesada' : 'Limpeza Leve'}
                    </p>
                    {selectedInfo.clientName && (
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
                        <Building2 className="h-3 w-3 shrink-0 text-primary/60" />
                        {selectedInfo.clientName}
                      </p>
                    )}
                    {selectedInfo.clientAddress && (
                      <p className="text-[10px] text-muted-foreground/70 mt-0.5 truncate ml-4">
                        {selectedInfo.clientAddress}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-2">Dia de folga</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
