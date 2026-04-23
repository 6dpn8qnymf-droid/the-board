import Link from 'next/link'
import FeedItem from './FeedItem'
import type { ActivityEvent, Profile } from '@/types'

interface Props {
  events: ActivityEvent[]
  profiles: Profile[]
}

export default function RecentActivity({ events, profiles }: Props) {
  const profileMap = Object.fromEntries(profiles.map(p => [p.id, p]))

  return (
    <div className="mt-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Recent</h2>
        <Link href="/feed" className="text-sm text-slate-400 font-medium">
          See all →
        </Link>
      </div>
      <div className="space-y-2">
        {events.map(event => (
          <FeedItem key={event.id} event={event} profile={profileMap[event.triggered_by]} compact />
        ))}
      </div>
    </div>
  )
}
