'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { User, ShieldCheck, ChevronRight, Lock, Delete, ArrowLeft, Users } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'
import type { Diarista } from '@/types/database'

const ADMIN_PIN_LENGTH = 6

export default function LoginPage() {
  const router = useRouter()
  const { loginAsDiarista, loginAsAdmin } = useAuth()
  const [screen, setScreen] = useState<'home' | 'admin-pin' | 'diarista-select'>('home')
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)
  const [shake, setShake] = useState(false)
  const [diaristas, setDiaristas] = useState<Diarista[]>([])
  const [loadingDiaristas, setLoadingDiaristas] = useState(false)

  useEffect(() => {
    loadDiaristas()
  }, [])

  async function loadDiaristas() {
    setLoadingDiaristas(true)
    try {
      const { data, error } = await supabase
        .from('diaristas')
        .select('*')
        .eq('active', true)
        .order('name')
      if (!error && data) {
        setDiaristas(data as unknown as Diarista[])
      }
    } catch (e) {
      console.error('Error loading diaristas:', e)
    } finally {
      setLoadingDiaristas(false)
    }
  }

  const handleDiaristaClick = async () => {
    // Se ainda esta carregando, espera terminar
    if (loadingDiaristas) return

    // Se nao carregou nenhuma diarista, tenta recarregar
    if (diaristas.length === 0) {
      setLoadingDiaristas(true)
      try {
        const { data } = await supabase
          .from('diaristas')
          .select('*')
          .eq('active', true)
          .order('name')
        if (data && data.length > 0) {
          const loaded = data as unknown as Diarista[]
          setDiaristas(loaded)
          if (loaded.length === 1) {
            // Apenas 1 diarista - entra direto
            loginAsDiarista(loaded[0])
            router.push('/diarista')
          } else {
            setScreen('diarista-select')
          }
        }
      } catch {
        // Erro ao carregar
      } finally {
        setLoadingDiaristas(false)
      }
      return
    }

    if (diaristas.length === 1) {
      // Apenas 1 diarista - entra direto
      loginAsDiarista(diaristas[0])
      router.push('/diarista')
    } else {
      setScreen('diarista-select')
    }
  }

  const handleSelectDiarista = (d: Diarista) => {
    // Seleciona e entra direto sem PIN
    loginAsDiarista(d)
    router.push('/diarista')
  }

  const triggerShake = () => {
    setShake(true)
    setTimeout(() => setShake(false), 500)
  }

  const handleAdminKey = async (key: string) => {
    if (loading) return
    setError(false)
    if (key === 'del') { setPin(p => p.slice(0, -1)); return }
    const next = pin + key
    setPin(next)
    if (next.length === ADMIN_PIN_LENGTH) {
      setLoading(true)
      const success = await loginAsAdmin(next)
      if (success) {
        router.push('/admin')
      } else {
        setError(true)
        triggerShake()
        setPin('')
        setLoading(false)
      }
    }
  }

  const numKeys = ['1','2','3','4','5','6','7','8','9','','0','del']

  /* ── PIN Screen (reusavel) ── */
  function PinScreen({ title, subtitle, pinLength, onKey, onBack, isAdmin }: {
    title: string
    subtitle: string
    pinLength: number
    onKey: (key: string) => void
    onBack: () => void
    isAdmin?: boolean
  }) {
    return (
      <div className="min-h-dvh bg-background flex flex-col select-none relative overflow-hidden">
        {/* Background decorativo */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Gradiente de topo */}
          <div className="absolute top-0 left-0 right-0 h-[40%] bg-gradient-to-b from-primary/5 to-transparent" />
          {/* Círculos decorativos */}
          <div className="absolute top-[-80px] right-[-80px] w-[250px] h-[250px] rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute bottom-[20%] left-[-60px] w-[180px] h-[180px] rounded-full bg-primary/3 blur-2xl" />
          {/* Padrão de grid sutil */}
          <div className="absolute inset-0 opacity-[0.02]" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
            backgroundSize: '24px 24px'
          }} />
        </div>

        {/* Back */}
        <div className="relative flex items-center px-4 pt-4 safe-area-inset-top z-10">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-card/80 backdrop-blur-sm border border-border flex items-center justify-center active:scale-90 transition-transform"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
        </div>

        <div className="relative flex-1 flex flex-col items-center justify-center gap-6 px-6 z-10">
          {/* Header visual aprimorado */}
          <div className="flex flex-col items-center gap-4">
            {/* Logo com efeito glow */}
            <div className="relative">
              <div className="absolute inset-0 rounded-[22px] bg-primary/25 blur-xl scale-150" />
              <Image
                src="/logo.jpg"
                alt="LIMPP DAY"
                width={72}
                height={72}
                priority
                className="relative rounded-[22px] shadow-2xl shadow-black/50 border border-primary/20"
              />
              {/* Badge de admin */}
              {isAdmin && (
                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg bg-primary flex items-center justify-center shadow-lg">
                  <ShieldCheck className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
            </div>

            {/* Titulo e subtitulo */}
            <div className="flex flex-col items-center gap-1.5 text-center">
              <h1 className="text-xl font-bold text-foreground text-balance">{title}</h1>
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            </div>
          </div>

          {/* Card do PIN */}
          <div className="w-full max-w-[300px]">
            <div className="rounded-2xl bg-card/60 backdrop-blur-sm border border-border p-5">
              {/* PIN dots */}
              <div className={`flex justify-center gap-4 ${shake ? 'animate-shake' : ''}`}>
                {Array.from({ length: pinLength }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-4 h-4 rounded-full transition-all duration-200 ${
                      i < pin.length
                        ? error 
                          ? 'bg-destructive scale-110 shadow-lg shadow-destructive/30' 
                          : 'bg-primary scale-110 shadow-lg shadow-primary/30'
                        : 'bg-muted border border-border'
                    }`}
                  />
                ))}
              </div>

              {/* Status */}
              <div className="h-6 flex items-center justify-center mt-3">
                {error && <p className="text-destructive text-sm font-medium">PIN incorreto. Tente novamente.</p>}
                {loading && (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    <p className="text-muted-foreground text-sm">Verificando...</p>
                  </div>
                )}
                {!error && !loading && (
                  <div className="flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-muted-foreground/50" />
                    <p className="text-muted-foreground/50 text-xs">Acesso protegido</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Keypad aprimorado */}
        <div className="relative px-8 pb-10 pt-4 z-10">
          <div className="grid grid-cols-3 gap-3 max-w-[280px] mx-auto">
            {numKeys.map((key, i) => {
              if (key === '') return <div key={i} />
              if (key === 'del') {
                return (
                  <button
                    key={i}
                    onClick={() => onKey('del')}
                    disabled={loading || pin.length === 0}
                    className="h-[60px] rounded-2xl bg-card/70 backdrop-blur-sm border border-border flex items-center justify-center active:scale-90 transition-all disabled:opacity-20 hover:bg-card"
                  >
                    <Delete className="h-5 w-5 text-foreground" />
                  </button>
                )
              }
              return (
                <button
                  key={i}
                  onClick={() => onKey(key)}
                  disabled={loading}
                  className="h-[60px] rounded-2xl bg-card/70 backdrop-blur-sm border border-border flex items-center justify-center active:scale-90 active:bg-primary/20 active:border-primary/50 transition-all hover:bg-card"
                >
                  <span className="text-xl font-semibold text-foreground">{key}</span>
                </button>
              )
            })}
          </div>
          
          {/* Dica visual */}
          <p className="text-center text-[10px] text-muted-foreground/40 mt-6 font-medium tracking-wider uppercase">
            LIMPP DAY Admin
          </p>
        </div>
      </div>
    )
  }

  /* ── Admin PIN ── */
  if (screen === 'admin-pin') {
    return (
      <PinScreen
        title="Acesso Administrador"
        subtitle={`Digite o PIN de ${ADMIN_PIN_LENGTH} digitos`}
        pinLength={ADMIN_PIN_LENGTH}
        onKey={handleAdminKey}
        onBack={() => { setScreen('home'); setPin(''); setError(false) }}
        isAdmin={true}
      />
    )
  }

  /* ── Selecionar Diarista ── */
  if (screen === 'diarista-select') {
    return (
      <div className="min-h-dvh bg-background flex flex-col select-none">
        <div className="flex items-center px-4 pt-4 safe-area-inset-top">
          <button
            onClick={() => setScreen('home')}
            className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center active:scale-90 transition-transform"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
        </div>

        <div className="flex-1 px-6 pt-8 pb-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/30 mx-auto mb-4">
              <Users className="h-7 w-7 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold text-foreground">Quem esta entrando?</h1>
            <p className="text-sm text-muted-foreground mt-1.5">Selecione seu perfil</p>
          </div>

          <div className="space-y-3 max-w-sm mx-auto">
            {diaristas.map(d => (
              <button
                key={d.id}
                onClick={() => handleSelectDiarista(d)}
                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-card border border-border active:scale-[0.97] active:border-primary/40 transition-all text-left group"
              >
                {d.photo_url ? (
                  <Image
                    src={d.photo_url}
                    alt={d.name}
                    width={44}
                    height={44}
                    className="w-11 h-11 rounded-full object-cover border border-primary/20 shrink-0"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full gradient-primary flex items-center justify-center shrink-0">
                    <span className="text-lg font-bold text-primary-foreground">{d.name.charAt(0).toUpperCase()}</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground">{d.name}</p>
                  {d.phone && <p className="text-xs text-muted-foreground mt-0.5">{d.phone}</p>}
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground/40 shrink-0 group-active:translate-x-0.5 transition-transform" />
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  /* ══════════════════════════════════════════════════
     ══  TELA PRINCIPAL — HOME
     ══════════════════════════════════════════════════ */
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center select-none px-5 relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-[-150px] left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full opacity-[0.03] pointer-events-none" style={{ background: 'radial-gradient(circle, hsl(25 95% 48%), transparent 70%)' }} />
      <div className="absolute bottom-[-100px] right-[-100px] w-[300px] h-[300px] rounded-full opacity-[0.02] pointer-events-none" style={{ background: 'radial-gradient(circle, hsl(25 95% 48%), transparent 70%)' }} />

      <div className="w-full max-w-[360px] relative z-10">
        {/* Logo + Branding */}
        <div className="flex flex-col items-center mb-10">
          <div className="relative">
            <div className="absolute inset-0 rounded-[22px] bg-primary/20 blur-xl scale-125" />
            <Image
              src="/logo.jpg"
              alt="LIMPP DAY"
              width={80}
              height={80}
              priority
              className="relative rounded-[22px] shadow-2xl shadow-black/60 border border-border/50"
            />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground mt-6">LIMPP DAY</h1>
          <p className="text-[11px] text-muted-foreground tracking-[0.3em] uppercase font-medium mt-1.5">
            {'Gestao de Servicos'}
          </p>
        </div>

        {/* Widget Card */}
        <div className="rounded-2xl bg-card border border-border overflow-hidden shadow-xl shadow-black/30">
          {/* Diarista */}
          <button
            onClick={handleDiaristaClick}
            className="w-full flex items-center gap-4 px-5 py-[22px] active:bg-muted/50 transition-all text-left group"
          >
            <div className="w-[52px] h-[52px] rounded-[16px] gradient-primary flex items-center justify-center shrink-0 shadow-lg shadow-primary/25 group-active:scale-95 transition-transform">
              <User className="h-6 w-6 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[15px] text-foreground leading-tight">Diarista</p>
              <p className="text-[12px] text-muted-foreground mt-1 leading-snug flex items-center gap-1.5">
                {loadingDiaristas && (
                  <span className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin shrink-0" />
                )}
                {loadingDiaristas
                  ? 'Carregando...'
                  : diaristas.length > 0
                    ? `${diaristas.length} profissiona${diaristas.length > 1 ? 'is' : 'l'} cadastrada${diaristas.length > 1 ? 's' : ''}`
                    : 'Acesso profissional'
                }
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground/30 shrink-0 group-active:translate-x-1 transition-transform" />
          </button>

          {/* Divider */}
          <div className="h-px bg-border mx-5" />

          {/* Administrador */}
          <button
            onClick={() => { setScreen('admin-pin'); setPin(''); setError(false) }}
            className="w-full flex items-center gap-4 px-5 py-[22px] active:bg-muted/50 transition-all text-left group"
          >
            <div className="w-[52px] h-[52px] rounded-[16px] bg-muted border border-border flex items-center justify-center shrink-0 group-active:scale-95 transition-transform">
              <ShieldCheck className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[15px] text-foreground leading-tight">Administrador</p>
              <p className="text-[12px] text-muted-foreground mt-1 leading-snug">Acesso completo ao sistema</p>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <Lock className="h-4 w-4 text-muted-foreground/25" />
              <ChevronRight className="h-5 w-5 text-muted-foreground/30 group-active:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>

        {/* Version */}
        <p className="text-center text-[10px] text-muted-foreground/30 mt-10 font-medium tracking-[0.2em]">
          {'LIMPP DAY v2.0'}
        </p>
      </div>
    </div>
  )
}
