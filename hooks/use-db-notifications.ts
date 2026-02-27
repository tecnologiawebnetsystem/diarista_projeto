'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

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
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('diarista_id', diaristaId)
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) throw error
      setNotifications(data || [])
      setUnreadCount((data || []).filter(n => !n.read).length)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }, [diaristaId])

  useEffect(() => {
    fetchNotifications()
    // Poll every 30 seconds for new notifications
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  async function sendNotification(targetDiaristaId: string, title: string, message: string, type: 'info' | 'warning' | 'note' = 'note') {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert([{ diarista_id: targetDiaristaId, title, message, type }])
      if (error) throw error
    } catch (error) {
      console.error('Error sending notification:', error)
      throw error
    }
  }

  async function markAsRead(id: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id)
      if (error) throw error
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  async function markAllAsRead() {
    if (!diaristaId) return
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('diarista_id', diaristaId)
        .eq('read', false)
      if (error) throw error
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  return { notifications, unreadCount, loading, sendNotification, markAsRead, markAllAsRead, refetch: fetchNotifications }
}
