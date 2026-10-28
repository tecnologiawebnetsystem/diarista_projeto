'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { Diarista } from '@/types/database'

type UserRole = 'diarista' | 'admin' | null

interface AuthContextType {
  role: UserRole
  isAuthenticated: boolean
  isLoading: boolean
  diarista: Diarista | null
  diaristaId: string | null
  loginAsDiarista: (d: Diarista) => void
  loginAsAdmin: () => void
  logout: () => void
  selectedDiaristaId: string | null
  setSelectedDiaristaId: (id: string | null) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const SESSION_KEYS = {
  role: 'limpp_day_role',
  diaristaId: 'limpp_day_diarista_id',
  diaristaName: 'limpp_day_diarista_name',
} as const

function readSession(key: string) {
  try {
    return sessionStorage.getItem(key)
  } catch {
    return null
  }
}

function writeSession(key: string, value: string) {
  try {
    sessionStorage.setItem(key, value)
  } catch (error) {
    console.error('[v0] Não foi possível salvar a sessão:', error)
  }
}

function removeSession(key: string) {
  try {
    sessionStorage.removeItem(key)
  } catch (error) {
    console.error('[v0] Não foi possível limpar a sessão:', error)
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [diarista, setDiarista] = useState<Diarista | null>(null)
  const [selectedDiaristaId, setSelectedDiaristaId] = useState<string | null>(null)

  useEffect(() => {
    try {
      const savedRole = readSession(SESSION_KEYS.role) as UserRole
      const savedDiaristaId = readSession(SESSION_KEYS.diaristaId)
      const savedDiaristaName = readSession(SESSION_KEYS.diaristaName)

      if (savedRole) {
        setRole(savedRole)
        setIsAuthenticated(true)
        if (savedRole === 'diarista' && savedDiaristaId && savedDiaristaName) {
          setDiarista({ id: savedDiaristaId, name: savedDiaristaName } as Diarista)
        }
      }
    } catch (error) {
      console.error('[v0] Error reading sessionStorage:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loginAsDiarista = (d: Diarista) => {
    setRole('diarista')
    setIsAuthenticated(true)
    setDiarista(d)
    writeSession(SESSION_KEYS.role, 'diarista')
    writeSession(SESSION_KEYS.diaristaId, d.id)
    writeSession(SESSION_KEYS.diaristaName, d.name)
  }

  const loginAsAdmin = () => {
    setRole('admin')
    setIsAuthenticated(true)
    writeSession(SESSION_KEYS.role, 'admin')
  }

  const logout = () => {
    setRole(null)
    setIsAuthenticated(false)
    setDiarista(null)
    setSelectedDiaristaId(null)
    removeSession(SESSION_KEYS.role)
    removeSession(SESSION_KEYS.diaristaId)
    removeSession(SESSION_KEYS.diaristaName)
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
