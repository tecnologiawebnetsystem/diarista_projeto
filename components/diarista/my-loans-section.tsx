'use client'

import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { HandCoins, AlertCircle, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useLoans } from '@/hooks/use-loans'

interface MyLoansSectionProps {
  diaristaId: string
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active: { label: 'Em aberto', color: 'text-warning border-warning/40 bg-warning/10' },
  paid: { label: 'Quitado', color: 'text-success border-success/40 bg-success/10' },
  cancelled: { label: 'Cancelado', color: 'text-muted-foreground border-border bg-muted' },
}

export function MyLoansSection({ diaristaId }: MyLoansSectionProps) {
  const { loans, loading, totalDebt } = useLoans(diaristaId)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (loading) {
    return (
      <div className="text-center text-muted-foreground py-10 text-sm">Carregando...</div>
    )
  }

  return (
    <div className="space-y-4 pb-safe">
      <div className="flex items-center gap-2 mb-2">
        <HandCoins className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-bold text-foreground">Meus Emprestimos</h2>
      </div>

      {/* Saldo devedor */}
      {totalDebt > 0 ? (
        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-warning flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Valor ainda a descontar</p>
                <p className="text-2xl font-bold text-warning">
                  R$ {totalDebt.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Sera descontado nos proximos pagamentos
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-success/20 bg-success/5">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-success">Sem debitos em aberto</p>
                <p className="text-xs text-muted-foreground">Voce nao possui emprestimos ativos.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista */}
      {loans.length === 0 ? (
        <p className="text-center text-muted-foreground text-sm py-6">Nenhum emprestimo encontrado.</p>
      ) : (
        <div className="space-y-3">
          {loans.map(loan => {
            const remaining = loan.installments - loan.installments_paid
            const remainingValue = remaining * loan.installment_value
            const isExpanded = expandedId === loan.id
            const statusInfo = STATUS_LABELS[loan.status]

            return (
              <Card key={loan.id} className="border-border bg-card">
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-foreground">{loan.description}</span>
                        <Badge variant="outline" className={`text-xs ${statusInfo.color}`}>
                          {statusInfo.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-sm text-muted-foreground">
                        <span>Total: <span className="font-medium text-foreground">
                          R$ {Number(loan.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span></span>
                        {loan.installments > 1 && (
                          <span>{loan.installments_paid}/{loan.installments} parcelas pagas</span>
                        )}
                      </div>
                      {loan.status === 'active' && (
                        <p className="text-xs text-warning mt-1">
                          A descontar: R$ {remainingValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          {loan.installments > 1 && ` em ${remaining}x de R$ ${Number(loan.installment_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : loan.id)}
                      className="text-muted-foreground p-1"
                      aria-label={isExpanded ? 'Recolher' : 'Expandir'}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>

                  {loan.installments > 1 && (
                    <div className="mt-3">
                      <div className="w-full bg-muted rounded-full h-1.5">
                        <div
                          className="bg-primary rounded-full h-1.5 transition-all"
                          style={{ width: `${(loan.installments_paid / loan.installments) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="text-xs text-muted-foreground">
                        Registrado em {format(new Date(loan.date), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </p>
                      {loan.notes && (
                        <p className="text-xs text-muted-foreground bg-muted/50 rounded p-2 mt-1.5">{loan.notes}</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
