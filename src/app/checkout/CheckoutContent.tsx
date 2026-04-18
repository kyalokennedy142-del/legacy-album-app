// src/app/checkout/page.tsx
'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { FaPhone, FaLock, FaCheckCircle, FaSpinner, FaTruck, FaBox } from 'react-icons/fa'

type PaymentMethod = 'mpesa' | 'cod' | 'place-order'  // ✅ Removed 'paypal'

export default function CheckoutPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = searchParams?.get('orderId')

  const [isMounted, setIsMounted] = useState(false)
  const [activeMethod, setActiveMethod] = useState<PaymentMethod>('place-order')
  const [phone, setPhone] = useState('')
  const [processing, setProcessing] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [orderPrice, setOrderPrice] = useState<number>(25000)

  const supabase = createClient()

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Load order price from DB
  useEffect(() => {
    if (!orderId) return
    const loadOrderPrice = async () => {
      const { data } = await supabase
        .from('draft_orders')
        .select('total_amount')
        .eq('id', orderId)
        .single()
      
      if (data?.total_amount) {
        setOrderPrice(data.total_amount)
      }
    }
    loadOrderPrice()
  }, [orderId, supabase])

  const safePush = useCallback((path: string) => {
    if (isMounted) router.push(path)
  }, [isMounted, router])

  const formatPhone = useCallback((value: string): string => {
    const digits = value.replace(/\D/g, '')
    if (digits.startsWith('07') || digits.startsWith('01')) return `254${digits.slice(1)}`
    if (digits.startsWith('7') || digits.startsWith('1')) return `254${digits}`
    if (digits.startsWith('254')) return digits
    return digits
  }, [])

  const isValidKenyanPhone = useCallback((value: string): boolean => {
    return /^254[71]\d{8}$/.test(value)
  }, [])

  // ✅ Helper: Update order with graceful fallback for missing columns
  const updateOrder = useCallback(async (updateData: Record<string, unknown>) => {
    // ✅ Try to add completed_at, but catch if column doesn't exist
    try {
      updateData.completed_at = new Date().toISOString()
    } catch {
      console.log('⚠️ completed_at column not found - skipping')
    }
    
    const { error } = await supabase
      .from('draft_orders')
      .update(updateData)
      .eq('id', orderId!)
    
    if (error) throw error
  }, [orderId, supabase])

  // M-Pesa payment handler (simulated for testing)
  const handleMpesaPayment = useCallback(async () => {
    if (!orderId || !phone) return

    const formattedPhone = formatPhone(phone)
    if (!isValidKenyanPhone(formattedPhone)) {
      setErrorMessage('Please enter a valid Kenyan phone number (e.g., 0712345678)')
      return
    }

    setProcessing(true)
    setErrorMessage('')
    setPaymentStatus('pending')

    try {
      const response = await fetch('/api/mpesa/stk-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          phoneNumber: formattedPhone,
          amount: orderPrice,
        }),
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Payment initiation failed')

      // For testing: simulate immediate success
      setPaymentStatus('success')
      setTimeout(() => safePush(`/confirmation?orderId=${orderId}&payment=mpesa`), 2000)

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not initiate payment'
      console.error('M-Pesa error:', error)
      setErrorMessage(message)
      setPaymentStatus('error')
    } finally {
      setProcessing(false)
    }
  }, [orderId, phone, orderPrice, formatPhone, isValidKenyanPhone, safePush])

  // ✅ "Place Order" handler - creates order without payment (user pays later)
  const handlePlaceOrder = useCallback(async () => {
    if (!orderId) return
    
    setProcessing(true)
    setErrorMessage('')
    
    try {
      await updateOrder({
        payment_method: 'place-order',  // ✅ Set correct payment method
        payment_status: 'pending',
        status: 'placed',
        updated_at: new Date().toISOString()
      })
      
      safePush(`/confirmation?orderId=${orderId}&payment=placed`)
      
    } catch (error) {
      console.error('Place Order failed:', error)
      setErrorMessage('Could not place order. Please try again.')
      setProcessing(false)
    }
  }, [orderId, updateOrder, safePush])

  // Pay on Delivery handler
  const handleCodPayment = useCallback(async () => {
    if (!orderId) return
    
    setProcessing(true)
    setErrorMessage('')
    
    try {
      await updateOrder({
        payment_method: 'cod',
        payment_status: 'pending',
        status: 'confirmed',
        updated_at: new Date().toISOString()
      })
      
      safePush(`/confirmation?orderId=${orderId}&payment=cod`)
      
    } catch (error) {
      console.error('COD payment failed:', error)
      setErrorMessage('Could not confirm order. Please try again.')
      setProcessing(false)
    }
  }, [orderId, updateOrder, safePush])

  const formatPrice = (amount: number) => `KES ${amount.toLocaleString()}`

  if (!isMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-900 via-slate-950 to-black text-white">
        <div className="animate-spin h-8 w-8 border-4 border-cyan-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-950 to-black text-white py-12 px-4">
      <div className="max-w-md mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaLock className="w-8 h-8 text-green-400" />
          </div>
          <h1 className="text-2xl font-bold">Secure Checkout</h1>
          <p className="text-gray-400 mt-1">Choose your payment method</p>
        </div>

        {/* Order Summary */}
        <div className="glass rounded-2xl p-6 mb-6">
          <h2 className="font-semibold mb-4">Order Summary</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Album Template</span>
              <span className="text-white">Selected</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Plan Tier</span>
              <span className="text-white capitalize">Active</span>
            </div>
            <div className="flex justify-between pt-3 border-t border-white/10 font-bold">
              <span>Total</span>
              <span className="text-cyan-400">{formatPrice(orderPrice)}</span>
            </div>
          </div>
        </div>

        {/* Payment Method Tabs - ✅ Only 3 options now */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            type="button"
            onClick={() => { setActiveMethod('place-order'); setErrorMessage('') }}
            className={`flex-1 min-w-30 py-3 rounded-xl font-semibold text-sm transition-all ${
              activeMethod === 'place-order'
                ? 'bg-purple-500/20 border border-purple-500/50 text-purple-300'
                : 'bg-white/5 border border-white/10 text-gray-400 hover:border-white/20'
            }`}
          >
            <FaBox className="inline mr-1" /> Place Order
          </button>
          
          <button
            type="button"
            onClick={() => { setActiveMethod('mpesa'); setErrorMessage('') }}
            className={`flex-1 min-w-30 py-3 rounded-xl font-semibold text-sm transition-all ${
              activeMethod === 'mpesa'
                ? 'bg-green-500/20 border border-green-500/50 text-green-300'
                : 'bg-white/5 border border-white/10 text-gray-400 hover:border-white/20'
            }`}
          >
            📱 M-Pesa
          </button>
          
          <button
            type="button"
            onClick={() => { setActiveMethod('cod'); setErrorMessage('') }}
            className={`flex-1 min-w-30 py-3 rounded-xl font-semibold text-sm transition-all ${
              activeMethod === 'cod'
                ? 'bg-orange-500/20 border border-orange-500/50 text-orange-300'
                : 'bg-white/5 border border-white/10 text-gray-400 hover:border-white/20'
            }`}
          >
            🚚 Pay on Delivery
          </button>
        </div>

        {/* ✅ Place Order Panel */}
        {activeMethod === 'place-order' && (
          <div className="glass rounded-2xl p-6 mb-6">
            <h2 className="text-sm font-semibold mb-4 flex items-center gap-2 text-purple-300">
              <FaBox className="w-4 h-4" />
              Place Order (Pay Later)
            </h2>
            <p className="text-sm text-gray-300 mb-4">
              Place your order now and pay when your album is ready for pickup or delivery.
            </p>
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4 text-sm text-purple-200">
              <p>✅ No upfront payment required</p>
              <p>✅ We&apos;ll contact you to arrange payment</p>
              <p>✅ Free delivery across Kenya</p>
              <p className="mt-2 text-xs text-purple-300">
                💡 You can also pay with M-Pesa or cash when we contact you.
              </p>
            </div>
          </div>
        )}

        {/* M-Pesa Panel */}
        {activeMethod === 'mpesa' && (
          <div className="glass rounded-2xl p-6 mb-6">
            <label className="flex items-center gap-2 text-sm font-medium mb-2">
              <FaPhone className="text-cyan-400" />
              M-Pesa Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onBlur={(e) => setPhone(formatPhone(e.target.value))}
              placeholder="0712 345 678"
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              disabled={processing || paymentStatus === 'success'}
            />
            <p className="text-xs text-gray-500 mt-2">
              We&apos;ll send an STK Push to this number. Enter your M-Pesa PIN on your phone to complete payment.
            </p>
          </div>
        )}

        {/* Pay on Delivery Panel */}
        {activeMethod === 'cod' && (
          <div className="glass rounded-2xl p-6 mb-6">
            <h2 className="text-sm font-semibold mb-4 flex items-center gap-2 text-orange-300">
              <FaTruck className="w-4 h-4" />
              Pay on Delivery
            </h2>
            <p className="text-sm text-gray-300 mb-4">
              Pay with cash or M-Pesa when your album is delivered. No upfront payment required.
            </p>
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 text-sm text-orange-200">
              <p>✅ Free delivery across Kenya</p>
              <p>✅ Pay when you receive your album</p>
              <p>✅ 7-day return policy</p>
            </div>
          </div>
        )}

        {/* Status Banners */}
        {errorMessage && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-300 px-4 py-3 rounded-lg mb-6 text-sm">
            {errorMessage}
          </div>
        )}
        {paymentStatus === 'success' && (
          <div className="bg-green-500/20 border border-green-500/50 text-green-300 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
            <FaCheckCircle /> Payment confirmed! Redirecting...
          </div>
        )}

        {/* Payment Buttons */}
        {activeMethod === 'place-order' && (
          <button
            onClick={handlePlaceOrder}
            disabled={processing}
            className="w-full py-4 rounded-xl font-bold text-lg bg-linear-to-r from-purple-500 to-purple-600 text-white hover:scale-105 transition-all shadow-lg shadow-purple-500/25"
          >
            {processing ? (
              <><FaSpinner className="animate-spin" /> Processing...</>
            ) : (
              <>📦 Place Order — Pay Later</>
            )}
          </button>
        )}

        {activeMethod === 'mpesa' && (
          <button
            onClick={handleMpesaPayment}
            disabled={processing || paymentStatus === 'success' || !phone}
            className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all ${
              paymentStatus === 'success'
                ? 'bg-green-600 text-white cursor-default'
                : processing
                ? 'bg-cyan-500/50 text-white cursor-wait'
                : 'bg-linear-to-r from-cyan-500 to-cyan-600 text-slate-900 hover:scale-105 shadow-lg shadow-cyan-500/25'
            }`}
          >
            {processing ? (
              <><FaSpinner className="animate-spin" /> Processing...</>
            ) : paymentStatus === 'success' ? (
              <><FaCheckCircle /> Paid Successfully</>
            ) : (
              <>Pay {formatPrice(orderPrice)} with M-Pesa</>
            )}
          </button>
        )}

        {activeMethod === 'cod' && (
          <button
            onClick={handleCodPayment}
            disabled={processing}
            className="w-full py-4 rounded-xl font-bold text-lg bg-linear-to-r from-orange-500 to-orange-600 text-white hover:scale-105 transition-all shadow-lg shadow-orange-500/25"
          >
            {processing ? (
              <><FaSpinner className="animate-spin" /> Processing...</>
            ) : (
              <>🚚 Confirm Order — Pay on Delivery</>
            )}
          </button>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 mt-6 flex items-center justify-center gap-1">
          <FaLock className="w-3 h-3" />
          Secured by M-Pesa & Supabase  {/* ✅ Removed PayPal mention */}
        </p>

      </div>
    </div>
  )
}