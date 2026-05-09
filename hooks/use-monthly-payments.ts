'use client'

import { useState, useEffect, useCallback } from 'react'
import type { MonthlyPayment } from '@/types/database'

export function useMonthlyPayments(month: number, year: number, diaristaId?: string | null) {
  const [payment, setPayment] = useState<MonthlyPayment | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchPayment = useCallback(async () => {
    if (!month || !year || isNaN(month) || isNaN(year)) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      const params = new URLSearchParams({ month: String(month), year: String(year) })
      if (diaristaId) params.set('diarista_id', diaristaId)

      const res = await fetch(`/api/db/monthly-payments?${params}`)
      if (!res.ok) throw new Error('Erro ao buscar pagamento')
      const data = await res.json()
      setPayment(data ?? null)
    } catch (error) {
      console.error('Error fetching payment:', error)
      setPayment(null)
    } finally {
      setLoading(false)
    }
  }, [month, year, diaristaId])

  useEffect(() => {
    fetchPayment()
  }, [fetchPayment])

  async function createPayment() {
    try {
      const res = await fetch('/api/db/monthly-payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month, year, diarista_id: diaristaId }),
      })
      if (!res.ok) throw new Error('Erro ao criar pagamento')
      const newPayment: MonthlyPayment = await res.json()
      setPayment(newPayment)
    } catch (error) {
      console.error('Error creating payment:', error)
      throw error
    }
  }

  async function markAsPaid(receiptUrl?: string) {
    if (!payment) return
    try {
      const updates: Record<string, unknown> = {
        paid_at: new Date().toISOString(),
        payment_date: new Date().toISOString().split('T')[0],
      }
      if (receiptUrl) updates.receipt_url = receiptUrl

      const res = await fetch(`/api/db/monthly-payments/${payment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!res.ok) throw new Error('Erro ao marcar como pago')
      const updated: MonthlyPayment = await res.json()
      setPayment(updated)
    } catch (error) {
      console.error('Error marking as paid:', error)
      throw error
    }
  }

  async function updatePayment(updates: Partial<MonthlyPayment>) {
    if (!payment) return
    try {
      const res = await fetch(`/api/db/monthly-payments/${payment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!res.ok) throw new Error('Erro ao atualizar pagamento')
      const updated: MonthlyPayment = await res.json()
      setPayment(updated)
    } catch (error) {
      console.error('Error updating payment:', error)
      throw error
    }
  }

  return { payment, loading, createPayment, markAsPaid, updatePayment, refetch: fetchPayment }
}
