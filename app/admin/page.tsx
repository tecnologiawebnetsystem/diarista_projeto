'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  Settings, LogOut, TrendingUp, FileText,
  ScrollText, Save, Check, DollarSign,
  LayoutDashboard, CalendarCheck, WashingMachine,
  ShieldCheck, FileDown
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/contexts/auth-context'
import { useMonthlyPayments } from '@/hooks/use-monthly-payments'
import { useAttendance } from '@/hooks/use-attendance'
import { useLaundryWeeks } from '@/hooks/use-laundry-weeks'
import { useConfig } from '@/hooks/use-config'
import { useNotes } from '@/hooks/use-notes'
import { useAwards } from '@/hooks/use-awards'
import { useDiaristas } from '@/hooks/use-diaristas'
import { MonthlyPaymentSection } from '@/components/monthly-payment-section'
import { AttendanceSection } from '@/components/attendance-section'
import { LaundrySection } from '@/components/laundry-section'
import { ContractViewer } from '@/components/contract-viewer'
import Link from 'next/link'

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

const CONFIG_ITEMS = [
  { key: 'monthly_salary', label: 'Salário Mensal', desc: 'Valor fixo mensal' },
  { key: 'heavy_cleaning', label: 'Limpeza Pesada', desc: 'Segunda-feira' },
  { key: 'light_cleaning', label: 'Limpeza Leve', desc: 'Quinta-feira' },
  { key: 'washing', label: 'Lavagem de Roupa', desc: 'Por semana' },
  { key: 'ironing', label: 'Passar Roupa', desc: 'Por semana' },
  { key: 'transport', label: 'Transporte', desc: 'Por visita de lavanderia' },
]

type Tab = 'resumo' | 'presenca' | 'lavanderia' | 'notas' | 'contrato' | 'config'

const NAV_ITEMS: { key: Tab; label: string; Icon: React.ElementType }[] = [
  { key: 'resumo',     label: 'Resumo',    Icon: LayoutDashboard },
  { key: 'presenca',   label: 'Presença',  Icon: CalendarCheck },
  { key: 'lavanderia', label: 'Lavanderia',Icon: WashingMachine },
  { key: 'notas',      label: 'Notas',     Icon: FileText },
  { key: 'contrato',   label: 'Contrato',  Icon: ScrollText },
  { key: 'config',     label: 'Config',    Icon: Settings },
]

export default function AdminPage() {
  const router = useRouter()
  const { role, isLoading, logout, selectedDiaristaId, setSelectedDiaristaId } = useAuth()
  const { activeDiaristas, loading: loadingDiaristas } = useDiaristas()
  const currentDate = new Date()
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear())
  const [activeTab, setActiveTab] = useState<Tab>('resumo')

  // Selecionar primeira diarista automaticamente
  useEffect(() => {
    if (!selectedDiaristaId && activeDiaristas.length > 0) {
      setSelectedDiaristaId(activeDiaristas[0].id)
    }
  }, [activeDiaristas, selectedDiaristaId, setSelectedDiaristaId])

  const { config, loading: configLoading, updateConfig } = useConfig()
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)
  const [values, setValues] = useState<Record<string, string>>({})

  const { payment } = useMonthlyPayments(selectedMonth, selectedYear, selectedDiaristaId)
  const { attendance } = useAttendance(selectedMonth, selectedYear, selectedDiaristaId)
  const { laundryWeeks } = useLaundryWeeks(selectedMonth, selectedYear, selectedDiaristaId)
  const { notes } = useNotes(selectedMonth, selectedYear, selectedDiaristaId)
  const { getConfigValue } = useConfig()

  const ironingValue = getConfigValue('ironing') || 50
  const washingValue = getConfigValue('washing') || 75

  useEffect(() => {
    if (isLoading) return
    if (role !== 'admin') router.replace('/login')
  }, [role, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const hasActivity = attendance.length > 0 || laundryWeeks.some(w => w.ironed || w.washed)
  const monthlySalary = payment?.paid_at ? (payment?.monthly_value || 0) : 0
  const laundryTotal = laundryWeeks.reduce((sum, week) => {
    const services = (week.ironed ? ironingValue : 0) + (week.washed ? washingValue : 0)
    const transport = (week.ironed || week.washed) ? week.transport_fee : 0
    return sum + services + transport
  }, 0)
  const grandTotal = monthlySalary + laundryTotal
  const warnings = notes.filter(n => n.is_warning)
  const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - 2 + i)

  const getValue = (key: string) => {
    if (values[key] !== undefined) return values[key]
    const v = config.find(c => c.key === key)?.value ?? 0
    return Number(v).toFixed(2)
  }

  const handleSave = async (key: string) => {
    try {
      setSaving(key)
      const raw = values[key]
      const value = raw !== undefined ? parseFloat(raw) : (config.find(c => c.key === key)?.value ?? 0)
      await updateConfig(key, value)
      setSaved(key)
      setTimeout(() => setSaved(null), 2000)
    } catch (error) {
      console.error('Error saving config:', error)
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="min-h-dvh bg-background flex flex-col">

      {/* Header */}
      <div className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/logo.jpg" alt="LIMPP DAY" width={36} height={36} priority className="rounded-lg" />
            <div>
              <h1 className="text-base font-bold text-primary leading-none">LIMPP DAY</h1>
              <p className="text-[10px] text-muted-foreground">Painel Admin</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => { logout(); router.push('/login') }} className="h-9 w-9 p-0">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Period Selector */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex gap-2">
          <Select value={selectedMonth.toString()} onValueChange={v => setSelectedMonth(parseInt(v))}>
            <SelectTrigger className="flex-1 h-10 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((m, i) => (
                <SelectItem key={i} value={(i + 1).toString()}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedYear.toString()} onValueChange={v => setSelectedYear(parseInt(v))}>
            <SelectTrigger className="w-24 h-10 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map(y => (
                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Diarista Selector */}
      {activeDiaristas.length > 1 && (
        <div className="px-4 pb-3">
          <Select
            value={selectedDiaristaId || ''}
            onValueChange={v => setSelectedDiaristaId(v)}
          >
            <SelectTrigger className="h-10 text-sm">
              <SelectValue placeholder="Selecionar diarista" />
            </SelectTrigger>
            <SelectContent>
              {activeDiaristas.map(d => (
                <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Total Card */}
      <div className="px-4 pb-3">
        <Card className="gradient-primary text-white shadow-lg">
          <CardContent className="pt-4 pb-4 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="h-3.5 w-3.5 opacity-80" />
              <p className="text-xs opacity-80">Total do Mês</p>
            </div>
            <p className="text-4xl font-bold mb-2">R$ {grandTotal.toFixed(2)}</p>
            {hasActivity ? (
              <div className="flex justify-center gap-5 text-xs">
                <div>
                  <p className="opacity-70 mb-0.5">Salário {payment?.paid_at ? 'Pago' : 'Pendente'}</p>
                  <p className="text-sm font-semibold">R$ {(payment?.monthly_value || 0).toFixed(2)}</p>
                </div>
                <div className="w-px bg-white/20" />
                <div>
                  <p className="opacity-70 mb-0.5">Lavanderia</p>
                  <p className="text-sm font-semibold">R$ {laundryTotal.toFixed(2)}</p>
                </div>
              </div>
            ) : (
              <p className="text-xs opacity-60">Nenhuma atividade registrada neste mês</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tab Content */}
      <div className="px-4 pb-28 flex-1 space-y-3">

        {/* RESUMO */}
        {activeTab === 'resumo' && (
          <>
            <Button
              variant="outline"
              className="w-full h-11"
              onClick={() => {
                const url = `/api/report?month=${selectedMonth}&year=${selectedYear}${selectedDiaristaId ? `&diarista_id=${selectedDiaristaId}` : ''}`
                window.open(url, '_blank')
              }}
            >
              <FileDown className="h-4 w-4 mr-2" />
              Gerar Relatorio Mensal
            </Button>
            <MonthlyPaymentSection month={selectedMonth} year={selectedYear} isAdmin={true} hasActivity={hasActivity} diaristaId={selectedDiaristaId} />
            <AttendanceSection month={selectedMonth} year={selectedYear} diaristaId={selectedDiaristaId} />
            <LaundrySection month={selectedMonth} year={selectedYear} diaristaId={selectedDiaristaId} />
          </>
        )}

        {/* PRESENÇA */}
        {activeTab === 'presenca' && (
          <AttendanceSection month={selectedMonth} year={selectedYear} diaristaId={selectedDiaristaId} />
        )}

        {/* LAVANDERIA */}
        {activeTab === 'lavanderia' && (
          <LaundrySection month={selectedMonth} year={selectedYear} diaristaId={selectedDiaristaId} />
        )}

        {/* NOTAS */}
        {activeTab === 'notas' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">Anotações</p>
              {warnings.length > 0 && (
                <span className="text-xs font-medium text-destructive">{warnings.length} advertência(s)</span>
              )}
            </div>
            <Link href="/notes">
              <Button className="w-full h-12" variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Abrir Anotações Completas
              </Button>
            </Link>
          </div>
        )}

        {/* CONTRATO */}
        {activeTab === 'contrato' && (
          <div className="space-y-3">
            <Card className="border-primary/30">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Status da Concordância
                </CardTitle>
                <CardDescription className="text-xs">
                  Situação da diarista com os termos do contrato
                </CardDescription>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <ContractViewer isAdmin={true} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <ScrollText className="h-4 w-4 text-primary" />
                  Visualizar Contrato
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <ContractViewer isAdmin={false} />
              </CardContent>
            </Card>
          </div>
        )}

        {/* CONFIG */}
        {activeTab === 'config' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold">Valores dos Serviços</p>
            </div>
            {CONFIG_ITEMS.map((item) => {
              const isSaving = saving === item.key
              const isSaved = saved === item.key
              return (
                <Card key={item.key}>
                  <CardContent className="p-4">
                    <div className="mb-3">
                      <p className="font-semibold text-sm">{item.label}</p>
                      <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                    </div>
                    <div className="flex gap-2 items-center">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">R$</span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          inputMode="decimal"
                          value={getValue(item.key)}
                          onChange={(e) => setValues(prev => ({ ...prev, [item.key]: e.target.value }))}
                          className="pl-10 h-11 text-base font-semibold"
                        />
                      </div>
                      <Button
                        onClick={() => handleSave(item.key)}
                        disabled={isSaving}
                        size="sm"
                        className={`h-11 px-4 min-w-[80px] transition-all ${isSaved ? 'bg-green-600' : ''}`}
                      >
                        {isSaved ? <Check className="h-4 w-4" /> :
                         isSaving ? <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> :
                         <><Save className="h-4 w-4 mr-1" />Salvar</>}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

      </div>

      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-card border-t border-border" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex items-stretch h-16">
          {NAV_ITEMS.map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 relative transition-colors ${
                activeTab === key ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <Icon className="h-5 w-5" strokeWidth={activeTab === key ? 2.5 : 1.5} />
              <span className="text-[9px] font-medium leading-none">{label}</span>
              {activeTab === key && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-b-full" />
              )}
            </button>
          ))}
        </div>
      </div>

    </div>
  )
}
