'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Attendance } from '@/types/database'

function normalizeDate(raw: string): string {
  return raw && raw.includes('T') ? raw.split('T')[0] : raw
}

function normalizeAttendance(a: Attendance): Attendance {
  return {
    ...a,
    date: normalizeDate(a.date),
    present: Boolean(a.present),
  }
}

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
      const params = new URLSearchParams({ month: String(month), year: String(year) })
      if (diaristaId) params.set('diarista_id', diaristaId)

      const res = await fetch(`/api/db/attendance?${params}`)
      if (!res.ok) throw new Error('Erro ao buscar presencas')
      const data: Attendance[] = await res.json()
      // Normaliza: MySQL pode retornar date como "2026-05-05T03:00:00.000Z"
      // e present como 0/1 em vez de boolean
      setAttendance(data.map(normalizeAttendance))
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
    const normalizedDate = normalizeDate(date)
    try {
      const res = await fetch('/api/db/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: normalizedDate, day_type: dayType, present, diarista_id: diaristaId }),
      })
      if (!res.ok) throw new Error('Erro ao registrar presenca')
      const created: Attendance = await res.json()
      const normalized = normalizeAttendance(created)
      setAttendance(prev => [normalized, ...prev])
      return normalized
    } catch (error) {
      console.error('Error marking attendance:', error)
      throw error
    }
  }

  async function updateAttendance(id: string, updates: Partial<Attendance>) {
    try {
      const res = await fetch(`/api/db/attendance/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!res.ok) throw new Error('Erro ao atualizar presenca')
      const updated: Attendance = await res.json()
      const normalized = normalizeAttendance(updated)
      setAttendance(prev => prev.map(a => a.id === id ? normalized : a))
      return normalized
    } catch (error) {
      console.error('Error updating attendance:', error)
      throw error
    }
  }

  async function deleteAttendance(id: string) {
    try {
      const res = await fetch(`/api/db/attendance/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erro ao deletar presenca')
      setAttendance(prev => prev.filter(a => a.id !== id))
    } catch (error) {
      console.error('Error deleting attendance:', error)
      throw error
    }
  }

  return { attendance, loading, markAttendance, updateAttendance, deleteAttendance, refetch: fetchAttendance }
}
