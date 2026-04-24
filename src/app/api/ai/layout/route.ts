import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateAutoLayout } from '@/lib/ai'
import { resolvePlanTier } from '@/lib/permissions'

export async function POST(request: Request) {
  try {
    const { orderId, planTier } = await request.json()

    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 })
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: order, error: orderError } = await supabase
      .from('draft_orders')
      .select('id, plan_id, user_id')
      .eq('id', orderId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const { data: photos, error: photoError } = await supabase
      .from('order_photos')
      .select('id, file_name, caption, public_url, sequence_number')
      .eq('draft_order_id', orderId)
      .order('sequence_number', { ascending: true })

    if (photoError) {
      return NextResponse.json({ error: 'Could not load photos' }, { status: 500 })
    }

    const layout = await generateAutoLayout(
      (photos ?? []).map((photo) => ({
        id: photo.id,
        fileName: photo.file_name,
        caption: photo.caption,
        publicUrl: photo.public_url,
        sequenceNumber: photo.sequence_number,
      })),
      resolvePlanTier(planTier ?? order.plan_id)
    )

    return NextResponse.json(layout)
  } catch (error) {
    console.error('[ai/layout] failed', error)
    return NextResponse.json({ error: 'Could not generate layout' }, { status: 500 })
  }
}
