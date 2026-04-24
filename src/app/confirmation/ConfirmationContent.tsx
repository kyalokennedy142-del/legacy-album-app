// src/app/confirmation/ConfirmationContent.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { FaCheckCircle, FaBox, FaTruck, FaArrowRight } from 'react-icons/fa'

type OrderDetails = {
  id: string
  status: string
  template_id: string | null
  total_amount: number | null
  payment_status: string
  payment_method: string | null
  created_at: string
  completed_at: string | null
}

export default function ConfirmationContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = searchParams?.get('orderId')
  
  const [isMounted, setIsMounted] = useState(false)
  const [order, setOrder] = useState<OrderDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const safePush = useCallback((path: string) => {
    if (isMounted) router.push(path)
  }, [isMounted, router])

  useEffect(() => {
    if (!isMounted || !orderId) return

    const loadOrder = async () => {
      try {
        const supabase = createClient()
        const { data: orderData, error: fetchError } = await supabase
          .from('draft_orders')
          .select('*')
          .eq('id', orderId)
          .single()

        if (fetchError) {
          console.error('Failed to load order:', fetchError)
          setError('Could not load order details.')
          return
        }
        if (orderData) setOrder(orderData)
        else setError('Order not found')
      } catch (err) {
        console.error('Unexpected error:', err)
        setError('An unexpected error occurred')
      } finally {
        setLoading(false)
      }
    }
    loadOrder()
  }, [isMounted, orderId])

  if (!isMounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-900 via-slate-950 to-black text-white">
        <div className="animate-spin h-8 w-8 border-4 border-cyan-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-900 via-slate-950 to-black text-white p-4">
        <div className="text-center glass rounded-2xl p-8 max-w-md">
          <p className="text-lg mb-4 text-red-400">{error || 'Order not found'}</p>
          <button
            onClick={() => safePush('/dashboard')}
            className="px-6 py-3 bg-cyan-500 text-slate-900 rounded-full font-medium hover:bg-cyan-400 transition"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    })
  }

  const isPaid = order.payment_status === 'paid'
  const isConfirmed = order.status === 'confirmed'
  const displayAmount = order.total_amount ? `KES ${order.total_amount.toLocaleString()}` : 'KES 7,500'

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-950 to-black text-white py-12 px-4">
      <div className="max-w-2xl mx-auto">
        
        {/* Success Header */}
        <div className="text-center mb-8 animate-slide-down">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaCheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <h1 className="text-3xl font-bold mb-2 neon-pink">
            {isConfirmed ? 'Order Confirmed! 🎉' : 'Payment Received ✅'}
          </h1>
          <p className="text-gray-400">
            {isConfirmed 
              ? "Your album is now in production. We'll notify you when it ships."
              : "We're confirming your payment. You'll receive a confirmation email shortly."
            }
          </p>
        </div>

        {/* Order Details */}
        <div className="glass rounded-2xl p-6 mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FaBox className="text-cyan-400" />
            Order Details
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-white/10">
              <span className="text-gray-400">Order ID</span>
              <span className="font-mono text-cyan-400">{order.id.slice(0, 8)}...</span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/10">
              <span className="text-gray-400">Date</span>
              <span className="text-white">{formatDate(order.created_at)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/10">
              <span className="text-gray-400">Template</span>
              <span className="text-white capitalize">{order.template_id?.replace(/-/g, ' ') || 'Custom'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/10">
              <span className="text-gray-400">Payment</span>
              <span className={`font-medium ${isPaid ? 'text-green-400' : 'text-yellow-400'}`}>
                {isPaid ? `Paid via ${order.payment_method?.toUpperCase() || 'M-Pesa'}` : 'Pending'}
              </span>
            </div>
            <div className="flex justify-between py-2 pt-3 font-bold">
              <span>Total</span>
              <span className="text-cyan-400">{displayAmount}</span>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="glass rounded-2xl p-6 mb-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FaTruck className="text-cyan-400" />
            What Happens Next
          </h2>
          <div className="space-y-4">
            {[
              { icon: FaCheckCircle, label: 'Order Confirmed', done: true },
              { icon: FaBox, label: 'Album in Production', done: isConfirmed },
              { icon: FaTruck, label: 'Shipped to Your Address', done: false },
              { icon: FaCheckCircle, label: 'Delivered in 7-10 Days', done: false }
            ].map((step, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                  step.done ? 'bg-green-500 text-slate-900' : 'bg-white/10 text-gray-400'
                }`}>
                  <step.icon className="w-3 h-3" />
                </div>
                <div>
                  <p className={`text-sm font-medium ${step.done ? 'text-white' : 'text-gray-400'}`}>
                    {step.label}
                  </p>
                  {index < 3 && <div className="w-0.5 h-6 bg-white/10 ml-3 mt-1" />}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <button
            onClick={() => safePush('/dashboard')}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white/10 text-white font-medium hover:bg-white/20 transition"
          >
            <FaArrowRight /> Back to Dashboard
          </button>
          <button
            onClick={() => window.open('https://wa.me/254740481359', '_blank')}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-green-600 text-white font-medium hover:bg-green-700 transition"
          >
            📱 Contact Support
          </button>
        </div>

        <p className="text-center text-xs text-gray-500 mt-8">
          Need help? Email us at{' '}
          <a href="mailto:support@legacyalbum.co.ke" className="text-cyan-400 hover:underline">
            support@legacyalbum.co.ke
          </a>
        </p>

      </div>
    </div>
  )
}
