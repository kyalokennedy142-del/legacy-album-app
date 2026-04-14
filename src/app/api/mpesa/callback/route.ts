// src/app/api/mpesa/callback/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ✅ FIX: Define proper types for Safaricom callback
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
  updated_at: string
  completed_at?: string
  status?: 'confirmed'
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing required environment variables')
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

export async function POST(request: Request) {
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

    // ✅ FIX: Proper destructuring with error handling
    const { data: orderData, error: fetchError } = await supabaseAdmin
      .from('draft_orders')
      .select('id, user_id')
      .eq('mpesa_checkout_id', CheckoutRequestID)
      .single()

    if (fetchError) {
      console.error('Database error fetching order:', fetchError)
      // Return 200 to prevent Safaricom retries, but log the error
      return NextResponse.json({ message: 'Error processed' }, { status: 200 })
    }

    if (!orderData) {
      console.warn('Callback received for unknown CheckoutRequestID:', CheckoutRequestID)
      return NextResponse.json({ message: 'Order not found' }, { status: 200 })
    }

    // ✅ FIX: Strongly typed update data
    const updateData: OrderUpdateData = {
      payment_status: isSuccess ? 'paid' : 'failed',
      payment_result_code: ResultCode,
      payment_result_desc: ResultDesc,
      updated_at: new Date().toISOString()
    }

    if (isSuccess) {
      updateData.completed_at = new Date().toISOString()
      updateData.status = 'confirmed'
    }

    // ✅ FIX: Check update result
    const { error: updateError } = await supabaseAdmin
      .from('draft_orders')
      .update(updateData)
      .eq('id', orderData.id)

    if (updateError) {
      console.error('Failed to update order status:', updateError)
      // Still return 200 to prevent Safaricom retry loops
      return NextResponse.json({ message: 'Error processed' }, { status: 200 })
    }

    // Optional: Send confirmation notification
    if (isSuccess) {
      try {
        // await sendOrderConfirmation(orderData.user_id, orderData.id)
        console.log(`✅ Payment confirmed for order ${orderData.id}`)
      } catch (notifyError) {
        // Log but don't fail the callback - payment is already recorded
        console.error('Notification failed:', notifyError)
      }
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
    
    // Still return 200 to avoid Safaricom retry loops
    return NextResponse.json({ message: 'Error processed', error: message }, { status: 200 })
  }
}