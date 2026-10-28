'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ArrowLeft, Briefcase, ChevronRight, Lock, UserRound, Users } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import type { Diarista } from '@/types/database'

type Screen = 'home' | 'diarista-select'

export default function LoginPage() {
  const router = useRouter()
  const { loginAsDiarista, loginAsAdmin, role } = useAuth()
  const [screen, setScreen] = useState<Screen>('home')
  const [diaristas, setDiaristas] = useState<Diarista[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (role === 'admin') router.replace('/admin')
    if (role === 'diarista') router.replace('/diarista')
  }, [role, router])

  useEffect(() => {
    fetch('/api/db/diaristas?active=1')
      .then((response) => response.ok ? response.json() : [])
      .then((data: Diarista[]) => setDiaristas(data))
      .catch(() => setDiaristas([]))
      .finally(() => setLoading(false))
  }, [])

  const enterAdmin = () => {
    loginAsAdmin()
    router.push('/admin')
  }

  const enterDiarista = () => {
    if (diaristas.length === 1) {
      loginAsDiarista(diaristas[0])
      router.push('/diarista')
      return
    }
    setScreen('diarista-select')
  }

  if (screen === 'diarista-select') {
    return (
      <main className="min-h-dvh bg-background px-6 py-8">
        <button onClick={() => setScreen('home')} className="mb-8 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card" aria-label="Voltar">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="mx-auto max-w-sm">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary">
              <Users className="h-7 w-7 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold text-foreground">Quem está entrando?</h1>
            <p className="mt-1 text-sm text-muted-foreground">Selecione seu perfil</p>
          </div>
          <div className="space-y-3">
            {diaristas.map((diarista) => (
              <button key={diarista.id} onClick={() => { loginAsDiarista(diarista); router.push('/diarista') }} className="flex w-full items-center gap-4 rounded-2xl border border-border bg-card p-4 text-left transition hover:border-primary">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full gradient-primary text-lg font-bold text-primary-foreground">{diarista.name.charAt(0).toUpperCase()}</div>
                <span className="flex-1 font-semibold text-foreground">{diarista.name}</span>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
            ))}
            {diaristas.length === 0 && <p className="rounded-xl border border-border bg-card p-4 text-center text-sm text-muted-foreground">Nenhuma diarista cadastrada.</p>}
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-dvh bg-background px-5 flex items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="mb-10 flex flex-col items-center text-center">
          <Image src="/logo.jpg" alt="LIMPP DAY" width={80} height={80} priority className="rounded-[22px] shadow-xl" />
          <h1 className="mt-6 text-2xl font-extrabold tracking-tight text-foreground">LIMPP DAY</h1>
          <p className="mt-1.5 text-[11px] font-medium uppercase tracking-[0.3em] text-muted-foreground">Gestão de serviços</p>
        </div>
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
          <button onClick={enterDiarista} disabled={loading} className="flex w-full items-center gap-4 px-5 py-6 text-left transition hover:bg-muted disabled:opacity-60">
            <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl gradient-primary"><UserRound className="h-6 w-6 text-primary-foreground" /></div>
            <div className="flex-1"><p className="font-bold text-foreground">Diarista</p><p className="mt-1 text-xs text-muted-foreground">Entrar na área de diarista</p></div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </button>
          <div className="mx-5 h-px bg-border" />
          <button onClick={enterAdmin} className="flex w-full items-center gap-4 px-5 py-6 text-left transition hover:bg-muted">
            <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl border border-border bg-muted"><Briefcase className="h-6 w-6 text-muted-foreground" /></div>
            <div className="flex-1"><p className="font-bold text-foreground">Administrador</p><p className="mt-1 text-xs text-muted-foreground">Entrar na área administrativa</p></div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
      </div>
    </main>
  )
}
