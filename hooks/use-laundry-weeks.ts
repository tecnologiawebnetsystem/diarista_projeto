'use client'

import { useState, useEffect, useCallback } from 'react'
import type { LaundryWeek } from '@/types/database'

async function getConfigValues(): Promise<Record<string, number>> {
  const res = await fetch('/api/db/config')
  if (!res.ok) return {}
  const data: Array<{ key: string; value: number }> = await res.json()
  const cfg: Record<string, number> = {}
  data.forEach(item => { cfg[item.key] = item.value })
  return cfg
}

export function useLaundryWeeks(month: number, year: number, diaristaId?: string | null) {
  const [laundryWeeks, setLaundryWeeks] = useState<LaundryWeek[]>([])
  const [loading, setLoading] = useState(true)

  const fetchLaundryWeeks = useCallback(async () => {
    if (!month || !year || isNaN(month) || isNaN(year)) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      const params = new URLSearchParams({ month: String(month), year: String(year) })
      if (diaristaId) params.set('diarista_id', diaristaId)

      const res = await fetch(`/api/db/laundry-weeks?${params}`)
      if (!res.ok) throw new Error('Erro ao buscar semanas')
      const data: LaundryWeek[] = await res.json()
      setLaundryWeeks(data)
    } catch (error) {
      console.error('Error fetching laundry weeks:', error)
      setLaundryWeeks([])
    } finally {
      setLoading(false)
    }
  }, [month, year, diaristaId])

  useEffect(() => {
    fetchLaundryWeeks()
  }, [fetchLaundryWeeks])

  async function toggleLaundryWeek(weekNumber: number) {
    try {
      const existing = laundryWeeks.find(w => w.week_number === weekNumber)
      if (existing) {
        const res = await fetch(`/api/db/laundry-weeks/${existing.id}`, { method: 'DELETE' })
        if (!res.ok) throw new Error('Erro ao remover semana')
        setLaundryWeeks(prev => prev.filter(w => w.id !== existing.id))
      } else {
        const res = await fetch('/api/db/laundry-weeks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ week_number: weekNumber, month, year, value: 0, ironed: false, washed: false, diarista_id: diaristaId }),
        })
        if (!res.ok) throw new Error('Erro ao criar semana')
        const created: LaundryWeek = await res.json()
        setLaundryWeeks(prev => [...prev, created])
      }
    } catch (error) {
      console.error('Error toggling laundry week:', error)
      throw error
    }
  }

  async function updateLaundryService(id: string, ironed: boolean, washed: boolean) {
    try {
      const config = await getConfigValues()
      const ironingValue = config.ironing || 50
      const washingValue = config.washing || 75
      const value = (ironed ? ironingValue : 0) + (washed ? washingValue : 0)

      const res = await fetch(`/api/db/laundry-weeks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ironed, washed, value }),
      })
      if (!res.ok) throw new Error('Erro ao atualizar servico')
      const updated: LaundryWeek = await res.json()
      setLaundryWeeks(prev => prev.map(w => w.id === id ? updated : w))
    } catch (error) {
      console.error('Error updating laundry service:', error)
      throw error
    }
  }

  async function markTransportPaid(id: string, paid: boolean) {
    try {
      const res = await fetch(`/api/db/laundry-weeks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paid_at: paid ? new Date().toISOString() : null }),
      })
      if (!res.ok) throw new Error('Erro ao marcar transporte')
      const updated: LaundryWeek = await res.json()
      setLaundryWeeks(prev => prev.map(w => w.id === id ? updated : w))
    } catch (error) {
      console.error('Error marking transport paid:', error)
      throw error
    }
  }

  async function updateTransportReceipt(id: string, receiptUrl: string | null) {
    try {
      const res = await fetch(`/api/db/laundry-weeks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receipt_url: receiptUrl }),
      })
      if (!res.ok) throw new Error('Erro ao atualizar comprovante')
      const updated: LaundryWeek = await res.json()
      setLaundryWeeks(prev => prev.map(w => w.id === id ? updated : w))
    } catch (error) {
      console.error('Error updating transport receipt:', error)
      throw error
    }
  }

  return { laundryWeeks, loading, toggleLaundryWeek, updateLaundryService, markTransportPaid, updateTransportReceipt, refetch: fetchLaundryWeeks }
}
