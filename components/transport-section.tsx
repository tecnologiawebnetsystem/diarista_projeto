'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useLaundryWeeks } from '@/hooks/use-laundry-weeks'
import { useConfig } from '@/hooks/use-config'
import { ReceiptUpload } from '@/components/receipt-upload'
import { Bus, CheckCircle2, Circle, ChevronDown, ChevronUp } from 'lucide-react'

interface TransportSectionProps {
  month: number
  year: number
  diaristaId?: string | null
  onDataChange?: () => void
}

export function TransportSection({ month, year, diaristaId, onDataChange }: TransportSectionProps) {
  const { laundryWeeks, loading, markTransportPaid, updateTransportReceipt, refetch } = useLaundryWeeks(month, year, diaristaId)
  const { getConfigValue } = useConfig()
  const transportValue = getConfigValue('transport') || 30
  const [expandedWeek, setExpandedWeek] = useState<number | null>(null)

  // Só mostra semanas que têm algum serviço de lavanderia
  const weeksWithServices = laundryWeeks.filter(w => w.ironed || w.washed)

  const totalTransport = weeksWithServices.reduce((sum, w) => sum + (w.transport_fee || 0), 0)
  const totalPaid = weeksWithServices
    .filter(w => w.paid_at)
    .reduce((sum, w) => sum + (w.transport_fee || 0), 0)
  const totalPending = totalTransport - totalPaid

  const handleTogglePaid = async (id: string, currentlyPaid: boolean) => {
    await markTransportPaid(id, !currentlyPaid)
    onDataChange?.()
  }

  const handleUploadReceipt = async (id: string, url: string) => {
    await updateTransportReceipt(id, url)
    onDataChange?.()
  }

  const handleRemoveReceipt = async (id: string) => {
    await updateTransportReceipt(id, null)
    onDataChange?.()
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
        {weeksWithServices.length > 0 && (
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
        )}

        {/* Estado vazio */}
        {weeksWithServices.length === 0 && (
          <p className="text-center text-muted-foreground py-4 text-sm">
            Nenhum servico de lavanderia registrado neste mes
          </p>
        )}

        {/* Semanas */}
        {weeksWithServices.map((week) => {
          const isPaid = !!week.paid_at
          const isExpanded = expandedWeek === week.week_number

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
                  <span className="text-sm font-semibold">Semana {week.week_number}</span>
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
                  {/* Servicos da semana */}
                  <div className="text-[11px] text-muted-foreground space-y-0.5">
                    {week.ironed && <p>Passou roupa</p>}
                    {week.washed && <p>Lavou roupa</p>}
                  </div>

                  {/* Botao Pago/Pendente */}
                  <button
                    onClick={() => handleTogglePaid(week.id, isPaid)}
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
                    onUpload={(url) => handleUploadReceipt(week.id, url)}
                    onRemove={() => handleRemoveReceipt(week.id)}
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
