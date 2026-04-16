/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/paypal/capture/route.ts
import { NextResponse } from 'next/server'

// ✅ Lazy-load Supabase admin client only when needed (not at build time)
const getSupabaseAdmin = async () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!url || !key) {
    console.error('❌ Missing Supabase admin credentials:', {
      hasUrl: !!url,
      hasKey: !!key
    })
    throw new Error('Supabase admin credentials not configured')
  }
  
  // Dynamic import to avoid bundling issues at build time
  const { createClient } = await import('@supabase/supabase-js')
  return createClient(url, key)
}

const PAYPAL_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com'

const getPayPalAccessToken = async () => {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('PayPal credentials not configured')
  }

  const token = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${token}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`PayPal auth failed: ${error.error_description}`)
  }

  const data = await response.json()
  return data.access_token
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    const orderId = searchParams.get('orderId')

    if (!token || !orderId) {
      return NextResponse.redirect(
        new URL('/checkout?error=missing_params', request.url)
      )
    }

    // ✅ Get PayPal access token
    const accessToken = await getPayPalAccessToken()

    // Capture the payment
    const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${token}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('PayPal capture error:', error)
      return NextResponse.redirect(
        new URL('/checkout?error=capture_failed', request.url)
      )
    }

    const captureData = await response.json()
    const paymentStatus = captureData.status

    // ✅ Only initialize Supabase admin client AFTER we know payment succeeded
    const supabaseAdmin = await getSupabaseAdmin()

    // Update your database
     
    const updateData: Record<string, any> = {
      payment_status: paymentStatus === 'COMPLETED' ? 'paid' : 'failed',
      payment_method: 'paypal',
      paypal_order_id: captureData.id,
      paypal_capture_id: captureData.purchase_units?.[0]?.payments?.captures?.[0]?.id,
      updated_at: new Date().toISOString()
    }

    if (paymentStatus === 'COMPLETED') {
      updateData.status = 'confirmed'
      updateData.completed_at = new Date().toISOString()
    }

    await supabaseAdmin
      .from('draft_orders')
      .update(updateData)
      .eq('id', orderId)

    // Redirect to confirmation page
    const redirectUrl = paymentStatus === 'COMPLETED'
      ? `/confirmation?orderId=${orderId}&payment=paypal`
      : `/checkout?orderId=${orderId}&error=payment_failed`

    return NextResponse.redirect(new URL(redirectUrl, request.url))

  } catch (error: any) {
    console.error('PayPal capture error:', error)
    
    // Graceful fallback: redirect to checkout with error
    return NextResponse.redirect(
      new URL('/checkout?error=system_error', request.url)
    )
  }
}