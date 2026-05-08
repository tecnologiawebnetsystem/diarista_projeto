'use client'

import { useState, useEffect, useCallback } from 'react'

interface DbNotification {
  id: string
  diarista_id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'note'
  read: boolean
  created_at: string
}

export function useDbNotifications(diaristaId?: string | null) {
  const [notifications, setNotifications] = useState<DbNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchNotifications = useCallback(async () => {
    if (!diaristaId) { setNotifications([]); setUnreadCount(0); setLoading(false); return }
    try {
      const res = await fetch(`/api/db/notifications?diarista_id=${diaristaId}`)
      if (!res.ok) throw new Error('Erro ao buscar notificacoes')
      const data: DbNotification[] = await res.json()
      setNotifications(data)
      setUnreadCount(data.filter(n => !n.read).length)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }, [diaristaId])

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  async function sendNotification(targetDiaristaId: string, title: string, message: string, type: 'info' | 'warning' | 'note' = 'note') {
    try {
      const res = await fetch('/api/db/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ diarista_id: targetDiaristaId, title, message, type }),
      })
      if (!res.ok) throw new Error('Erro ao enviar notificacao')
    } catch (error) {
      console.error('Error sending notification:', error)
      throw error
    }
  }

  async function markAsRead(id: string) {
    try {
      const res = await fetch(`/api/db/notifications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: true }),
      })
      if (!res.ok) throw new Error('Erro ao marcar como lida')
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  async function markAllAsRead() {
    if (!diaristaId) return
    try {
      const res = await fetch('/api/db/notifications/mark-all-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ diarista_id: diaristaId }),
      })
      if (!res.ok) throw new Error('Erro ao marcar todas como lidas')
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  return { notifications, unreadCount, loading, sendNotification, markAsRead, markAllAsRead, refetch: fetchNotifications }
}
