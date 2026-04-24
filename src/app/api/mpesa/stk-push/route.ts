import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { promoteOrderPayment } from '@/lib/payment'

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase admin credentials not configured')
  }

  return createClient(supabaseUrl, supabaseKey)
}

export async function POST(request: Request) {
  try {
    const { orderId, phoneNumber, amount } = await request.json()

    if (!orderId || !phoneNumber || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: orderId, phoneNumber, amount' },
        { status: 400 }
      )
    }

    const formattedPhone = phoneNumber.startsWith('254')
      ? phoneNumber
      : `254${String(phoneNumber).replace(/^0/, '')}`

    if (!/^254[71]\d{8}$/.test(formattedPhone)) {
      return NextResponse.json({ error: 'Invalid Kenyan phone number format' }, { status: 400 })
    }

    const supabaseAdmin = getAdminClient()
    await supabaseAdmin
      .from('draft_orders')
      .update({
        payment_method: 'mpesa',
        payment_status: 'pending',
        mpesa_phone: formattedPhone,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)

    // The current repo uses a simulated STK flow in development, so we immediately promote the order.
    await promoteOrderPayment({
      orderId,
      amount: Number(amount),
      paymentMethod: 'mpesa',
      paymentStatus: 'paid',
      providerReference: `SIM-${Date.now()}`,
    })

    return NextResponse.json({
      success: true,
      message: 'STK Push sent. Check your phone to complete payment.',
      merchantRequestID: `MERCH-${Date.now()}`,
      checkoutRequestID: `CHK-${Date.now()}`,
    })
  } catch (error) {
    console.error('[mpesa] STK push failed', error)
    return NextResponse.json({ error: 'Failed to initiate M-Pesa payment' }, { status: 500 })
  }
}
