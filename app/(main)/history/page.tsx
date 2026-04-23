import { createServerClient } from '@/lib/supabase/server'
import HistoryChart from '@/components/HistoryChart'
import type { MetricSnapshot, Profile } from '@/types'

export const dynamic = 'force-dynamic'

export default async function HistoryPage() {
  const supabase = await createServerClient()

  const [profilesRes, snapshotsRes] = await Promise.all([
    supabase.from('profiles').select('*').order('created_at'),
    supabase
      .from('metric_snapshots')
      .select('*')
      .order('created_at', { ascending: true }),
  ])

  const profiles = (profilesRes.data ?? []) as Profile[]
  const snapshots = (snapshotsRes.data ?? []) as MetricSnapshot[]

  return (
    <div className="px-4 pt-6">
      <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-5">History</h1>
      <HistoryChart profiles={profiles} snapshots={snapshots} />
      <div className="h-4" />
    </div>
  )
}
