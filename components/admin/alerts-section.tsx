'use client'

import { useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { AlertTriangle, UserX, FileWarning, DollarSign, ShieldAlert, CalendarX, Bell, CheckCircle2 } from 'lucide-react'
import type { Diarista, Note } from '@/types/database'

interface AlertsSectionProps {
  diaristas: Diarista[]
  notes: Note[]
  pendingPayments: number
  month: number
  year: number
}

interface Alert {
  id: string
  type: 'critical' | 'warning' | 'info'
  icon: React.ElementType
  title: string
  description: string
  diaristaName?: string
}

export function AlertsSection({ diaristas, notes, pendingPayments, month, year }: AlertsSectionProps) {
  const alerts = useMemo(() => {
    const items: Alert[] = []

    // 1. Advertencias proximas do limite (3)
    const activeDiaristas = diaristas.filter(d => d.active)
    for (const d of activeDiaristas) {
      const warnings = notes.filter(n => n.diarista_id === d.id && n.is_warning)
      if (warnings.length >= 3) {
        items.push({
          id: `warn-limit-${d.id}`,
          type: 'critical',
          icon: ShieldAlert,
          title: `${d.name} atingiu ${warnings.length} advertencias`,
          description: 'Limite de advertencias atingido. Avalie a situacao.',
          diaristaName: d.name,
        })
      } else if (warnings.length === 2) {
        items.push({
          id: `warn-near-${d.id}`,
          type: 'warning',
          icon: AlertTriangle,
          title: `${d.name} com 2 advertencias`,
          description: 'Proxima advertencia atinge o limite.',
          diaristaName: d.name,
        })
      }
    }

    // 2. Diaristas sem agenda configurada
    for (const d of activeDiaristas) {
      if (!d.work_schedule || d.work_schedule.length === 0) {
        items.push({
          id: `no-sched-${d.id}`,
          type: 'warning',
          icon: CalendarX,
          title: `${d.name} sem agenda`,
          description: 'Configure os dias de trabalho na aba Equipe.',
          diaristaName: d.name,
        })
      }
    }

    // 3. Dias sem cliente vinculado
    for (const d of activeDiaristas) {
      const daysNoClient = d.work_schedule?.filter(s => !s.client_id) || []
      if (daysNoClient.length > 0 && d.work_schedule && d.work_schedule.length > 0) {
        items.push({
          id: `no-client-${d.id}`,
          type: 'info',
          icon: UserX,
          title: `${d.name} tem ${daysNoClient.length} dia(s) sem cliente`,
          description: 'Vincule clientes aos dias de trabalho.',
          diaristaName: d.name,
        })
      }
    }

    // 4. Pagamentos pendentes
    if (pendingPayments > 0) {
      items.push({
        id: 'pending-payments',
        type: 'warning',
        icon: DollarSign,
        title: `${pendingPayments} pagamento(s) pendente(s)`,
        description: `Confira na aba Pagamentos - ${month.toString().padStart(2, '0')}/${year}`,
      })
    }

    // 5. Diaristas sem PIN
    for (const d of activeDiaristas) {
      if (!d.pin) {
        items.push({
          id: `no-pin-${d.id}`,
          type: 'warning',
          icon: FileWarning,
          title: `${d.name} sem PIN`,
          description: 'Defina um PIN para acesso ao painel.',
          diaristaName: d.name,
        })
      }
    }

    return items.sort((a, b) => {
      const order = { critical: 0, warning: 1, info: 2 }
      return order[a.type] - order[b.type]
    })
  }, [diaristas, notes, pendingPayments, month, year])

  const criticals = alerts.filter(a => a.type === 'critical').length
  const warnings = alerts.filter(a => a.type === 'warning').length
  const infos = alerts.filter(a => a.type === 'info').length

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <Card className={cn('border-destructive/20', criticals > 0 && 'bg-destructive/5')}>
          <CardContent className="p-3 text-center">
            <p className={cn('text-lg font-bold', criticals > 0 ? 'text-destructive' : 'text-muted-foreground')}>{criticals}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Criticos</p>
          </CardContent>
        </Card>
        <Card className="border-yellow-500/20">
          <CardContent className="p-3 text-center">
            <p className={cn('text-lg font-bold', warnings > 0 ? 'text-yellow-500' : 'text-muted-foreground')}>{warnings}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Alertas</p>
          </CardContent>
        </Card>
        <Card className="border-blue-500/20">
          <CardContent className="p-3 text-center">
            <p className={cn('text-lg font-bold', infos > 0 ? 'text-blue-500' : 'text-muted-foreground')}>{infos}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Info</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {alerts.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm font-medium">Tudo em ordem</p>
          <p className="text-xs mt-1 opacity-60">Nenhum alerta encontrado</p>
        </div>
      ) : (
        <div className="space-y-2">
          {alerts.map(alert => {
            const Icon = alert.icon
            const colors = {
              critical: { bg: 'bg-destructive/10', border: 'border-destructive/30', text: 'text-destructive', icon: 'text-destructive' },
              warning: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-600 dark:text-yellow-400', icon: 'text-yellow-500' },
              info: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-600 dark:text-blue-400', icon: 'text-blue-500' },
            }[alert.type]

            return (
              <div key={alert.id} className={cn('rounded-xl border p-3.5 flex items-start gap-3', colors.bg, colors.border)}>
                <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', colors.bg)}>
                  <Icon className={cn('h-4.5 w-4.5', colors.icon)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={cn('text-sm font-semibold', colors.text)}>{alert.title}</p>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{alert.description}</p>
                </div>
                <Badge variant="outline" className={cn('shrink-0 text-[9px] h-5', colors.border, colors.text)}>
                  {alert.type === 'critical' ? 'Critico' : alert.type === 'warning' ? 'Alerta' : 'Info'}
                </Badge>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
