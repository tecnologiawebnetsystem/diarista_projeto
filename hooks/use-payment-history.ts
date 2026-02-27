'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

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
      const allRecords: PaymentRecord[] = []

      // Buscar config para calcular valores
      const { data: configData } = await supabase.from('config').select('key, value')
      const cfg: Record<string, number> = {}
      configData?.forEach(item => { cfg[item.key] = item.value })
      const heavyCleaningValue = cfg.heavy_cleaning || 0
      const lightCleaningValue = cfg.light_cleaning || 0
      const ironingValue = cfg.ironing || 50
      const washingValue = cfg.washing || 75

      // Buscar presenca agrupada por mes para calcular ganhos de limpeza
      let attendanceQuery = supabase
        .from('attendance')
        .select('*')
        .eq('present', true)
        .order('date', { ascending: false })

      if (diaristaId) attendanceQuery = attendanceQuery.eq('diarista_id', diaristaId)
      if (filterYear) {
        attendanceQuery = attendanceQuery
          .gte('date', `${filterYear}-01-01`)
          .lte('date', `${filterYear}-12-31`)
      }

      const { data: attendanceData } = await attendanceQuery

      if (attendanceData && attendanceData.length > 0) {
        const grouped: Record<string, typeof attendanceData> = {}
        for (const a of attendanceData) {
          const d = new Date(a.date + 'T00:00:00')
          const key = `${d.getFullYear()}-${d.getMonth() + 1}`
          if (!grouped[key]) grouped[key] = []
          grouped[key].push(a)
        }

        // Buscar pagamentos mensais para saber status de pagamento
        let paymentQuery = supabase
          .from('monthly_payments')
          .select('*')
        if (diaristaId) paymentQuery = paymentQuery.eq('diarista_id', diaristaId)
        if (filterYear) paymentQuery = paymentQuery.eq('year', filterYear)
        const { data: payments } = await paymentQuery

        for (const [key, days] of Object.entries(grouped)) {
          const [y, m] = key.split('-').map(Number)
          const heavy = days.filter(a => a.day_type === 'heavy_cleaning').length
          const light = days.filter(a => a.day_type === 'light_cleaning').length
          const total = (heavy * heavyCleaningValue) + (light * lightCleaningValue)

          const payment = payments?.find(p => p.month === m && p.year === y)

          allRecords.push({
            id: `attendance-${key}`,
            month: m,
            year: y,
            type: 'attendance',
            description: `Limpeza (${heavy} pesada, ${light} leve)`,
            amount: total,
            status: payment?.paid_at ? 'paid' : 'pending',
            paid_at: payment?.paid_at || null,
            receipt_url: payment?.receipt_url || null,
          })
        }
      }

      // Buscar lavanderias agrupadas por mes (sem transporte)
      let laundryQuery = supabase
        .from('laundry_weeks')
        .select('*')
        .order('year', { ascending: false })
        .order('month', { ascending: false })

      if (diaristaId) laundryQuery = laundryQuery.eq('diarista_id', diaristaId)
      if (filterYear) laundryQuery = laundryQuery.eq('year', filterYear)

      const { data: laundries } = await laundryQuery

      if (laundries && laundries.length > 0) {
        const grouped: Record<string, typeof laundries> = {}
        for (const l of laundries) {
          const key = `${l.year}-${l.month}`
          if (!grouped[key]) grouped[key] = []
          grouped[key].push(l)
        }

        for (const [key, weeks] of Object.entries(grouped)) {
          const [y, m] = key.split('-').map(Number)
          const activeWeeks = weeks.filter(w => w.ironed || w.washed)
          if (activeWeeks.length === 0) continue

          const total = activeWeeks.reduce((sum, w) => {
            return sum + (w.ironed ? ironingValue : 0) + (w.washed ? washingValue : 0)
          }, 0)

          allRecords.push({
            id: `laundry-${key}`,
            month: m,
            year: y,
            type: 'laundry',
            description: `Lavanderia (${activeWeeks.length} semana${activeWeeks.length > 1 ? 's' : ''})`,
            amount: total,
            status: 'pending',
            paid_at: null,
            receipt_url: null,
          })

          // Transporte separado
          const transportWeeks = activeWeeks.filter(w => w.transport_fee > 0)
          if (transportWeeks.length > 0) {
            const transportTotal = transportWeeks.reduce((sum, w) => sum + (w.transport_fee || 0), 0)
            const transportPaid = transportWeeks.filter(w => w.paid_at)
            const allTransportPaid = transportPaid.length === transportWeeks.length

            allRecords.push({
              id: `transport-${key}`,
              month: m,
              year: y,
              type: 'transport',
              description: `Transporte (${transportWeeks.length} semana${transportWeeks.length > 1 ? 's' : ''})`,
              amount: transportTotal,
              status: allTransportPaid ? 'paid' : 'pending',
              paid_at: allTransportPaid ? transportPaid[0].paid_at : null,
              receipt_url: null,
            })
          }
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
