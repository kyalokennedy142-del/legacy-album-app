'use client'

export const dynamic = 'force-dynamic'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  FaBox,
  FaCheckCircle,
  FaLock,
  FaPaypal,
  FaPhone,
  FaSpinner,
  FaTruck,
  FaWhatsapp,
} from 'react-icons/fa'
import { createClient } from '@/lib/supabase/client'
import UpgradeModal from '@/components/UpgradeModal'
import PayPalButton from '@/components/PayPalButton'

type PaymentMethod = 'mpesa' | 'paypal' | 'cod' | 'place-order'

export default function CheckoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = searchParams?.get('orderId')
  const showUpgrade = searchParams?.get('upgrade') === '1'
  const [activeMethod, setActiveMethod] = useState<PaymentMethod>('mpesa')
  const [isMounted, setIsMounted] = useState(false)
  const [phone, setPhone] = useState('')
  const [processing, setProcessing] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [orderPrice, setOrderPrice] = useState<number>(7500)
  const [orderPlan, setOrderPlan] = useState('legacy')
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!orderId) {
      return
    }

    const loadOrder = async () => {
      const { data } = await supabase
        .from('draft_orders')
        .select('total_amount, plan_id')
        .eq('id', orderId)
        .maybeSingle()

      if (data?.total_amount) {
        setOrderPrice(data.total_amount)
      }
      if (data?.plan_id) {
        setOrderPlan(data.plan_id)
      }
    }

    void loadOrder()
  }, [orderId, supabase])

  const safePush = useCallback(
    (path: string) => {
      if (isMounted) {
        router.push(path)
      }
    },
    [isMounted, router]
  )

  const formatPhone = useCallback((value: string) => {
    const digits = value.replace(/\D/g, '')
    if (digits.startsWith('07') || digits.startsWith('01')) return `254${digits.slice(1)}`
    if (digits.startsWith('7') || digits.startsWith('1')) return `254${digits}`
    return digits
  }, [])

  const isValidKenyanPhone = useCallback((value: string) => /^254[71]\d{8}$/.test(value), [])

  const updateOrder = useCallback(
    async (updateData: Record<string, unknown>) => {
      const { error } = await supabase.from('draft_orders').update(updateData).eq('id', orderId!)
      if (error) {
        throw error
      }
    },
    [orderId, supabase]
  )

  const handleMpesaPayment = useCallback(async () => {
    if (!orderId || !phone) {
      return
    }

    const formattedPhone = formatPhone(phone)
    if (!isValidKenyanPhone(formattedPhone)) {
      setErrorMessage('Please enter a valid Kenyan phone number, for example 0712 345 678.')
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
      if (!response.ok) {
        throw new Error(result.error || 'Payment initiation failed')
      }

      setPaymentStatus('success')
      window.setTimeout(() => safePush(`/confirmation?orderId=${orderId}&payment=mpesa`), 2000)
    } catch (error) {
      setPaymentStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'Could not initiate M-Pesa payment.')
    } finally {
      setProcessing(false)
    }
  }, [formatPhone, isValidKenyanPhone, orderId, orderPrice, phone, safePush])

  const handlePlaceOrder = useCallback(async () => {
    if (!orderId) {
      return
    }

    setProcessing(true)
    setErrorMessage('')

    try {
      await updateOrder({
        payment_method: 'place-order',
        payment_status: 'pending',
        status: 'placed',
        updated_at: new Date().toISOString(),
      })
      safePush(`/confirmation?orderId=${orderId}&payment=placed`)
    } catch (error) {
      console.error('Place order failed', error)
      setErrorMessage('Could not place order. Please try again.')
    } finally {
      setProcessing(false)
    }
  }, [orderId, safePush, updateOrder])

  const handleCodPayment = useCallback(async () => {
    if (!orderId) {
      return
    }

    setProcessing(true)
    setErrorMessage('')

    try {
      await updateOrder({
        payment_method: 'cod',
        payment_status: 'pending',
        status: 'confirmed',
        updated_at: new Date().toISOString(),
      })
      safePush(`/confirmation?orderId=${orderId}&payment=cod`)
    } catch (error) {
      console.error('COD payment failed', error)
      setErrorMessage('Could not confirm order. Please try again.')
    } finally {
      setProcessing(false)
    }
  }, [orderId, safePush, updateOrder])

  const formatPrice = (amount: number) => `KES ${amount.toLocaleString('en-KE')}`

  if (!isMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-900 via-slate-950 to-black text-white">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-950 to-black px-4 py-12 text-white">
      <div className={`mx-auto max-w-md ${showUpgrade ? 'pointer-events-none blur-[2px]' : ''}`}>
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
            <FaLock className="h-8 w-8 text-green-400" />
          </div>
          <h1 className="text-2xl font-bold">Secure Checkout</h1>
          <p className="mt-1 text-gray-400">Choose your preferred payment method</p>
          <a
            href="tel:*334%23"
            className="mt-3 inline-flex min-h-11 items-center justify-center rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white"
          >
            Open M-Pesa menu (*334#)
          </a>
        </div>

        <div className="glass mb-6 rounded-2xl p-6">
          <h2 className="mb-4 font-semibold">Order Summary</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Plan Tier</span>
              <span className="capitalize text-white">{orderPlan}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Shipping</span>
              <span className="text-white">Nairobi 2-3 days, Rest of Kenya 5-7 days</span>
            </div>
            <div className="flex justify-between border-t border-white/10 pt-3 font-bold">
              <span>Total</span>
              <span className="text-cyan-400">{formatPrice(orderPrice)}</span>
            </div>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {([
            ['mpesa', 'M-Pesa'],
            ['paypal', 'PayPal'],
            ['cod', 'Pay on Delivery'],
            ['place-order', 'Place Order'],
          ] as Array<[PaymentMethod, string]>).map(([method, label]) => (
            <button
              key={method}
              type="button"
              onClick={() => {
                setActiveMethod(method)
                setErrorMessage('')
              }}
              className={`flex-1 rounded-xl py-3 text-sm font-semibold transition-all ${
                activeMethod === method
                  ? 'border border-(--color-gold) bg-[rgba(201,160,80,0.14)] text-(--color-cream)'
                  : 'border border-white/10 bg-white/5 text-gray-400 hover:border-white/20'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {activeMethod === 'mpesa' ? (
          <div className="glass mb-6 rounded-2xl p-6">
            <label className="mb-2 flex items-center gap-2 text-sm font-medium">
              <FaPhone className="text-cyan-400" />
              M-Pesa Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              onBlur={(event) => setPhone(formatPhone(event.target.value))}
              placeholder="0712 345 678"
              className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-gray-500"
              disabled={processing || paymentStatus === 'success'}
            />
            <p className="mt-2 text-xs text-gray-500">
              We&apos;ll send an STK Push to this number so you can approve with your M-Pesa PIN.
            </p>
          </div>
        ) : null}

        {activeMethod === 'paypal' && orderId ? (
          <div className="glass mb-6 rounded-2xl p-6">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-blue-200">
              <FaPaypal className="h-4 w-4" />
              Pay online with PayPal
            </h2>
            <p className="mb-4 text-sm text-gray-300">
              Best for card payments and family members paying from abroad.
            </p>
            <PayPalButton
              orderId={orderId}
              amount={orderPrice}
              onSuccess={() => setPaymentStatus('success')}
              onError={(message) => {
                setErrorMessage(message)
                setPaymentStatus('error')
              }}
            />
          </div>
        ) : null}

        {activeMethod === 'cod' ? (
          <div className="glass mb-6 rounded-2xl p-6">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-orange-300">
              <FaTruck className="h-4 w-4" />
              Pay on Delivery
            </h2>
            <div className="rounded-lg border border-orange-500/30 bg-orange-500/10 p-4 text-sm text-orange-200">
              <p>Free delivery across Kenya.</p>
              <p>Pay with cash or M-Pesa when your album arrives.</p>
            </div>
          </div>
        ) : null}

        {activeMethod === 'place-order' ? (
          <div className="glass mb-6 rounded-2xl p-6">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-purple-300">
              <FaBox className="h-4 w-4" />
              Place Order and Pay Later
            </h2>
            <div className="rounded-lg border border-purple-500/30 bg-purple-500/10 p-4 text-sm text-purple-200">
              <p>No upfront payment required.</p>
              <p>We&apos;ll contact you to finalise payment and delivery.</p>
            </div>
          </div>
        ) : null}

        {errorMessage ? (
          <div className="mb-6 rounded-lg border border-red-500/50 bg-red-500/20 px-4 py-3 text-sm text-red-300">
            {errorMessage}
          </div>
        ) : null}

        {paymentStatus === 'success' ? (
          <div className="mb-6 flex items-center gap-2 rounded-lg border border-green-500/50 bg-green-500/20 px-4 py-3 text-green-300">
            <FaCheckCircle />
            Payment confirmed. Redirecting...
          </div>
        ) : null}

        {activeMethod === 'mpesa' ? (
          <button
            onClick={handleMpesaPayment}
            disabled={processing || paymentStatus === 'success' || !phone}
            className="w-full rounded-xl bg-linear-to-r from-cyan-500 to-cyan-600 py-4 text-lg font-bold text-slate-900 shadow-lg shadow-cyan-500/25 transition-all hover:scale-105 disabled:cursor-wait disabled:opacity-60"
          >
            {processing ? (
              <>
                <FaSpinner className="mr-2 inline animate-spin" />
                Processing...
              </>
            ) : paymentStatus === 'success' ? (
              <>
                <FaCheckCircle className="mr-2 inline" />
                Paid Successfully
              </>
            ) : (
              <>Pay {formatPrice(orderPrice)} with M-Pesa</>
            )}
          </button>
        ) : null}

        {activeMethod === 'cod' ? (
          <button
            onClick={handleCodPayment}
            disabled={processing}
            className="w-full rounded-xl bg-linear-to-r from-orange-500 to-orange-600 py-4 text-lg font-bold text-white shadow-lg shadow-orange-500/25 transition-all hover:scale-105 disabled:opacity-60"
          >
            {processing ? 'Processing...' : 'Confirm Order - Pay on Delivery'}
          </button>
        ) : null}

        {activeMethod === 'place-order' ? (
          <button
            onClick={handlePlaceOrder}
            disabled={processing}
            className="w-full rounded-xl bg-linear-to-r from-purple-500 to-purple-600 py-4 text-lg font-bold text-white shadow-lg shadow-purple-500/25 transition-all hover:scale-105 disabled:opacity-60"
          >
            {processing ? 'Processing...' : 'Place Order - Pay Later'}
          </button>
        ) : null}

        <div className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-gray-500">
          <FaLock className="h-3 w-3" />
          Secured by M-Pesa, PayPal and Supabase
        </div>
        <a
          href="https://wa.me/254740481359?text=Hi%20Legacy%20Album%2C%20I%20need%20help%20with%20checkout."
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex w-full min-h-11 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white"
        >
          <FaWhatsapp />
          Need checkout help on WhatsApp?
        </a>
      </div>

      <UpgradeModal
        isOpen={showUpgrade}
        fromPath={`/checkout${orderId ? `?orderId=${orderId}` : ''}`}
        onClose={() => safePush('/plans')}
        message="Checkout is unlocked after you upgrade, so your payment, shipping, and production details stay tied to a premium plan."
      />
    </div>
  )
}
