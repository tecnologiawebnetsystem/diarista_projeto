'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { MonthlyPayment } from '@/types/database'

function calculate5thBusinessDay(month: number, year: number): Date {
  let businessDaysCount = 0
  const currentDate = new Date(year, month - 1, 1)

  while (businessDaysCount < 5) {
    const dayOfWeek = currentDate.getDay()
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      businessDaysCount++
    }
    if (businessDaysCount < 5) {
      currentDate.setDate(currentDate.getDate() + 1)
    }
  }

  return currentDate
}

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
      let query = supabase
        .from('monthly_payments')
        .select('*')
        .eq('month', month)
        .eq('year', year)

      if (diaristaId) {
        query = query.eq('diarista_id', diaristaId)
      }

      const { data, error } = await query.maybeSingle()

      if (error) {
        if (error.code === 'PGRST205') {
          setPayment(null)
          return
        }
        // If multiple rows found, try limiting to 1
        if (error.code === 'PGRST116') {
          let retryQuery = supabase
            .from('monthly_payments')
            .select('*')
            .eq('month', month)
            .eq('year', year)
            .limit(1)
          if (diaristaId) retryQuery = retryQuery.eq('diarista_id', diaristaId)
          const { data: retryData } = await retryQuery
          setPayment(retryData?.[0] ?? null)
          return
        }
        throw error
      }

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
      const dueDate = calculate5thBusinessDay(month, year)
      const { data: configData } = await supabase
        .from('config')
        .select('value')
        .eq('key', 'monthly_salary')
        .single()

      const monthlyValue = configData?.value || 2000

      const insertData: Record<string, unknown> = {
        month,
        year,
        payment_due_date: dueDate.toISOString().split('T')[0],
        monthly_value: monthlyValue,
        hour_limit: '20:00:00',
      }
      if (diaristaId) insertData.diarista_id = diaristaId

      const { data: newPayment, error } = await supabase
        .from('monthly_payments')
        .upsert(insertData, { onConflict: 'month,year', ignoreDuplicates: false })
        .select()
        .single()

      if (error) throw error
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

      const { data, error } = await supabase
        .from('monthly_payments')
        .update(updates)
        .eq('id', payment.id)
        .select()
        .single()

      if (error) throw error
      setPayment(data)
    } catch (error) {
      console.error('Error marking as paid:', error)
      throw error
    }
  }

  async function updatePayment(updates: Partial<MonthlyPayment>) {
    if (!payment) return
    try {
      const { data, error } = await supabase
        .from('monthly_payments')
        .update(updates)
        .eq('id', payment.id)
        .select()
        .single()

      if (error) throw error
      setPayment(data)
    } catch (error) {
      console.error('Error updating payment:', error)
      throw error
    }
  }

  return { payment, loading, createPayment, markAsPaid, updatePayment, refetch: fetchPayment }
}
