'use client'

import { useState } from 'react'
import { Bell, BellOff, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useNotifications } from '@/hooks/use-notifications'

export function NotificationBanner() {
  const { permission, supported, requestPermission } = useNotifications()
  const [dismissed, setDismissed] = useState(false)
  const [loading, setLoading] = useState(false)

  // Nao mostrar se ja concedeu, nao suportado, ou dispensou
  if (!supported || permission === 'granted' || permission === 'denied' || dismissed) {
    return null
  }

  const handleEnable = async () => {
    setLoading(true)
    await requestPermission()
    setLoading(false)
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-primary/10 border border-primary/20 rounded-xl">
      <Bell className="h-5 w-5 text-primary shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground">Ativar notificacoes</p>
        <p className="text-[10px] text-muted-foreground">Receba avisos de pagamentos e advertencias</p>
      </div>
      <Button
        size="sm"
        onClick={handleEnable}
        disabled={loading}
        className="h-8 px-3 text-xs shrink-0"
      >
        {loading ? 'Ativando...' : 'Ativar'}
      </Button>
      <button onClick={() => setDismissed(true)} className="p-1 text-muted-foreground">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
