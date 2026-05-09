'use client'

import { useState, useEffect, useCallback } from 'react'
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
      const params = new URLSearchParams({ month: String(month), year: String(year) })
      if (diaristaId) params.set('diarista_id', diaristaId)

      const res = await fetch(`/api/db/notes?${params}`)
      if (!res.ok) throw new Error('Erro ao buscar anotacoes')
      const data: Note[] = await res.json()
      setNotes(data)
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
      const res = await fetch('/api/db/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, note_type, content, is_warning, diarista_id: diaristaId }),
      })
      if (!res.ok) throw new Error('Erro ao criar anotacao')
      const created: Note = await res.json()
      setNotes(prev => [created, ...prev])
      return created
    } catch (error) {
      console.error('Error adding note:', error)
      throw error
    }
  }

  async function updateNote(id: string, content: string, is_warning?: boolean) {
    try {
      const updates: Record<string, unknown> = { content }
      if (is_warning !== undefined) updates.is_warning = is_warning

      const res = await fetch(`/api/db/notes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!res.ok) throw new Error('Erro ao atualizar anotacao')
      const updated: Note = await res.json()
      setNotes(prev => prev.map(n => n.id === id ? updated : n))
      return updated
    } catch (error) {
      console.error('Error updating note:', error)
      throw error
    }
  }

  async function deleteNote(id: string) {
    try {
      const res = await fetch(`/api/db/notes/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erro ao deletar anotacao')
      setNotes(prev => prev.filter(n => n.id !== id))
    } catch (error) {
      console.error('Error deleting note:', error)
      throw error
    }
  }

  return { notes, loading, addNote, updateNote, deleteNote, refetch: fetchNotes }
}
