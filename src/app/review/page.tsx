/* eslint-disable @next/next/no-img-element */
 
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { TEMPLATES } from '@/lib/templates'
import { FaArrowLeft, FaCheck, FaEdit, FaSpinner } from 'react-icons/fa'

// ✅ FIXED: Type now matches actual DB column names
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
}

export default function ReviewPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = searchParams?.get('orderId')
  
  const [isMounted, setIsMounted] = useState(false)
  const [order, setOrder] = useState<DraftOrder | null>(null)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // ✅ FIXED: Wrapped in useCallback to prevent stale closure in useEffect
  const safePush = useCallback((path: string) => {
    if (isMounted) router.push(path)
  }, [isMounted, router])

  useEffect(() => {
    if (!isMounted || !orderId) return

    const supabase = createClient()

    const loadData = async () => {
      try {
        // ✅ FIXED: Proper destructuring alias from Supabase response
        const { data: orderData, error: orderError } = await supabase
          .from('draft_orders')
          .select('*')
          .eq('id', orderId)
          .single()

        if (orderError || !orderData) throw orderError
        setOrder(orderData)

        // ✅ FIXED: Proper destructuring alias
        const { data: photoData, error: photoError } = await supabase
          .from('order_photos')
          .select('id, public_url, file_name, caption, sequence_number')
          .eq('draft_order_id', orderId)
          .order('sequence_number', { ascending: true })

        if (photoError) throw photoError
        setPhotos(photoData || [])

      } catch (error) {
        console.error('Failed to load order', error)
        safePush('/upload')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [isMounted, orderId, safePush])

  const handleSubmitOrder = async () => {
    if (!orderId || !order?.template_id) return
    
    setSubmitting(true)
    
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('draft_orders')
        .update({ 
          status: 'submitted',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)

      if (error) throw error

      alert('🎉 Order submitted successfully! We\'ll start printing your album.')
      safePush('/dashboard')
      
    } catch (error) {
      console.error('Submission failed', error)
      alert('Could not submit order. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const selectedTemplate = order?.template_id 
    ? TEMPLATES.find(t => t.id === order.template_id)
    : null

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

  if (!order || photos.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-900 via-slate-950 to-black text-white p-4">
        <div className="text-center glass rounded-2xl p-8 max-w-md">
          <p className="text-lg mb-4">No order found</p>
          <button
            onClick={() => safePush('/upload')}
            className="px-6 py-3 bg-cyan-500 text-slate-900 rounded-full font-medium hover:bg-cyan-400 transition"
          >
            Start Over
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-950 to-black text-white">
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
        <section className="mb-8 glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-2 neon-pink">Selected Template</h2>
          <p className="text-gray-300">
            {selectedTemplate?.name || 'Custom Layout'} — {selectedTemplate?.description || 'No description available'}
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4 neon-cyan">Your Photos ({photos.length})</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {photos.map((photo, index) => (
              // ✅ FIXED: Added 'relative' class for absolute positioning context
              <div key={photo.id} className="glass rounded-xl overflow-hidden group relative">
                <div className="aspect-square relative">
                  {/* ✅ FIXED: Use public_url instead of url */}
                  { }
                  <img 
                    src={photo.public_url} 
                    alt={photo.file_name}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                {photo.caption && (
                  <div className="p-3">
                    <p className="text-sm text-gray-300 italic">&ldquo;{photo.caption}&rdquo;</p>
                  </div>
                )}
                <div className="absolute top-2 right-2 w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center text-xs font-bold text-slate-900">
                  {index + 1}
                </div>
              </div>
            ))}
          </div>
        </section>

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
            <div className="flex justify-between pt-2 border-t border-white/10">
              <span className="font-medium">Estimated Price</span>
              <span className="font-bold text-cyan-400">KES 2,499</span>
            </div>
          </div>
        </section>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => safePush('/customize')}
            disabled={submitting}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white/10 text-white font-medium hover:bg-white/20 transition disabled:opacity-50"
          >
            <FaEdit /> Make Changes
          </button>
          
          <button
            onClick={handleSubmitOrder}
            disabled={submitting}
            className="flex items-center justify-center gap-2 px-8 py-3 rounded-full bg-linear-to-r from-green-500 to-emerald-600 text-white font-bold hover:scale-105 transition disabled:opacity-50 disabled:hover:scale-100 shadow-lg"
          >
            {submitting ? (
              <>
                <FaSpinner className="animate-spin" /> Submitting...
              </>
            ) : (
              <>
                <FaCheck /> Submit Order — KES 2,499
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  )
}