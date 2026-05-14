'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Loan } from '@/types/database'

// MySQL retorna campos numéricos como string — normaliza aqui
function normalizeLoan(l: Loan): Loan {
  return {
    ...l,
    amount: Number(l.amount) || 0,
    installment_value: Number(l.installment_value) || 0,
    installments: Number(l.installments) || 1,
    installments_paid: Number(l.installments_paid) || 0,
  }
}

export function useLoans(diaristaId?: string | null, statusFilter?: string) {
  const [loans, setLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)

  const fetchLoans = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (diaristaId) params.set('diarista_id', diaristaId)
      if (statusFilter) params.set('status', statusFilter)

      const res = await fetch(`/api/db/loans?${params}`)
      if (!res.ok) throw new Error('Erro ao buscar emprestimos')
      const data: Loan[] = await res.json()
      setLoans(data.map(normalizeLoan))
    } catch (error) {
      console.error('Error fetching loans:', error)
      setLoans([])
    } finally {
      setLoading(false)
    }
  }, [diaristaId, statusFilter])

  useEffect(() => { fetchLoans() }, [fetchLoans])

  async function createLoan(data: {
    diarista_id: string
    description: string
    amount: number
    installments: number
    date: string
    notes?: string
  }) {
    const res = await fetch('/api/db/loans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Erro ao criar emprestimo')
    const created: Loan = await res.json()
    setLoans(prev => [normalizeLoan(created), ...prev])
    return created
  }

  async function payInstallment(loanId: string, paymentDate?: string) {
    const res = await fetch(`/api/db/loans/${loanId}/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payment_date: paymentDate || new Date().toISOString().split('T')[0] }),
    })
    if (!res.ok) throw new Error('Erro ao registrar pagamento')
    const result = await res.json()
    setLoans(prev => prev.map(l => l.id === loanId ? normalizeLoan(result.loan) : l))
    return result
  }

  async function cancelLoan(loanId: string) {
    const res = await fetch(`/api/db/loans/${loanId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'cancelled' }),
    })
    if (!res.ok) throw new Error('Erro ao cancelar emprestimo')
    const updated: Loan = await res.json()
    setLoans(prev => prev.map(l => l.id === loanId ? normalizeLoan(updated) : l))
    return updated
  }

  async function deleteLoan(loanId: string) {
    const res = await fetch(`/api/db/loans/${loanId}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Erro ao deletar emprestimo')
    setLoans(prev => prev.filter(l => l.id !== loanId))
  }

  const activeLoans = loans.filter(l => l.status === 'active')
  const totalDebt = activeLoans.reduce((sum, l) => {
    const remaining = l.installments - l.installments_paid
    return sum + remaining * l.installment_value
  }, 0)

  return { loans, loading, createLoan, payInstallment, cancelLoan, deleteLoan, activeLoans, totalDebt, refetch: fetchLoans }
}
