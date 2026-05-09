'use client'

import { useState, useEffect, useCallback } from 'react'

interface PaymentRecord {
  id: string
  month: number
  year: number
  type: 'attendance' | 'laundry' | 'transport'
  description: string
  amount: number
  status: 'paid' | 'pending'
  paid_at: string | null
  receipt_url: string | null
}

export function usePaymentHistory(diaristaId?: string | null, filterYear?: number) {
  const [records, setRecords] = useState<PaymentRecord[]>([])
  const [loading, setLoading] = useState(true)

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (diaristaId) params.set('diarista_id', diaristaId)
      if (filterYear) params.set('year', String(filterYear))

      const res = await fetch(`/api/db/payment-history?${params}`)
      if (!res.ok) throw new Error('Erro ao buscar historico')
      const data: PaymentRecord[] = await res.json()
      setRecords(data)
    } catch (error) {
      console.error('Error fetching payment history:', error)
      setRecords([])
    } finally {
      setLoading(false)
    }
  }, [diaristaId, filterYear])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  const totalPaid = records.filter(r => r.status === 'paid').reduce((sum, r) => sum + r.amount, 0)
  const totalPending = records.filter(r => r.status === 'pending').reduce((sum, r) => sum + r.amount, 0)

  return { records, loading, totalPaid, totalPending, refetch: fetchHistory }
}
