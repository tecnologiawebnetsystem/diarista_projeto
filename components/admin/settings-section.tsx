'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { Settings, Shield, DollarSign, Save, Check, Eye, EyeOff, RotateCcw } from 'lucide-react'

interface ConfigRow {
  id: string
  key: string
  value: number
  label: string
  description: string | null
}

export function SettingsSection() {
  const supabase = createClient()
  const [configs, setConfigs] = useState<ConfigRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  // Admin PIN
  const [adminPin, setAdminPin] = useState('')
  const [showAdminPin, setShowAdminPin] = useState(false)
  const [savingPin, setSavingPin] = useState(false)
  const [pinSaved, setPinSaved] = useState(false)

  // Local edits
  const [editValues, setEditValues] = useState<Record<string, string>>({})

  const fetchConfigs = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('config').select('*').order('key')
    const rows = (data as unknown as ConfigRow[]) || []
    setConfigs(rows)
    const vals: Record<string, string> = {}
    for (const r of rows) vals[r.key] = String(r.value)

    // Find admin pin config
    const pinConfig = rows.find(r => r.key === 'admin_pin')
    if (pinConfig) setAdminPin(String(pinConfig.value))

    setEditValues(vals)
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchConfigs() }, [fetchConfigs])

  const handleSaveConfigs = async () => {
    setSaving(true)
    setError('')
    try {
      for (const cfg of configs) {
        if (cfg.key === 'admin_pin') continue
        const newVal = parseFloat(editValues[cfg.key] || '0')
        if (newVal !== cfg.value) {
          await supabase.from('config').update({ value: newVal }).eq('id', cfg.id)
        }
      }
      await fetchConfigs()
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      setError('Erro ao salvar configuracoes')
    }
    setSaving(false)
  }

  const handleSavePin = async () => {
    if (!adminPin.trim() || adminPin.length < 4) {
      setError('PIN deve ter pelo menos 4 digitos')
      return
    }
    setSavingPin(true)
    setError('')
    try {
      const pinConfig = configs.find(r => r.key === 'admin_pin')
      if (pinConfig) {
        await supabase.from('config').update({ value: parseInt(adminPin) }).eq('id', pinConfig.id)
      } else {
        await supabase.from('config').insert({ key: 'admin_pin', value: parseInt(adminPin), label: 'PIN Administrador', description: 'PIN de acesso ao painel admin' })
      }
      setPinSaved(true)
      setTimeout(() => setPinSaved(false), 2000)
      await fetchConfigs()
    } catch {
      setError('Erro ao salvar PIN')
    }
    setSavingPin(false)
  }

  const valueConfigs = configs.filter(c => c.key !== 'admin_pin')

  const configGroups = [
    { title: 'Valores de Limpeza', keys: ['default_heavy_cleaning_value', 'default_light_cleaning_value'], icon: DollarSign },
    { title: 'Valores de Lavanderia', keys: ['default_washing_value', 'default_ironing_value'], icon: DollarSign },
    { title: 'Transporte', keys: ['default_transport_value'], icon: DollarSign },
  ]

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* PIN Admin */}
      <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border/40 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Shield className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold">PIN do Administrador</p>
            <p className="text-[11px] text-muted-foreground">Altere o PIN de acesso ao painel</p>
          </div>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div className="relative">
            <Label className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium mb-2 block">PIN atual</Label>
            <div className="relative">
              <Input
                type={showAdminPin ? 'text' : 'password'}
                value={adminPin}
                onChange={e => setAdminPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Digite o PIN"
                className="h-11 bg-muted/50 border-transparent focus:border-primary/50 pr-10 font-mono text-lg tracking-widest"
                maxLength={6}
              />
              <button
                type="button"
                onClick={() => setShowAdminPin(!showAdminPin)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showAdminPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <Button
            onClick={handleSavePin}
            disabled={savingPin || adminPin.length < 4}
            className={cn('w-full h-10 rounded-xl text-sm font-medium transition-all', pinSaved && 'bg-green-600 hover:bg-green-600')}
          >
            {pinSaved ? <><Check className="h-4 w-4 mr-2" />PIN Salvo</> : savingPin ? <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> : <><Save className="h-4 w-4 mr-2" />Salvar PIN</>}
          </Button>
        </div>
      </div>

      {/* Valores Padrao */}
      <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border/40 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <DollarSign className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold">Valores Padrao</p>
            <p className="text-[11px] text-muted-foreground">Usados ao cadastrar novas diaristas</p>
          </div>
        </div>
        <div className="px-5 py-4 space-y-4">
          {valueConfigs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma configuracao encontrada</p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                {valueConfigs.map(cfg => (
                  <div key={cfg.key}>
                    <Label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-1.5 block truncate">{cfg.label}</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">R$</span>
                      <Input
                        type="number"
                        value={editValues[cfg.key] || ''}
                        onChange={e => setEditValues({ ...editValues, [cfg.key]: e.target.value })}
                        className="h-10 bg-muted/50 border-transparent focus:border-primary/50 pl-9 text-sm font-medium"
                        step="0.01"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {error && <p className="text-xs text-destructive font-medium">{error}</p>}

              <Button
                onClick={handleSaveConfigs}
                disabled={saving}
                className={cn('w-full h-10 rounded-xl text-sm font-medium transition-all', saved && 'bg-green-600 hover:bg-green-600')}
              >
                {saved ? <><Check className="h-4 w-4 mr-2" />Salvo</> : saving ? <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> : <><Save className="h-4 w-4 mr-2" />Salvar Valores</>}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Info */}
      <Card className="border-muted">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Settings className="h-4 w-4" />
            <p className="text-xs">LIMPP DAY v2.0</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
