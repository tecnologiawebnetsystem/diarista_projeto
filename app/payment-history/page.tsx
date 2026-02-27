'use client'

import { useState } from 'react'
import { ArrowLeft, DollarSign, Clock, CheckCircle, Receipt, Filter } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/contexts/auth-context'
import { usePaymentHistory } from '@/hooks/use-payment-history'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const MONTHS = [
  '', 'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

export default function PaymentHistoryPage() {
  const { role, diaristaId, diarista } = useAuth()
  const currentDate = new Date()
  const [filterYear, setFilterYear] = useState<number>(currentDate.getFullYear())
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'pending'>('all')

  const effectiveDiaristaId = role === 'diarista' ? diaristaId : null
  const { records, loading, totalPaid, totalPending } = usePaymentHistory(effectiveDiaristaId, filterYear)

  const filteredRecords = filterStatus === 'all'
    ? records
    : records.filter(r => r.status === filterStatus)

  const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - 2 + i)
  const backUrl = role === 'admin' ? '/admin' : '/diarista'

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      {/* Header */}
      <div className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="px-4 py-3 flex items-center gap-3">
          <Link href={backUrl}>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            <div>
              <h1 className="text-base font-bold leading-none">{'Historico de Pagamentos'}</h1>
              <p className="text-[10px] text-muted-foreground">
                {diarista?.name || 'Todos os registros'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4 pb-safe">
        {/* Totais */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="border-green-500/30 bg-green-500/5">
            <CardContent className="p-4 text-center">
              <CheckCircle className="h-5 w-5 text-green-600 mx-auto mb-1" />
              <p className="text-[11px] text-muted-foreground">Total Pago</p>
              <p className="text-lg font-bold text-green-600">R$ {totalPaid.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardContent className="p-4 text-center">
              <Clock className="h-5 w-5 text-amber-600 mx-auto mb-1" />
              <p className="text-[11px] text-muted-foreground">Pendente</p>
              <p className="text-lg font-bold text-amber-600">R$ {totalPending.toFixed(2)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <div className="flex gap-2">
          <Select value={filterYear.toString()} onValueChange={v => setFilterYear(parseInt(v))}>
            <SelectTrigger className="flex-1 h-10 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map(y => (
                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={(v: 'all' | 'paid' | 'pending') => setFilterStatus(v)}>
            <SelectTrigger className="w-32 h-10 text-sm">
              <Filter className="h-3.5 w-3.5 mr-1.5" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="paid">Pagos</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Lista */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Nenhum registro encontrado</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredRecords.map((record) => (
              <Card key={record.id} className={cn(
                'transition-all',
                record.status === 'paid' ? 'border-green-500/20' : 'border-amber-500/20'
              )}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center',
                        record.type === 'salary' ? 'bg-primary/10' : 'bg-accent/10'
                      )}>
                        <DollarSign className={cn(
                          'h-5 w-5',
                          record.type === 'salary' ? 'text-primary' : 'text-accent'
                        )} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{record.description}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {MONTHS[record.month]} {record.year}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-bold text-foreground">R$ {record.amount.toFixed(2)}</p>
                      <Badge
                        variant={record.status === 'paid' ? 'default' : 'secondary'}
                        className={cn(
                          'text-[10px]',
                          record.status === 'paid' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-amber-100 text-amber-800'
                        )}
                      >
                        {record.status === 'paid' ? 'Pago' : 'Pendente'}
                      </Badge>
                    </div>
                  </div>
                  {record.paid_at && (
                    <p className="text-[10px] text-muted-foreground mt-2">
                      Pago em {new Date(record.paid_at).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
