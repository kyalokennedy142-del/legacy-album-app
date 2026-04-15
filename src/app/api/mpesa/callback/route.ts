// src/app/api/mpesa/callback/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ✅ FIX: Types only - no runtime checks at module level
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

interface OrderUpdateData {
  payment_status: 'paid' | 'failed'
  payment_result_code: number
  payment_result_desc: string
  // ✅ FIX: Removed updated_at - column doesn't exist in your DB
  completed_at?: string
  status?: 'confirmed'
}

export async function POST(request: Request) {
  // ✅ FIX: Lazy initialization - only check/create when request comes in
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing required environment variables')
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    )
  }

  // Create client inside handler
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)
  
  try {
    const body: SafaricomCallbackBody = await request.json()
    
    const { Body } = body
    const { stkCallback } = Body || {}
    
    if (!stkCallback) {
      console.warn('Invalid callback format received:', body)
      return NextResponse.json({ error: 'Invalid callback format' }, { status: 400 })
    }

    const { CheckoutRequestID, ResultCode, ResultDesc } = stkCallback
    const isSuccess = ResultCode === 0

    // Find order
    const { data: orderData, error: fetchError } = await supabaseAdmin
      .from('draft_orders')
      .select('id, user_id')
      .eq('mpesa_checkout_id', CheckoutRequestID)
      .single()

    if (fetchError) {
      console.error('Database error fetching order:', fetchError)
      return NextResponse.json({ message: 'Error processed' }, { status: 200 })
    }

    if (!orderData) {
      console.warn('Callback received for unknown CheckoutRequestID:', CheckoutRequestID)
      return NextResponse.json({ message: 'Order not found' }, { status: 200 })
    }

    // ✅ FIX: Removed updated_at from update data
    const updateData: OrderUpdateData = {
      payment_status: isSuccess ? 'paid' : 'failed',
      payment_result_code: ResultCode,
      payment_result_desc: ResultDesc
    }

    if (isSuccess) {
      updateData.completed_at = new Date().toISOString()
      updateData.status = 'confirmed'
    }

    // Update order
    const { error: updateError } = await supabaseAdmin
      .from('draft_orders')
      .update(updateData)
      .eq('id', orderData.id)

    if (updateError) {
      console.error('Failed to update order status:', updateError)
      return NextResponse.json({ message: 'Error processed' }, { status: 200 })
    }

    if (isSuccess) {
      console.log(`✅ Payment confirmed for order ${orderData.id}`)
    } else {
      console.log(`❌ Payment failed for order ${orderData.id}: ${ResultDesc}`)
    }

    return NextResponse.json({ message: 'Callback processed' })

  } catch (error) {
    console.error('M-Pesa callback error:', error)
    
    let message = 'Unknown error'
    if (error instanceof Error) {
      message = error.message
    }
    
    return NextResponse.json({ message: 'Error processed', error: message }, { status: 200 })
  }
}