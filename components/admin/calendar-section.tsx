'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react'
import type { Diarista, Client } from '@/types/database'

const WDAY_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']
const MONTHS_FULL = ['Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
const DOW_MAP: Record<number, string> = { 0: 'sunday', 1: 'monday', 2: 'tuesday', 3: 'wednesday', 4: 'thursday', 5: 'friday', 6: 'saturday' }

interface CalendarSectionProps {
  diaristas: Diarista[]
  clients: Client[]
  month: number
  year: number
  onChangeMonth: (m: number, y: number) => void
}

interface DayEntry {
  diarista: Diarista
  type: 'heavy_cleaning' | 'light_cleaning'
  clientName?: string
}

export function CalendarSection({ diaristas, clients, month, year, onChangeMonth }: CalendarSectionProps) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  const calendarData = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1)
    const startDow = firstDay.getDay()
    const daysInMonth = new Date(year, month, 0).getDate()
    const today = new Date()
    const isCurrentMonth = today.getMonth() + 1 === month && today.getFullYear() === year

    // Build day -> diaristas map
    const dayMap: Record<number, DayEntry[]> = {}
    for (let d = 1; d <= daysInMonth; d++) {
      const dow = new Date(year, month - 1, d).getDay()
      const dayName = DOW_MAP[dow]
      const entries: DayEntry[] = []

      for (const diarista of diaristas) {
        if (!diarista.active) continue
        const sched = diarista.work_schedule?.find(s => s.day === dayName)
        if (sched) {
          const client = sched.client_id ? clients.find(c => c.id === sched.client_id) : null
          entries.push({ diarista, type: sched.type, clientName: client?.name })
        }
      }
      if (entries.length > 0) dayMap[d] = entries
    }

    return { startDow, daysInMonth, dayMap, isCurrentMonth, todayDate: today.getDate() }
  }, [diaristas, clients, month, year])

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

  const selectedEntries = selectedDay ? dayMap[selectedDay] || [] : []

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
            const entries = dayMap[day] || []
            const isToday = isCurrentMonth && day === todayDate
            const isSelected = selectedDay === day
            const hasHeavy = entries.some(e => e.type === 'heavy_cleaning')
            const hasLight = entries.some(e => e.type === 'light_cleaning')

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
                  entries.length === 0 && 'text-muted-foreground/50'
                )}>
                  {day}
                </span>
                {entries.length > 0 && (
                  <div className="flex gap-0.5 mt-0.5">
                    {hasHeavy && <div className="w-1.5 h-1.5 rounded-full bg-destructive" />}
                    {hasLight && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                    {entries.length > 1 && <span className="text-[8px] text-muted-foreground leading-none">+{entries.length}</span>}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-destructive" />Pesada</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-primary" />Leve</span>
      </div>

      {/* Selected day detail */}
      {selectedDay && (
        <Card className="border-primary/20">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-3">
              {selectedDay} de {MONTHS_FULL[month - 1]}
            </p>
            {selectedEntries.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-3">Nenhum servico agendado</p>
            ) : (
              <div className="space-y-2.5">
                {selectedEntries.map((entry, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/50">
                    {entry.diarista.photo_url ? (
                      <img src={entry.diarista.photo_url} alt="" className="w-9 h-9 rounded-full object-cover" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center text-primary text-xs font-bold">
                        {entry.diarista.name.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{entry.diarista.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Badge variant="outline" className={cn('text-[9px] h-4 px-1.5', entry.type === 'heavy_cleaning' ? 'border-destructive/40 text-destructive' : 'border-primary/40 text-primary')}>
                          {entry.type === 'heavy_cleaning' ? 'Pesada' : 'Leve'}
                        </Badge>
                        {entry.clientName && (
                          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 truncate">
                            <MapPin className="h-2.5 w-2.5 shrink-0" />{entry.clientName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
