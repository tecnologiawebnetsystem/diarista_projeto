'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  LogOut, TrendingUp, FileText,
  ScrollText, LayoutDashboard, CalendarCheck, WashingMachine,
  ShieldCheck, FileDown, Bus, Plus, AlertTriangle,
  CheckCircle, XCircle, Trash2, Edit2, X,
  Users, Phone, Hash, UserPlus, UserX, UserCheck, Eye, EyeOff,
  MapPin, Building2
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/contexts/auth-context'
import { useMonthlyPayments } from '@/hooks/use-monthly-payments'
import { useAttendance } from '@/hooks/use-attendance'
import { useLaundryWeeks } from '@/hooks/use-laundry-weeks'

import { useNotes } from '@/hooks/use-notes'
import { useAwards } from '@/hooks/use-awards'
import { useDiaristas } from '@/hooks/use-diaristas'
import { useClients } from '@/hooks/use-clients'
import { useDbNotifications } from '@/hooks/use-db-notifications'
import { MonthlyPaymentSection } from '@/components/monthly-payment-section'
import { AttendanceSection } from '@/components/attendance-section'
import { LaundrySection } from '@/components/laundry-section'
import { ContractViewer } from '@/components/contract-viewer'
import { TransportSection } from '@/components/transport-section'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import type { Note, Diarista, WorkScheduleDay, Client, LaundryAssignment } from '@/types/database'
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

const WEEKDAYS = [
  { value: 'monday', label: 'Segunda' },
  { value: 'tuesday', label: 'Terca' },
  { value: 'wednesday', label: 'Quarta' },
  { value: 'thursday', label: 'Quinta' },
  { value: 'friday', label: 'Sexta' },
  { value: 'saturday', label: 'Sabado' },
] as const

const CLEANING_TYPES = [
  { value: 'heavy_cleaning', label: 'Limpeza Pesada' },
  { value: 'light_cleaning', label: 'Limpeza Leve' },
] as const

type Tab = 'resumo' | 'presenca' | 'lavanderia' | 'transporte' | 'notas' | 'contrato' | 'equipe' | 'clientes'

const NAV_ITEMS: { key: Tab; label: string; Icon: React.ElementType }[] = [
  { key: 'resumo',      label: 'Dashboard',   Icon: LayoutDashboard },
  { key: 'presenca',    label: 'Presenca',     Icon: CalendarCheck },
  { key: 'lavanderia',  label: 'Lavanderia',   Icon: WashingMachine },
  { key: 'transporte',  label: 'Transporte',   Icon: Bus },
  { key: 'notas',       label: 'Notas',        Icon: FileText },
  { key: 'contrato',    label: 'Contrato',     Icon: ScrollText },
  { key: 'equipe',      label: 'Equipe',       Icon: Users },
  { key: 'clientes',    label: 'Clientes',     Icon: Building2 },
]

export default function AdminPage() {
  const router = useRouter()
  const { role, isLoading, logout, selectedDiaristaId, setSelectedDiaristaId } = useAuth()
  const { diaristas: allDiaristas, activeDiaristas, loading: loadingDiaristas, addDiarista, updateDiarista, deleteDiarista, refetch: refetchDiaristas } = useDiaristas()
  const { clients: allClients, activeClients, addClient, updateClient, deleteClient, refetch: refetchClients } = useClients()
  const [showClientForm, setShowClientForm] = useState(false)
  const [editingClient, setEditingClient] = useState<string | null>(null)
  const [clientForm, setClientForm] = useState({ name: '', address: '', neighborhood: '', phone: '', notes: '' })
  const [clientError, setClientError] = useState('')
  const [showDiaristaForm, setShowDiaristaForm] = useState(false)
  const [editingDiarista, setEditingDiarista] = useState<string | null>(null)
  const [diaristaForm, setDiaristaForm] = useState({
    name: '', pin: '', phone: '',
    heavy_cleaning_value: '250', light_cleaning_value: '150',
    washing_value: '75', ironing_value: '50', transport_value: '30',
    work_schedule: [
      { day: 'monday' as const, type: 'heavy_cleaning' as const },
      { day: 'thursday' as const, type: 'light_cleaning' as const },
    ] as WorkScheduleDay[],
    laundry_assignments: [] as LaundryAssignment[],
  })
  const [showPin, setShowPin] = useState<string | null>(null)
  const [diaristaError, setDiaristaError] = useState('')
  const [showInactive, setShowInactive] = useState(false)
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

  const defaultDiaristaForm = {
    name: '', pin: '', phone: '',
    heavy_cleaning_value: '250', light_cleaning_value: '150',
    washing_value: '75', ironing_value: '50', transport_value: '30',
    work_schedule: [
      { day: 'monday' as const, type: 'heavy_cleaning' as const },
      { day: 'thursday' as const, type: 'light_cleaning' as const },
    ] as WorkScheduleDay[],
    laundry_assignments: [] as LaundryAssignment[],
  }

  // Client CRUD handlers
  const handleClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setClientError('')
    if (!clientForm.name.trim()) { setClientError('Nome obrigatorio'); return }
    try {
      if (editingClient) {
        await updateClient(editingClient, clientForm)
      } else {
        await addClient(clientForm)
      }
      setClientForm({ name: '', address: '', neighborhood: '', phone: '', notes: '' })
      setShowClientForm(false)
      setEditingClient(null)
      refetchClients()
    } catch {
      setClientError('Erro ao salvar cliente')
    }
  }

  const handleEditClient = (c: Client) => {
    setEditingClient(c.id)
    setClientForm({
      name: c.name,
      address: c.address || '',
      neighborhood: c.neighborhood || '',
      phone: c.phone || '',
      notes: c.notes || '',
    })
    setShowClientForm(true)
    setClientError('')
  }

  const handleCancelClient = () => {
    setShowClientForm(false)
    setEditingClient(null)
    setClientForm({ name: '', address: '', neighborhood: '', phone: '', notes: '' })
    setClientError('')
  }

  // Diarista CRUD
  const handleDiaristaSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setDiaristaError('')
    if (diaristaForm.pin.length < 4) {
      setDiaristaError('O PIN deve ter pelo menos 4 digitos')
      return
    }
    if (diaristaForm.work_schedule.length === 0) {
      setDiaristaError('Adicione pelo menos um dia de trabalho')
      return
    }
    try {
      const payload = {
        name: diaristaForm.name,
        pin: diaristaForm.pin,
        phone: diaristaForm.phone || null,
        heavy_cleaning_value: parseFloat(diaristaForm.heavy_cleaning_value) || 0,
        light_cleaning_value: parseFloat(diaristaForm.light_cleaning_value) || 0,
        washing_value: parseFloat(diaristaForm.washing_value) || 0,
        ironing_value: parseFloat(diaristaForm.ironing_value) || 0,
        transport_value: parseFloat(diaristaForm.transport_value) || 0,
        work_schedule: diaristaForm.work_schedule,
        laundry_assignments: diaristaForm.laundry_assignments,
      }
      if (editingDiarista) {
        await updateDiarista(editingDiarista, payload)
      } else {
        const { name, pin, phone, ...extras } = payload
        await addDiarista(name, pin, phone || undefined, extras)
      }
      setDiaristaForm(defaultDiaristaForm)
      setShowDiaristaForm(false)
      setEditingDiarista(null)
      refetchDiaristas()
    } catch {
      setDiaristaError('Erro ao salvar diarista')
    }
  }

  const handleEditDiarista = (d: Diarista) => {
    setEditingDiarista(d.id)
    setDiaristaForm({
      name: d.name,
      pin: d.pin,
      phone: d.phone || '',
      heavy_cleaning_value: (d.heavy_cleaning_value ?? 250).toString(),
      light_cleaning_value: (d.light_cleaning_value ?? 150).toString(),
      washing_value: (d.washing_value ?? 75).toString(),
      ironing_value: (d.ironing_value ?? 50).toString(),
      transport_value: (d.transport_value ?? 30).toString(),
      work_schedule: d.work_schedule || defaultDiaristaForm.work_schedule,
      laundry_assignments: d.laundry_assignments || [],
    })
    setShowDiaristaForm(true)
    setDiaristaError('')
  }

  const handleToggleDiarista = async (id: string, active: boolean) => {
    await updateDiarista(id, { active })
    refetchDiaristas()
  }

  const handleCancelDiarista = () => {
    setShowDiaristaForm(false)
    setEditingDiarista(null)
    setDiaristaForm(defaultDiaristaForm)
    setDiaristaError('')
  }

  const addScheduleDay = () => {
    const usedDays = diaristaForm.work_schedule.map(s => s.day)
    const nextDay = WEEKDAYS.find(w => !usedDays.includes(w.value))
    if (nextDay) {
      setDiaristaForm({
        ...diaristaForm,
        work_schedule: [...diaristaForm.work_schedule, { day: nextDay.value as WorkScheduleDay['day'], type: 'light_cleaning' }],
      })
    }
  }

  const removeScheduleDay = (idx: number) => {
    setDiaristaForm({
      ...diaristaForm,
      work_schedule: diaristaForm.work_schedule.filter((_, i) => i !== idx),
    })
  }
  // Get values from selected diarista
  const selectedDiarista = allDiaristas.find(d => d.id === selectedDiaristaId)
  const ironingValue = selectedDiarista?.ironing_value ?? 50
  const washingValue = selectedDiarista?.washing_value ?? 75

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

  const heavyCleaningValue = selectedDiarista?.heavy_cleaning_value ?? 250
  const lightCleaningValue = selectedDiarista?.light_cleaning_value ?? 150
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
      {activeDiaristas.length > 0 && (
        <div className="px-4 pb-3">
          {activeDiaristas.length === 1 ? (
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/50 border border-border">
              <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center shrink-0 text-white font-bold text-xs">
                {activeDiaristas[0].name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{activeDiaristas[0].name}</p>
                <p className="text-[10px] text-muted-foreground">Diarista ativa</p>
              </div>
            </div>
          ) : (
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
          )}
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
            <MonthlyPaymentSection month={selectedMonth} year={selectedYear} isAdmin={true} hasActivity={hasActivity} diaristaId={selectedDiaristaId} diaristaName={selectedDiarista?.name} />
            <AttendanceSection month={selectedMonth} year={selectedYear} readOnly diaristaId={selectedDiaristaId} workSchedule={selectedDiarista?.work_schedule} />
            <LaundrySection month={selectedMonth} year={selectedYear} isAdmin diaristaId={selectedDiaristaId} diaristaIroningValue={selectedDiarista?.ironing_value} diaristaWashingValue={selectedDiarista?.washing_value} diaristaTransportValue={selectedDiarista?.transport_value} />
          </>
        )}

        {/* PRESENÇA */}
        {activeTab === 'presenca' && (
          <AttendanceSection month={selectedMonth} year={selectedYear} diaristaId={selectedDiaristaId} workSchedule={selectedDiarista?.work_schedule} />
        )}

        {/* LAVANDERIA */}
        {activeTab === 'lavanderia' && (
          <LaundrySection month={selectedMonth} year={selectedYear} diaristaId={selectedDiaristaId} onDataChange={refetchLaundry} diaristaIroningValue={selectedDiarista?.ironing_value} diaristaWashingValue={selectedDiarista?.washing_value} diaristaTransportValue={selectedDiarista?.transport_value} />
        )}

        {/* TRANSPORTE */}
        {activeTab === 'transporte' && (
          <TransportSection month={selectedMonth} year={selectedYear} diaristaId={selectedDiaristaId} onDataChange={refetchLaundry} diaristaTransportValue={selectedDiarista?.transport_value} />
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
                <ContractViewer isAdmin={true} diaristaId={selectedDiaristaId} diaristaName={selectedDiarista?.name} />
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

        {/* CLIENTES */}
        {activeTab === 'clientes' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold">{'Gestao de Clientes'}</p>
              </div>
              <Button size="sm" className="h-9 px-3" onClick={() => { setShowClientForm(true); setEditingClient(null); setClientForm({ name: '', address: '', neighborhood: '', phone: '', notes: '' }) }}>
                <Plus className="h-4 w-4 mr-1" />
                <span className="text-xs">Novo</span>
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2">
              <Card>
                <CardContent className="p-3 text-center">
                  <p className="text-2xl font-bold text-primary">{activeClients.length}</p>
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Ativos</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <p className="text-2xl font-bold text-muted-foreground">{allClients.filter(c => !c.active).length}</p>
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Inativos</p>
                </CardContent>
              </Card>
            </div>

            {/* Formulario */}
            {showClientForm && (
              <Card className="border-primary/40">
                <CardHeader className="pb-2 pt-4 px-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">{editingClient ? 'Editar' : 'Novo'} Cliente</CardTitle>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCancelClient}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <form onSubmit={handleClientSubmit} className="space-y-3">
                    <div>
                      <Label className="text-xs mb-1.5 block">Nome do cliente</Label>
                      <Input
                        value={clientForm.name}
                        onChange={e => setClientForm({ ...clientForm, name: e.target.value })}
                        placeholder="Ex: Familia Silva"
                        required
                        className="h-10"
                      />
                    </div>
                    <div>
                      <Label className="text-xs mb-1.5 block">Endereco</Label>
                      <Input
                        value={clientForm.address}
                        onChange={e => setClientForm({ ...clientForm, address: e.target.value })}
                        placeholder="Rua, numero, complemento"
                        className="h-10"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs mb-1.5 block">Bairro</Label>
                        <Input
                          value={clientForm.neighborhood}
                          onChange={e => setClientForm({ ...clientForm, neighborhood: e.target.value })}
                          placeholder="Bairro"
                          className="h-10"
                        />
                      </div>
                      <div>
                        <Label className="text-xs mb-1.5 block">Telefone</Label>
                        <Input
                          value={clientForm.phone}
                          onChange={e => setClientForm({ ...clientForm, phone: e.target.value })}
                          placeholder="(11) 99999-9999"
                          className="h-10"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs mb-1.5 block">Observacoes</Label>
                      <Textarea
                        value={clientForm.notes}
                        onChange={e => setClientForm({ ...clientForm, notes: e.target.value })}
                        placeholder="Notas sobre o cliente, instrucoes especiais..."
                        className="min-h-[60px] text-sm"
                      />
                    </div>

                    {clientError && <p className="text-xs text-destructive font-medium">{clientError}</p>}

                    <div className="flex gap-2 pt-1">
                      <Button type="submit" className="flex-1 h-10">
                        {editingClient ? 'Atualizar' : 'Cadastrar'}
                      </Button>
                      <Button type="button" variant="outline" onClick={handleCancelClient} className="h-10">
                        Cancelar
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Lista clientes */}
            {activeClients.length === 0 && !showClientForm ? (
              <div className="text-center py-10 text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm">{'Nenhum cliente cadastrado'}</p>
                <p className="text-xs mt-1 opacity-60">{'Clique em "Novo" para cadastrar'}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {activeClients.map(c => {
                  // Diaristas vinculadas a este cliente
                  const linkedDiaristas = activeDiaristas.filter(d =>
                    d.work_schedule?.some(s => s.client_id === c.id) ||
                    d.laundry_assignments?.some(la => la.client_id === c.id)
                  )
                  return (
                    <Card key={c.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                            <Building2 className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">{c.name}</p>
                            {c.address && (
                              <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                <MapPin className="h-3 w-3 shrink-0" />{c.address}
                              </p>
                            )}
                            {c.neighborhood && (
                              <p className="text-[11px] text-muted-foreground mt-0.5">{c.neighborhood}</p>
                            )}
                            {c.phone && (
                              <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                <Phone className="h-3 w-3 shrink-0" />{c.phone}
                              </p>
                            )}
                            {linkedDiaristas.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {linkedDiaristas.map(d => (
                                  <Badge key={d.id} variant="outline" className="text-[10px] h-5 px-2 border-primary/30 text-primary">
                                    {d.name}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            {c.notes && (
                              <p className="text-[10px] text-muted-foreground mt-1.5 italic">{c.notes}</p>
                            )}
                          </div>
                          <div className="flex flex-col gap-1 shrink-0">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditClient(c)}>
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteClient(c.id)}>
                              <XCircle className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* EQUIPE */}
        {activeTab === 'equipe' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold">{'Gestao de Diaristas'}</p>
              </div>
              <Button size="sm" className="h-9 px-3" onClick={() => { setShowDiaristaForm(true); setEditingDiarista(null); setDiaristaForm(defaultDiaristaForm) }}>
                <UserPlus className="h-4 w-4 mr-1" />
                <span className="text-xs">Nova</span>
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2">
              <Card>
                <CardContent className="p-3 text-center">
                  <p className="text-2xl font-bold text-primary">{activeDiaristas.length}</p>
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Ativas</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <p className="text-2xl font-bold text-muted-foreground">{allDiaristas.filter(d => !d.active).length}</p>
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Inativas</p>
                </CardContent>
              </Card>
            </div>

            {/* Formulario completo */}
            {showDiaristaForm && (
              <Card className="border-primary/40">
                <CardHeader className="pb-2 pt-4 px-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">{editingDiarista ? 'Editar' : 'Nova'} Diarista</CardTitle>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCancelDiarista}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <form onSubmit={handleDiaristaSubmit} className="space-y-4">
                    {/* Dados pessoais */}
                    <div className="space-y-3">
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Dados pessoais</p>
                      <div>
                        <Label className="text-xs mb-1.5 block">Nome completo</Label>
                        <Input
                          value={diaristaForm.name}
                          onChange={e => setDiaristaForm({ ...diaristaForm, name: e.target.value })}
                          placeholder="Ex: Maria Silva"
                          required
                          className="h-10"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs mb-1.5 block">PIN (4+ digitos)</Label>
                          <Input
                            value={diaristaForm.pin}
                            onChange={e => setDiaristaForm({ ...diaristaForm, pin: e.target.value.replace(/\D/g, '') })}
                            placeholder="1234"
                            required
                            maxLength={8}
                            inputMode="numeric"
                            className="h-10 font-mono tracking-widest"
                          />
                        </div>
                        <div>
                          <Label className="text-xs mb-1.5 block">Telefone</Label>
                          <Input
                            value={diaristaForm.phone}
                            onChange={e => setDiaristaForm({ ...diaristaForm, phone: e.target.value })}
                            placeholder="(11) 99999-9999"
                            className="h-10"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Separador */}
                    <div className="h-px bg-border" />

                    {/* Agenda de trabalho */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Dias de trabalho</p>
                        {diaristaForm.work_schedule.length < 6 && (
                          <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-[11px]" onClick={addScheduleDay}>
                            <Plus className="h-3 w-3 mr-1" />
                            Dia
                          </Button>
                        )}
                      </div>
                      {diaristaForm.work_schedule.map((sched, idx) => (
                        <div key={idx} className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <Select
                              value={sched.day}
                              onValueChange={v => {
                                const updated = [...diaristaForm.work_schedule]
                                updated[idx] = { ...updated[idx], day: v as WorkScheduleDay['day'] }
                                setDiaristaForm({ ...diaristaForm, work_schedule: updated })
                              }}
                            >
                              <SelectTrigger className="flex-1 h-9 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {WEEKDAYS.map(w => (
                                  <SelectItem key={w.value} value={w.value}>{w.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Select
                              value={sched.type}
                              onValueChange={v => {
                                const updated = [...diaristaForm.work_schedule]
                                updated[idx] = { ...updated[idx], type: v as WorkScheduleDay['type'] }
                                setDiaristaForm({ ...diaristaForm, work_schedule: updated })
                              }}
                            >
                              <SelectTrigger className="flex-1 h-9 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {CLEANING_TYPES.map(t => (
                                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {diaristaForm.work_schedule.length > 1 && (
                              <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-destructive" onClick={() => removeScheduleDay(idx)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                          <Select
                            value={sched.client_id || '_none'}
                            onValueChange={v => {
                              const updated = [...diaristaForm.work_schedule]
                              updated[idx] = { ...updated[idx], client_id: v === '_none' ? null : v }
                              setDiaristaForm({ ...diaristaForm, work_schedule: updated })
                            }}
                          >
                            <SelectTrigger className="h-8 text-[11px] text-muted-foreground">
                              <MapPin className="h-3 w-3 mr-1.5 shrink-0" />
                              <SelectValue placeholder="Selecionar cliente" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="_none">Sem cliente vinculado</SelectItem>
                              {activeClients.map(c => (
                                <SelectItem key={c.id} value={c.id}>{c.name}{c.neighborhood ? ` - ${c.neighborhood}` : ''}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                    </div>

                    {/* Separador */}
                    <div className="h-px bg-border" />

                    {/* Valores dos servicos */}
                    <div className="space-y-3">
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Valores dos servicos</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-[11px] mb-1 block text-muted-foreground">Limpeza Pesada</Label>
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">R$</span>
                            <Input
                              type="number" step="0.01" min="0" inputMode="decimal"
                              value={diaristaForm.heavy_cleaning_value}
                              onChange={e => setDiaristaForm({ ...diaristaForm, heavy_cleaning_value: e.target.value })}
                              className="h-9 pl-8 text-sm font-semibold"
                            />
                          </div>
                        </div>
                        <div>
                          <Label className="text-[11px] mb-1 block text-muted-foreground">Limpeza Leve</Label>
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">R$</span>
                            <Input
                              type="number" step="0.01" min="0" inputMode="decimal"
                              value={diaristaForm.light_cleaning_value}
                              onChange={e => setDiaristaForm({ ...diaristaForm, light_cleaning_value: e.target.value })}
                              className="h-9 pl-8 text-sm font-semibold"
                            />
                          </div>
                        </div>
                        <div>
                          <Label className="text-[11px] mb-1 block text-muted-foreground">Lavagem</Label>
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">R$</span>
                            <Input
                              type="number" step="0.01" min="0" inputMode="decimal"
                              value={diaristaForm.washing_value}
                              onChange={e => setDiaristaForm({ ...diaristaForm, washing_value: e.target.value })}
                              className="h-9 pl-8 text-sm font-semibold"
                            />
                          </div>
                        </div>
                        <div>
                          <Label className="text-[11px] mb-1 block text-muted-foreground">Passar Roupa</Label>
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">R$</span>
                            <Input
                              type="number" step="0.01" min="0" inputMode="decimal"
                              value={diaristaForm.ironing_value}
                              onChange={e => setDiaristaForm({ ...diaristaForm, ironing_value: e.target.value })}
                              className="h-9 pl-8 text-sm font-semibold"
                            />
                          </div>
                        </div>
                      </div>
                      <div>
                        <Label className="text-[11px] mb-1 block text-muted-foreground">Transporte (lavanderia/semana)</Label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">R$</span>
                          <Input
                            type="number" step="0.01" min="0" inputMode="decimal"
                            value={diaristaForm.transport_value}
                            onChange={e => setDiaristaForm({ ...diaristaForm, transport_value: e.target.value })}
                            className="h-9 pl-8 text-sm font-semibold"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Separador */}
                    <div className="h-px bg-border" />

                    {/* Lavanderia por cliente */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Lavanderia por cliente</p>
                        {activeClients.length > 0 && (
                          <Button
                            type="button" variant="ghost" size="sm" className="h-7 px-2 text-[11px]"
                            onClick={() => {
                              const usedIds = diaristaForm.laundry_assignments.map(la => la.client_id)
                              const nextClient = activeClients.find(c => !usedIds.includes(c.id))
                              if (nextClient) {
                                setDiaristaForm({
                                  ...diaristaForm,
                                  laundry_assignments: [...diaristaForm.laundry_assignments, { client_id: nextClient.id, services: ['washing', 'ironing'] }],
                                })
                              }
                            }}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Cliente
                          </Button>
                        )}
                      </div>
                      {diaristaForm.laundry_assignments.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-2">Nenhum cliente vinculado a lavanderia</p>
                      )}
                      {diaristaForm.laundry_assignments.map((la, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <Select
                            value={la.client_id}
                            onValueChange={v => {
                              const updated = [...diaristaForm.laundry_assignments]
                              updated[idx] = { ...updated[idx], client_id: v }
                              setDiaristaForm({ ...diaristaForm, laundry_assignments: updated })
                            }}
                          >
                            <SelectTrigger className="flex-1 h-9 text-xs">
                              <SelectValue placeholder="Cliente" />
                            </SelectTrigger>
                            <SelectContent>
                              {activeClients.map(c => (
                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              className={cn('px-2 py-1 rounded text-[10px] font-medium border transition-colors', la.services.includes('washing') ? 'bg-primary/10 border-primary text-primary' : 'bg-muted border-border text-muted-foreground')}
                              onClick={() => {
                                const updated = [...diaristaForm.laundry_assignments]
                                const has = la.services.includes('washing')
                                updated[idx] = { ...updated[idx], services: has ? la.services.filter(s => s !== 'washing') : [...la.services, 'washing'] }
                                setDiaristaForm({ ...diaristaForm, laundry_assignments: updated })
                              }}
                            >
                              Lavar
                            </button>
                            <button
                              type="button"
                              className={cn('px-2 py-1 rounded text-[10px] font-medium border transition-colors', la.services.includes('ironing') ? 'bg-primary/10 border-primary text-primary' : 'bg-muted border-border text-muted-foreground')}
                              onClick={() => {
                                const updated = [...diaristaForm.laundry_assignments]
                                const has = la.services.includes('ironing')
                                updated[idx] = { ...updated[idx], services: has ? la.services.filter(s => s !== 'ironing') : [...la.services, 'ironing'] }
                                setDiaristaForm({ ...diaristaForm, laundry_assignments: updated })
                              }}
                            >
                              Passar
                            </button>
                          </div>
                          <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-destructive" onClick={() => {
                            setDiaristaForm({ ...diaristaForm, laundry_assignments: diaristaForm.laundry_assignments.filter((_, i) => i !== idx) })
                          }}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    {diaristaError && (
                      <p className="text-xs text-destructive font-medium">{diaristaError}</p>
                    )}

                    <div className="flex gap-2 pt-1">
                      <Button type="submit" className="flex-1 h-10">
                        {editingDiarista ? 'Atualizar' : 'Cadastrar'}
                      </Button>
                      <Button type="button" variant="outline" onClick={handleCancelDiarista} className="h-10">
                        Cancelar
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Lista de diaristas ativas */}
            {activeDiaristas.length === 0 && !showDiaristaForm ? (
              <div className="text-center py-10 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm">{'Nenhuma diarista cadastrada'}</p>
                <p className="text-xs mt-1 opacity-60">{'Clique em "Nova" para cadastrar'}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {activeDiaristas.map(d => {
                  const schedule = (d.work_schedule || []) as WorkScheduleDay[]
                  const getDayLabel = (day: string) => WEEKDAYS.find(w => w.value === day)?.label || day
                  const getTypeLabel = (type: string) => type === 'heavy_cleaning' ? 'Pesada' : 'Leve'
                  return (
                    <Card key={d.id} className={cn(selectedDiaristaId === d.id && 'border-primary/50 bg-primary/5')}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center shrink-0 text-white font-bold text-sm mt-0.5">
                            {d.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-sm truncate">{d.name}</p>
                              <Badge variant="outline" className="text-[9px] h-4 px-1.5 border-green-500/50 text-green-500">Ativa</Badge>
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                              {d.phone && (
                                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                  <Phone className="h-3 w-3" />{d.phone}
                                </span>
                              )}
                              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                <Hash className="h-3 w-3" />
                                PIN: {showPin === d.id ? (
                                  <span className="font-mono">{d.pin}</span>
                                ) : (
                                  <span>{'****'}</span>
                                )}
                                <button onClick={() => setShowPin(showPin === d.id ? null : d.id)} className="ml-0.5">
                                  {showPin === d.id ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                </button>
                              </span>
                            </div>
                            {/* Agenda */}
                            {schedule.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {schedule.map((s, i) => {
                                  const client = s.client_id ? activeClients.find(c => c.id === s.client_id) : null
                                  return (
                                    <Badge key={i} variant="secondary" className="text-[10px] h-auto py-0.5 px-2">
                                      {getDayLabel(s.day)} - {getTypeLabel(s.type)}
                                      {client && <span className="ml-1 text-primary font-normal">({client.name})</span>}
                                    </Badge>
                                  )
                                })}
                              </div>
                            )}
                            {/* Valores resumo */}
                            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                              <span className="text-[10px] text-muted-foreground">
                                Pesada: <strong className="text-foreground">R$ {(d.heavy_cleaning_value ?? 0).toFixed(2)}</strong>
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                Leve: <strong className="text-foreground">R$ {(d.light_cleaning_value ?? 0).toFixed(2)}</strong>
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                Lav: <strong className="text-foreground">R$ {(d.washing_value ?? 0).toFixed(2)}</strong>
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                Pass: <strong className="text-foreground">R$ {(d.ironing_value ?? 0).toFixed(2)}</strong>
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-1 shrink-0">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditDiarista(d)}>
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { if (selectedDiaristaId !== d.id) setSelectedDiaristaId(d.id) }}>
                              <UserCheck className="h-3.5 w-3.5 text-primary" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleToggleDiarista(d.id, false)}>
                              <UserX className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}

            {/* Diaristas inativas */}
            {allDiaristas.filter(d => !d.active).length > 0 && (
              <div className="pt-2">
                <button
                  onClick={() => setShowInactive(!showInactive)}
                  className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <UserX className="h-3.5 w-3.5" />
                  {showInactive ? 'Ocultar' : 'Mostrar'} inativas ({allDiaristas.filter(d => !d.active).length})
                </button>
                {showInactive && (
                  <div className="space-y-2 mt-2">
                    {allDiaristas.filter(d => !d.active).map(d => (
                      <Card key={d.id} className="opacity-60">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0 text-muted-foreground font-bold text-sm">
                              {d.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-sm truncate">{d.name}</p>
                                <Badge variant="outline" className="text-[9px] h-4 px-1.5 border-destructive/50 text-destructive">Inativa</Badge>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => handleToggleDiarista(d.id, true)}>
                              <UserCheck className="h-3.5 w-3.5 mr-1" />
                              Reativar
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-card border-t border-border" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex items-stretch h-16 overflow-x-auto scrollbar-hide">
          {NAV_ITEMS.map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => handleTabChange(key)}
              className={`flex-1 min-w-[56px] flex flex-col items-center justify-center gap-0.5 relative transition-colors ${
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
