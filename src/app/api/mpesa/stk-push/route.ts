import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing required environment variables')
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

export async function POST(request: Request) {
  try {
    const { orderId, phoneNumber } = await request.json()

    if (!orderId || !phoneNumber) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate phone format
    const phoneRegex = /^254[71]\d{8}$/
    if (!phoneRegex.test(phoneNumber)) {
      return NextResponse.json(
        { error: 'Invalid phone format. Use 2547XXXXXXXX' },
        { status: 400 }
      )
    }

    await supabaseAdmin
      .from('draft_orders')
      .update({ 
        payment_status: 'pending',
        payment_method: 'mpesa',
        payment_phone: phoneNumber,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)

    return NextResponse.json({ 
      success: true, 
      message: 'STK Push sent. Check your phone.',
      orderId
    })

  } catch (error) {
    console.error('M-Pesa API error:', error)
    
    let message = 'Payment initiation failed'
    if (error instanceof Error) {
      message = error.message
    }

    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}