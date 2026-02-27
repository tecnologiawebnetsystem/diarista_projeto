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
  const [selectedDiarista, setSelectedDiarista] = useState<Diarista | null>(null)
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
      // Uma unica diarista — vai direto para PIN
      setSelectedDiarista(diaristas[0])
      setScreen('diarista-pin')
      setPin('')
      setError(false)
    } else if (diaristas.length > 1) {
      setScreen('diarista-select')
    } else {
      // Sem diaristas cadastradas — entra no modo PIN
      setScreen('diarista-pin')
      setPin('')
      setError(false)
    }
  }

  const handleSelectDiarista = (d: Diarista) => {
    setSelectedDiarista(d)
    setScreen('diarista-pin')
    setPin('')
    setError(false)
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

      if (selectedDiarista) {
        // Valida o PIN da diarista selecionada
        if (selectedDiarista.pin === next) {
          loginAsDiarista(selectedDiarista)
          router.push('/diarista')
        } else {
          setError(true)
          triggerShake()
          setPin('')
          setLoading(false)
        }
      } else {
        // Fallback: busca qualquer diarista com esse PIN
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
        title={selectedDiarista ? selectedDiarista.name : 'PIN da Diarista'}
        subtitle={`Digite seu PIN de ${DIARISTA_PIN_LENGTH} digitos`}
        pinLength={DIARISTA_PIN_LENGTH}
        onKey={handleDiaristaKey}
        onBack={() => {
          if (selectedDiarista && diaristas.length > 1) {
            setScreen('diarista-select')
          } else {
            setScreen('home')
          }
          setPin('')
          setError(false)
          setSelectedDiarista(null)
        }}
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
    <div className="min-h-dvh flex flex-col items-center justify-center select-none px-5 relative overflow-hidden">
      {/* Background accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/[0.04] rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-[340px] relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <Image
            src="/logo.jpg"
            alt="LIMPP DAY"
            width={72}
            height={72}
            priority
            className="rounded-2xl shadow-lg shadow-black/40"
          />
          <h1 className="text-[22px] font-extrabold tracking-tight text-foreground mt-5">LIMPP DAY</h1>
          <p className="text-[10px] text-muted-foreground tracking-[0.25em] uppercase font-semibold mt-1">{'Gestao de Servicos'}</p>
        </div>

        {/* Widget card */}
        <div className="rounded-2xl bg-card/80 backdrop-blur-sm border border-border overflow-hidden">
          {/* Diarista */}
          <button
            onClick={handleDiaristaClick}
            disabled={loadingDiaristas}
            className="w-full flex items-center gap-4 px-5 py-5 active:bg-muted/60 transition-colors text-left disabled:opacity-50 group"
          >
            <div className="w-12 h-12 rounded-[14px] gradient-primary flex items-center justify-center shrink-0 shadow-md shadow-primary/20 group-active:scale-95 transition-transform">
              <User className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[15px] text-foreground leading-tight">Diarista</p>
              <p className="text-[12px] text-muted-foreground mt-1 leading-snug">
                {diaristas.length > 1 ? `${diaristas.length} profissionais cadastradas` : 'Consultar ganhos e pagamentos'}
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground/40 shrink-0 group-active:translate-x-0.5 transition-transform" />
          </button>

          {/* Divider */}
          <div className="h-px bg-border mx-5" />

          {/* Admin */}
          <button
            onClick={() => { setScreen('admin-pin'); setPin(''); setError(false) }}
            className="w-full flex items-center gap-4 px-5 py-5 active:bg-muted/60 transition-colors text-left group"
          >
            <div className="w-12 h-12 rounded-[14px] bg-muted border border-border flex items-center justify-center shrink-0 group-active:scale-95 transition-transform">
              <ShieldCheck className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[15px] text-foreground leading-tight">Administrador</p>
              <p className="text-[12px] text-muted-foreground mt-1 leading-snug">Acesso completo ao sistema</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Lock className="h-3.5 w-3.5 text-muted-foreground/30" />
              <ChevronRight className="h-5 w-5 text-muted-foreground/40 group-active:translate-x-0.5 transition-transform" />
            </div>
          </button>
        </div>

        {/* Version */}
        <p className="text-center text-[10px] text-muted-foreground/40 mt-8 font-medium tracking-wider">
          {'LIMPP DAY v2.0'}
        </p>
      </div>
    </div>
  )
}
