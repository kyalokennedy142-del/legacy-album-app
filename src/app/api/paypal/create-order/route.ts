// src/app/api/paypal/create-order/route.ts
import { NextResponse } from 'next/server'

// ✅ FIX: Removed trailing spaces from both URLs (were breaking every API call)
const PAYPAL_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com'

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

// ✅ FIX: Typed the links array so .rel is accessible without casting to unknown
interface PayPalLink {
  rel: string
  href: string
  method?: string
}

export async function POST(request: Request) {
  try {
    const { orderId, amount = 2499, currency = 'KES' } = await request.json()

    const validAmounts = [2499, 4999, 7499]
    if (!validAmounts.includes(amount)) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    const accessToken = await getPayPalAccessToken()

    const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: currency,
              value: (amount / 100).toFixed(2),
            },
            description: `Legacy Album Order #${orderId?.slice(0, 8)}`,
            custom_id: orderId,
          },
        ],
        application_context: {
          brand_name: 'Legacy Album',
          locale: 'en-KE',
          shipping_preference: 'NO_SHIPPING',
          user_action: 'PAY_NOW',
          return_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/paypal/capture?orderId=${orderId}`,
          cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout?orderId=${orderId}&cancelled=true`,
        },
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('PayPal create order error:', error)
      throw new Error(error.message || 'Failed to create PayPal order')
    }

    const orderData = await response.json()

    return NextResponse.json({
      id: orderData.id,
      approveUrl: (orderData.links as PayPalLink[]).find(
        (link) => link.rel === 'approve'
      )?.href,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not initiate PayPal payment'
    console.error('PayPal API error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}