'use client'

import { useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useMonthlyPayments } from '@/hooks/use-monthly-payments'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar, Clock, CheckCircle2, XCircle, DollarSign } from 'lucide-react'
import { ReceiptUpload } from '@/components/receipt-upload'

interface MonthlyPaymentSectionProps {
  month: number
  year: number
  isAdmin?: boolean
  hasActivity?: boolean
  diaristaId?: string | null
  diaristaName?: string
}

export function MonthlyPaymentSection({ month, year, isAdmin = true, hasActivity = false, diaristaId, diaristaName }: MonthlyPaymentSectionProps) {
  const { payment, loading, createPayment, markAsPaid, updatePayment } = useMonthlyPayments(month, year, diaristaId)

  // Cria o registro de pagamento apenas quando houver atividade e ele não existir ainda
  useEffect(() => {
    if (hasActivity && !loading && !payment) {
      createPayment()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasActivity, loading, payment])

  // Sem atividade no mês = não mostra nada
  if (!hasActivity) return null

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pagamento Mensal</CardTitle>
          <CardDescription>Carregando...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (!payment) return null

  const isPaid = !!payment.paid_at
  const dueDate = new Date(payment.payment_due_date + 'T00:00:00')
  const paymentDate = payment.payment_date ? new Date(payment.payment_date + 'T00:00:00') : null

  return (
    <Card className={isPaid ? 'border-success/50 bg-success/5' : 'border-primary/30'}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Pagamento Mensal
            </CardTitle>
            <CardDescription>
              {diaristaName ? `Pagamento mensal - ${diaristaName}` : 'Pagamento mensal da diarista'}
            </CardDescription>
          </div>
          {isPaid ? (
            <Badge variant="default" className="bg-success text-white">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Pago
            </Badge>
          ) : (
            <Badge variant="outline" className="border-destructive text-destructive">
              <XCircle className="h-3 w-3 mr-1" />
              Pendente
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Data de Pagamento Prevista */}
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Data Prevista (5º dia útil)</p>
            <p className="text-sm text-muted-foreground">
              {format(dueDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </div>
        </div>

        {/* Limite de Horas */}
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Horário Limite</p>
            <p className="text-sm text-muted-foreground">
              Até {payment.hour_limit.substring(0, 5)} (20:00)
            </p>
          </div>
        </div>

        {/* Data de Pagamento Efetiva */}
        {paymentDate && (
          <div className="flex items-center gap-3 p-3 bg-success/10 rounded-lg border border-success/20">
            <CheckCircle2 className="h-5 w-5 text-success" />
            <div>
              <p className="text-sm font-medium text-success">Pago em</p>
              <p className="text-sm text-success/80">
                {format(paymentDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>
          </div>
        )}

        {/* Comprovante */}
        {isAdmin && (
          <div className="pt-3 border-t">
            <ReceiptUpload
              currentUrl={payment.receipt_url}
              onUpload={async (url) => {
                await updatePayment({ receipt_url: url } as Record<string, unknown>)
              }}
              onRemove={async () => {
                await updatePayment({ receipt_url: null } as Record<string, unknown>)
              }}
              label="Comprovante de Pagamento"
            />
          </div>
        )}

        {/* Comprovante view para diarista */}
        {!isAdmin && payment.receipt_url && (
          <div className="pt-3 border-t">
            <ReceiptUpload
              currentUrl={payment.receipt_url}
              onUpload={async () => {}}
              label="Comprovante de Pagamento"
            />
          </div>
        )}

        {/* Acoes Admin */}
        {isAdmin && !isPaid && (
          <div className="pt-3 border-t">
            <Button 
              onClick={() => markAsPaid(payment.receipt_url || undefined)} 
              className="w-full"
              size="lg"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Marcar como Pago
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Registra o pagamento na data atual
            </p>
          </div>
        )}

        {/* Observações */}
        {payment.notes && (
          <div className="pt-3 border-t">
            <p className="text-sm font-medium mb-1">Observações</p>
            <p className="text-sm text-muted-foreground">{payment.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
