'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ScrollText, X, Shield, Clock, DollarSign, AlertTriangle, Star, Smartphone, Shirt, ChevronRight, Users, CheckCircle2, Lock } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'

const clauses = [
  {
    icon: Shield,
    title: 'Clausula 1 - Fundamentacao e Quitacao',
    items: [
      'Regido pelo Art. 442-B da CLT e Art. 1 da LC 150/2015, ratificando a natureza autonoma da relacao.',
      'Quitacao Retroativa: todos os valores e debitos referentes a periodos anteriores foram integralmente liquidados.',
      'O contrato formaliza a continuidade da prestacao de servicos autonomos, sem qualquer vinculo empregaticio.',
    ],
  },
  {
    icon: DollarSign,
    title: 'Clausula 2 - Cronograma, Valores e Agenda',
    items: [
      'DIARIAS: Segunda-feira R$ 250,00 (Limpeza Pesada) e Quinta-feira R$ 150,00 (Manutencao).',
      'Alteracao pela CONTRATADA: aviso minimo de 07 dias. Sem disponibilidade do CONTRATANTE, diaria e cancelada e valor indevido.',
      'Alteracao pelo CONTRATANTE na Segunda: se sem disponibilidade da CONTRATADA, R$ 250,00 e devido integralmente.',
      'Alteracao pelo CONTRATANTE na Quinta: sem disponibilidade da CONTRATADA, valor nao e devido.',
      'Cancelamento definitivo na Segunda: pago integralmente. Na Quinta: valor indevido.',
    ],
  },
  {
    icon: Shield,
    title: 'Clausula 3 - Escopo Tecnico',
    items: [
      'PESADA (SEGUNDA): Banheiros, cozinha (desengorduramento), vidros, esquadrias, trilhos, garagem, quintal e churrasqueira. Inclui movimentacao de moveis.',
      'MANUTENCAO (QUINTA): Organizacao estetica, retirada de po, aspiracao e higiene superficial.',
      'ANIMAIS DOMESTICOS: Lavagem dos pisos inclusa. Excluidos: alimentacao, troca de agua, caixas de areia e tapetes higienicos.',
    ],
  },
  {
    icon: Clock,
    title: 'Clausula 4 - Autonomia, Horarios e Eficiencia',
    items: [
      'Inexiste carga horaria fixa. A CONTRATADA detem autonomia sobre inicio e termino, sem descontos por atrasos.',
      'Obrigacao de comunicar ao CONTRATANTE a hora prevista de chegada com antecedencia.',
      'Inicio efetivo das atividades em tempo razoavel apos a chegada, evitando conversas prolongadas.',
    ],
  },
  {
    icon: Shirt,
    title: 'Clausula 5 - Lavanderia e Transporte',
    items: [
      'Lavagem: R$ 75,00 por semana executada.',
      'Bonus de Passadoria: entrega na mesma semana (ate sexta-feira 18h00) gera premio de R$ 50,00.',
      'Transporte de vestuario: R$ 30,00 semanais (toda sexta ate 20h00) para deslocamento de lavanderia.',
      'Caso nao realize o translado, os R$ 30,00 sao devolvidos ao CONTRATANTE.',
    ],
  },
  {
    icon: Smartphone,
    title: 'Clausula 6 - Pagamento Mensal (APP LIMPP DAY)',
    items: [
      'Pagamento das diarias e bonus realizado mensalmente ate o 5 dia util do mes subsequente.',
      'Calculo baseado estritamente nas diarias efetivamente realizadas e registradas no App.',
      'Obrigatorio: anexar no App a foto do RECIBO preenchido e assinado a cada fechamento mensal.',
      'Nao validacao dos recibos no App em ate 01 semana apos o pagamento gera advertencia verbal registrada.',
      'Vedados adiantamentos ou vales sob qualquer pretexto.',
    ],
  },
  {
    icon: Shield,
    title: 'Clausula 7 - Seguranca e EPIs',
    items: [
      'O CONTRATANTE fornece: luvas de cano longo, calcado antiderrapante, avental de PVC e mascaras.',
      'Uso obrigatorio. Recusa injustificada pode ensejar rescisao imediata.',
    ],
  },
  {
    icon: Shield,
    title: 'Clausula 8 - Acesso e Privacidade',
    items: [
      'Responsabilidade civil da CONTRATADA por extravios ou danos de chaves (Art. 186 CC).',
      'Vedada captacao de imagens (fotos/videos) da residencia ou moradores para redes sociais.',
      'Wi-Fi liberado para uso moderado, sem comprometer o trabalho.',
    ],
  },
  {
    icon: Users,
    title: 'Clausula 9 - Conduta Profissional',
    items: [
      'Relacao pautada na dinamica Contratante-Prestador. Assuntos familiares e pessoais devem ser evitados no expediente.',
      'Dialogos sociais devem ser breves. Assuntos longos fora dos horarios de servico.',
    ],
  },
  {
    icon: Shield,
    title: 'Clausula 10 - Dignidade e Igualdade',
    items: [
      'Ambiente livre de racismo ou preconceito.',
      'A CONTRATADA utilizara os mesmos utensilios, banheiros e realizara refeicoes na mesma mesa que o CONTRATANTE.',
    ],
  },
  {
    icon: Clock,
    title: 'Clausula 11 - Repouso e Alimentacao',
    items: [
      'Intervalo de 01 (uma) hora garantido, com total liberdade de locomocao.',
      'O CONTRATANTE nao solicitara atividades durante o intervalo.',
    ],
  },
  {
    icon: Clock,
    title: 'Clausula 13 - Vigencia e Reajuste',
    items: [
      'Inicio em 09/03/2026, prazo indeterminado.',
      'Reajuste anual pelo IPCA (IBGE) para manutencao do equilibrio economico.',
      'Rescisao: 30 dias de aviso por cortesia ou imediata por descumprimento de clausulas.',
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
      console.error('Erro ao verificar concordancia:', e)
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
      console.error('Erro ao registrar concordancia:', e)
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
              : 'A diarista ainda nao concordou com o contrato'}
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
                ? `Voce concordou em ${new Date(agreedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`
                : 'Concordancia registrada'}
            </p>
          </div>
          <Lock className="h-4 w-4 text-green-500 shrink-0" />
        </div>
      ) : (
        <div className="flex items-center gap-3 p-4 rounded-xl border-2 border-destructive/40 bg-destructive/10">
          <AlertTriangle className="h-6 w-6 text-destructive shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold text-destructive">Contrato Pendente</p>
            <p className="text-xs text-muted-foreground">Voce ainda nao concordou com o contrato</p>
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
              <p className="text-[10px] text-muted-foreground">Prestacao Autonoma - Diarista</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <ScrollText className="h-4 w-4 text-primary" />
            </div>
          </div>

          {!agreed && !scrolledToEnd && (
            <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 shrink-0">
              <p className="text-[11px] text-amber-500 text-center">Role ate o final para habilitar a concordancia</p>
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

            <div className="rounded-xl border-2 border-amber-500/50 bg-amber-500/10 p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
                  <Star className="h-4 w-4 text-amber-500" />
                </div>
                <p className="text-xs font-bold text-amber-500">Clausula 12 - Premio Quadrimestral</p>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {'Concessao eventual de '}
                <span className="text-amber-500 font-bold">R$ 300,00 a cada 4 meses</span>
                {', condicionada a excelencia tecnica, assiduidade e ausencia de mais de 02 advertencias no periodo. Natureza meramente indenizatoria (Art. 457, par. 2 CLT).'}
              </p>
            </div>

            <div className="rounded-xl border-2 border-destructive/50 bg-destructive/10 p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                <p className="text-xs font-bold text-destructive uppercase tracking-wide">Nota Essencial</p>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {'E dever da CONTRATADA a visualizacao constante das notificacoes no '}
                <span className="text-foreground font-bold">APP LIMPP DAY</span>
                {', canal oficial para registros e seguranca juridica de ambos.'}
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
