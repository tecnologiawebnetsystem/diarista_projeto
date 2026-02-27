'use client'

import { useState, useMemo } from 'react'
import { format, getDaysInMonth, startOfMonth, getDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAttendance } from '@/hooks/use-attendance'
import { Clock, CheckCircle2, XCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface AttendanceSectionProps {
  month: number
  year: number
  isAdmin?: boolean
  diaristaId?: string | null
}

export function AttendanceSection({ month, year, isAdmin, diaristaId }: AttendanceSectionProps) {
  const { attendance, loading, markAttendance, deleteAttendance } = useAttendance(month, year, diaristaId)
  const [toggling, setToggling] = useState<string | null>(null)

  // Gera todos os dias do mês que são segunda (1) ou quinta (4)
  const validDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(new Date(year, month - 1))
    const days: { date: string; dayOfWeek: number; dayType: 'heavy_cleaning' | 'light_cleaning' }[] = []

    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, month - 1, d)
      const dow = getDay(dateObj) // 0=Dom, 1=Seg, 4=Qui
      if (dow === 1) {
        days.push({ date: format(dateObj, 'yyyy-MM-dd'), dayOfWeek: 1, dayType: 'heavy_cleaning' })
      } else if (dow === 4) {
        days.push({ date: format(dateObj, 'yyyy-MM-dd'), dayOfWeek: 4, dayType: 'light_cleaning' })
      }
    }
    return days
  }, [month, year])

  const attendanceMap = useMemo(() => {
    const map: Record<string, typeof attendance[0]> = {}
    attendance.forEach(a => { map[a.date] = a })
    return map
  }, [attendance])

  async function handleToggle(date: string, dayType: 'heavy_cleaning' | 'light_cleaning') {
    if (toggling) return
    setToggling(date)
    try {
      const existing = attendanceMap[date]
      if (existing) {
        await deleteAttendance(existing.id)
      } else {
        await markAttendance(date, dayType)
      }
    } finally {
      setToggling(null)
    }
  }

  const totalHeavy = attendance.filter(a => a.day_type === 'heavy_cleaning' && a.present).length
  const totalLight = attendance.filter(a => a.day_type === 'light_cleaning' && a.present).length

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
            <Clock className="h-4 w-4 text-primary" />
            Dias Trabalhados
          </CardTitle>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-[10px] border-destructive text-destructive">
              {totalHeavy} pesada
            </Badge>
            <Badge variant="outline" className="text-[10px] border-primary text-primary">
              {totalLight} leve
            </Badge>
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground mt-1">
          Toque no dia para marcar/desmarcar presenca
        </p>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {validDays.length === 0 ? (
          <p className="text-center text-muted-foreground py-6 text-sm">
            Nenhum dia disponivel neste mes
          </p>
        ) : (
          <div className="space-y-2">
            {/* Legenda */}
            <div className="flex gap-3 mb-3">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-destructive/80" />
                <span className="text-[11px] text-muted-foreground">Segunda — Pesada</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-primary/80" />
                <span className="text-[11px] text-muted-foreground">Quinta — Leve</span>
              </div>
            </div>

            {/* Grade de dias */}
            <div className="grid grid-cols-2 gap-2">
              {validDays.map(({ date, dayType }) => {
                const record = attendanceMap[date]
                const present = !!record && record.present
                const isToggling = toggling === date
                const isHeavy = dayType === 'heavy_cleaning'
                const dateObj = new Date(date + 'T00:00:00')

                return (
                  <button
                    key={date}
                    onClick={() => handleToggle(date, dayType)}
                    disabled={!!toggling}
                    className={`
                      relative flex items-center gap-3 px-3 py-3 rounded-xl border-2 transition-all active:scale-95
                      ${present
                        ? isHeavy
                          ? 'border-destructive bg-destructive/15 text-destructive'
                          : 'border-primary bg-primary/15 text-primary'
                        : 'border-border bg-muted/30 text-muted-foreground'
                      }
                      ${isToggling ? 'opacity-60' : ''}
                    `}
                  >
                    {/* Spinner */}
                    {isToggling ? (
                      <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
                    ) : present ? (
                      <CheckCircle2 className="h-5 w-5 shrink-0" />
                    ) : (
                      <XCircle className="h-5 w-5 shrink-0 opacity-40" />
                    )}

                    <div className="text-left min-w-0">
                      <p className="text-sm font-bold leading-none">
                        {format(dateObj, 'dd/MM')}
                      </p>
                      <p className="text-[10px] mt-0.5 opacity-80 capitalize">
                        {format(dateObj, 'EEEE', { locale: ptBR })}
                      </p>
                      <p className={`text-[9px] font-semibold mt-0.5 uppercase tracking-wide ${present ? 'opacity-80' : 'opacity-40'}`}>
                        {isHeavy ? 'Pesada' : 'Leve'}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
