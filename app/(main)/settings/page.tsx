import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SettingsForm from '@/components/SettingsForm'
import PushNotificationToggle from '@/components/PushNotificationToggle'
import type { Profile, MilestoneThresholds } from '@/types'
import { DEFAULT_THRESHOLDS } from '@/lib/constants'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profileRes, settingsRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('app_settings').select('value').eq('key', 'milestone_thresholds').single(),
  ])

  const profile = profileRes.data as Profile | null
  if (!profile) redirect('/setup')

  const thresholds = (settingsRes.data?.value as MilestoneThresholds) ?? DEFAULT_THRESHOLDS

  async function signOut() {
    'use server'
    const supabase = await createServerClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <div className="px-4 pt-6">
      <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-6">Settings</h1>

      {/* Profile */}
      <section className="mb-6">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">You</h2>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full" style={{ backgroundColor: profile.color_hex }} />
          <div>
            <div className="font-semibold text-slate-900">{profile.display_name}</div>
            <div className="text-sm text-slate-400">{user.email}</div>
          </div>
        </div>
      </section>

      {/* Push notifications */}
      <section className="mb-6">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Notifications</h2>
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <PushNotificationToggle />
        </div>
      </section>

      {/* Milestone thresholds */}
      <section className="mb-6">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Milestone Thresholds</h2>
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <p className="text-sm text-slate-500 mb-4">
            A badge fires each time any competitor crosses a multiple of these values.
          </p>
          <SettingsForm thresholds={thresholds} />
        </div>
      </section>

      {/* Sign out */}
      <section className="mb-6">
        <form action={signOut}>
          <button
            type="submit"
            className="w-full py-3 text-red-600 font-medium bg-white rounded-2xl border border-slate-200 active:scale-95 transition-transform"
          >
            Sign out
          </button>
        </form>
      </section>
    </div>
  )
}
