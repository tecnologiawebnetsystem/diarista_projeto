'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Client } from '@/types/database'

export function useClients() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)

  const fetchClients = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name')

      if (error) throw error
      setClients((data as unknown as Client[]) || [])
    } catch (error) {
      console.error('Error fetching clients:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchClients()
  }, [fetchClients])

  async function addClient(clientData: {
    name: string
    address?: string
    neighborhood?: string
    phone?: string
    notes?: string
  }) {
    try {
      const { data, error } = await supabase
        .from('clients')
        .insert([{ ...clientData, active: true }])
        .select()
        .single()

      if (error) throw error
      const newClient = data as unknown as Client
      setClients(prev => [...prev, newClient].sort((a, b) => a.name.localeCompare(b.name)))
      return newClient
    } catch (error) {
      console.error('Error adding client:', error)
      throw error
    }
  }

  async function updateClient(id: string, updates: Partial<Client>) {
    try {
      const { data, error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      const updated = data as unknown as Client
      setClients(prev => prev.map(c => c.id === id ? updated : c))
      return updated
    } catch (error) {
      console.error('Error updating client:', error)
      throw error
    }
  }

  async function deleteClient(id: string) {
    try {
      const { error } = await supabase
        .from('clients')
        .update({ active: false })
        .eq('id', id)

      if (error) throw error
      setClients(prev => prev.map(c => c.id === id ? { ...c, active: false } : c))
    } catch (error) {
      console.error('Error deleting client:', error)
      throw error
    }
  }

  const activeClients = clients.filter(c => c.active)

  return {
    clients,
    activeClients,
    loading,
    addClient,
    updateClient,
    deleteClient,
    refetch: fetchClients,
  }
}
