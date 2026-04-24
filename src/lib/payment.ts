import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { getPlanTierFromAmount, type PlanTier } from '@/lib/permissions'

type PaymentStatus = 'paid' | 'failed' | 'pending'

type PaymentUpdateInput = {
  orderId: string
  amount?: number | null
  paymentMethod: 'mpesa' | 'paypal'
  paymentStatus: PaymentStatus
  providerReference?: string | null
  providerPayload?: Record<string, unknown>
}

function getAdminClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase admin credentials not configured')
  }

  return createClient(supabaseUrl, serviceRoleKey)
}

export function getPlanTierFromPaymentAmount(amount?: number | null): PlanTier {
  return getPlanTierFromAmount(amount)
}

export async function promoteOrderPayment(input: PaymentUpdateInput) {
  const supabaseAdmin = getAdminClient()
  const now = new Date().toISOString()

  const { data: order, error: orderError } = await supabaseAdmin
    .from('draft_orders')
    .select('id, user_id, total_amount')
    .eq('id', input.orderId)
    .maybeSingle()

  if (orderError) {
    throw orderError
  }

  if (!order) {
    throw new Error(`Order ${input.orderId} not found`)
  }

  const amount = Number(input.amount ?? order.total_amount ?? 0)
  const planTier = getPlanTierFromPaymentAmount(amount)
  const paid = input.paymentStatus === 'paid'

  const { error: updateOrderError } = await supabaseAdmin
    .from('draft_orders')
    .update({
      payment_method: input.paymentMethod,
      payment_status: input.paymentStatus,
      status: paid ? 'confirmed' : 'reviewing',
      total_amount: amount,
      plan_id: planTier,
      completed_at: paid ? now : null,
      updated_at: now,
    })
    .eq('id', order.id)

  if (updateOrderError) {
    throw updateOrderError
  }

  if (paid) {
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert(
        {
          id: order.user_id,
          payment_status: 'paid',
          plan_tier: planTier,
          plan_expires_at: null,
        },
        { onConflict: 'id' }
      )

    if (profileError) {
      throw profileError
    }
  }

  return {
    orderId: order.id,
    userId: order.user_id,
    planTier,
    amount,
    paid,
  }
}
