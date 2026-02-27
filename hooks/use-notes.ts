'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Note } from '@/types/database'

export function useNotes(month: number, year: number, diaristaId?: string | null) {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)

  const fetchNotes = useCallback(async () => {
    if (!month || !year || isNaN(month) || isNaN(year)) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0]
      const endDate = new Date(year, month, 0).toISOString().split('T')[0]

      let query = supabase
        .from('notes')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false })

      if (diaristaId) {
        query = query.eq('diarista_id', diaristaId)
      }

      const { data, error } = await query
      if (error) throw error
      setNotes(data || [])
    } catch (error) {
      console.error('Error fetching notes:', error)
      setNotes([])
    } finally {
      setLoading(false)
    }
  }, [month, year, diaristaId])

  useEffect(() => {
    fetchNotes()
  }, [fetchNotes])

  async function addNote(date: string, note_type: string, content: string, is_warning: boolean = false) {
    try {
      const insertData: Record<string, unknown> = { date, note_type, content, is_warning }
      if (diaristaId) insertData.diarista_id = diaristaId

      const { data, error } = await supabase
        .from('notes')
        .insert([insertData])
        .select()
        .single()

      if (error) throw error
      if (data) {
        setNotes(prev => [data, ...prev])
        return data
      }
      return null
    } catch (error) {
      console.error('Error adding note:', error)
      throw error
    }
  }

  async function updateNote(id: string, content: string, is_warning?: boolean) {
    try {
      const updates: Record<string, unknown> = { content }
      if (is_warning !== undefined) updates.is_warning = is_warning

      const { data, error } = await supabase
        .from('notes')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      if (data) {
        setNotes(prev => prev.map(n => n.id === id ? data : n))
        return data
      }
      return null
    } catch (error) {
      console.error('Error updating note:', error)
      throw error
    }
  }

  async function deleteNote(id: string) {
    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id)

      if (error) throw error
      setNotes(prev => prev.filter(n => n.id !== id))
    } catch (error) {
      console.error('Error deleting note:', error)
      throw error
    }
  }

  return { notes, loading, addNote, updateNote, deleteNote, refetch: fetchNotes }
}
