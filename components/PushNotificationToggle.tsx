'use client'

import { useEffect, useState } from 'react'

type PermissionState = 'default' | 'granted' | 'denied' | 'unsupported' | 'loading'

async function subscribeUser() {
  const reg = await navigator.serviceWorker.getRegistration('/sw.js')
  if (!reg) throw new Error('Service worker not registered')

  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
  })

  await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sub),
  })
}

async function unsubscribeUser() {
  const reg = await navigator.serviceWorker.getRegistration('/sw.js')
  if (!reg) return
  const sub = await reg.pushManager.getSubscription()
  if (sub) await sub.unsubscribe()
  await fetch('/api/push/subscribe', { method: 'DELETE' })
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
}

export default function PushNotificationToggle() {
  const [state, setState] = useState<PermissionState>('loading')
  const [subscribed, setSubscribed] = useState(false)

  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      setState('unsupported')
      return
    }
    setState(Notification.permission as PermissionState)

    navigator.serviceWorker.ready.then(async reg => {
      const sub = await reg.pushManager.getSubscription()
      setSubscribed(!!sub)
    })
  }, [])

  async function toggle() {
    if (subscribed) {
      await unsubscribeUser()
      setSubscribed(false)
      return
    }

    if (Notification.permission === 'denied') return

    const result = await Notification.requestPermission()
    setState(result as PermissionState)
    if (result === 'granted') {
      await subscribeUser()
      setSubscribed(true)
    }
  }

  if (state === 'loading') return <div className="text-sm text-slate-400">Checking…</div>

  if (state === 'unsupported') {
    return (
      <div className="text-sm text-slate-500">
        Push notifications require the app to be installed on your home screen (iOS 16.4+).
      </div>
    )
  }

  if (state === 'denied') {
    return (
      <div className="text-sm text-slate-500">
        Notifications are blocked. Enable them in your device Settings → Safari → [this site].
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="font-medium text-slate-900 text-sm">Push notifications</div>
        <div className="text-xs text-slate-400 mt-0.5">
          {subscribed ? 'You'll be notified of lead changes and milestones' : 'Get notified of lead changes and milestones'}
        </div>
      </div>
      <button
        onClick={toggle}
        className={`w-11 h-6 rounded-full transition-colors relative ${subscribed ? 'bg-green-500' : 'bg-slate-200'}`}
      >
        <div
          className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${subscribed ? 'translate-x-5' : 'translate-x-0.5'}`}
        />
      </button>
    </div>
  )
}
