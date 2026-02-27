'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { LayoutDashboard, CalendarCheck, WashingMachine, FileText, ScrollText, Trophy, AlertTriangle, LogOut, CheckCircle2, XCircle, Briefcase, TrendingUp, CalendarDays, Receipt, FileDown, Bus, Bell, X, User, Camera, Phone, Save, Check, MapPin, Building2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/auth-context'
import { useMonthlyPayments } from '@/hooks/use-monthly-payments'
import { useAttendance } from '@/hooks/use-attendance'
import { useLaundryWeeks } from '@/hooks/use-laundry-weeks'
import { useNotes } from '@/hooks/use-notes'
import { useAwards } from '@/hooks/use-awards'
import { useDiaristas } from '@/hooks/use-diaristas'
import { useClients } from '@/hooks/use-clients'
import { ContractViewer } from '@/components/contract-viewer'
import { NotificationBanner } from '@/components/notification-banner'
import { useDbNotifications } from '@/hooks/use-db-notifications'
import { cn } from '@/lib/utils'
import Link from 'next/link'

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

export default function DiaristaPage() {
  const router = useRouter()
  const { role, isLoading, logout } = useAuth()
  const currentDate = new Date()
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear())
  const [activeTab, setActiveTab] = useState<'resumo' | 'presenca' | 'lavanderia' | 'transporte' | 'anotacoes' | 'contrato' | 'perfil'>('resumo')

  const { diaristaId } = useAuth()
  const { diaristas: allDiaristas, updateDiarista, refetch: refetchDiaristas } = useDiaristas()
  const { activeClients } = useClients()
  const currentDiarista = allDiaristas.find(d => d.id === diaristaId)
  const getClientName = (clientId?: string | null) => clientId ? activeClients.find(c => c.id === clientId)?.name : null

  // Perfil states
  const [profileName, setProfileName] = useState('')
  const [profilePhone, setProfilePhone] = useState('')
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)
  const [profileError, setProfileError] = useState('')

  // Sync profile form when diarista loads
  useEffect(() => {
    if (currentDiarista) {
      setProfileName(currentDiarista.name)
      setProfilePhone(currentDiarista.phone || '')
    }
  }, [currentDiarista?.id, currentDiarista?.name, currentDiarista?.phone])
  const { notifications: dbNotifications, unreadCount, markAsRead, markAllAsRead } = useDbNotifications(diaristaId)
  const [showNotifications, setShowNotifications] = useState(false)
  const { payment } = useMonthlyPayments(selectedMonth, selectedYear, diaristaId)
  const { attendance: attendances, refetch: refetchAttendance } = useAttendance(selectedMonth, selectedYear, diaristaId)
  const { laundryWeeks, refetch: refetchLaundry } = useLaundryWeeks(selectedMonth, selectedYear, diaristaId)
  const { notes } = useNotes(selectedMonth, selectedYear, diaristaId)
  const { currentPeriod: currentPeriodAward } = useAwards(diaristaId)

  useEffect(() => {
    if (isLoading) return
    if (role !== 'diarista') router.replace('/login')
  }, [role, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  const ironingValue = currentDiarista?.ironing_value ?? 50
  const washingValue = currentDiarista?.washing_value ?? 75

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !diaristaId) return
    setUploadingPhoto(true)
    setProfileError('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro no upload')
      await updateDiarista(diaristaId, { photo_url: data.url })
      refetchDiaristas()
    } catch {
      setProfileError('Erro ao enviar foto')
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!diaristaId || !profileName.trim()) return
    setSavingProfile(true)
    setProfileError('')
    try {
      await updateDiarista(diaristaId, {
        name: profileName.trim(),
        phone: profilePhone.trim() || null,
      })
      refetchDiaristas()
      setProfileSaved(true)
      setTimeout(() => setProfileSaved(false), 2000)
    } catch {
      setProfileError('Erro ao salvar perfil')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab)
    if (tab === 'resumo') {
      refetchAttendance()
      refetchLaundry()
    }
  }

  // Só mostra valores se houver atividade registrada no mês
  const presentDays = attendances.filter(a => a.present)
  const hasActivity = presentDays.length > 0 || laundryWeeks.some(w => w.ironed || w.washed)

  const heavyCleaningValue = currentDiarista?.heavy_cleaning_value ?? 250
  const lightCleaningValue = currentDiarista?.light_cleaning_value ?? 150
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
      <div className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10 safe-area-inset-top">
        <div className="px-4 py-3 flex items-center justify-between">
          <button className="flex items-center gap-3" onClick={() => handleTabChange('perfil')}>
            {currentDiarista?.photo_url ? (
              <Image
                src={currentDiarista.photo_url}
                alt={currentDiarista.name}
                width={40}
                height={40}
                className="rounded-full object-cover w-10 h-10 border-2 border-primary/30"
              />
            ) : (
              <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-white font-bold text-sm border-2 border-primary/30">
                {currentDiarista?.name?.charAt(0).toUpperCase() || 'D'}
              </div>
            )}
            <div>
              <h1 className="text-sm font-bold text-foreground leading-none text-left">{currentDiarista?.name || 'Diarista'}</h1>
              <p className="text-[10px] text-primary font-medium mt-0.5">LIMPP DAY</p>
            </div>
          </button>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowNotifications(!showNotifications)}
              className="h-9 w-9 p-0 relative"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                  {unreadCount}
                </span>
              )}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { logout(); router.push('/login') }} className="h-9 w-9 p-0">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Notifications Panel */}
      {showNotifications && (
        <div className="border-b bg-card">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold">{'Notificações'}</h2>
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="text-[10px] h-5 px-1.5">{unreadCount}</Badge>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" className="h-8 text-[11px] px-2" onClick={markAllAsRead}>
                    Marcar todas como lidas
                  </Button>
                )}
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowNotifications(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {dbNotifications.length === 0 ? (
              <p className="text-center text-muted-foreground py-4 text-sm">{'Nenhuma notificação'}</p>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {dbNotifications.slice(0, 20).map(n => (
                  <div
                    key={n.id}
                    onClick={() => { if (!n.read) markAsRead(n.id) }}
                    className={cn(
                      'p-3 rounded-lg cursor-pointer transition-colors',
                      n.read ? 'bg-muted/50' : 'bg-primary/10 border border-primary/30'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          {!n.read && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                          <p className={cn('text-sm font-semibold truncate', !n.read && 'text-primary')}>
                            {n.title}
                          </p>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">{n.message}</p>
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0 mt-0.5">
                        {new Date(n.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Period Selector */}
      <div className={cn('px-4 pt-4 pb-2', activeTab === 'perfil' && 'hidden')}>
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

      {/* Total Card */}
      <div className={cn('px-4 pb-3', activeTab === 'perfil' && 'hidden')}>
        <Card className="gradient-primary text-white shadow-lg">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <TrendingUp className="h-3.5 w-3.5 opacity-80" />
                  <p className="text-xs opacity-80">Seus Ganhos no Mes</p>
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
                    <p className="text-[10px] opacity-60">recebido</p>
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
      <div className="px-4 pb-24 flex-1">

        {/* RESUMO */}
        {activeTab === 'resumo' && (
          <div className="space-y-3">
            <NotificationBanner />

            {/* Card: Onde trabalho hoje */}
            {(() => {
              const DOW_MAP: Record<number, string> = { 0: 'sunday', 1: 'monday', 2: 'tuesday', 3: 'wednesday', 4: 'thursday', 5: 'friday', 6: 'saturday' }
              const todayDow = DOW_MAP[new Date().getDay()]
              const todaySchedule = currentDiarista?.work_schedule?.find(s => s.day === todayDow)
              if (!todaySchedule) return null
              const clientName = getClientName(todaySchedule.client_id)
              const client = todaySchedule.client_id ? activeClients.find(c => c.id === todaySchedule.client_id) : null
              return (
                <Card className="border-primary/30 bg-primary/5">
                  <CardContent className="py-4 px-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                        <MapPin className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-primary font-semibold uppercase tracking-wide">Hoje</p>
                        <p className="text-sm font-bold text-foreground mt-0.5">
                          {todaySchedule.type === 'heavy_cleaning' ? 'Limpeza Pesada' : 'Limpeza Leve'}
                        </p>
                        {clientName ? (
                          <div className="mt-1">
                            <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                              <Building2 className="h-3.5 w-3.5 text-primary shrink-0" />
                              {clientName}
                            </p>
                            {client?.address && (
                              <p className="text-[11px] text-muted-foreground mt-0.5 ml-5">{client.address}</p>
                            )}
                          </div>
                        ) : (
                          <p className="text-[11px] text-muted-foreground mt-0.5">Sem cliente vinculado</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })()}

            <Card>
              <CardContent className="py-4 px-4">
                <div className="flex gap-2">
                  <div className="flex-1 bg-muted rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-primary">{heavyDays.length}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">Pesada</p>
                  </div>
                  <div className="flex-1 bg-muted rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-primary">{lightDays.length}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">Leve</p>
                  </div>
                  <div className="flex-1 bg-muted rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-destructive">{warnings.length}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">{'Anotações'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {payment && hasActivity && (
              <Card>
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-primary" />
                    Pagamento Mensal
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">{'Previsao de pagamento'}</p>
                      <p className="text-sm font-medium">
                        {format(new Date(payment.payment_due_date + 'T00:00:00'), "dd 'de' MMMM", { locale: ptBR })}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Limite: {payment.hour_limit?.slice(0, 5) || '20:00'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-primary">R$ {grandTotal.toFixed(2)}</p>
                      <Badge variant={payment.paid_at ? 'default' : 'outline'} className="text-[10px] mt-1">
                        {payment.paid_at ? 'Pago' : 'Aguardando'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex gap-2">
              <Link href="/payment-history" className="flex-1">
                <Button className="w-full h-11" variant="outline">
                  <Receipt className="h-4 w-4 mr-2" />
                  Historico
                </Button>
              </Link>
              <Button
                className="flex-1 h-11"
                variant="outline"
                onClick={() => {
                  const url = `/api/report?month=${selectedMonth}&year=${selectedYear}${diaristaId ? `&diarista_id=${diaristaId}` : ''}`
                  window.open(url, '_blank')
                }}
              >
                <FileDown className="h-4 w-4 mr-2" />
                Relatorio
              </Button>
            </div>
          </div>
        )}

        {/* PRESENÇA */}
        {activeTab === 'presenca' && (
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-primary" />
                Dias Trabalhados
              </CardTitle>
              <CardDescription className="text-xs">
                {(() => {
                  const WDAY_LABELS: Record<string, string> = { monday: 'Seg', tuesday: 'Ter', wednesday: 'Qua', thursday: 'Qui', friday: 'Sex', saturday: 'Sab', sunday: 'Dom' }
                  const schedule = currentDiarista?.work_schedule || []
                  if (schedule.length === 0) return 'Conforme agenda definida'
                  return schedule.map(s => `${WDAY_LABELS[s.day] || s.day} = ${s.type === 'heavy_cleaning' ? 'Pesada' : 'Leve'}`).join(' · ')
                })()}
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {attendances.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-sm">
                  Nenhum dia registrado neste mês
                </p>
              ) : (
                <div className="space-y-2">
                  {attendances.map(a => {
                    const DOW_MAP2: Record<number, string> = { 0: 'sunday', 1: 'monday', 2: 'tuesday', 3: 'wednesday', 4: 'thursday', 5: 'friday', 6: 'saturday' }
                    const dateDow = DOW_MAP2[new Date(a.date + 'T00:00:00').getDay()]
                    const schedEntry = currentDiarista?.work_schedule?.find(s => s.day === dateDow)
                    const clientForDay = getClientName(schedEntry?.client_id)
                    return (
                      <div key={a.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-2">
                          {a.present
                            ? <CheckCircle2 className="h-4 w-4 text-success" />
                            : <XCircle className="h-4 w-4 text-destructive" />
                          }
                          <div>
                            <p className="text-sm font-medium">
                              {format(new Date(a.date + 'T00:00:00'), "dd/MM/yyyy")}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {format(new Date(a.date + 'T00:00:00'), 'EEEE', { locale: ptBR })}
                            </p>
                            {clientForDay && (
                              <p className="text-[10px] text-primary font-medium flex items-center gap-1 mt-0.5">
                                <Building2 className="h-3 w-3" />{clientForDay}
                              </p>
                            )}
                          </div>
                        </div>
                        <Badge variant="outline" className={`text-[10px] ${a.day_type === 'heavy_cleaning' ? 'border-destructive text-destructive' : 'border-primary text-primary'}`}>
                          {a.day_type === 'heavy_cleaning' ? 'Pesada' : 'Leve'}
                        </Badge>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* LAVANDERIA */}
        {activeTab === 'lavanderia' && (
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <WashingMachine className="h-4 w-4 text-primary" />
                Lavanderia
              </CardTitle>
              <CardDescription className="text-xs">Serviços de lavagem e passagem</CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {laundryWeeks.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-sm">
                  Nenhum serviço registrado neste mês
                </p>
              ) : (
                <div className="space-y-2">
                  {laundryWeeks.map(week => {
                    const services = (week.ironed ? ironingValue : 0) + (week.washed ? washingValue : 0)
                    const hasServices = week.ironed || week.washed
                    const transportPaid = hasServices && !!week.paid_at
                    return (
                      <div key={week.id} className="p-3 bg-muted rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-semibold">Semana {week.week_number}</p>
                          <p className="text-sm font-bold text-primary">R$ {services.toFixed(2)}</p>
                        </div>
                        <div className="text-[11px] text-muted-foreground space-y-0.5">
                          {week.ironed && <p>Passou roupa: R$ {ironingValue.toFixed(2)}</p>}
                          {week.washed && <p>Lavou roupa: R$ {washingValue.toFixed(2)}</p>}
                        </div>
                        {hasServices && (
                          <div className="mt-2 pt-2 border-t border-border/50 flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <Bus className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-[11px] text-muted-foreground">
                                Transporte: R$ {(week.transport_fee || 0).toFixed(2)}
                              </span>
                            </div>
                            <Badge
                              variant={transportPaid ? 'default' : 'outline'}
                              className={`text-[10px] ${transportPaid ? 'bg-green-600' : ''}`}
                            >
                              {transportPaid ? 'Pago' : 'Pendente'}
                            </Badge>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* TRANSPORTE */}
        {activeTab === 'transporte' && (
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <Bus className="h-4 w-4 text-primary" />
                Transporte
              </CardTitle>
              <CardDescription className="text-xs">Pagamentos de transporte por semana</CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {(() => {
                const transportWeeks = laundryWeeks.filter(w => (w.ironed || w.washed))
                if (transportWeeks.length === 0) {
                  return (
                    <p className="text-center text-muted-foreground py-8 text-sm">
                      Nenhum transporte registrado neste mes
                    </p>
                  )
                }
                const paidWeeks = transportWeeks.filter(w => w.paid_at)
                const pendingWeeks = transportWeeks.filter(w => !w.paid_at)
                const totalPaid = paidWeeks.reduce((s, w) => s + (w.transport_fee || 0), 0)
                const totalPending = pendingWeeks.reduce((s, w) => s + (w.transport_fee || 0), 0)
                return (
                  <div className="space-y-3">
                    {/* Resumo */}
                    <div className="flex gap-2">
                      <div className="flex-1 bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-center">
                        <p className="text-lg font-bold text-green-500">R$ {totalPaid.toFixed(2)}</p>
                        <p className="text-[10px] text-muted-foreground">Recebido</p>
                      </div>
                      <div className="flex-1 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-center">
                        <p className="text-lg font-bold text-amber-500">R$ {totalPending.toFixed(2)}</p>
                        <p className="text-[10px] text-muted-foreground">Pendente</p>
                      </div>
                    </div>

                    {/* Lista de semanas */}
                    <div className="space-y-2">
                      {transportWeeks.map(week => {
                        const isPaid = !!week.paid_at
                        return (
                          <div key={week.id} className="p-3 bg-muted rounded-lg">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Bus className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="text-sm font-semibold">Semana {week.week_number}</p>
                                  <p className="text-[10px] text-muted-foreground">
                                    {week.ironed && week.washed ? 'Lavou e Passou' : week.ironed ? 'Passou roupa' : 'Lavou roupa'}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className={`text-sm font-bold ${isPaid ? 'text-green-500' : 'text-amber-500'}`}>
                                  R$ {(week.transport_fee || 0).toFixed(2)}
                                </p>
                                <Badge
                                  variant={isPaid ? 'default' : 'outline'}
                                  className={`text-[10px] ${isPaid ? 'bg-green-600' : 'border-amber-500 text-amber-500'}`}
                                >
                                  {isPaid ? 'Recebido' : 'Pendente'}
                                </Badge>
                              </div>
                            </div>
                            {isPaid && week.receipt_url && (
                              <div className="mt-2 pt-2 border-t border-border/50">
                                <a
                                  href={week.receipt_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1.5 text-[11px] text-primary hover:underline"
                                >
                                  <Receipt className="h-3 w-3" />
                                  Ver comprovante
                                </a>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })()}
            </CardContent>
          </Card>
        )}

        {/* ANOTAÇÕES */}
        {activeTab === 'anotacoes' && (
          <div className="space-y-3">
            {warnings.length > 0 && (
              <Card className="border-destructive">
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-4 w-4" />
                    Advertências ({warnings.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-2">
                  {warnings.map(w => (
                    <div key={w.id} className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                      <p className="text-[10px] text-muted-foreground mb-1">
                        {format(new Date(w.date + 'T00:00:00'), "dd/MM/yyyy")}
                      </p>
                      <p className="text-sm">{w.content}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
            <Card>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Todas as Anotações
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                {notes.length === 0 ? (
                  <p className="text-center text-muted-foreground py-6 text-sm">Nenhuma anotação neste mês</p>
                ) : (
                  <div className="space-y-2">
                    {notes.map(note => (
                      <div key={note.id} className="p-3 bg-muted rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <Badge variant="outline" className="text-[10px]">
                            {note.note_type === 'general' && 'Geral'}
                            {note.note_type === 'warning' && 'Advertência'}
                            {note.note_type === 'extra_work' && 'Trabalho Extra'}
                            {note.note_type === 'missed_task' && 'Tarefa Não Realizada'}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {format(new Date(note.date + 'T00:00:00'), "dd/MM/yyyy")}
                          </span>
                        </div>
                        <p className="text-sm">{note.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* CONTRATO */}
        {activeTab === 'contrato' && (
          <ContractViewer isAdmin={false} diaristaId={diaristaId} diaristaName={currentDiarista?.name} />
        )}

        {/* PERFIL */}
        {activeTab === 'perfil' && (
          <div className="space-y-5">

            {/* Hero profile card */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-card to-card border border-primary/10">
              {/* Glow */}
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-primary/5 rounded-full blur-2xl" />

              <div className="relative px-5 pt-8 pb-6 flex flex-col items-center">
                {/* Avatar com camera */}
                <div className="relative group">
                  <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl scale-110 opacity-60" />
                  {currentDiarista?.photo_url ? (
                    <Image
                      src={currentDiarista.photo_url}
                      alt={currentDiarista.name}
                      width={110}
                      height={110}
                      className="relative rounded-full object-cover w-[110px] h-[110px] border-[3px] border-primary/30 shadow-lg shadow-primary/10"
                    />
                  ) : (
                    <div className="relative w-[110px] h-[110px] rounded-full gradient-primary flex items-center justify-center text-white font-bold text-4xl border-[3px] border-primary/30 shadow-lg shadow-primary/10">
                      {currentDiarista?.name?.charAt(0).toUpperCase() || 'D'}
                    </div>
                  )}
                  <label className="absolute bottom-1 right-1 w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer shadow-lg hover:scale-105 active:scale-95 transition-transform ring-2 ring-card">
                    {uploadingPhoto ? (
                      <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="sr-only"
                      onChange={handlePhotoUpload}
                      disabled={uploadingPhoto}
                    />
                  </label>
                </div>

                {/* Nome e telefone */}
                <h2 className="text-xl font-bold text-foreground mt-4 tracking-tight">{currentDiarista?.name || 'Diarista'}</h2>
                {currentDiarista?.phone && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                    <Phone className="h-3.5 w-3.5" />
                    {currentDiarista.phone}
                  </p>
                )}

                {/* Mini stats */}
                <div className="flex items-center gap-5 mt-5 pt-5 border-t border-border/50 w-full justify-center">
                  <div className="text-center">
                    <p className="text-xl font-bold text-primary">{currentDiarista?.work_schedule?.length || 0}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mt-0.5">dias/sem</p>
                  </div>
                  <div className="w-px h-8 bg-border/50" />
                  <div className="text-center">
                    <p className="text-xl font-bold text-primary">
                      {new Set(currentDiarista?.work_schedule?.map(s => s.client_id).filter(Boolean)).size}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mt-0.5">clientes</p>
                  </div>
                  <div className="w-px h-8 bg-border/50" />
                  <div className="text-center">
                    <p className="text-xl font-bold text-primary">{currentPeriodAward?.stars || 0}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mt-0.5">estrelas</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Dados pessoais -- inline edit style */}
            <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
              <div className="px-5 py-4 border-b border-border/40 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Meus Dados</p>
                  <p className="text-[11px] text-muted-foreground">Toque para editar</p>
                </div>
              </div>
              <div className="px-5 py-4 space-y-4">
                <div>
                  <Label className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium mb-2 block">Nome completo</Label>
                  <Input
                    value={profileName}
                    onChange={e => setProfileName(e.target.value)}
                    placeholder="Seu nome"
                    className="h-11 bg-muted/50 border-transparent focus:border-primary/50 focus:bg-card transition-all text-sm font-medium"
                  />
                </div>
                <div>
                  <Label className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium mb-2 block">Telefone</Label>
                  <Input
                    value={profilePhone}
                    onChange={e => setProfilePhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="h-11 bg-muted/50 border-transparent focus:border-primary/50 focus:bg-card transition-all text-sm font-medium"
                  />
                </div>

                {profileError && (
                  <p className="text-xs text-destructive font-medium">{profileError}</p>
                )}

                <Button
                  onClick={handleSaveProfile}
                  disabled={savingProfile || !profileName.trim()}
                  className={cn(
                    'w-full h-11 rounded-xl font-semibold text-sm transition-all',
                    profileSaved ? 'bg-green-600 hover:bg-green-600 shadow-lg shadow-green-600/20' : 'shadow-lg shadow-primary/20'
                  )}
                >
                  {profileSaved ? (
                    <><Check className="h-4 w-4 mr-2" />Salvo com sucesso</>
                  ) : savingProfile ? (
                    <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  ) : (
                    <><Save className="h-4 w-4 mr-2" />Salvar Alteracoes</>
                  )}
                </Button>
              </div>
            </div>

            {/* Agenda semanal */}
            <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
              <div className="px-5 py-4 border-b border-border/40 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <CalendarCheck className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Minha Agenda</p>
                  <p className="text-[11px] text-muted-foreground">Definida pelo administrador</p>
                </div>
              </div>
              <div className="divide-y divide-border/30">
                {currentDiarista?.work_schedule && currentDiarista.work_schedule.length > 0 ? (
                  currentDiarista.work_schedule.map((s, i) => {
                    const WDAY: Record<string, string> = { monday: 'Seg', tuesday: 'Ter', wednesday: 'Qua', thursday: 'Qui', friday: 'Sex', saturday: 'Sab', sunday: 'Dom' }
                    const WDAY_FULL: Record<string, string> = { monday: 'Segunda', tuesday: 'Terca', wednesday: 'Quarta', thursday: 'Quinta', friday: 'Sexta', saturday: 'Sabado', sunday: 'Domingo' }
                    const clientForSchedule = getClientName(s.client_id)
                    const isHeavy = s.type === 'heavy_cleaning'
                    return (
                      <div key={i} className="px-5 py-3.5 flex items-center gap-3">
                        <div className={cn(
                          'w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold shrink-0',
                          isHeavy ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
                        )}>
                          {WDAY[s.day]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{WDAY_FULL[s.day] || s.day}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={cn('text-[10px] font-semibold uppercase tracking-wider', isHeavy ? 'text-destructive' : 'text-primary')}>
                              {isHeavy ? 'Pesada' : 'Leve'}
                            </span>
                            {clientForSchedule && (
                              <>
                                <span className="text-muted-foreground/30">{'|'}</span>
                                <span className="text-[11px] text-muted-foreground flex items-center gap-1 truncate">
                                  <Building2 className="h-3 w-3 shrink-0 text-primary/60" />{clientForSchedule}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">Nenhuma agenda definida</p>
                )}
              </div>
            </div>

            {/* Valores -- visual limpo */}
            <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
              <div className="px-5 py-4 border-b border-border/40 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Tabela de Valores</p>
                  <p className="text-[11px] text-muted-foreground">Definidos pelo administrador</p>
                </div>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Limpeza Pesada', value: currentDiarista?.heavy_cleaning_value ?? 250, color: 'text-destructive' },
                    { label: 'Limpeza Leve', value: currentDiarista?.light_cleaning_value ?? 150, color: 'text-primary' },
                    { label: 'Lavagem', value: currentDiarista?.washing_value ?? 75, color: 'text-primary' },
                    { label: 'Passar Roupa', value: currentDiarista?.ironing_value ?? 50, color: 'text-primary' },
                  ].map((item, i) => (
                    <div key={i} className="rounded-xl bg-muted/50 p-3.5 text-center border border-border/30">
                      <p className={cn('text-lg font-bold', item.color)}>
                        {'R$ '}{item.value.toFixed(2)}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-1">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Logout button */}
            <button
              onClick={() => { logout(); router.push('/login') }}
              className="w-full py-3.5 rounded-2xl border border-destructive/20 text-destructive text-sm font-medium hover:bg-destructive/5 transition-colors flex items-center justify-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sair da conta
            </button>
          </div>
        )}

      </div>

      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-card border-t border-border" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex items-stretch h-16 overflow-x-auto scrollbar-hide">
          {([
            { key: 'resumo',      label: 'Inicio',      Icon: LayoutDashboard },
            { key: 'presenca',    label: 'Presenca',    Icon: CalendarCheck },
            { key: 'lavanderia',  label: 'Lavanderia',  Icon: WashingMachine },
            { key: 'transporte',  label: 'Transporte',  Icon: Bus },
            { key: 'anotacoes',   label: warnings.length > 0 ? `Notas·${warnings.length}` : 'Notas', Icon: FileText },
            { key: 'contrato',    label: 'Contrato',    Icon: ScrollText },
            { key: 'perfil',      label: 'Perfil',      Icon: User },
          ] as { key: typeof activeTab; label: string; Icon: React.ElementType }[]).map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => handleTabChange(key)}
              className={`flex-1 min-w-[52px] flex flex-col items-center justify-center gap-0.5 transition-colors ${
                activeTab === key
                  ? 'text-primary'
                  : 'text-muted-foreground'
              }`}
            >
              <Icon className={`h-5 w-5 ${activeTab === key ? 'text-primary' : ''}`} strokeWidth={activeTab === key ? 2.5 : 1.5} />
              <span className="text-[10px] font-medium leading-none">{label}</span>
              {activeTab === key && (
                <span className="absolute bottom-0 w-8 h-0.5 bg-primary rounded-t-full" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
