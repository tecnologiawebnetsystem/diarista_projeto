'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Attendance } from '@/types/database'

export function useAttendance(month: number, year: number, diaristaId?: string | null) {
  const [attendance, setAttendance] = useState<Attendance[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAttendance = useCallback(async () => {
    if (!month || !year || isNaN(month) || isNaN(year)) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      const startDate = new Date(year, month - 1, 1)
      const endDate = new Date(year, month, 0)

      let query = supabase
        .from('attendance')
        .select('*')
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
        .order('date', { ascending: false })

      if (diaristaId) {
        query = query.eq('diarista_id', diaristaId)
      }

      const { data, error } = await query
      if (error) throw error
      setAttendance(data || [])
    } catch (error) {
      console.error('Error fetching attendance:', error)
      setAttendance([])
    } finally {
      setLoading(false)
    }
  }, [month, year, diaristaId])

  useEffect(() => {
    fetchAttendance()
  }, [fetchAttendance])

  async function markAttendance(date: string, dayType: 'heavy_cleaning' | 'light_cleaning', present: boolean = true) {
    try {
      const insertData: Record<string, unknown> = { date, day_type: dayType, present }
      if (diaristaId) insertData.diarista_id = diaristaId

      const { data, error } = await supabase
        .from('attendance')
        .insert([insertData])
        .select()
        .single()

      if (error) throw error
      if (data) {
        setAttendance(prev => [data, ...prev])
        return data
      }
      return null
    } catch (error) {
      console.error('Error marking attendance:', error)
      throw error
    }
  }

  async function updateAttendance(id: string, updates: Partial<Attendance>) {
    try {
      const { data, error } = await supabase
        .from('attendance')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      if (data) {
        setAttendance(prev => prev.map(a => a.id === id ? data : a))
        return data
      }
      return null
    } catch (error) {
      console.error('Error updating attendance:', error)
      throw error
    }
  }

  async function deleteAttendance(id: string) {
    try {
      const { error } = await supabase
        .from('attendance')
        .delete()
        .eq('id', id)

      if (error) throw error
      setAttendance(prev => prev.filter(a => a.id !== id))
    } catch (error) {
      console.error('Error deleting attendance:', error)
      throw error
    }
  }

  return { attendance, loading, markAttendance, updateAttendance, deleteAttendance, refetch: fetchAttendance }
}
