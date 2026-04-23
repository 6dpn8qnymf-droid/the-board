import { CATEGORY_LABELS, PERSON_MAP } from '@/lib/constants'
import { formatCurrency, formatDelta, timeAgo } from '@/lib/utils'
import type { ActivityEvent, Profile, Category } from '@/types'

interface Props {
  event: ActivityEvent
  profile: Profile | undefined
  compact?: boolean
}

function getEventContent(event: ActivityEvent, personName: string): { icon: string; text: string } {
  const cat = event.category ? CATEGORY_LABELS[event.category as Category] : ''
  const p = event.payload

  switch (event.event_type) {
    case 'update': {
      const changed: string[] = []
      if ((p.aum_delta as number) !== 0) changed.push(`AUM ${formatDelta(p.aum_delta as number)} → ${formatCurrency(p.aum as number)}`)
      if ((p.fee_revenue_delta as number) !== 0) changed.push(`Rev ${formatDelta(p.fee_revenue_delta as number)} → ${formatCurrency(p.fee_revenue_ytd as number)}`)
      if ((p.contributions_delta as number) !== 0) changed.push(`Cont ${formatDelta(p.contributions_delta as number)} → ${formatCurrency(p.contributions_ytd as number)}`)
      return { icon: '📊', text: `${personName} updated: ${changed.join(' · ')}` }
    }
    case 'lead_change':
      return { icon: '🏆', text: `${personName} took the ${cat} lead!` }
    case 'milestone':
      return { icon: '🎉', text: `${personName} crossed ${formatCurrency(p.milestone_value as number)} in ${cat}!` }
    case 'personal_best':
      return { icon: '🔥', text: `${personName} set a personal best in ${cat}: ${formatDelta(p.delta as number)}` }
    case 'triple_crown':
      return { icon: '👑', text: `${personName} achieved the Triple Crown!` }
    default:
      return { icon: '📌', text: `${personName} posted an update` }
  }
}

export default function FeedItem({ event, profile, compact }: Props) {
  if (!profile) return null

  const person = PERSON_MAP[profile.person_id]
  const { icon, text } = getEventContent(event, profile.display_name)
  const isNotable = event.event_type !== 'update'

  return (
    <div className={`bg-white rounded-xl border p-3 flex gap-3 ${isNotable ? 'border-amber-200 bg-amber-50' : 'border-slate-200'}`}>
      <div className="text-xl leading-none pt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm text-slate-800 ${compact ? 'line-clamp-2' : ''}`}>{text}</p>
        <p className="text-xs text-slate-400 mt-0.5">{timeAgo(event.created_at)}</p>
      </div>
      <div
        className="w-2 rounded-full flex-shrink-0 self-stretch"
        style={{ backgroundColor: person.colorHex }}
      />
    </div>
  )
}
