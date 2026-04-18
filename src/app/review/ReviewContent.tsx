// src/app/review/ReviewContent.tsx
/* eslint-disable @next/next/no-img-element */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { FaArrowLeft, FaCheck, FaEdit, FaSpinner, FaDownload } from 'react-icons/fa'
import { TEMPLATES } from '@/lib/templates'

type Photo = {
  id: string
  public_url: string
  file_name: string
  caption?: string
  sequence_number: number
}

type DraftOrder = {
  id: string
  template_id: string | null
  status: string
  total_amount: number
  plan_id: string
  created_at: string
  user_id: string
}

type User = {
  id: string
  email: string
  user_metadata: {
    full_name?: string
  }
}

export default function ReviewContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = searchParams?.get('orderId')
  
  const [isMounted, setIsMounted] = useState(false)
  const [order, setOrder] = useState<DraftOrder | null>(null)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const safePush = useCallback((path: string) => {
    if (isMounted) router.push(path)
  }, [isMounted, router])

  // Load order + photos with proper filtering
  useEffect(() => {
    if (!isMounted || !orderId) return

    const supabase = createClient()

    const loadData = async () => {
      try {
        // Get authenticated user
        const { data: { user: userData } } = await supabase.auth.getUser()
        if (!userData) {
          safePush('/auth/login')
          return
        }
        setUser(userData as User)

        // Get order with explicit fields + user_id filter
        const { data: orderData, error: orderError } = await supabase
          .from('draft_orders')
          .select('id, template_id, status, total_amount, plan_id, created_at, user_id')
          .eq('id', orderId)
          .eq('user_id', userData.id)
          .single()

        if (orderError || !orderData) {
          console.error('Order fetch failed:', orderError)
          safePush('/upload')
          return
        }
        setOrder(orderData)

        // Get photos SCOPED to this draft_order_id ONLY
        const { data: photoData, error: photoError } = await supabase
          .from('order_photos')
          .select('id, public_url, file_name, caption, sequence_number')
          .eq('draft_order_id', orderId)
          .order('sequence_number', { ascending: true })

        if (photoError) {
          console.error('Photo fetch failed:', photoError)
          setPhotos([])
        } else {
          setPhotos(photoData || [])
          console.log('✅ Loaded photos for order:', orderId, 'count:', photoData?.length)
        }

      } catch (error) {
        console.error('Failed to load order', error)
        safePush('/upload')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [isMounted, orderId, safePush])

  // Redirect to CHECKOUT for payment
  const handleSubmitOrder = async () => {
    if (!orderId) return
    setSubmitting(true)
    
    try {
      const supabase = createClient()
      // Update status to 'reviewing' (payment pending)
      await supabase
        .from('draft_orders')
        .update({ 
          status: 'reviewing',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)

      // Redirect to checkout for payment
      safePush(`/checkout?orderId=${orderId}`)
      
    } catch (error) {
      console.error('Failed to proceed to payment', error)
      alert('Could not proceed to payment. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const selectedTemplate = order?.template_id 
    ? TEMPLATES.find(t => t.id === order.template_id)
    : null

  // Format price helper
  const formatPrice = (amount: number) => `KES ${amount.toLocaleString()}`

  // Loading state
  if (!isMounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-900 via-slate-950 to-black text-white">
        <div className="text-center">
          <FaSpinner className="w-8 h-8 animate-spin mx-auto mb-4 text-cyan-400" />
          <p className="text-gray-400">Loading your album preview...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (!order || (photos.length === 0 && order.status !== 'draft')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-900 via-slate-950 to-black text-white p-4">
        <div className="text-center glass rounded-2xl p-8 max-w-md">
          <p className="text-lg mb-4">No photos found for this order</p>
          <button
            onClick={() => safePush('/upload')}
            className="px-6 py-3 bg-cyan-500 text-slate-900 rounded-full font-medium hover:bg-cyan-400 transition"
          >
            Upload Photos
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-950 to-black text-white">
      
      {/* Header */}
      <header className="border-b border-white/10 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => safePush('/customize')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition"
          >
            <FaArrowLeft /> Edit
          </button>
          <h1 className="text-xl font-bold">Review Your Album</h1>
          <div className="w-20" />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        
        {/* Plan + Price Summary */}
        <section className="mb-8 glass rounded-2xl p-6">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold">Selected Plan</h2>
            <span className="text-2xl font-bold text-cyan-400">
              {formatPrice(order.total_amount)}
            </span>
          </div>
          <p className="text-gray-300 capitalize">
            {order.plan_id} Tier • {photos.length} photo{photos.length !== 1 ? 's' : ''}
          </p>
        </section>

        
        {/* ✅ Download Receipt Button - Link to receipt page */}
        {selectedTemplate && order && (
          <div className="flex justify-center mb-6">
            <Link
              href={`/orders/${order.id}/receipt`}
              target="_blank"
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-cyan-500 text-slate-900 font-medium hover:bg-cyan-400 transition"
            >
              <FaDownload /> Download Receipt
            </Link>
          </div>
        )}

        {/* PDF Content Preview - What gets printed */}
        <div className="glass rounded-2xl p-6 mb-8 bg-white text-slate-900">
          {/* Header for PDF */}
          <div className="border-b border-gray-200 pb-4 mb-4">
            <h2 className="text-2xl font-bold text-slate-800">Legacy Album Proof</h2>
            <p className="text-slate-500">{selectedTemplate?.name || 'Custom'} Template</p>
            <div className="flex justify-between mt-2 text-xs text-slate-400">
              <span>Order: {order?.id.slice(0, 8)}</span>
              <span>{user?.user_metadata?.full_name || user?.email || 'Customer'}</span>
              <span>{order?.created_at ? new Date(order.created_at).toLocaleDateString('en-KE') : ''}</span>
            </div>
          </div>

          {/* Photo Grid */}
          <h3 className="text-lg font-semibold mb-4 text-slate-800">Your Photos ({photos.length})</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {photos.map((photo, index) => (
              <div key={photo.id} className="relative">
                <img 
                  src={photo.public_url} 
                  alt={photo.file_name}
                  className="w-full h-32 object-cover rounded-lg"
                  crossOrigin="anonymous"
                />
                {photo.caption && (
                  <p className="text-xs text-gray-600 mt-1 italic text-center">
                    &ldquo;{photo.caption}&rdquo;
                  </p>
                )}
                <div className="absolute top-1 right-1 w-5 h-5 bg-cyan-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                  {index + 1}
                </div>
              </div>
            ))}
          </div>

          {/* Footer for PDF */}
          <div className="border-t border-gray-200 pt-4 mt-6 text-center text-xs text-slate-400">
            Legacy Album • Proof for printing • Not for distribution • 
            Generated {new Date().toLocaleDateString()}
          </div>
        </div>

        {/* Order Summary with Dynamic Price */}
        <section className="glass rounded-2xl p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Photos</span>
              <span className="text-white">{photos.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Template</span>
              <span className="text-white">{selectedTemplate?.name || 'None'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Plan</span>
              <span className="text-white capitalize">{order.plan_id}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-white/10">
              <span className="font-medium">Total</span>
              <span className="font-bold text-cyan-400">{formatPrice(order.total_amount)}</span>
            </div>
          </div>
        </section>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => safePush('/customize')}
            disabled={submitting}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white/10 text-white font-medium hover:bg-white/20 transition disabled:opacity-50"
          >
            <FaEdit /> Make Changes
          </button>
          
          {/* Proceed to Payment → goes to /checkout */}
          <button
            onClick={handleSubmitOrder}
            disabled={submitting || photos.length === 0}
            className="flex items-center justify-center gap-2 px-8 py-3 rounded-full bg-linear-to-r from-cyan-500 to-cyan-600 text-slate-900 font-bold hover:scale-105 transition disabled:opacity-50 disabled:hover:scale-100 shadow-lg"
          >
            {submitting ? (
              <>
                <FaSpinner className="animate-spin" /> Processing...
              </>
            ) : (
              <>
                <FaCheck /> Proceed to Payment — {formatPrice(order.total_amount)}
              </>
            )}
          </button>
        </div>

        {/* Trust Badges */}
        <p className="text-center text-xs text-gray-500 mt-8">
          🔒 Secure payment via M-Pesa or PayPal • Free delivery across Kenya
        </p>

      </main>
    </div>
  )
}