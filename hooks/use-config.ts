'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Config } from '@/types/database'

export function useConfig() {
  const [config, setConfig] = useState<Config[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchConfig()
  }, [])

  async function fetchConfig() {
    try {
      const { data, error } = await supabase
        .from('config')
        .select('*')
        .order('key')

      if (error) throw error
      setConfig(data || [])
    } catch (error) {
      console.error('Error fetching config:', error)
    } finally {
      setLoading(false)
    }
  }

  async function updateConfig(key: string, value: number) {
    try {
      const { data, error } = await supabase
        .from('config')
        .update({ value })
        .eq('key', key)
        .select()
        .single()

      if (error) throw error
      if (data) {
        setConfig(config.map(c => c.key === key ? data : c))
      }
      return data
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
