'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import type { Diarista } from '@/types/database'

type UserRole = 'diarista' | 'admin' | null

interface AuthContextType {
  role: UserRole
  isAuthenticated: boolean
  isLoading: boolean
  diarista: Diarista | null
  diaristaId: string | null
  loginAsDiarista: (d: Diarista) => void
  loginAsAdmin: (pin: string) => Promise<boolean>
  logout: () => void
  /** Admin: selecionar diarista para visualizar */
  selectedDiaristaId: string | null
  setSelectedDiaristaId: (id: string | null) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [diarista, setDiarista] = useState<Diarista | null>(null)
  const [selectedDiaristaId, setSelectedDiaristaId] = useState<string | null>(null)

  useEffect(() => {
    const savedRole = sessionStorage.getItem('limpp_day_role') as UserRole
    const savedDiaristaId = sessionStorage.getItem('limpp_day_diarista_id')
    const savedDiaristaName = sessionStorage.getItem('limpp_day_diarista_name')

    if (savedRole) {
      setRole(savedRole)
      setIsAuthenticated(true)
      if (savedRole === 'diarista' && savedDiaristaId && savedDiaristaName) {
        setDiarista({ id: savedDiaristaId, name: savedDiaristaName } as Diarista)
      }
    }
    setIsLoading(false)
  }, [])

  const loginAsDiarista = (d: Diarista) => {
    setRole('diarista')
    setIsAuthenticated(true)
    setDiarista(d)
    sessionStorage.setItem('limpp_day_role', 'diarista')
    sessionStorage.setItem('limpp_day_diarista_id', d.id)
    sessionStorage.setItem('limpp_day_diarista_name', d.name)
  }

  const loginAsAdmin = async (pin: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('config')
        .select('value')
        .eq('key', 'admin_pin')
        .single()

      if (error || !data) return false

      const correctPin = String(data.value) || '123456'
      if (pin === correctPin) {
        setRole('admin')
        setIsAuthenticated(true)
        sessionStorage.setItem('limpp_day_role', 'admin')
        return true
      }
      return false
    } catch (error) {
      console.error('Login error:', error)
      return false
    }
  }

  const logout = () => {
    setRole(null)
    setIsAuthenticated(false)
    setDiarista(null)
    setSelectedDiaristaId(null)
    sessionStorage.removeItem('limpp_day_role')
    sessionStorage.removeItem('limpp_day_diarista_id')
    sessionStorage.removeItem('limpp_day_diarista_name')
  }

  return (
    <AuthContext.Provider value={{
      role,
      isAuthenticated,
      isLoading,
      diarista,
      diaristaId: diarista?.id || null,
      loginAsDiarista,
      loginAsAdmin,
      logout,
      selectedDiaristaId,
      setSelectedDiaristaId,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
