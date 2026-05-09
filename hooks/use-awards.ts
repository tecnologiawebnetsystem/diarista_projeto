'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Award } from '@/types/database'

export function useAwards(diaristaId?: string | null) {
  const [awards, setAwards] = useState<Award[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPeriod, setCurrentPeriod] = useState<Award | null>(null)

  const fetchAwards = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (diaristaId) params.set('diarista_id', diaristaId)

      const res = await fetch(`/api/db/awards?${params}`)
      if (!res.ok) throw new Error('Erro ao buscar premiacoes')
      const data: Award[] = await res.json()
      setAwards(data)

      const today = new Date().toISOString().split('T')[0]
      const current = data.find(a => a.period_start <= today && a.period_end >= today)
      setCurrentPeriod(current || null)
    } catch (error) {
      console.error('Error fetching awards:', error)
      setAwards([])
      setCurrentPeriod(null)
    } finally {
      setLoading(false)
    }
  }, [diaristaId])

  useEffect(() => {
    fetchAwards()
  }, [fetchAwards])

  async function createAwardPeriod(startDate: string, endDate: string) {
    try {
      const res = await fetch('/api/db/awards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          period_start: startDate,
          period_end: endDate,
          value: 300,
          status: 'pending',
          diarista_id: diaristaId,
        }),
      })
      if (!res.ok) throw new Error('Erro ao criar periodo de premiacao')
      const created: Award = await res.json()
      setAwards(prev => [created, ...prev])
      return created
    } catch (error) {
      console.error('Error creating award period:', error)
      throw error
    }
  }

  async function updateAward(id: string, updates: Partial<Award>) {
    try {
      const res = await fetch(`/api/db/awards/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!res.ok) throw new Error('Erro ao atualizar premiacao')
      const updated: Award = await res.json()
      setAwards(prev => prev.map(a => a.id === id ? updated : a))
      if (currentPeriod?.id === id) setCurrentPeriod(updated)
      return updated
    } catch (error) {
      console.error('Error updating award:', error)
      throw error
    }
  }

  async function awardPrize(id: string) {
    return updateAward(id, { status: 'awarded', awarded_at: new Date().toISOString() })
  }

  async function disqualifyAward(id: string, reason: string) {
    return updateAward(id, { status: 'disqualified', disqualification_reason: reason })
  }

  return { awards, currentPeriod, loading, createAwardPeriod, updateAward, awardPrize, disqualifyAward, refetch: fetchAwards }
}
