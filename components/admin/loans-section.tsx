'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { HandCoins, Plus, CheckCircle2, XCircle, Trash2, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useLoans } from '@/hooks/use-loans'
import type { Diarista } from '@/types/database'

interface LoansSectionProps {
  diaristas: Diarista[]
  selectedDiaristaId?: string | null
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active: { label: 'Ativo', color: 'text-warning border-warning/40 bg-warning/10' },
  paid: { label: 'Quitado', color: 'text-success border-success/40 bg-success/10' },
  cancelled: { label: 'Cancelado', color: 'text-muted-foreground border-border bg-muted' },
}

export function LoansSection({ diaristas, selectedDiaristaId }: LoansSectionProps) {
  const { loans, loading, createLoan, payInstallment, cancelLoan, deleteLoan, totalDebt } = useLoans(selectedDiaristaId || undefined)
  const [showForm, setShowForm] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [actionId, setActionId] = useState<string | null>(null)

  const [form, setForm] = useState({
    diarista_id: selectedDiaristaId || '',
    description: '',
    amount: '',
    installments: '1',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  })

  function resetForm() {
    setForm({
      diarista_id: selectedDiaristaId || '',
      description: '',
      amount: '',
      installments: '1',
      date: new Date().toISOString().split('T')[0],
      notes: '',
    })
    setShowForm(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.diarista_id || !form.description || !form.amount || !form.date) return
    try {
      setSaving(true)
      await createLoan({
        diarista_id: form.diarista_id,
        description: form.description,
        amount: parseFloat(form.amount),
        installments: parseInt(form.installments),
        date: form.date,
        notes: form.notes || undefined,
      })
      resetForm()
    } catch {
      alert('Erro ao registrar emprestimo.')
    } finally {
      setSaving(false)
    }
  }

  async function handlePay(loanId: string) {
    try {
      setActionId(loanId)
      await payInstallment(loanId)
    } catch {
      alert('Erro ao registrar pagamento.')
    } finally {
      setActionId(null)
    }
  }

  async function handleCancel(loanId: string) {
    if (!confirm('Cancelar este emprestimo?')) return
    try {
      setActionId(loanId)
      await cancelLoan(loanId)
    } catch {
      alert('Erro ao cancelar emprestimo.')
    } finally {
      setActionId(null)
    }
  }

  async function handleDelete(loanId: string) {
    if (!confirm('Excluir este emprestimo permanentemente?')) return
    try {
      setActionId(loanId)
      await deleteLoan(loanId)
    } catch {
      alert('Erro ao excluir emprestimo.')
    } finally {
      setActionId(null)
    }
  }

  const diaristaName = selectedDiaristaId
    ? diaristas.find(d => d.id === selectedDiaristaId)?.name
    : null

  return (
    <div className="space-y-4 pb-safe">
      {/* Header com total */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <HandCoins className="w-5 h-5 text-primary" />
            Emprestimos e Adiantamentos
          </h2>
          {diaristaName && <p className="text-sm text-muted-foreground">{diaristaName}</p>}
        </div>
        <Button
          size="sm"
          onClick={() => setShowForm(v => !v)}
          className="bg-primary text-primary-foreground"
        >
          <Plus className="w-4 h-4 mr-1" />
          Novo
        </Button>
      </div>

      {/* Saldo devedor */}
      {totalDebt > 0 && (
        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-warning flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Saldo devedor total</p>
                <p className="text-xl font-bold text-warning">
                  R$ {totalDebt.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Formulario novo emprestimo */}
      {showForm && (
        <Card className="border-primary/30 bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Novo Emprestimo / Adiantamento</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!selectedDiaristaId && (
                <div className="space-y-1.5">
                  <Label>Diarista</Label>
                  <Select value={form.diarista_id} onValueChange={v => setForm(f => ({ ...f, diarista_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecionar diarista..." /></SelectTrigger>
                    <SelectContent>
                      {diaristas.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-1.5">
                <Label>Descricao</Label>
                <Input
                  placeholder="Ex: Adiantamento de salario, Emprestimo pessoal..."
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Valor Total (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0,00"
                    value={form.amount}
                    onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Parcelas</Label>
                  <Input
                    type="number"
                    min="1"
                    max="24"
                    value={form.installments}
                    onChange={e => setForm(f => ({ ...f, installments: e.target.value }))}
                    required
                  />
                </div>
              </div>
              {form.amount && form.installments && parseInt(form.installments) > 1 && (
                <p className="text-xs text-muted-foreground">
                  Valor por parcela: <span className="font-semibold text-primary">
                    R$ {(parseFloat(form.amount) / parseInt(form.installments)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </p>
              )}
              <div className="space-y-1.5">
                <Label>Data</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Observacoes (opcional)</Label>
                <Textarea
                  placeholder="Detalhes adicionais..."
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={saving} className="flex-1 bg-primary text-primary-foreground">
                  {saving ? 'Salvando...' : 'Registrar'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Lista de emprestimos */}
      {loading ? (
        <div className="text-center text-muted-foreground py-8 text-sm">Carregando...</div>
      ) : loans.length === 0 ? (
        <Card className="border-dashed border-border">
          <CardContent className="py-10 text-center text-muted-foreground text-sm">
            Nenhum emprestimo registrado.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {loans.map(loan => {
            const remaining = loan.installments - loan.installments_paid
            const remainingValue = remaining * loan.installment_value
            const isExpanded = expandedId === loan.id
            const statusInfo = STATUS_LABELS[loan.status]
            const diarista = diaristas.find(d => d.id === loan.diarista_id)

            return (
              <Card key={loan.id} className="border-border bg-card">
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-foreground truncate">{loan.description}</span>
                        <Badge variant="outline" className={`text-xs ${statusInfo.color}`}>
                          {statusInfo.label}
                        </Badge>
                      </div>
                      {!selectedDiaristaId && diarista && (
                        <p className="text-xs text-muted-foreground mt-0.5">{diarista.name}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-sm">
                        <span className="text-muted-foreground">
                          Total: <span className="font-medium text-foreground">
                            R$ {Number(loan.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </span>
                        {loan.installments > 1 && (
                          <span className="text-muted-foreground">
                            {loan.installments_paid}/{loan.installments} parcelas
                          </span>
                        )}
                      </div>
                      {loan.status === 'active' && (
                        <p className="text-xs text-warning mt-1">
                          Restam: R$ {remainingValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          {loan.installments > 1 && ` (${remaining}x R$ ${Number(loan.installment_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`}
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

                  {/* Barra de progresso */}
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

                  {/* Acoes expandidas */}
                  {isExpanded && (
                    <div className="mt-4 pt-3 border-t border-border space-y-2">
                      <p className="text-xs text-muted-foreground">
                        Registrado em {format(new Date(loan.date), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </p>
                      {loan.notes && (
                        <p className="text-xs text-muted-foreground bg-muted/50 rounded p-2">{loan.notes}</p>
                      )}
                      <div className="flex gap-2 flex-wrap pt-1">
                        {loan.status === 'active' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handlePay(loan.id)}
                              disabled={actionId === loan.id}
                              className="bg-success/20 text-success border border-success/30 hover:bg-success/30 h-8 text-xs"
                              variant="outline"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                              {loan.installments > 1 ? 'Pagar Parcela' : 'Quitar'}
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleCancel(loan.id)}
                              disabled={actionId === loan.id}
                              variant="outline"
                              className="h-8 text-xs text-muted-foreground"
                            >
                              <XCircle className="w-3.5 h-3.5 mr-1" />
                              Cancelar
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          onClick={() => handleDelete(loan.id)}
                          disabled={actionId === loan.id}
                          variant="outline"
                          className="h-8 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1" />
                          Excluir
                        </Button>
                      </div>
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
