'use client'

import { useState, useEffect } from 'react'
import type { Config } from '@/types/database'

export function useConfig() {
  const [config, setConfig] = useState<Config[]>([])
  const [loading, setLoading] = useState(true)

  async function fetchConfig() {
    try {
      const res = await fetch('/api/db/config')
      if (!res.ok) throw new Error('Erro ao buscar configuracoes')
      const data: Config[] = await res.json()
      setConfig(data)
    } catch (error) {
      console.error('Error fetching config:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchConfig()
  }, [])

  async function updateConfig(key: string, value: number) {
    try {
      const res = await fetch('/api/db/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value }),
      })
      if (!res.ok) throw new Error('Erro ao atualizar configuracao')
      const updated: Config[] = await res.json()
      setConfig(updated)
      return updated.find(c => c.key === key) ?? null
    } catch (error) {
      console.error('Error updating config:', error)
      throw error
    }
  }

  function getConfigValue(key: string): number {
    const item = config.find(c => c.key === key)
    return item?.value || 0
  }

  return { config, loading, updateConfig, getConfigValue, refetch: fetchConfig }
}
