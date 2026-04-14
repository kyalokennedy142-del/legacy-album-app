/* eslint-disable @typescript-eslint/no-unused-vars */
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
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      // 1. Get authenticated user
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/login')
        return
      }
      
      setUserId(user.id)

      // 2. Create a new draft order for this session
      const { data: { id }, error: draftError } = await supabase
        .from('draft_orders')
        .insert({ user_id: user.id })
        .select('id')
        .single()

      if (error || !id) {
        console.error('Failed to create draft order', error)
        alert('Could not start new album. Please try again.')
        return
      }

      setDraftOrderId(id)
      setLoading(false)
    }

    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router])

  const handleUploadComplete = () => {
    // All photos uploaded → navigate to customize with orderId
    if (draftOrderId) {
      router.push(`/customize?orderId=${draftOrderId}`)
    }
  }

  if (loading || !userId || !draftOrderId) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        <div className="animate-spin h-8 w-8 border-4 border-cyan-500 border-t-transparent rounded-full"></div>
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

        {/* Pass draftOrderId to PhotoUpload */}
        <div className="mb-12">
          <PhotoUpload 
            userId={userId} 
            draftOrderId={draftOrderId}
            onUploadComplete={handleUploadComplete} 
          />
        </div>

        {/* Continue Button */}
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