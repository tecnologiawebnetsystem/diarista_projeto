'use client'

import { useState, useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { ScrollText, X, Shield, Clock, DollarSign, AlertTriangle, Smartphone, Shirt, ChevronRight, Users, CheckCircle2, Lock } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'

const clauses: { icon: React.ElementType; title: string; items: ReactNode[] }[] = [
  {
    icon: Shield,
    title: 'Cláusula 1 - Fundamentação e Quitação',
    items: [
      'Regido pelo Art. 442-B da CLT e Art. 1 da LC 150/2015, ratificando a natureza autônoma da relação.',
      'Quitação Retroativa: todos os valores e débitos referentes a períodos anteriores foram integralmente liquidados.',
      'O contrato formaliza a continuidade da prestação de serviços autônomos, sem qualquer vínculo empregatício.',
    ],
  },
  {
    icon: DollarSign,
    title: 'Cláusula 2 - Cronograma, Valores e Agenda',
    items: [
      'DIÁRIAS: Segunda-feira R$ 250,00 (Limpeza Pesada) e Quinta-feira R$ 150,00 (Manutenção).',
      <>{'FERIADOS: Caso a segunda-feira seja feriado, o valor de R$ 250,00 '}<span className="text-green-500 font-semibold">{'será pago integralmente'}</span>{'.'}</>,
      <>{'FERIADOS: Caso a quinta-feira seja feriado, o valor de R$ 150,00 '}<span className="text-destructive font-semibold">{'NÃO será pago integralmente'}</span>{'.'}</>,
      <>{'Alteração pela CONTRATADA: aviso mínimo de 02 dias de antecedência. Na Segunda: se sem disponibilidade da CONTRATADA, '}<span className="text-green-500 font-semibold">{'R$ 250,00 é devido integralmente'}</span>{'. Na Quinta: sem disponibilidade da CONTRATADA, '}<span className="text-destructive font-semibold">{'valor não é devido'}</span>{'.'}</>,
      <>{'Alteração pelo CONTRATANTE: aviso mínimo de 02 dias de antecedência. Na Segunda: se sem disponibilidade da CONTRATADA, '}<span className="text-green-500 font-semibold">{'R$ 250,00 é devido integralmente'}</span>{'. Na Quinta: sem disponibilidade da CONTRATADA, '}<span className="text-destructive font-semibold">{'valor não é devido'}</span>{'.'}</>,
    ],
  },
  {
    icon: Shield,
    title: 'Cláusula 3 - Escopo Técnico',
    items: [
      'PESADA (SEGUNDA): Banheiros, cozinha (desengorduramento), vidros, esquadrias, trilhos, garagem, quintal e churrasqueira. Inclui movimentação de móveis.',
      'MANUTENÇÃO (QUINTA): Organização estética, retirada de pó, aspiração e higiene superficial.',
      'ANIMAIS DOMÉSTICOS: Lavagem dos pisos inclusa. Excluídos: alimentação, troca de água, caixas de areia e tapetes higiênicos.',
    ],
  },
  {
    icon: Clock,
    title: 'Cláusula 4 - Autonomia, Horários e Eficiência',
    items: [
      'Inexiste carga horária fixa. A CONTRATADA detém autonomia sobre início e término, sem descontos por atrasos.',
      'Obrigação de comunicar ao CONTRATANTE a hora prevista de chegada com antecedência.',
      'Início efetivo das atividades em tempo razoável após a chegada, evitando conversas prolongadas.',
    ],
  },
  {
    icon: Shirt,
    title: 'Cláusula 5 - Lavanderia e Transporte',
    items: [
      'Lavagem: R$ 75,00 por semana executada.',
      'Bônus de Passadoria: entrega na mesma semana (até sexta-feira 18h00) gera prêmio de R$ 50,00.',
      'Transporte de vestuário: R$ 30,00 semanais (toda sexta até 20h00) para deslocamento de lavanderia.',
      'Caso não realize o translado, os R$ 30,00 são devolvidos ao CONTRATANTE.',
    ],
  },
  {
    icon: Smartphone,
    title: 'Cláusula 6 - Pagamento Mensal (APP LIMPP DAY)',
    items: [
      'Pagamento das diárias e bônus realizado mensalmente até o 5º dia útil do mês subsequente.',
      'Cálculo baseado estritamente nas diárias efetivamente realizadas e registradas no App.',
      'Obrigatório: anexar no App a foto do RECIBO preenchido e assinado a cada fechamento mensal.',
      'Não validação dos recibos no App em até 01 semana após o pagamento gera advertência verbal registrada.',
      'Vedados adiantamentos ou vales sob qualquer pretexto.',
    ],
  },
  {
    icon: Shield,
    title: 'Cláusula 7 - Segurança e EPIs',
    items: [
      'O CONTRATANTE fornece: luvas de cano longo, calçado antiderrapante, avental de PVC e máscaras.',
      'Uso obrigatório. Recusa injustificada pode ensejar rescisão imediata.',
    ],
  },
  {
    icon: Shield,
    title: 'Cláusula 8 - Acesso e Privacidade',
    items: [
      'Responsabilidade civil da CONTRATADA por extravios ou danos de chaves (Art. 186 CC).',
      'Vedada captação de imagens (fotos/vídeos) da residência ou moradores para redes sociais.',
      'Wi-Fi liberado para uso moderado, sem comprometer o trabalho.',
    ],
  },
  {
    icon: Users,
    title: 'Cláusula 9 - Conduta Profissional',
    items: [
      'Relação pautada na dinâmica Contratante-Prestador. Assuntos familiares e pessoais devem ser evitados no expediente.',
      'Diálogos sociais devem ser breves. Assuntos longos fora dos horários de serviço.',
    ],
  },
  {
    icon: Shield,
    title: 'Cláusula 10 - Dignidade e Igualdade',
    items: [
      'Ambiente livre de racismo ou preconceito.',
      'A CONTRATADA utilizará os mesmos utensílios, banheiros e realizará refeições na mesma mesa que o CONTRATANTE.',
    ],
  },
  {
    icon: Clock,
    title: 'Cláusula 11 - Repouso e Alimentação',
    items: [
      'Intervalo de 01 (uma) hora garantido, com total liberdade de locomoção.',
      'O CONTRATANTE não solicitará atividades durante o intervalo.',
    ],
  },
  {
    icon: Clock,
    title: 'Cláusula 12 - Vigência e Reajuste',
    items: [
      'Início em 09/03/2026, prazo indeterminado.',
      'Reajuste anual pelo IPCA (IBGE) para manutenção do equilíbrio econômico.',
      'Rescisão: 30 dias de aviso por cortesia ou imediata por descumprimento de cláusulas.',
    ],
  },
]

interface ContractViewerProps {
  isAdmin?: boolean
}

export function ContractViewer({ isAdmin = false }: ContractViewerProps) {
  const [open, setOpen] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [agreedAt, setAgreedAt] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(true)
  const [scrolledToEnd, setScrolledToEnd] = useState(false)

  useEffect(() => {
    checkAgreement()
  }, [])

  async function checkAgreement() {
    try {
      // Cast para evitar erro de tipo 'never' quando a tabela nao esta nos tipos gerados
      const result = await supabase
        .from('contract_agreements')
        .select('agreed_at')
        .order('agreed_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      const row = (result as unknown as { data: { agreed_at: string } | null }).data
      if (row) {
        setAgreed(true)
        setAgreedAt(row.agreed_at)
      }
    } catch (e) {
      console.error('Erro ao verificar concordância:', e)
    } finally {
      setLoading(false)
    }
  }

  async function handleAgree() {
    try {
      setConfirming(true)
      const client = supabase as unknown as { from: (t: string) => { insert: (d: Record<string, unknown>[]) => Promise<{ error: unknown | null }> } }
      const insertResult = await client
        .from('contract_agreements')
        .insert([{ agreed_at: new Date().toISOString() }])

      if (insertResult.error) throw insertResult.error

      setAgreed(true)
      setAgreedAt(new Date().toISOString())
      setOpen(false)
    } catch (e) {
      console.error('Erro ao registrar concordância:', e)
    } finally {
      setConfirming(false)
    }
  }

  function handleScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80
    if (atBottom) setScrolledToEnd(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (isAdmin) {
    return (
      <div className={`flex items-center gap-3 p-4 rounded-xl border-2 ${agreed ? 'border-green-500/40 bg-green-500/10' : 'border-destructive/40 bg-destructive/10'}`}>
        {agreed ? (
          <CheckCircle2 className="h-6 w-6 text-green-500 shrink-0" />
        ) : (
          <AlertTriangle className="h-6 w-6 text-destructive shrink-0" />
        )}
        <div className="flex-1">
          <p className="text-sm font-bold">
            {agreed ? 'Contrato Aceito' : 'Contrato Pendente'}
          </p>
          <p className="text-xs text-muted-foreground">
            {agreed && agreedAt
              ? `Concordou em ${new Date(agreedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`
              :       'A diarista ainda não concordou com o contrato'}
          </p>
        </div>
        {agreed && <Lock className="h-4 w-4 text-green-500 shrink-0" />}
      </div>
    )
  }

  return (
    <>
      {agreed ? (
        <div className="flex items-center gap-3 p-4 rounded-xl border-2 border-green-500/40 bg-green-500/10">
          <CheckCircle2 className="h-6 w-6 text-green-500 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold text-green-500">Contrato Aceito</p>
            <p className="text-xs text-muted-foreground">
              {agreedAt
                ? `Você concordou em ${new Date(agreedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`
                : 'Concordância registrada'}
            </p>
          </div>
          <Lock className="h-4 w-4 text-green-500 shrink-0" />
        </div>
      ) : (
        <div className="flex items-center gap-3 p-4 rounded-xl border-2 border-destructive/40 bg-destructive/10">
          <AlertTriangle className="h-6 w-6 text-destructive shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold text-destructive">Contrato Pendente</p>
            <p className="text-xs text-muted-foreground">Você ainda não concordou com o contrato</p>
          </div>
        </div>
      )}

      <button
        onClick={() => { setOpen(true); setScrolledToEnd(false) }}
        className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-primary/40 bg-primary/5 active:scale-95 transition-all mt-3"
      >
        <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
          <ScrollText className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1 text-left">
          <p className="font-semibold text-sm text-foreground">Ler Contrato Completo</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {agreed ? 'Toque para reler o contrato' : 'Leia ate o final para poder concordar'}
          </p>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
      </button>

      {open && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] bg-background flex flex-col">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card sticky top-0 shrink-0">
            <button
              onClick={() => setOpen(false)}
              className="w-9 h-9 rounded-full bg-muted flex items-center justify-center active:scale-90 transition-all shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm truncate">Contrato de Trabalho</p>
              <p className="text-[10px] text-muted-foreground">Prestação Autônoma - Diarista</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <ScrollText className="h-4 w-4 text-primary" />
            </div>
          </div>

          {!agreed && !scrolledToEnd && (
            <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 shrink-0">
              <p className="text-[11px] text-amber-500 text-center">Role até o final para habilitar a concordância</p>
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" onScroll={handleScroll}>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Partes Contratantes</p>
              <div className="space-y-2">
                <div className="bg-muted/40 rounded-lg px-3 py-2.5">
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase mb-0.5">Contratante</p>
                  <p className="text-sm font-bold">KLEBER DE OLIVEIRA GONCALVES</p>
                  <p className="text-[11px] text-muted-foreground">CPF: 277.679.728-10 - RG: 33.402.066-9</p>
                  <p className="text-[11px] text-muted-foreground">Rua Expedicionario Teodoro Francisco Ribeiro, 81</p>
                  <p className="text-[11px] text-muted-foreground">Vila Isabel, CEP: 12.050-540 - Taubate/SP</p>
                </div>
              </div>
            </div>

            {clauses.map((clause, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <clause.icon className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-xs font-bold text-foreground leading-tight">{clause.title}</p>
                </div>
                <ul className="space-y-2">
                  {clause.items.map((item, j) => (
                    <li key={j} className="flex items-start gap-2">
                      <span className="text-primary text-sm leading-none mt-0.5 shrink-0">{'•'}</span>
                      <p className="text-xs text-muted-foreground leading-relaxed">{item}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <div className="rounded-xl border-2 border-destructive/50 bg-destructive/10 p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                <p className="text-xs font-bold text-destructive uppercase tracking-wide">{'Nota Essencial'}</p>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {'É dever da CONTRATADA a visualização constante das notificações no '}
                <span className="text-foreground font-bold">APP LIMPP DAY</span>
                {', canal oficial para registros e segurança jurídica de ambos.'}
              </p>
            </div>

            <div className="h-4" />
          </div>

          <div className="px-4 py-4 border-t border-border bg-card shrink-0 pb-safe">
            {agreed ? (
              <div className="flex items-center justify-center gap-2 py-3">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <p className="text-sm font-semibold text-green-500">Contrato aceito e registrado</p>
                <Lock className="h-4 w-4 text-green-500" />
              </div>
            ) : (
              <Button
                onClick={handleAgree}
                disabled={!scrolledToEnd || confirming}
                className="w-full h-13 text-sm font-bold"
                style={{ minHeight: 52 }}
              >
                {confirming ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {'Registrando...'}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    {scrolledToEnd ? 'Li e Concordo com o Contrato' : 'Role ate o final para concordar'}
                  </div>
                )}
              </Button>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
