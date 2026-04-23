import { createServerClient } from '@/lib/supabase/server'
import FeedItem from '@/components/FeedItem'
import type { ActivityEvent, Profile } from '@/types'

export const dynamic = 'force-dynamic'

export default async function FeedPage() {
  const supabase = await createServerClient()

  const [eventsRes, profilesRes] = await Promise.all([
    supabase
      .from('activity_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100),
    supabase.from('profiles').select('*'),
  ])

  const events = (eventsRes.data ?? []) as ActivityEvent[]
  const profiles = (profilesRes.data ?? []) as Profile[]
  const profileMap = Object.fromEntries(profiles.map(p => [p.id, p]))

  const notableEvents = events.filter(e => e.event_type !== 'update')
  const allEvents = events

  return (
    <div className="px-4 pt-6">
      <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-5">Activity</h1>

      {allEvents.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <div className="text-4xl mb-3">📭</div>
          <p className="text-sm">No activity yet. Post your first update!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {allEvents.map(event => (
            <FeedItem
              key={event.id}
              event={event}
              profile={profileMap[event.triggered_by]}
            />
          ))}
        </div>
      )}

      <div className="h-4" />
    </div>
  )
}
