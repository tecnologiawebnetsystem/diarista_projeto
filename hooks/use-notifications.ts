'use client'

import { useState, useEffect, useCallback } from 'react'

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [supported, setSupported] = useState(false)

  useEffect(() => {
    const isSupported = 'Notification' in window && 'serviceWorker' in navigator
    setSupported(isSupported)
    if (isSupported) {
      setPermission(Notification.permission)
    }
  }, [])

  const requestPermission = useCallback(async () => {
    if (!supported) return false
    try {
      const result = await Notification.requestPermission()
      setPermission(result)
      return result === 'granted'
    } catch {
      return false
    }
  }, [supported])

  const sendLocalNotification = useCallback((title: string, body: string, url?: string) => {
    if (permission !== 'granted') return

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(reg => {
        reg.showNotification(title, {
          body,
          icon: '/logo.jpg',
          badge: '/logo.jpg',
          data: url || '/login',
        })
      })
    }
  }, [permission])

  return {
    permission,
    supported,
    requestPermission,
    sendLocalNotification,
  }
}
