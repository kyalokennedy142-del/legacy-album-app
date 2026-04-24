// src/app/api/paypal/create-order/route.ts
import { NextResponse } from 'next/server'

// ✅ FIX: Trim URLs and ensure they're valid
const PAYPAL_BASE_URL = (process.env.NODE_ENV === 'production'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com'
).trim()

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').trim()

async function getPayPalAccessToken(): Promise<string> {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID?.trim()
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET?.trim()

  if (!clientId || !clientSecret) {
    console.error('❌ PayPal credentials not configured')
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

interface PayPalLink {
  rel: string
  href: string
  method?: string
}

export async function POST(request: Request) {
  try {
    const { orderId, amount = 7500, currency = 'KES' } = await request.json()
    
    console.log('📥 PayPal create-order request:', { orderId, amount, currency, appUrl: APP_URL })

    if (!orderId) {
      return NextResponse.json({ error: 'Missing orderId' }, { status: 400 })
    }

    // ✅ FIX: Use USD for testing since KES is not supported in PayPal Sandbox
    const isTestMode = process.env.NODE_ENV !== 'production'
    const paypalCurrency = isTestMode ? 'USD' : currency
    const amountValue = isTestMode 
      ? (Number(amount) / 130).toFixed(2)  // Convert KES to USD for testing (~130 KES = 1 USD)
      : Number(amount).toFixed(2)           // Keep as original currency in production

    // Validate amount is valid
    if (isNaN(Number(amountValue)) || Number(amountValue) <= 0) {
      return NextResponse.json({ error: 'Invalid amount value' }, { status: 400 })
    }

    const accessToken = await getPayPalAccessToken()

    // ✅ FIX: Ensure return_url and cancel_url are valid absolute URLs
    const returnUrl = `${APP_URL}/api/paypal/capture?orderId=${orderId}`
    const cancelUrl = `${APP_URL}/checkout?orderId=${orderId}&cancelled=true`
    
    // ✅ Validate URLs are properly formatted
    try {
      new URL(returnUrl)
      new URL(cancelUrl)
    } catch (urlError) {
      console.error('❌ Invalid redirect URLs:', { returnUrl, cancelUrl, error: urlError })
      return NextResponse.json({ 
        error: 'Invalid redirect URL configuration',
        hint: 'Check NEXT_PUBLIC_APP_URL environment variable'
      }, { status: 500 })
    }
    
    console.log('🔗 PayPal redirect URLs:', { returnUrl, cancelUrl, currency: paypalCurrency, amountValue })

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
              currency_code: paypalCurrency,
              value: amountValue, // ✅ Send as string: "192.31" for 25000 KES in testing
            },
            description: `Legacy Album Order #${orderId?.slice(0, 8)}`,
            custom_id: orderId,
            soft_descriptor: 'LEGACYALBUM',
          },
        ],
        application_context: {
          brand_name: 'Legacy Album',
          locale: 'en-KE',
          shipping_preference: 'NO_SHIPPING',
          user_action: 'PAY_NOW',
          return_url: returnUrl,
          cancel_url: cancelUrl,
          payment_method: {
            payer_selected: 'PAYPAL',
            payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED'
          }
        },
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('❌ PayPal create order error:', {
        status: response.status,
        statusText: response.statusText,
        error
      })
      
      // ✅ Provide more helpful error message
      const errorMessage = error.details?.[0]?.description || error.message || 'Failed to create PayPal order'
      throw new Error(errorMessage)
    }

    const orderData = await response.json()
    console.log('✅ PayPal order created:', orderData.id)

    return NextResponse.json({
      id: orderData.id,
      approveUrl: (orderData.links as PayPalLink[]).find(
        (link) => link.rel === 'approve'
      )?.href,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not initiate PayPal payment'
    console.error('💥 PayPal API error:', {
      message,
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
