'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { LaundryWeek } from '@/types/database'

async function getConfigValues() {
  const { data } = await supabase.from('config').select('key, value')
  const config: Record<string, number> = {}
  data?.forEach(item => {
    config[item.key] = item.value
  })
  return config
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
      let query = supabase
        .from('laundry_weeks')
        .select('*')
        .eq('month', month)
        .eq('year', year)
        .order('week_number', { ascending: true })

      if (diaristaId) {
        query = query.eq('diarista_id', diaristaId)
      }

      const { data, error } = await query
      if (error) throw error
      setLaundryWeeks(data || [])
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
        const { error } = await supabase
          .from('laundry_weeks')
          .delete()
          .eq('id', existing.id)
        if (error) throw error
        setLaundryWeeks(prev => prev.filter(w => w.id !== existing.id))
      } else {
        const insertData: Record<string, unknown> = { week_number: weekNumber, month, year, value: 0, ironed: false, washed: false }
        if (diaristaId) insertData.diarista_id = diaristaId

        const { data, error } = await supabase
          .from('laundry_weeks')
          .insert([insertData])
          .select()
          .single()
        if (error) throw error
        if (data) setLaundryWeeks(prev => [...prev, data])
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

      const { data, error } = await supabase
        .from('laundry_weeks')
        .update({ ironed, washed, value })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      if (data) {
        setLaundryWeeks(prev => prev.map(w => w.id === id ? data : w))
      }
    } catch (error) {
      console.error('Error updating laundry service:', error)
      throw error
    }
  }

  async function markTransportPaid(id: string, paid: boolean) {
    try {
      const { data, error } = await supabase
        .from('laundry_weeks')
        .update({ paid_at: paid ? new Date().toISOString() : null })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      if (data) {
        setLaundryWeeks(prev => prev.map(w => w.id === id ? data : w))
      }
    } catch (error) {
      console.error('Error marking transport paid:', error)
      throw error
    }
  }

  async function updateTransportReceipt(id: string, receiptUrl: string | null) {
    try {
      const { data, error } = await supabase
        .from('laundry_weeks')
        .update({ receipt_url: receiptUrl })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      if (data) {
        setLaundryWeeks(prev => prev.map(w => w.id === id ? data : w))
      }
    } catch (error) {
      console.error('Error updating transport receipt:', error)
      throw error
    }
  }

  return { laundryWeeks, loading, toggleLaundryWeek, updateLaundryService, markTransportPaid, updateTransportReceipt, refetch: fetchLaundryWeeks }
}
