import { createClient } from '@/lib/supabase/server'
import { resolvePlanTier, type UserPlan } from '@/lib/permissions'

export async function getUserPlan(userId?: string): Promise<UserPlan> {
  const supabase = await createClient()
  const authResult = await supabase.auth.getUser()
  const targetUserId = userId ?? authResult.data.user?.id

  if (!targetUserId) {
    return {
      planTier: 'free',
      isPaid: false,
      expiresAt: null,
    }
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('plan_tier, payment_status, plan_expires_at')
    .eq('id', targetUserId)
    .maybeSingle()

  if (error) {
    console.error('[permissions] Failed to load profile plan', error)
    return {
      planTier: 'free',
      isPaid: false,
      expiresAt: null,
    }
  }

  const planTier = resolvePlanTier(profile?.plan_tier)
  const expiresAt = profile?.plan_expires_at ?? null
  const isExpired =
    typeof expiresAt === 'string' && new Date(expiresAt).getTime() < Date.now()

  return {
    planTier: isExpired ? 'free' : planTier,
    isPaid: profile?.payment_status === 'paid' && !isExpired,
    expiresAt,
  }
}
