'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  Settings, LogOut, TrendingUp, FileText,
  ScrollText, Save, Check, DollarSign,
  LayoutDashboard, CalendarCheck, WashingMachine,
  ShieldCheck, FileDown, Bus, Plus, AlertTriangle,
  CheckCircle, XCircle, Trash2, Edit2, X
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/contexts/auth-context'
import { useMonthlyPayments } from '@/hooks/use-monthly-payments'
import { useAttendance } from '@/hooks/use-attendance'
import { useLaundryWeeks } from '@/hooks/use-laundry-weeks'
import { useConfig } from '@/hooks/use-config'
import { useNotes } from '@/hooks/use-notes'
import { useAwards } from '@/hooks/use-awards'
import { useDiaristas } from '@/hooks/use-diaristas'
import { useDbNotifications } from '@/hooks/use-db-notifications'
import { MonthlyPaymentSection } from '@/components/monthly-payment-section'
import { AttendanceSection } from '@/components/attendance-section'
import { LaundrySection } from '@/components/laundry-section'
import { ContractViewer } from '@/components/contract-viewer'
import { TransportSection } from '@/components/transport-section'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import type { Note } from '@/types/database'
import Link from 'next/link'

const NOTE_TYPES = [
  { value: 'general', label: 'Nota Geral', Icon: FileText, color: 'text-primary' },
  { value: 'warning', label: 'Observação', Icon: AlertTriangle, color: 'text-warning' },
  { value: 'extra_work', label: 'Trabalho Extra', Icon: CheckCircle, color: 'text-success' },
  { value: 'missed_task', label: 'Tarefa Não Realizada', Icon: XCircle, color: 'text-destructive' },
]

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

const CONFIG_ITEMS = [
  { key: 'heavy_cleaning', label: 'Limpeza Pesada', desc: 'Segunda-feira' },
  { key: 'light_cleaning', label: 'Limpeza Leve', desc: 'Quinta-feira' },
  { key: 'washing', label: 'Lavagem de Roupa', desc: 'Por semana' },
  { key: 'ironing', label: 'Passar Roupa', desc: 'Por semana' },
  { key: 'transport', label: 'Transporte', desc: 'Por semana de lavanderia' },
]

type Tab = 'resumo' | 'presenca' | 'lavanderia' | 'transporte' | 'notas' | 'contrato' | 'config'

const NAV_ITEMS: { key: Tab; label: string; Icon: React.ElementType }[] = [
  { key: 'resumo',      label: 'Dashboard',   Icon: LayoutDashboard },
  { key: 'presenca',    label: 'Presença',    Icon: CalendarCheck },
  { key: 'lavanderia',  label: 'Lavanderia',  Icon: WashingMachine },
  { key: 'transporte',  label: 'Transporte',  Icon: Bus },
  { key: 'notas',       label: 'Notas',       Icon: FileText },
  { key: 'contrato',    label: 'Contrato',    Icon: ScrollText },
  { key: 'config',      label: 'Config',      Icon: Settings },
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
  const { attendance, refetch: refetchAttendance } = useAttendance(selectedMonth, selectedYear, selectedDiaristaId)
  const { laundryWeeks, refetch: refetchLaundry } = useLaundryWeeks(selectedMonth, selectedYear, selectedDiaristaId)
  const { notes, addNote, updateNote, deleteNote } = useNotes(selectedMonth, selectedYear, selectedDiaristaId)
  const { sendNotification } = useDbNotifications()
  const [showNoteForm, setShowNoteForm] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [noteFormData, setNoteFormData] = useState({
    date: new Date(),
    note_type: 'general' as Note['note_type'],
    content: '',
    is_warning: false,
  })

  const getNoteTypeInfo = (type: Note['note_type']) =>
    NOTE_TYPES.find(t => t.value === type) || NOTE_TYPES[0]

  const handleNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const dateStr = format(noteFormData.date, 'yyyy-MM-dd')
      const typeInfo = getNoteTypeInfo(noteFormData.note_type)
      if (editingNote) {
        await updateNote(editingNote.id, noteFormData.content, noteFormData.is_warning)
      } else {
        await addNote(dateStr, noteFormData.note_type, noteFormData.content, noteFormData.is_warning)
      }
      // Enviar notificacao para a diarista
      if (selectedDiaristaId) {
        const title = editingNote ? 'Anotacao Atualizada' : 'Nova Anotacao'
        const message = `${typeInfo.label}: ${noteFormData.content.substring(0, 100)}${noteFormData.content.length > 100 ? '...' : ''}`
        const type = noteFormData.is_warning ? 'warning' as const : 'note' as const
        await sendNotification(selectedDiaristaId, title, message, type)
      }
      setNoteFormData({ date: new Date(), note_type: 'general', content: '', is_warning: false })
      setShowNoteForm(false)
      setEditingNote(null)
    } catch (error) {
      console.error('Error saving note:', error)
    }
  }

  const handleEditNote = (note: Note) => {
    setEditingNote(note)
    setNoteFormData({
      date: new Date(note.date + 'T00:00:00'),
      note_type: note.note_type,
      content: note.content,
      is_warning: note.is_warning,
    })
    setShowNoteForm(true)
  }

  const handleCancelNote = () => {
    setShowNoteForm(false)
    setEditingNote(null)
    setNoteFormData({ date: new Date(), note_type: 'general', content: '', is_warning: false })
  }
  const { getConfigValue } = useConfig()

  const ironingValue = getConfigValue('ironing') || 50
  const washingValue = getConfigValue('washing') || 75

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab)
    if (tab === 'resumo') {
      refetchAttendance()
      refetchLaundry()
    }
  }

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

  const presentDays = attendance.filter(a => a.present)
  const hasActivity = presentDays.length > 0 || laundryWeeks.some(w => w.ironed || w.washed)

  const heavyCleaningValue = getConfigValue('heavy_cleaning') || 0
  const lightCleaningValue = getConfigValue('light_cleaning') || 0
  const heavyDays = presentDays.filter(a => a.day_type === 'heavy_cleaning')
  const lightDays = presentDays.filter(a => a.day_type === 'light_cleaning')
  const attendanceTotal = (heavyDays.length * heavyCleaningValue) + (lightDays.length * lightCleaningValue)

  const laundryTotal = laundryWeeks.reduce((sum, week) => {
    const services = (week.ironed ? ironingValue : 0) + (week.washed ? washingValue : 0)
    return sum + services
  }, 0)
  const grandTotal = attendanceTotal + laundryTotal
  const transportPaidTotal = laundryWeeks
    .filter(w => (w.ironed || w.washed) && w.paid_at)
    .reduce((sum, w) => sum + (w.transport_fee || 0), 0)
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
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <TrendingUp className="h-3.5 w-3.5 opacity-80" />
                  <p className="text-xs opacity-80">Total do Mes</p>
                </div>
                <p className="text-3xl font-bold">R$ {grandTotal.toFixed(2)}</p>
              </div>
              {transportPaidTotal > 0 && (
                <>
                  <div className="w-px h-12 bg-white/20 mx-3" />
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Bus className="h-3.5 w-3.5 opacity-80" />
                      <p className="text-xs opacity-80">Transporte</p>
                    </div>
                    <p className="text-xl font-bold">R$ {transportPaidTotal.toFixed(2)}</p>
                    <p className="text-[10px] opacity-60">pago</p>
                  </div>
                </>
              )}
            </div>
            {!hasActivity && (
              <p className="text-xs opacity-60 text-center mt-1">Nenhuma atividade registrada neste mes</p>
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
            <AttendanceSection month={selectedMonth} year={selectedYear} readOnly diaristaId={selectedDiaristaId} />
            <LaundrySection month={selectedMonth} year={selectedYear} isAdmin diaristaId={selectedDiaristaId} />
          </>
        )}

        {/* PRESENÇA */}
        {activeTab === 'presenca' && (
          <AttendanceSection month={selectedMonth} year={selectedYear} diaristaId={selectedDiaristaId} />
        )}

        {/* LAVANDERIA */}
        {activeTab === 'lavanderia' && (
          <LaundrySection month={selectedMonth} year={selectedYear} diaristaId={selectedDiaristaId} onDataChange={refetchLaundry} />
        )}

        {/* TRANSPORTE */}
        {activeTab === 'transporte' && (
          <TransportSection month={selectedMonth} year={selectedYear} diaristaId={selectedDiaristaId} onDataChange={refetchLaundry} />
        )}

        {/* NOTAS */}
        {activeTab === 'notas' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">Anotações</p>
              <Button size="sm" className="h-9 px-3" onClick={() => { setShowNoteForm(true); setEditingNote(null) }}>
                <Plus className="h-4 w-4 mr-1" />
                <span className="text-xs">Nova</span>
              </Button>
            </div>

            {warnings.length > 0 && (
              <div className={cn(
                'flex items-center gap-3 p-3 rounded-xl border',
                warnings.length >= 3 ? 'bg-destructive/10 border-destructive/40' : 'bg-amber-500/10 border-amber-500/40'
              )}>
                <AlertTriangle className={cn('h-5 w-5', warnings.length >= 3 ? 'text-destructive' : 'text-amber-500')} />
                <div className="flex-1">
                  <p className="text-sm font-semibold">
                    {warnings.length} {'advertência'}{warnings.length > 1 ? 's' : ''}
                  </p>
                </div>
                <span className={cn('text-2xl font-bold', warnings.length >= 3 ? 'text-destructive' : 'text-amber-500')}>
                  {warnings.length}/3
                </span>
              </div>
            )}

            {/* Formulario */}
            {showNoteForm && (
              <Card className="border-primary/40">
                <CardHeader className="pb-2 pt-4 px-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">{editingNote ? 'Editar' : 'Nova'} {'Anotação'}</CardTitle>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCancelNote}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <form onSubmit={handleNoteSubmit} className="space-y-3">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start h-10 text-sm" disabled={!!editingNote}>
                          <FileText className="mr-2 h-4 w-4" />
                          {format(noteFormData.date, 'dd/MM/yyyy', { locale: ptBR })}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={noteFormData.date}
                          onSelect={(date) => date && setNoteFormData({ ...noteFormData, date })}
                          locale={ptBR}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>

                    <Select
                      value={noteFormData.note_type}
                      onValueChange={(v) => setNoteFormData({ ...noteFormData, note_type: v as Note['note_type'] })}
                      disabled={!!editingNote}
                    >
                      <SelectTrigger className="h-10 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {NOTE_TYPES.map(t => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Textarea
                      value={noteFormData.content}
                      onChange={(e) => setNoteFormData({ ...noteFormData, content: e.target.value })}
                      placeholder="Descreva a anotação..."
                      rows={3}
                      required
                      className="text-sm resize-none"
                    />

                    <div className="flex gap-2">
                      <Button type="submit" className="flex-1 h-10">
                        {editingNote ? 'Atualizar' : 'Salvar'}
                      </Button>
                      <Button type="button" variant="outline" onClick={handleCancelNote} className="h-10">
                        Cancelar
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Lista de notas */}
            {notes.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm">{'Nenhuma anotação neste mês'}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {notes.map((note) => {
                  const typeInfo = getNoteTypeInfo(note.note_type)
                  const { Icon } = typeInfo
                  return (
                    <Card key={note.id} className={cn(note.is_warning && 'border-amber-500/50 bg-amber-500/5')}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <Icon className={cn('h-4 w-4', typeInfo.color)} />
                            <span className="text-sm font-semibold">{typeInfo.label}</span>
                            {note.is_warning && (
                              <Badge variant="destructive" className="text-[10px] h-4 px-1.5">
                                {'Advertência'}
                              </Badge>
                            )}
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditNote(note)}>
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteNote(note.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-[11px] text-muted-foreground mb-1">
                          {format(new Date(note.date + 'T00:00:00'), 'dd/MM/yyyy')}
                        </p>
                        <p className="text-sm text-foreground/90 leading-relaxed">{note.content}</p>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
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
              onClick={() => handleTabChange(key)}
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
