// src/app/api/mpesa/stk-push/route.ts
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { orderId, phoneNumber, amount } = await request.json()
    
    console.log('📥 M-Pesa STK Push request:', { orderId, phoneNumber, amount })
    
    // ✅ Validate required fields
    if (!orderId || !phoneNumber || !amount) {
      return NextResponse.json({ error: 'Missing required fields: orderId, phoneNumber, amount' }, { status: 400 })
    }
    
    // ✅ Format phone number to 2547XXXXXXXX format
    const formattedPhone = phoneNumber.startsWith('254') 
      ? phoneNumber 
      : `254${phoneNumber.replace(/^0/, '')}`
    
    // ✅ Validate phone number format
    if (!/^254[71]\d{8}$/.test(formattedPhone)) {
      return NextResponse.json({ error: 'Invalid Kenyan phone number format' }, { status: 400 })
    }
    
    // ✅ For testing: simulate successful STK Push without calling Daraja API
    console.log('📱 M-Pesa STK Push simulated:', {
      orderId,
      phone: formattedPhone,
      amount: Number(amount)
    })
    
    // ✅ Update order in database (only if Supabase is configured)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (supabaseUrl && supabaseKey) {
      const { createClient } = await import('@supabase/supabase-js')
      const supabaseAdmin = createClient(supabaseUrl, supabaseKey)
      
      const { error: updateError } = await supabaseAdmin
        .from('draft_orders')
        .update({ 
          payment_method: 'mpesa',
          payment_status: 'pending',
          mpesa_phone: formattedPhone,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
      
      if (updateError) {
        console.error('⚠️ Failed to update order (non-critical):', updateError)
        // Continue anyway - payment can still complete via callback
      }
    } else {
      console.log('⚠️ Supabase admin credentials not configured - skipping DB update (testing mode)')
    }
    
    // ✅ Return success response (simulated)
    return NextResponse.json({
      success: true,
      message: 'STK Push sent. Check your phone to complete payment.',
      merchantRequestID: `MERCH-${Date.now()}`,
      checkoutRequestID: `CHK-${Date.now()}`,
    })
    
  } catch (error) {
    console.error('❌ M-Pesa API error:', error)
    return NextResponse.json(
      { error: 'Failed to initiate M-Pesa payment' },
      { status: 500 }
    )
  }
}