// src/app/api/mpesa/stk-push/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  // ✅ FIX: Lazy initialization - move inside handler
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing required environment variables')
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    )
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)
  
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

    // ✅ FIX: Check update result and remove updated_at
    const { error: updateError } = await supabaseAdmin
      .from('draft_orders')
      .update({ 
        payment_status: 'pending',
        payment_method: 'mpesa',
        payment_phone: phoneNumber
        // ✅ Removed: updated_at doesn't exist in your DB
      })
      .eq('id', orderId)

    if (updateError) {
      console.error('Database update failed:', updateError)
      return NextResponse.json(
        { error: 'Failed to update order status' },
        { status: 500 }
      )
    }

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