import { createServerClient } from '@/lib/supabase/server'
import { computeLeaders, getTripleCrown } from '@/lib/utils'
import LeaderboardCard from '@/components/LeaderboardCard'
import CategoryLeaders from '@/components/CategoryLeaders'
import TripleCrownBanner from '@/components/TripleCrownBanner'
import RecentActivity from '@/components/RecentActivity'
import type { Profile, MetricSnapshot, ActivityEvent } from '@/types'

export const dynamic = 'force-dynamic'

export default async function LeaderboardPage() {
  const supabase = await createServerClient()

  const { data: { user } } = await supabase.auth.getUser()

  const [profilesRes, eventsRes] = await Promise.all([
    supabase.from('profiles').select('*').order('created_at'),
    supabase
      .from('activity_events')
      .select('*, profile:profiles(*)')
      .order('created_at', { ascending: false })
      .limit(3),
  ])

  const profiles = (profilesRes.data ?? []) as Profile[]

  // Latest snapshot per user
  const snapshots = await Promise.all(
    profiles.map(async (p) => {
      const { data } = await supabase
        .from('metric_snapshots')
        .select('*')
        .eq('user_id', p.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      return { profile: p, snapshot: data as MetricSnapshot | null }
    })
  )

  const latestRows = snapshots
    .filter(s => s.snapshot !== null)
    .map(s => ({
      user_id: s.profile.id,
      aum: s.snapshot!.aum,
      fee_revenue_ytd: s.snapshot!.fee_revenue_ytd,
      contributions_ytd: s.snapshot!.contributions_ytd,
    }))

  const leaders = computeLeaders(latestRows)
  const tripleHolder = getTripleCrown(leaders)
  const tripleProfile = tripleHolder ? profiles.find(p => p.id === tripleHolder) : null
  const recentEvents = (eventsRes.data ?? []) as ActivityEvent[]

  return (
    <div className="px-4 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">The Board</h1>
        <span className="text-2xl">🏆</span>
      </div>

      {/* Triple Crown */}
      {tripleProfile && (
        <TripleCrownBanner profile={tripleProfile} />
      )}

      {/* Category leaders */}
      <CategoryLeaders leaders={leaders} profiles={profiles} />

      {/* Player cards */}
      <div className="space-y-3 mt-4">
        {snapshots.map(({ profile, snapshot }) => (
          <LeaderboardCard
            key={profile.id}
            profile={profile}
            snapshot={snapshot}
            leaders={leaders}
            isMe={user?.id === profile.id}
          />
        ))}
      </div>

      {/* Recent activity preview */}
      {recentEvents.length > 0 && (
        <RecentActivity events={recentEvents} profiles={profiles} />
      )}

      <div className="h-4" />
    </div>
  )
}
