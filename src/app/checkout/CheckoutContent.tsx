'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { FaPhone, FaLock, FaCheckCircle, FaSpinner } from 'react-icons/fa'

export default function CheckoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = searchParams?.get('orderId')
  
  const [isMounted, setIsMounted] = useState(false)
  const [phone, setPhone] = useState('')
  const [processing, setProcessing] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setIsMounted(true)
    
    return () => {
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const safePush = useCallback((path: string) => {
    if (isMounted) router.push(path)
  }, [isMounted, router])

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '')
    
    if (digits.startsWith('07') || digits.startsWith('01')) {
      return '254' + digits.slice(1)
    }
    if (digits.startsWith('7') || digits.startsWith('1')) {
      return '254' + digits
    }
    if (digits.startsWith('254')) {
      return digits
    }
    return digits
  }

  const isValidKenyanPhone = (phone: string): boolean => {
    return /^254[71]\d{8}$/.test(phone)
  }

  const handleMpesaPayment = async () => {
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
          amount: 2499,
          accountReference: `LEGACY-${orderId.slice(0, 8).toUpperCase()}`,
          transactionDesc: 'Legacy Album Order'
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Payment initiation failed')
      }

      const supabase = createClient()
      
      checkIntervalRef.current = setInterval(async () => {
        const { data: paymentData, error: paymentError } = await supabase
          .from('draft_orders')
          .select('payment_status')
          .eq('id', orderId)
          .single()

        if (paymentError) {
          console.error('Polling error:', paymentError)
          return
        }

        if (paymentData?.payment_status === 'paid') {
          if (checkIntervalRef.current) clearInterval(checkIntervalRef.current)
          if (timeoutRef.current) clearTimeout(timeoutRef.current)
          
          setPaymentStatus('success')
          
          setTimeout(() => {
            safePush(`/confirmation?orderId=${orderId}`)
          }, 2000)
        }
      }, 3000)

      timeoutRef.current = setTimeout(() => {
        if (checkIntervalRef.current) clearInterval(checkIntervalRef.current)
        
        setPaymentStatus(current => {
          if (current === 'pending') {
            setErrorMessage('Payment pending. Check your phone for the M-Pesa prompt.')
            return 'error'
          }
          return current
        })
      }, 120000)

    } catch (error) {
      let message = 'Could not initiate payment. Please try again.'
      if (error instanceof Error) {
        message = error.message
      }
      console.error('M-Pesa error:', error)
      setErrorMessage(message)
      setPaymentStatus('error')
    } finally {
      setProcessing(false)
    }
  }

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
        
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaLock className="w-8 h-8 text-green-400" />
          </div>
          <h1 className="text-2xl font-bold">Secure Checkout</h1>
          <p className="text-gray-400 mt-1">Pay with M-Pesa</p>
        </div>

        <div className="glass rounded-2xl p-6 mb-6">
          <h2 className="font-semibold mb-4">Order Summary</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Album Template</span>
              <span className="text-white">Classic Grid</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Photos</span>
              <span className="text-white">10</span>
            </div>
            <div className="flex justify-between pt-3 border-t border-white/10 font-bold">
              <span>Total</span>
              <span className="text-cyan-400">KES 2,499</span>
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl p-6 mb-6">
          <label className="block text-sm font-medium mb-2 items-center gap-2">
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

        <button
          onClick={handleMpesaPayment}
          disabled={processing || paymentStatus === 'success' || !phone}
          className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all ${
            paymentStatus === 'success'
              ? 'bg-green-600 text-white cursor-default'
              : processing
              ? 'bg-cyan-500/50 text-white cursor-wait'
              : 'bg-linear-to-r from-cyan-500 to-cyan-600 text-slate-900 hover:scale-[1.02] shadow-lg shadow-cyan-500/25'
          }`}
        >
          {processing ? (
            <>
              <FaSpinner className="animate-spin" /> Checking Payment...
            </>
          ) : paymentStatus === 'success' ? (
            <>
              <FaCheckCircle /> Paid Successfully
            </>
          ) : (
            <>
              Pay KES 2,499 with M-Pesa
            </>
          )}
        </button>

        <p className="text-center text-xs text-gray-500 mt-6 flex items-center justify-center gap-1">
          <FaLock className="w-3 h-3" />
          Secured by M-Pesa & Supabase
        </p>

      </div>
    </div>
  )
}