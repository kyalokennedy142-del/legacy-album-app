/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { promoteOrderPayment } from '@/lib/payment'

const PAYPAL_BASE_URL =
  process.env.NODE_ENV === 'production'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com'

async function getPayPalAccessToken() {
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
  return data.access_token as string
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    const orderId = searchParams.get('orderId')

    if (!token || !orderId) {
      return NextResponse.redirect(new URL('/checkout?error=missing_params', request.url))
    }

    const accessToken = await getPayPalAccessToken()
    const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${token}/capture`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('[paypal] capture failed', error)
      return NextResponse.redirect(new URL('/checkout?error=capture_failed', request.url))
    }

    const captureData = await response.json()
    const paymentStatus = captureData.status === 'COMPLETED' ? 'paid' : 'failed'
    const amount = Number(captureData.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value ?? 0)

    await promoteOrderPayment({
      orderId,
      amount,
      paymentMethod: 'paypal',
      paymentStatus,
      providerReference: captureData.id,
      providerPayload: captureData,
    })

    const redirectUrl =
      paymentStatus === 'paid'
        ? `/confirmation?orderId=${orderId}&payment=paypal`
        : `/checkout?orderId=${orderId}&error=payment_failed`

    return NextResponse.redirect(new URL(redirectUrl, request.url))
  } catch (error: any) {
    console.error('[paypal] capture error', error)
    return NextResponse.redirect(new URL('/checkout?error=system_error', request.url))
  }
}
