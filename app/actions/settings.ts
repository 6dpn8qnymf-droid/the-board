'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { MilestoneThresholds } from '@/types'

export async function updateMilestoneThresholds(thresholds: MilestoneThresholds): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('app_settings')
    .upsert({ key: 'milestone_thresholds', value: thresholds, updated_at: new Date().toISOString() })

  if (error) return { error: error.message }

  revalidatePath('/settings')
  return { success: true }
}
