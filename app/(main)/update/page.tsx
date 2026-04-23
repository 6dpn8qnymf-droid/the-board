import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import UpdateForm from '@/components/UpdateForm'
import type { MetricSnapshot, Profile } from '@/types'

export const dynamic = 'force-dynamic'

export default async function UpdatePage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/setup')

  const { data: snapshot } = await supabase
    .from('metric_snapshots')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return (
    <div className="px-4 pt-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Update Numbers</h1>
        <p className="text-slate-500 text-sm mt-1">
          Enter your new totals or the change since last time.
        </p>
      </div>
      <UpdateForm profile={profile as Profile} prevSnapshot={snapshot as MetricSnapshot | null} />
    </div>
  )
}
