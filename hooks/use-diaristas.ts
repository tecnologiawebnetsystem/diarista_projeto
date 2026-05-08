'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Diarista } from '@/types/database'

export function useDiaristas() {
  const [diaristas, setDiaristas] = useState<Diarista[]>([])
  const [loading, setLoading] = useState(true)

  const fetchDiaristas = useCallback(async () => {
    try {
      const res = await fetch('/api/db/diaristas')
      if (!res.ok) throw new Error('Erro ao buscar diaristas')
      const data: Diarista[] = await res.json()
      setDiaristas(data)
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
      const res = await fetch('/api/db/diaristas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, pin, phone: phone || null, active: true, ...extras }),
      })
      if (!res.ok) throw new Error('Erro ao criar diarista')
      const newDiarista: Diarista = await res.json()
      setDiaristas(prev => [...prev, newDiarista])
      return newDiarista
    } catch (error) {
      console.error('Error adding diarista:', error)
      throw error
    }
  }

  async function updateDiarista(id: string, updates: Record<string, unknown>) {
    try {
      const res = await fetch(`/api/db/diaristas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!res.ok) throw new Error('Erro ao atualizar diarista')
      const updated: Diarista = await res.json()
      setDiaristas(prev => prev.map(d => d.id === id ? updated : d))
      return updated
    } catch (error) {
      console.error('Error updating diarista:', error)
      throw error
    }
  }

  async function deleteDiarista(id: string) {
    try {
      const res = await fetch(`/api/db/diaristas/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erro ao desativar diarista')
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
