'use client'

import { useState, useEffect } from 'react'
import { Trophy, AlertTriangle, CheckCircle, XCircle, Calendar, ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAwards } from '@/hooks/use-awards'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'

export default function AwardsPage() {
  const { awards, currentPeriod, loading } = useAwards()
  const [warningsInPeriod, setWarningsInPeriod] = useState(0)

  // Buscar warnings diretamente pelo periodo do award (sem depender de month/year)
  useEffect(() => {
    async function fetchWarnings() {
      if (!currentPeriod) {
        setWarningsInPeriod(0)
        return
      }
      try {
        const { count, error } = await supabase
          .from('notes')
          .select('*', { count: 'exact', head: true })
          .eq('is_warning', true)
          .gte('date', currentPeriod.period_start)
          .lte('date', currentPeriod.period_end)

        if (error) throw error
        setWarningsInPeriod(count || 0)
      } catch (error) {
        console.error('Error fetching warnings:', error)
        setWarningsInPeriod(0)
      }
    }
    fetchWarnings()
  }, [currentPeriod])

  const isDisqualified = warningsInPeriod >= 3

  if (loading) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <Trophy className="h-10 w-10 text-primary mx-auto animate-pulse" />
          <p className="text-sm text-muted-foreground">Carregando prêmios...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-background flex flex-col safe-area-inset-top">
      {/* Header */}
      <div className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="px-4 py-3 flex items-center gap-3">
          <Link href="/diarista">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-accent" />
            <div>
              <h1 className="text-base font-bold leading-none">Prêmio de Excelência</h1>
              <p className="text-[10px] text-muted-foreground">Quadrimestral — R$ 300,00</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 pb-safe space-y-4">

        {/* Período atual */}
        {currentPeriod && (
          <>
            {/* Valor destaque */}
            <Card className="gradient-accent text-white overflow-hidden">
              <CardContent className="pt-5 pb-5 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Trophy className="h-4 w-4 opacity-80" />
                  <p className="text-xs opacity-80">Período Atual</p>
                </div>
                <p className="text-4xl font-bold mb-2">R$ {currentPeriod.value.toFixed(2)}</p>
                <Badge
                  variant={currentPeriod.status === 'awarded' ? 'default' :
                           currentPeriod.status === 'disqualified' ? 'destructive' : 'outline'}
                  className="text-xs"
                >
                  {currentPeriod.status === 'awarded' ? 'Concedido' :
                   currentPeriod.status === 'disqualified' ? 'Desqualificado' : 'Em Andamento'}
                </Badge>
                <p className="text-[11px] opacity-60 mt-2">
                  {format(new Date(currentPeriod.period_start), "dd/MM/yyyy")} até{' '}
                  {format(new Date(currentPeriod.period_end), "dd/MM/yyyy")}
                </p>
              </CardContent>
            </Card>

            {/* Advertências */}
            <Card className={cn('border', isDisqualified ? 'border-destructive bg-destructive/10' : 'border-warning/50 bg-warning/5')}>
              <CardContent className="p-4 flex items-center gap-3">
                <AlertTriangle className={cn('h-8 w-8 flex-shrink-0', isDisqualified ? 'text-destructive' : 'text-warning')} />
                <div className="flex-1">
                  <p className="text-sm font-semibold">Advertências no período</p>
                  <p className="text-[11px] text-muted-foreground">3 ou mais desqualificam o prêmio</p>
                  {isDisqualified && (
                    <div className="flex items-center gap-1 mt-1">
                      <XCircle className="h-3.5 w-3.5 text-destructive" />
                      <p className="text-[11px] text-destructive font-medium">Desqualificado</p>
                    </div>
                  )}
                </div>
                <p className={cn('text-3xl font-bold flex-shrink-0', isDisqualified ? 'text-destructive' : 'text-warning')}>
                  {warningsInPeriod}/3
                </p>
              </CardContent>
            </Card>

            {/* Scores */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Assiduidade', value: currentPeriod.attendance_score },
                { label: 'Performance', value: currentPeriod.performance_score },
                { label: 'Conduta', value: currentPeriod.conduct_score },
              ].map(item => (
                <Card key={item.label}>
                  <CardContent className="p-3 text-center">
                    <p className="text-xl font-bold text-primary">{item.value}%</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{item.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Critérios */}
            <Card>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm">Critérios de Elegibilidade</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-3">
                {[
                  { ok: true, title: 'Assiduidade e Pontualidade', desc: 'Cumprir dias acordados (Seg e Qui)' },
                  { ok: true, title: 'Performance Técnica', desc: 'Execução completa do escopo' },
                  { ok: true, title: 'Conduta Ética', desc: 'Discrição e foco profissional' },
                  { ok: false, title: 'Limite de Advertências', desc: 'Máximo de 2 advertências no período', warning: true },
                ].map((c, i) => (
                  <div key={i} className="flex items-start gap-3">
                    {c.warning
                      ? <AlertTriangle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
                      : <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                    }
                    <div>
                      <p className="text-sm font-medium">{c.title}</p>
                      <p className="text-[11px] text-muted-foreground">{c.desc}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </>
        )}

        {/* Histórico */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Histórico
            </CardTitle>
            <CardDescription className="text-xs">Períodos anteriores</CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {awards.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Trophy className="h-10 w-10 mx-auto mb-2 opacity-20" />
                <p className="text-sm">Nenhum período registrado ainda</p>
              </div>
            ) : (
              <div className="space-y-2">
                {awards.map((award) => (
                  <div key={award.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="text-sm font-medium">
                        {format(new Date(award.period_start), "dd/MM/yy")} – {format(new Date(award.period_end), "dd/MM/yy")}
                      </p>
                      <p className="text-[11px] text-muted-foreground">{award.warnings_count} advertência(s)</p>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-bold">R$ {award.value.toFixed(2)}</p>
                      <Badge
                        variant={award.status === 'awarded' ? 'default' :
                                 award.status === 'disqualified' ? 'destructive' : 'secondary'}
                        className="text-[10px]"
                      >
                        {award.status === 'awarded' ? 'Concedido' :
                         award.status === 'disqualified' ? 'Desqualificado' : 'Pendente'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
