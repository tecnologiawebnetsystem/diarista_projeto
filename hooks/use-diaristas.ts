'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Diarista } from '@/types/database'

export function useDiaristas() {
  const [diaristas, setDiaristas] = useState<Diarista[]>([])
  const [loading, setLoading] = useState(true)

  const fetchDiaristas = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('diaristas')
        .select('*')
        .order('name')

      if (error) throw error
      setDiaristas((data as unknown as Diarista[]) || [])
    } catch (error) {
      console.error('Error fetching diaristas:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDiaristas()
  }, [fetchDiaristas])

  async function addDiarista(name: string, pin: string, phone?: string, extras?: Record<string, unknown>) {
    try {
      const insertData = {
        name,
        pin,
        phone: phone || null,
        active: true,
        ...extras,
      }
      const { data, error } = await supabase
        .from('diaristas')
        .insert([insertData])
        .select()
        .single()

      if (error) throw error
      const newDiarista = data as unknown as Diarista
      setDiaristas(prev => [...prev, newDiarista])
      return newDiarista
    } catch (error) {
      console.error('Error adding diarista:', error)
      throw error
    }
  }

  async function updateDiarista(id: string, updates: Record<string, unknown>) {
    try {
      const { data, error } = await supabase
        .from('diaristas')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      const updated = data as unknown as Diarista
      setDiaristas(prev => prev.map(d => d.id === id ? updated : d))
      return updated
    } catch (error) {
      console.error('Error updating diarista:', error)
      throw error
    }
  }

  async function deleteDiarista(id: string) {
    try {
      const { error } = await supabase
        .from('diaristas')
        .update({ active: false })
        .eq('id', id)

      if (error) throw error
      setDiaristas(prev => prev.map(d => d.id === id ? { ...d, active: false } : d))
    } catch (error) {
      console.error('Error deleting diarista:', error)
      throw error
    }
  }

  async function findByPin(pin: string): Promise<Diarista | null> {
    const found = diaristas.find(d => d.pin === pin && d.active)
    return found || null
  }

  const activeDiaristas = diaristas.filter(d => d.active)

  return {
    diaristas,
    activeDiaristas,
    loading,
    addDiarista,
    updateDiarista,
    deleteDiarista,
    findByPin,
    refetch: fetchDiaristas,
  }
}
