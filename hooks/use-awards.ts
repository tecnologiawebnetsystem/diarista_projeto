'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Award } from '@/types/database'

export function useAwards(diaristaId?: string | null) {
  const [awards, setAwards] = useState<Award[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPeriod, setCurrentPeriod] = useState<Award | null>(null)

  const fetchAwards = useCallback(async () => {
    try {
      let query = supabase
        .from('awards')
        .select('*')
        .order('period_start', { ascending: false })

      if (diaristaId) {
        query = query.eq('diarista_id', diaristaId)
      }

      const { data, error } = await query
      if (error) throw error
      setAwards(data || [])

      const today = new Date().toISOString().split('T')[0]
      const current = data?.find(a => a.period_start <= today && a.period_end >= today)
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
      const insertData: Record<string, unknown> = {
        period_start: startDate,
        period_end: endDate,
        value: 300,
        status: 'pending',
        warnings_count: 0,
        attendance_score: 0,
        performance_score: 0,
        conduct_score: 0,
      }
      if (diaristaId) insertData.diarista_id = diaristaId

      const { data, error } = await supabase
        .from('awards')
        .insert([insertData])
        .select()
        .single()

      if (error) throw error
      if (data) {
        setAwards(prev => [data, ...prev])
        return data
      }
    } catch (error) {
      console.error('Error creating award period:', error)
      throw error
    }
  }

  async function updateAward(id: string, updates: Partial<Award>) {
    try {
      const { data, error } = await supabase
        .from('awards')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      if (data) {
        setAwards(prev => prev.map(a => a.id === id ? data : a))
        if (currentPeriod?.id === id) setCurrentPeriod(data)
        return data
      }
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
