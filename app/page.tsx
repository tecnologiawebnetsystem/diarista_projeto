'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'

export default function Home() {
  const router = useRouter()
  const { role, isLoading } = useAuth()

  useEffect(() => {
    if (isLoading) return
    if (role === 'admin') {
      router.replace('/admin')
    } else if (role === 'diarista') {
      router.replace('/diarista')
    } else {
      router.replace('/login')
    }
  }, [isLoading, role, router])

  return (
    <div className="min-h-dvh bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </div>
    </div>
  )
}
