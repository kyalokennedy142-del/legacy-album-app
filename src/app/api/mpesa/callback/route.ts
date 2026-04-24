import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { promoteOrderPayment } from '@/lib/payment'

interface StkCallback {
  CheckoutRequestID: string
  ResultCode: number
  ResultDesc: string
  CallbackMetadata?: {
    Item: Array<{
      Name: string
      Value: string | number
    }>
  }
}

interface SafaricomCallbackBody {
  Body?: {
    stkCallback?: StkCallback
  }
}

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase admin credentials not configured')
  }

  return createClient(supabaseUrl, serviceRoleKey)
}

function readAmount(callback?: StkCallback): number | null {
  const amountItem = callback?.CallbackMetadata?.Item?.find((item) => item.Name === 'Amount')
  return amountItem?.Value ? Number(amountItem.Value) : null
}

export async function POST(request: Request) {
  try {
    const body: SafaricomCallbackBody = await request.json()
    const stkCallback = body.Body?.stkCallback

    if (!stkCallback) {
      return NextResponse.json({ error: 'Invalid callback format' }, { status: 400 })
    }

    const supabaseAdmin = getAdminClient()
    const { data: order, error: orderLookupError } = await supabaseAdmin
      .from('draft_orders')
      .select('id')
      .eq('mpesa_checkout_id', stkCallback.CheckoutRequestID)
      .maybeSingle()

    if (orderLookupError) {
      console.error('[mpesa] Failed to find order', orderLookupError)
      return NextResponse.json({ message: 'Callback processed' }, { status: 200 })
    }

    if (!order?.id) {
      console.warn('[mpesa] Unknown CheckoutRequestID', stkCallback.CheckoutRequestID)
      return NextResponse.json({ message: 'Order not found' }, { status: 200 })
    }

    await promoteOrderPayment({
      orderId: order.id,
      amount: readAmount(stkCallback),
      paymentMethod: 'mpesa',
      paymentStatus: stkCallback.ResultCode === 0 ? 'paid' : 'failed',
      providerReference: stkCallback.CheckoutRequestID,
      providerPayload: {
        resultCode: stkCallback.ResultCode,
        resultDesc: stkCallback.ResultDesc,
      },
    })

    return NextResponse.json({ message: 'Callback processed' })
  } catch (error) {
    console.error('[mpesa] callback error', error)
    return NextResponse.json({ message: 'Callback processed' }, { status: 200 })
  }
}
