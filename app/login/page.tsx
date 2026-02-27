'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { User, ShieldCheck, ChevronRight, Lock, Delete, ArrowLeft, Users } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'
import type { Diarista } from '@/types/database'

const ADMIN_PIN_LENGTH = 6
const DIARISTA_PIN_LENGTH = 4

export default function LoginPage() {
  const router = useRouter()
  const { loginAsDiarista, loginAsAdmin } = useAuth()
  const [screen, setScreen] = useState<'home' | 'admin-pin' | 'diarista-select' | 'diarista-pin'>('home')
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

  const handleDiaristaClick = () => {
    if (diaristas.length === 1) {
      // Uma unica diarista — login direto
      loginAsDiarista(diaristas[0])
      router.push('/diarista')
    } else if (diaristas.length > 1) {
      setScreen('diarista-select')
    } else {
      // Sem diaristas cadastradas — entra no modo PIN antigo
      setScreen('diarista-pin')
      setPin('')
      setError(false)
    }
  }

  const handleSelectDiarista = (d: Diarista) => {
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

    if (key === 'del') {
      setPin(p => p.slice(0, -1))
      return
    }

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

  const handleDiaristaKey = async (key: string) => {
    if (loading) return
    setError(false)

    if (key === 'del') {
      setPin(p => p.slice(0, -1))
      return
    }

    const next = pin + key
    setPin(next)

    if (next.length === DIARISTA_PIN_LENGTH) {
      setLoading(true)
      const found = diaristas.find(d => d.pin === next && d.active)
      if (found) {
        loginAsDiarista(found)
        router.push('/diarista')
      } else {
        setError(true)
        triggerShake()
        setPin('')
        setLoading(false)
      }
    }
  }

  const keys = ['1','2','3','4','5','6','7','8','9','','0','del']

  /* ── Tela PIN (reutilizavel para admin e diarista) ── */
  function PinScreen({ title, subtitle, pinLength, onKey, onBack }: {
    title: string
    subtitle: string
    pinLength: number
    onKey: (key: string) => void
    onBack: () => void
  }) {
    return (
      <div className="min-h-dvh bg-background flex flex-col select-none">
        <div className="flex items-center px-4 pt-4">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-muted flex items-center justify-center active:scale-90 transition-transform"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
            <ShieldCheck className="h-7 w-7 text-primary-foreground" />
          </div>
          <div className="flex flex-col items-center gap-1 text-center">
            <h1 className="text-2xl font-bold text-foreground">{title}</h1>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>

          <div className={`flex gap-5 ${shake ? 'animate-shake' : ''}`}>
            {Array.from({ length: pinLength }).map((_, i) => (
              <div
                key={i}
                className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                  i < pin.length
                    ? error ? 'bg-destructive' : 'bg-primary'
                    : 'bg-muted-foreground/30 border border-border'
                }`}
              />
            ))}
          </div>

          <div className="h-5 flex items-center">
            {error && <p className="text-destructive text-sm font-medium">PIN incorreto. Tente novamente.</p>}
            {loading && <p className="text-muted-foreground text-sm">Verificando...</p>}
          </div>
        </div>

        <div className="px-8 pb-10 pt-2">
          <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
            {keys.map((key, i) => {
              if (key === '') return <div key={i} />
              if (key === 'del') {
                return (
                  <button
                    key={i}
                    onClick={() => onKey('del')}
                    disabled={loading || pin.length === 0}
                    className="h-16 rounded-2xl bg-muted flex items-center justify-center active:scale-90 transition-transform disabled:opacity-30"
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
                  className="h-16 rounded-2xl bg-card border border-border flex items-center justify-center active:scale-90 active:bg-muted transition-all"
                >
                  <span className="text-xl font-medium text-foreground">{key}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  /* ── Tela Admin PIN ── */
  if (screen === 'admin-pin') {
    return (
      <PinScreen
        title="PIN do Administrador"
        subtitle={`Digite seu PIN de ${ADMIN_PIN_LENGTH} digitos`}
        pinLength={ADMIN_PIN_LENGTH}
        onKey={handleAdminKey}
        onBack={() => { setScreen('home'); setPin(''); setError(false) }}
      />
    )
  }

  /* ── Tela Diarista PIN ── */
  if (screen === 'diarista-pin') {
    return (
      <PinScreen
        title="PIN da Diarista"
        subtitle={`Digite seu PIN de ${DIARISTA_PIN_LENGTH} digitos`}
        pinLength={DIARISTA_PIN_LENGTH}
        onKey={handleDiaristaKey}
        onBack={() => { setScreen('home'); setPin(''); setError(false) }}
      />
    )
  }

  /* ── Tela Selecionar Diarista ── */
  if (screen === 'diarista-select') {
    return (
      <div className="min-h-dvh bg-background flex flex-col select-none">
        <div className="flex items-center px-4 pt-4">
          <button
            onClick={() => setScreen('home')}
            className="w-10 h-10 rounded-full bg-muted flex items-center justify-center active:scale-90 transition-transform"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
        </div>

        <div className="flex-1 px-6 pt-8 pb-8">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg mx-auto mb-4">
              <Users className="h-7 w-7 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Selecione seu perfil</h1>
            <p className="text-sm text-muted-foreground mt-1">Escolha seu nome para entrar</p>
          </div>

          <div className="space-y-3 max-w-sm mx-auto">
            {diaristas.map(d => (
              <button
                key={d.id}
                onClick={() => handleSelectDiarista(d)}
                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-card border border-border active:scale-[0.97] transition-all text-left"
              >
                <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-lg font-bold text-primary">{d.name.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground">{d.name}</p>
                  {d.phone && <p className="text-xs text-muted-foreground">{d.phone}</p>}
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  /* ── Tela inicial ── */
  return (
    <div className="min-h-dvh bg-background flex flex-col select-none">
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-16 pb-8 gap-8">
        <div className="flex flex-col items-center gap-3">
          <Image
            src="/logo.jpg"
            alt="LIMPP DAY"
            width={88}
            height={88}
            priority
            className="rounded-[22px] shadow-2xl ring-2 ring-primary/20"
          />
          <div className="flex flex-col items-center gap-1 text-center">
            <h1 className="text-3xl font-extrabold tracking-tight text-primary">LIMPP DAY</h1>
            <p className="text-xs text-muted-foreground tracking-widest uppercase">{'Gestao de Servicos'}</p>
          </div>
        </div>

        <div className="w-full max-w-sm space-y-3">
          <button
            onClick={handleDiaristaClick}
            disabled={loadingDiaristas}
            className="w-full flex items-center gap-4 p-5 rounded-2xl bg-card border border-border active:scale-[0.97] transition-all text-left shadow-sm disabled:opacity-50"
          >
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shrink-0">
              <User className="h-6 w-6 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-base text-foreground">Diarista</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                {diaristas.length > 1 ? `${diaristas.length} profissionais cadastradas` : 'Consultar ganhos e pagamentos'}
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
          </button>

          <button
            onClick={() => { setScreen('admin-pin'); setPin(''); setError(false) }}
            className="w-full flex items-center gap-4 p-5 rounded-2xl bg-card border border-border active:scale-[0.97] transition-all text-left shadow-sm"
          >
            <div className="w-12 h-12 rounded-xl bg-foreground flex items-center justify-center shrink-0">
              <ShieldCheck className="h-6 w-6 text-background" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-base text-foreground">Administrador</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">Acesso completo ao sistema</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Lock className="h-3.5 w-3.5 text-muted-foreground" />
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </button>
        </div>
      </div>

      <p className="text-center text-[11px] text-muted-foreground pb-8 tracking-wide">
        {'LIMPP DAY v2.0 — Acesso restrito'}
      </p>
    </div>
  )
}
