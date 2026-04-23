'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { DEFAULT_THRESHOLDS, DELTA_COLUMNS, CATEGORIES } from '@/lib/constants'
import { computeLeaders, getTripleCrown } from '@/lib/utils'
import type { Category, SnapshotInput, MetricSnapshot } from '@/types'

type LatestRow = Pick<MetricSnapshot, 'user_id' | 'aum' | 'fee_revenue_ytd' | 'contributions_ytd'>

async function getLatestPerUser(supabase: Awaited<ReturnType<typeof createServerClient>>) {
  const { data: profiles } = await supabase.from('profiles').select('id')
  if (!profiles) return []

  const rows = await Promise.all(
    profiles.map(async (p) => {
      const { data } = await supabase
        .from('metric_snapshots')
        .select('user_id, aum, fee_revenue_ytd, contributions_ytd')
        .eq('user_id', p.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      return data as LatestRow | null
    })
  )
  return rows.filter(Boolean) as LatestRow[]
}

export async function submitSnapshot(input: SnapshotInput): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createServerClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  if (!profile) return { error: 'Profile not found' }

  // Get this user's previous snapshot
  const { data: prev } = await supabase
    .from('metric_snapshots')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const prevAum = prev?.aum ?? 0
  const prevFee = prev?.fee_revenue_ytd ?? 0
  const prevCont = prev?.contributions_ytd ?? 0

  // Compute new totals and deltas
  let newAum = prevAum, newFee = prevFee, newCont = prevCont
  let aumDelta = 0, feeDelta = 0, contDelta = 0

  if (input.aum) {
    if (input.aum.method === 'total') { newAum = input.aum.value; aumDelta = newAum - prevAum }
    else { aumDelta = input.aum.value; newAum = prevAum + aumDelta }
  }
  if (input.fee_revenue_ytd) {
    if (input.fee_revenue_ytd.method === 'total') { newFee = input.fee_revenue_ytd.value; feeDelta = newFee - prevFee }
    else { feeDelta = input.fee_revenue_ytd.value; newFee = prevFee + feeDelta }
  }
  if (input.contributions_ytd) {
    if (input.contributions_ytd.method === 'total') { newCont = input.contributions_ytd.value; contDelta = newCont - prevCont }
    else { contDelta = input.contributions_ytd.value; newCont = prevCont + contDelta }
  }

  if (aumDelta === 0 && feeDelta === 0 && contDelta === 0) {
    return { error: 'No changes detected' }
  }

  // Pre-update leaders
  const preRows = await getLatestPerUser(supabase)
  const preLeaders = computeLeaders(preRows)
  const preTriple = getTripleCrown(preLeaders)

  // Insert snapshot
  const { data: snapshot, error: insertErr } = await supabase
    .from('metric_snapshots')
    .insert({
      user_id: user.id,
      aum: newAum,
      fee_revenue_ytd: newFee,
      contributions_ytd: newCont,
      aum_delta: aumDelta,
      fee_revenue_delta: feeDelta,
      contributions_delta: contDelta,
      note: input.note ?? null,
    })
    .select()
    .single()

  if (insertErr || !snapshot) return { error: 'Failed to save update' }

  // Post-update leaders
  const postRows = await getLatestPerUser(supabase)
  const postLeaders = computeLeaders(postRows)
  const postTriple = getTripleCrown(postLeaders)

  // Get milestone thresholds
  const { data: settingsRow } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'milestone_thresholds')
    .single()
  const thresholds = (settingsRow?.value as typeof DEFAULT_THRESHOLDS) ?? DEFAULT_THRESHOLDS

  const events: Array<{ triggered_by: string; event_type: string; category: string | null; payload: object }> = []

  // Base update event
  events.push({
    triggered_by: user.id,
    event_type: 'update',
    category: null,
    payload: { aum: newAum, fee_revenue_ytd: newFee, contributions_ytd: newCont, aum_delta: aumDelta, fee_revenue_delta: feeDelta, contributions_delta: contDelta },
  })

  // Lead changes
  for (const cat of CATEGORIES) {
    if (preLeaders[cat] !== postLeaders[cat] && postLeaders[cat] !== null) {
      events.push({
        triggered_by: user.id,
        event_type: 'lead_change',
        category: cat,
        payload: { new_leader_id: postLeaders[cat], prev_leader_id: preLeaders[cat], new_value: cat === 'aum' ? newAum : cat === 'fee_revenue_ytd' ? newFee : newCont },
      })
    }
  }

  // Milestones
  const metricInfo = [
    { cat: 'aum' as Category, delta: aumDelta, prev: prevAum, next: newAum },
    { cat: 'fee_revenue_ytd' as Category, delta: feeDelta, prev: prevFee, next: newFee },
    { cat: 'contributions_ytd' as Category, delta: contDelta, prev: prevCont, next: newCont },
  ]
  for (const { cat, delta, prev, next } of metricInfo) {
    if (delta > 0) {
      const threshold = thresholds[cat]
      if (Math.floor(next / threshold) > Math.floor(prev / threshold)) {
        events.push({
          triggered_by: user.id,
          event_type: 'milestone',
          category: cat,
          payload: { milestone_value: Math.floor(next / threshold) * threshold, actual_value: next },
        })
      }
    }
  }

  // Personal bests (only if there's a prior delta to beat)
  for (const { cat, delta } of metricInfo) {
    if (delta > 0) {
      const deltaCol = DELTA_COLUMNS[cat]
      const { data: bestRow } = await supabase
        .from('metric_snapshots')
        .select(deltaCol)
        .eq('user_id', user.id)
        .neq('id', snapshot.id)
        .order(deltaCol, { ascending: false })
        .limit(1)
        .maybeSingle()

      const prevBest = bestRow ? (bestRow as Record<string, number>)[deltaCol] ?? 0 : 0
      if (prevBest > 0 && delta > prevBest) {
        const next = cat === 'aum' ? newAum : cat === 'fee_revenue_ytd' ? newFee : newCont
        events.push({
          triggered_by: user.id,
          event_type: 'personal_best',
          category: cat,
          payload: { delta, prev_best: prevBest, new_total: next },
        })
      }
    }
  }

  // Triple crown gained
  if (postTriple && postTriple !== preTriple) {
    events.push({
      triggered_by: user.id,
      event_type: 'triple_crown',
      category: null,
      payload: { holder_id: postTriple },
    })
  }

  if (events.length > 0) {
    await supabase.from('activity_events').insert(events)
  }

  // Send push notifications for notable events (everything except the base update)
  const notableEvents = events.filter(e => e.event_type !== 'update')
  if (notableEvents.length > 0) {
    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('subscription, user_id')

    const othersubs = (subs ?? []).filter(s => s.user_id !== user.id)
    if (othersubs.length > 0) {
      await Promise.allSettled(
        othersubs.map(s =>
          fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/push/notify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subscription: s.subscription, events: notableEvents, triggeredBy: profile.display_name }),
          })
        )
      )
    }
  }

  revalidatePath('/')
  revalidatePath('/leaderboard')
  revalidatePath('/feed')
  revalidatePath('/history')

  return { success: true }
}
