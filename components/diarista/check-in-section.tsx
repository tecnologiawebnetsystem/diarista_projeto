'use client'

import { useMemo } from 'react'
import { format, getDaysInMonth, getDay, isToday, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { MapPin, CheckCircle2, Clock, CalendarCheck } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAttendance } from '@/hooks/use-attendance'
import type { WorkScheduleDay, Client } from '@/types/database'

const DAY_TO_DOW: Record<string, number> = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
  thursday: 4, friday: 5, saturday: 6,
}

interface CheckInSectionProps {
  month: number
  year: number
  diaristaId: string
  workSchedule?: WorkScheduleDay[]
  clients?: Client[]
}

export function CheckInSection({ month, year, diaristaId, workSchedule, clients = [] }: CheckInSectionProps) {
  const { attendance, loading, markAttendance } = useAttendance(month, year, diaristaId)

  const todayStr = format(new Date(), 'yyyy-MM-dd')

  const validDays = useMemo(() => {
    const schedule = workSchedule && workSchedule.length > 0
      ? workSchedule
      : [{ day: 'monday' as const, type: 'heavy_cleaning' as const }, { day: 'thursday' as const, type: 'light_cleaning' as const }]

    const scheduleMap = new Map<number, { type: 'heavy_cleaning' | 'light_cleaning'; client_id?: string | null }>()
    for (const s of schedule) {
      const dow = DAY_TO_DOW[s.day]
      if (dow !== undefined) scheduleMap.set(dow, { type: s.type, client_id: s.client_id })
    }

    const daysInMonth = getDaysInMonth(new Date(year, month - 1))
    const days: { date: string; dayType: 'heavy_cleaning' | 'light_cleaning'; clientId?: string | null; isToday: boolean }[] = []

    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, month - 1, d)
      const dow = getDay(dateObj)
      const entry = scheduleMap.get(dow)
      if (entry) {
        const dateStr = format(dateObj, 'yyyy-MM-dd')
        days.push({ date: dateStr, dayType: entry.type, clientId: entry.client_id, isToday: dateStr === todayStr })
      }
    }
    return days
  }, [month, year, workSchedule, todayStr])

  const attendanceMap = useMemo(() => {
    const map: Record<string, typeof attendance[0]> = {}
    attendance.forEach(a => {
      // MySQL pode retornar date como "2026-05-05T03:00:00.000Z" — normaliza para "2026-05-05"
      const key = a.date.includes('T') ? a.date.split('T')[0] : a.date
      map[key] = { ...a, date: key }
    })
    return map
  }, [attendance])

  const todayEntry = validDays.find(d => d.isToday)
  const todayRecord = todayEntry ? attendanceMap[todayEntry.date] : null
  const alreadyCheckedIn = !!(todayRecord?.present)

  async function handleCheckIn() {
    if (!todayEntry || alreadyCheckedIn) return
    try {
      await markAttendance(todayEntry.date, todayEntry.dayType, true)
    } catch {
      alert('Erro ao registrar check-in. Tente novamente.')
    }
  }

  const presentCount = attendance.filter(a => a.present).length
  const checkedInByDiarista = attendance.filter(a => (a as unknown as Record<string, unknown>).checked_in_by_diarista).length

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
    <div className="space-y-4 pb-safe">
      <div className="flex items-center gap-2 mb-2">
        <CalendarCheck className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-bold text-foreground">Check-in de Presenca</h2>
      </div>

      {/* Card de check-in do dia */}
      {todayEntry ? (
        <Card className={`border-2 transition-all ${alreadyCheckedIn ? 'border-success/50 bg-success/5' : 'border-primary/40 bg-primary/5'}`}>
          <CardContent className="pt-5 pb-5">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${alreadyCheckedIn ? 'bg-success/20' : 'bg-primary/20'}`}>
                {alreadyCheckedIn
                  ? <CheckCircle2 className="w-8 h-8 text-success" />
                  : <MapPin className="w-8 h-8 text-primary" />
                }
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
                </p>
                <p className="font-bold text-lg text-foreground mt-0.5">
                  {alreadyCheckedIn ? 'Presenca confirmada!' : 'Confirmar presenca hoje'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {todayEntry.dayType === 'heavy_cleaning' ? 'Limpeza Pesada' : 'Limpeza Leve'}
                  {todayEntry.clientId && clients.length > 0 && (
                    <span> · {clients.find(c => c.id === todayEntry.clientId)?.name}</span>
                  )}
                </p>
              </div>
              {!alreadyCheckedIn && (
                <Button
                  onClick={handleCheckIn}
                  size="lg"
                  className="w-full max-w-xs bg-primary text-primary-foreground font-bold"
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  Confirmar Check-in
                </Button>
              )}
              {alreadyCheckedIn && todayRecord && (
                <div className="flex items-center gap-1.5 text-xs text-success">
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    Registrado em {format(parseISO(todayRecord.created_at), "HH:mm", { locale: ptBR })}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border bg-card">
          <CardContent className="py-6 text-center">
            <p className="text-muted-foreground text-sm">Hoje nao e um dia de trabalho.</p>
          </CardContent>
        </Card>
      )}

      {/* Resumo do mes */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm text-muted-foreground">Resumo do mes</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Dias trabalhados</span>
            <Badge variant="outline" className="text-primary border-primary/40">
              {presentCount} / {validDays.length}
            </Badge>
          </div>
          {checkedInByDiarista > 0 && (
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-muted-foreground">Confirmados por voce</span>
              <Badge variant="outline" className="text-success border-success/40">
                {checkedInByDiarista}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Historico dos dias do mes */}
      <div className="space-y-2">
        {validDays.filter(d => new Date(d.date) <= new Date()).map(({ date, dayType, clientId, isToday: isTodayDate }) => {
          const record = attendanceMap[date]
          const present = !!(record?.present)
          const dateObj = parseISO(date)
          const clientName = clientId ? clients.find(c => c.id === clientId)?.name : null

          return (
            <div
              key={date}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                isTodayDate ? 'border-primary/40 bg-primary/5' :
                present ? 'border-success/20 bg-success/5' :
                'border-border bg-muted/20'
              }`}
            >
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                present ? 'bg-success/20' : 'bg-muted'
              }`}>
                {present
                  ? <CheckCircle2 className="w-4 h-4 text-success" />
                  : <Clock className="w-4 h-4 text-muted-foreground" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground capitalize">
                  {format(dateObj, "EEEE, d/MM", { locale: ptBR })}
                  {isTodayDate && <span className="ml-1.5 text-xs text-primary">(hoje)</span>}
                </p>
                <p className="text-xs text-muted-foreground">
                  {dayType === 'heavy_cleaning' ? 'Limpeza Pesada' : 'Limpeza Leve'}
                  {clientName && ` · ${clientName}`}
                </p>
              </div>
              <Badge
                variant="outline"
                className={`text-xs flex-shrink-0 ${present ? 'text-success border-success/30' : 'text-muted-foreground'}`}
              >
                {present ? 'Presente' : 'Pendente'}
              </Badge>
            </div>
          )
        })}
      </div>
    </div>
  )
}
