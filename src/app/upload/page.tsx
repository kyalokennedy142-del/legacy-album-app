// src/app/upload/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import PhotoUpload from '@/components/PhotoUpload'
import { FaArrowRight } from 'react-icons/fa'

export default function UploadPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [draftOrderId, setDraftOrderId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()

    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          router.push('/auth/login')
          return
        }
        
        setUserId(user.id)

        // ✅ FIX: Don't destructure id directly - data could be null
        const { data, error: draftError } = await supabase
          .from('draft_orders')
          .insert({ user_id: user.id, status: 'draft' })
          .select('id')
          .single()

        if (draftError || !data) {
          console.error('Failed to create draft order', draftError)
          setError('Failed to create order. Please try again.')
          return
        }

        // ✅ FIX: Access id safely after null check
        setDraftOrderId(data.id)

      } catch (err) {
        console.error('Initialization error:', err)
        setError('An unexpected error occurred')
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [router])

  const handleUploadComplete = () => {
    if (draftOrderId) {
      router.push(`/customize?orderId=${draftOrderId}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        <div className="animate-spin h-8 w-8 border-4 border-cyan-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (error || !userId || !draftOrderId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-900 via-slate-950 to-black text-white p-4">
        <div className="text-center glass rounded-2xl p-8 max-w-md">
          <p className="text-lg mb-4 text-red-400">{error || 'Unable to initialize upload'}</p>
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
          <p className="text-gray-400 max-w-xl mx-auto">
            Select your favorite photos. We support JPG, PNG, and WebP up to 10MB each.
          </p>
        </div>

        <div className="mb-12">
          <PhotoUpload 
            userId={userId} 
            draftOrderId={draftOrderId}
            onUploadComplete={handleUploadComplete} 
          />
        </div>

        <div className="text-center mt-12">
          <button
            onClick={handleUploadComplete}
            className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-linear-to-r from-cyan-400 to-cyan-500 text-slate-900 font-bold text-lg hover:scale-105 transition-all shadow-[0_0_20px_rgba(34,211,238,0.4)]"
          >
            Continue to Templates
            <FaArrowRight />
          </button>
        </div>
      </div>
    </div>
  )
}