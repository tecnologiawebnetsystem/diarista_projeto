'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Client } from '@/types/database'

export function useClients() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)

  const fetchClients = useCallback(async () => {
    try {
      const res = await fetch('/api/db/clients')
      if (!res.ok) throw new Error('Erro ao buscar clientes')
      const data: Client[] = await res.json()
      setClients(data)
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
      const res = await fetch('/api/db/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...clientData, active: true }),
      })
      if (!res.ok) throw new Error('Erro ao criar cliente')
      const newClient: Client = await res.json()
      setClients(prev => [...prev, newClient].sort((a, b) => a.name.localeCompare(b.name)))
      return newClient
    } catch (error) {
      console.error('Error adding client:', error)
      throw error
    }
  }

  async function updateClient(id: string, updates: Partial<Client>) {
    try {
      const res = await fetch(`/api/db/clients/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!res.ok) throw new Error('Erro ao atualizar cliente')
      const updated: Client = await res.json()
      setClients(prev => prev.map(c => c.id === id ? updated : c))
      return updated
    } catch (error) {
      console.error('Error updating client:', error)
      throw error
    }
  }

  async function deleteClient(id: string) {
    try {
      const res = await fetch(`/api/db/clients/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erro ao desativar cliente')
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
