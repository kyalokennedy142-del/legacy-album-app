'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { FaExclamationTriangle, FaImages, FaSpinner, FaWhatsapp } from 'react-icons/fa'
import { createClient } from '@/lib/supabase/client'
import PhotoUpload from '@/components/PhotoUpload'

export const PLAN_LIMITS: Record<string, number> = {
  free: 5,
  heritage: 20,
  legacy: 50,
  heirloom: Infinity,
}

export const PLAN_PRICES: Record<string, number> = {
  free: 0,
  heritage: 15000,
  legacy: 25000,
  heirloom: 40000,
}

export default function UploadContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const selectedPlan = ((searchParams?.get('plan') || 'free').toLowerCase().trim()) as
    | 'free'
    | 'heritage'
    | 'legacy'
    | 'heirloom'

  const [userId, setUserId] = useState<string | null>(null)
  const [draftOrderId, setDraftOrderId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const safePush = useCallback(
    (path: string) => {
      try {
        router.push(path)
      } catch {
        if (typeof window !== 'undefined') {
          window.location.href = path
        }
      }
    },
    [router]
  )

  useEffect(() => {
    const init = async () => {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user) {
          setError('Please log in to upload photos')
          window.setTimeout(() => safePush('/auth/login'), 1500)
          return
        }

        setUserId(user.id)

        const { data, error: insertError } = await supabase
          .from('draft_orders')
          .insert({
            user_id: user.id,
            status: 'draft',
            plan_id: selectedPlan,
            total_amount: PLAN_PRICES[selectedPlan] ?? PLAN_PRICES.legacy,
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

    void init()
  }, [safePush, selectedPlan, supabase])

  const handleUploadComplete = useCallback(() => {
    if (!draftOrderId) {
      setError('Upload session expired. Please restart.')
      return
    }

    safePush(`/gallery?orderId=${draftOrderId}&plan=${selectedPlan}`)
  }, [draftOrderId, safePush, selectedPlan])

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-950 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="mx-auto mb-4 h-8 w-8 animate-spin text-cyan-400" />
          <p className="text-gray-400">Preparing your upload session...</p>
        </div>
      </div>
    )
  }

  if (error || !userId || !draftOrderId) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-950 to-black text-white flex items-center justify-center p-4">
        <div className="glass max-w-md rounded-2xl p-8 text-center">
          <FaExclamationTriangle className="mx-auto mb-4 h-12 w-12 text-red-400" />
          <p className="mb-4 text-lg text-red-300">{error || 'Session error'}</p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-full bg-cyan-500 px-6 py-3 font-medium text-slate-900 transition hover:bg-cyan-400"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-950 to-black px-6 pb-16 pt-24 text-white">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-8 rounded-[28px] border border-white/10 bg-white/5 p-6">
          <h1 className="mb-3 text-4xl font-bold text-white">Upload Your Memories</h1>
          <p className="max-w-2xl text-sm leading-6 text-slate-300">
            {selectedPlan === 'free'
              ? 'Free tier includes up to 10 photos, basic templates, and a watermarked preview.'
              : `You're on the ${selectedPlan} plan. ${
                  PLAN_LIMITS[selectedPlan] === Infinity
                    ? 'Upload as many photos as you need.'
                    : `You can use up to ${PLAN_LIMITS[selectedPlan]} photos.`
                }`}
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-300">
            <span className="rounded-full bg-white/8 px-3 py-2">Large mobile touch targets</span>
            <span className="rounded-full bg-white/8 px-3 py-2">WebP/AVIF delivery downstream</span>
            <a
              href="https://wa.me/254740481359?text=Hi%20Legacy%20Album%2C%20I%20want%20to%20send%20my%20photos%20via%20WhatsApp."
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-white/8 px-3 py-2"
            >
              <FaWhatsapp />
              Send via WhatsApp
            </a>
          </div>
        </div>

        <div className="mb-12">
          <PhotoUpload
            userId={userId}
            draftOrderId={draftOrderId}
            planId={selectedPlan}
            onUploadComplete={handleUploadComplete}
            uploadToGallery
          />
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={handleUploadComplete}
            disabled={!draftOrderId}
            className="inline-flex items-center gap-3 rounded-full bg-linear-to-r from-cyan-400 to-cyan-500 px-8 py-4 text-lg font-bold text-slate-900 shadow-[0_0_20px_rgba(34,211,238,0.4)] transition-all hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Continue to Gallery
            <FaImages />
          </button>
          <p className="mt-2 text-xs text-gray-500">Or continue automatically after uploading photos</p>
        </div>
      </div>
    </div>
  )
}