// src/app/api/paypal/capture/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ✅ FIX: Removed trailing spaces from both URLs
const PAYPAL_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ✅ FIX: Added credential check + response.ok guard (was silently returning undefined as token)
async function getPayPalAccessToken(): Promise<string> {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('PayPal credentials not configured')
  }

  const token = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${token}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`PayPal auth failed: ${error.error_description}`)
  }

  const data = await response.json()
  return data.access_token
}

// ✅ FIX: Replaced Record<string, any> with a proper interface
interface OrderUpdatePayload {
  payment_status: 'paid' | 'failed'
  payment_method: 'paypal'
  paypal_order_id: string
  paypal_capture_id: string | undefined
  updated_at: string
  status?: 'confirmed'
  completed_at?: string
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    const orderId = searchParams.get('orderId')

    if (!token || !orderId) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/checkout?error=missing_params`
      )
    }

    const accessToken = await getPayPalAccessToken()

    const response = await fetch(
      `${PAYPAL_BASE_URL}/v2/checkout/orders/${token}/capture`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      const error = await response.json()
      console.error('PayPal capture error:', error)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/checkout?error=capture_failed`
      )
    }

    const captureData = await response.json()
    const paymentStatus: string = captureData.status

    const updateData: OrderUpdatePayload = {
      payment_status: paymentStatus === 'COMPLETED' ? 'paid' : 'failed',
      payment_method: 'paypal',
      paypal_order_id: captureData.id,
      paypal_capture_id:
        captureData.purchase_units?.[0]?.payments?.captures?.[0]?.id,
      updated_at: new Date().toISOString(),
    }

    if (paymentStatus === 'COMPLETED') {
      updateData.status = 'confirmed'
      updateData.completed_at = new Date().toISOString()
    }

    await supabaseAdmin
      .from('draft_orders')
      .update(updateData)
      .eq('id', orderId)

    const redirectUrl =
      paymentStatus === 'COMPLETED'
        ? `${process.env.NEXT_PUBLIC_APP_URL}/confirmation?orderId=${orderId}&payment=paypal`
        : `${process.env.NEXT_PUBLIC_APP_URL}/checkout?orderId=${orderId}&error=payment_failed`

    return NextResponse.redirect(redirectUrl)
  } catch (error) {
    console.error('PayPal capture error:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/checkout?error=system_error`
    )
  }
}