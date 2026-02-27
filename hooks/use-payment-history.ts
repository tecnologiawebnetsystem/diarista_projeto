'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

interface PaymentRecord {
  id: string
  month: number
  year: number
  type: 'salary' | 'laundry'
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
      const allRecords: PaymentRecord[] = []

      // Buscar pagamentos mensais
      let salaryQuery = supabase
        .from('monthly_payments')
        .select('*')
        .order('year', { ascending: false })
        .order('month', { ascending: false })

      if (diaristaId) salaryQuery = salaryQuery.eq('diarista_id', diaristaId)
      if (filterYear) salaryQuery = salaryQuery.eq('year', filterYear)

      const { data: salaries } = await salaryQuery
      if (salaries) {
        for (const s of salaries) {
          allRecords.push({
            id: s.id,
            month: s.month,
            year: s.year,
            type: 'salary',
            description: 'Salario Mensal',
            amount: s.monthly_value || 0,
            status: s.paid_at ? 'paid' : 'pending',
            paid_at: s.paid_at,
            receipt_url: s.receipt_url,
          })
        }
      }

      // Buscar lavanderias agrupadas por mes
      let laundryQuery = supabase
        .from('laundry_weeks')
        .select('*')
        .order('year', { ascending: false })
        .order('month', { ascending: false })

      if (diaristaId) laundryQuery = laundryQuery.eq('diarista_id', diaristaId)
      if (filterYear) laundryQuery = laundryQuery.eq('year', filterYear)

      const { data: laundries } = await laundryQuery

      // Buscar config para calcular valores
      const { data: configData } = await supabase.from('config').select('key, value')
      const cfg: Record<string, number> = {}
      configData?.forEach(item => { cfg[item.key] = item.value })
      const ironingValue = cfg.ironing || 50
      const washingValue = cfg.washing || 75

      if (laundries && laundries.length > 0) {
        // Agrupar por mes/ano
        const grouped: Record<string, typeof laundries> = {}
        for (const l of laundries) {
          const key = `${l.year}-${l.month}`
          if (!grouped[key]) grouped[key] = []
          grouped[key].push(l)
        }

        for (const [key, weeks] of Object.entries(grouped)) {
          const [y, m] = key.split('-').map(Number)
          const total = weeks.reduce((sum, w) => {
            const services = (w.ironed ? ironingValue : 0) + (w.washed ? washingValue : 0)
            const transport = (w.ironed || w.washed) ? (w.transport_fee || 30) : 0
            return sum + services + transport
          }, 0)
          const allPaid = weeks.every(w => w.paid_at)

          allRecords.push({
            id: `laundry-${key}`,
            month: m,
            year: y,
            type: 'laundry',
            description: `Lavanderia (${weeks.length} semana${weeks.length > 1 ? 's' : ''})`,
            amount: total,
            status: allPaid ? 'paid' : 'pending',
            paid_at: allPaid ? weeks[0].paid_at : null,
            receipt_url: null,
          })
        }
      }

      // Ordenar por data (mais recente primeiro)
      allRecords.sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year
        if (a.month !== b.month) return b.month - a.month
        return a.type.localeCompare(b.type)
      })

      setRecords(allRecords)
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
