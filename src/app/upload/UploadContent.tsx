// src/app/upload/UploadContent.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import PhotoUpload from '@/components/PhotoUpload'
import { FaSpinner, FaExclamationTriangle, FaImages } from 'react-icons/fa'

export const PLAN_LIMITS: Record<string, number> = { 
  'free-trial': 5,
  heritage: 20, 
  legacy: 50, 
  heirloom: Infinity 
}
export const PLAN_PRICES: Record<string, number> = { 
  'free-trial': 0,
  heritage: 15000, 
  legacy: 25000, 
  heirloom: 40000 
}

// ✅ MUST have default export
export default function UploadContent() {
  const router = useRouter()
  const searchParams = useSearchParams()  // ✅ Now safe inside Suspense
  const selectedPlan = ((searchParams?.get('plan') || 'free-trial').toLowerCase().trim()) as 
    | 'free-trial' | 'heritage' | 'legacy' | 'heirloom'
  
  const [userId, setUserId] = useState<string | null>(null)
  const [draftOrderId, setDraftOrderId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const safePush = useCallback((path: string) => {
    try {
      router.push(path)
    } catch {
      if (typeof window !== 'undefined') {
        window.location.href = path
      }
    }
  }, [router])

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !user) {
          setError('Please log in to upload photos')
          setTimeout(() => safePush('/auth/login'), 1500)
          return
        }
        setUserId(user.id)

        const { data, error: insertError } = await supabase
          .from('draft_orders')
          .insert({ 
            user_id: user.id, 
            status: 'draft', 
            plan_id: selectedPlan,
            total_amount: PLAN_PRICES[selectedPlan] || PLAN_PRICES.legacy
          })
          .select('id')
          .single()

        if (insertError || !data?.id) {
          console.error('Failed to create draft order', { error: insertError, selectedPlan })
          setError('Could not start your album. Please try again.')
          return
        }

        setDraftOrderId(data.id)
      } catch (err) {
        console.error('Unexpected error in UploadContent:', err)
        setError('An unexpected error occurred')
      } finally {
        setLoading(false)
      }
    }
    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPlan, safePush])

  const handleUploadComplete = useCallback(() => {
    if (!draftOrderId) {
      setError('Upload session expired. Please restart.')
      return
    }
    safePush(`/gallery?orderId=${draftOrderId}&plan=${selectedPlan}`)
  }, [draftOrderId, selectedPlan, safePush])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-linear-to-br from-slate-900 via-slate-950 to-black">
        <div className="text-center">
          <FaSpinner className="w-8 h-8 animate-spin mx-auto mb-4 text-cyan-400" />
          <p className="text-gray-400">Preparing your upload session...</p>
        </div>
      </div>
    )
  }

  if (error || !userId || !draftOrderId) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-linear-to-br from-slate-900 via-slate-950 to-black p-4">
        <div className="text-center glass rounded-2xl p-8 max-w-md">
          <FaExclamationTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-lg mb-4 text-red-300">{error || 'Session error'}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-cyan-500 text-slate-900 rounded-full font-medium hover:bg-cyan-400 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-950 to-black text-white p-6 pt-24">
      <div className="container mx-auto max-w-4xl">
        
        <div className="text-center mb-12 animate-slide-down">
          <h1 className="text-4xl font-bold mb-4 neon-pink">Upload Your Memories</h1>
          <p className="text-gray-400 max-w-xl mx-auto capitalize">
            {selectedPlan === 'free-trial' 
              ? '🎁 Free Trial: 5 photos, 7 days access' 
              : `You're on the ${selectedPlan} plan • ${PLAN_LIMITS[selectedPlan] === Infinity ? 'Unlimited photos' : `Max ${PLAN_LIMITS[selectedPlan]} photos`}`
            }
          </p>
        </div>

        <div className="mb-12">
          <PhotoUpload 
            userId={userId} 
            draftOrderId={draftOrderId}
            planId={selectedPlan}
            onUploadComplete={handleUploadComplete} 
            uploadToGallery={true}
          />
        </div>

        <div className="text-center mt-8">
          <button
            onClick={handleUploadComplete}
            disabled={!draftOrderId}
            className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-linear-to-r from-cyan-400 to-cyan-500 text-slate-900 font-bold text-lg hover:scale-105 transition-all shadow-[0_0_20px_rgba(34,211,238,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue to Gallery
            <FaImages />
          </button>
          <p className="text-xs text-gray-500 mt-2">
            Or continue automatically after uploading photos
          </p>
        </div>

      </div>
    </div>
  )
}