import webpush from 'web-push'
import { NextResponse } from 'next/server'
import { CATEGORY_LABELS } from '@/lib/constants'
import { formatCurrency, formatDelta } from '@/lib/utils'
import type { Category, EventType } from '@/types'

interface EventPayload {
  event_type: EventType
  category: Category | null
  payload: Record<string, unknown>
  triggered_by?: string
}

function buildNotification(event: EventPayload, triggeredBy: string): { title: string; body: string } {
  const cat = event.category ? CATEGORY_LABELS[event.category] : ''

  switch (event.event_type) {
    case 'lead_change': {
      const newLeaderId = event.payload.new_leader_id as string
      // Find by profile id — we only have person_id in PERSON_MAP so use triggeredBy name
      return {
        title: `Lead Change — ${cat} 🏆`,
        body: `${triggeredBy} took the ${cat} lead!`,
      }
    }
    case 'milestone': {
      const mv = event.payload.milestone_value as number
      return {
        title: `Milestone — ${cat} 🎉`,
        body: `${triggeredBy} passed ${formatCurrency(mv)} in ${cat}!`,
      }
    }
    case 'personal_best': {
      const delta = event.payload.delta as number
      return {
        title: `Personal Best — ${cat} 🔥`,
        body: `${triggeredBy} had their biggest ${cat} jump ever: ${formatDelta(delta)}`,
      }
    }
    case 'triple_crown': {
      return {
        title: 'Triple Crown 👑',
        body: `${triggeredBy} now holds the Triple Crown!`,
      }
    }
    default:
      return { title: 'The Board', body: `${triggeredBy} posted an update` }
  }
}

export async function POST(request: Request) {
  try {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT!,
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!
    )

    const { subscription, events, triggeredBy } = await request.json()
    if (!subscription || !events?.length) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 })
    }

    // Send one notification per notable event
    await Promise.allSettled(
      events.map((event: EventPayload) => {
        const { title, body } = buildNotification(event, triggeredBy)
        return webpush.sendNotification(
          subscription,
          JSON.stringify({ title, body, icon: '/icons/icon-192.png', badge: '/icons/badge-72.png' })
        )
      })
    )

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Push notify error:', err)
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 })
  }
}
