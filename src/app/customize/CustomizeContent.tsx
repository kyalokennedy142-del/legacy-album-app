// src/app/customize/page.tsx
'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { TEMPLATES, type Template } from '@/lib/templates'
import TemplateCard from '@/components/TemplateCard'
import CaptionInput from '@/components/CaptionInput'
import { FaArrowLeft, FaArrowRight, FaPalette, FaSpinner } from 'react-icons/fa'
import { clsx } from 'clsx'

type Photo = {
  id: string
  url: string
  name: string
  size: number
  path: string
  caption?: string
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type OrderPhotoRow = {
  id: string
  draft_order_id: string
  storage_path: string
  public_url: string
  file_name: string
  file_size: number
  caption: string | null
  sequence_number: number | null
  uploaded_at: string | null
}

export default function CustomizePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = searchParams?.get('orderId')
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [userId, setUserId] = useState<string | null>(null)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [captions, setCaptions] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  // ✅ Safe redirect with fallback
  const safePush = useCallback((path: string) => {
    try {
      router.push(path)
    } catch {
      if (typeof window !== 'undefined') {
        window.location.href = path
      }
    }
  }, [router])

  // ✅ Load photos with proper Supabase destructuring + deduplication
  useEffect(() => {
    if (!orderId) {
      console.warn('⚠️ No orderId in URL')
      safePush('/upload')
      return
    }

    console.log('🔍 Loading photos for order:', orderId)

    const loadData = async () => {
      try {
        // 1. Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !user) {
          console.error('❌ Auth error:', authError)
          safePush('/auth/login')
          return
        }
        setUserId(user.id)

        // ✅ FIX #1: Properly destructure Supabase response
        const orderResponse = await supabase
          .from('draft_orders')
          .select('id, plan_id, total_amount')
          .eq('id', orderId)
          .eq('user_id', user.id)
          .single()

        const orderData = orderResponse.data
        const orderError = orderResponse.error

        if (orderError || !orderData) {
          console.error('❌ Order not found or unauthorized:', orderError)
          setError('Order not found. Please start over.')
          return
        }

        // 2. ✅ Load photos with EXACT column names from your schema
        const photosResponse = await supabase
          .from('order_photos')
          .select('id, draft_order_id, storage_path, public_url, file_name, file_size, caption, sequence_number, uploaded_at')
          .eq('draft_order_id', orderId)
          .order('sequence_number', { ascending: true, nullsFirst: false })

        const photoData = photosResponse.data
        const photosError = photosResponse.error

        if (photosError) {
          console.error('❌ Photo fetch error:', photosError)
          setError('Could not load photos')
          return
        }

        // ✅ FIX #2: Deduplicate by ID + filter by exact draft_order_id
        const validPhotos = (photoData || []).filter(p => p.draft_order_id === orderId)
        const uniquePhotos = validPhotos.filter(
          (photo, index, self) => index === self.findIndex(p => p.id === photo.id)
        )

        console.log('✅ Loaded photos:', {
          raw: photoData?.length,
          validDraftOrder: validPhotos.length,
          unique: uniquePhotos.length,
          ids: uniquePhotos.map(p => p.id.slice(0, 8))
        })

        // Map to Photo type
        const loadedPhotos: Photo[] = uniquePhotos.map(p => ({
          id: p.id,
          url: p.public_url,
          name: p.file_name,
          size: Number(p.file_size),
          path: p.storage_path,
          caption: p.caption || undefined
        }))

        setPhotos(loadedPhotos)

        // Load existing captions
        const initialCaptions: Record<string, string> = {}
        uniquePhotos.forEach(p => {
          if (p.caption) initialCaptions[p.id] = p.caption
        })
        setCaptions(initialCaptions)

      } catch (err) {
        console.error('💥 Unexpected error in loadData:', err)
        setError('Failed to load order data')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, safePush])

  // ✅ Save caption with debounce
  const handleCaptionChange = useCallback((photoId: string, value: string) => {
    setCaptions(prev => ({ ...prev, [photoId]: value }))
    
    const timeoutId = setTimeout(async () => {
      try {
        const { error } = await supabase
          .from('order_photos')
          .update({ caption: value })
          .eq('id', photoId)

        if (error) console.error('Failed to save caption:', error)
      } catch (err) {
        console.error('Caption save error:', err)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [supabase])

  // ✅ Save template + redirect to review
  const handleContinue = async () => {
    if (!selectedTemplate) {
      alert('Please select a template first')
      return
    }
    if (!orderId) {
      alert('Order ID missing. Please restart.')
      return
    }
    
    try {
      console.log('🔄 Saving template selection:', selectedTemplate.id)
      
      const { error } = await supabase
        .from('draft_orders')
        .update({ 
          template_id: selectedTemplate.id,
          status: 'reviewing'
        })
        .eq('id', orderId)

      if (error) throw error

      console.log('✅ Template saved, redirecting to review')
      safePush(`/review?orderId=${orderId}`)
      
    } catch (err) {
      console.error('❌ Failed to save template:', err)
      alert('Could not save selection. Please try again.')
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-linear-to-br from-slate-900 via-slate-950 to-black">
        <div className="text-center">
          <FaSpinner className="w-8 h-8 animate-spin mx-auto mb-4 text-cyan-400" />
          <p className="text-gray-400">Loading your templates...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !orderId) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-linear-to-br from-slate-900 via-slate-950 to-black p-4">
        <div className="text-center glass rounded-2xl p-8 max-w-md">
          <p className="text-lg mb-4 text-red-300">{error || 'Order not found'}</p>
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

  // No photos state
  if (photos.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-linear-to-br from-slate-900 via-slate-950 to-black p-4">
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
            onClick={() => safePush('/upload')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition"
          >
            <FaArrowLeft /> Back
          </button>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <FaPalette className="text-cyan-400" />
            Choose Your Style
          </h1>
          <div className="w-20" />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-12">
        
        {/* Template Selection */}
        <section>
          <h2 className="text-2xl font-bold mb-6 neon-pink">Select a Template</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {TEMPLATES.map(template => (
              <TemplateCard
                key={template.id}
                template={template}
                isSelected={selectedTemplate?.id === template.id}
                onSelect={setSelectedTemplate}
              />
            ))}
          </div>
        </section>

        {/* Caption Inputs */}
        {selectedTemplate && (
          <section className="animate-slide-up">
            <h2 className="text-2xl font-bold mb-6 neon-cyan">Add Your Stories</h2>
            <p className="text-gray-400 mb-6">
              Optional: Add captions, memories, or notes to your photos
            </p>
            <div className="space-y-4 max-w-2xl">
              {photos.map((photo, index) => (
                <CaptionInput
                  key={photo.id}
                  photoName={photo.name}
                  photoUrl={photo.url}
                  value={captions[photo.id] || ''}
                  onChange={(value) => handleCaptionChange(photo.id, value)}
                  index={index}
                />
              ))}
            </div>
          </section>
        )}

        {/* Continue Button */}
        <div className="flex justify-center pt-8 pb-12">
          <button
            onClick={handleContinue}
            disabled={!selectedTemplate}
            className={clsx(
              'inline-flex items-center gap-3 px-8 py-4 rounded-full font-bold text-lg transition-all',
              selectedTemplate
                ? 'bg-linear-to-r from-cyan-400 to-cyan-500 text-slate-900 hover:scale-105 shadow-[0_0_20px_rgba(34,211,238,0.4)]'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            )}
          >
            Continue to Review
            <FaArrowRight />
          </button>
        </div>

        {/* 🔍 DEBUG: Show what's actually loaded (dev only) */}
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-8 p-4 bg-white/5 rounded-lg text-xs text-gray-400">
            <summary className="cursor-pointer font-medium text-gray-300 mb-2">🔧 Debug: Photos Loaded</summary>
            <p><strong>orderId:</strong> {orderId}</p>
            <p><strong>photos.length:</strong> {photos.length}</p>
            <p><strong>Photo IDs:</strong></p>
            <ul className="ml-4 list-disc">
              {photos.map(p => (
                <li key={p.id}>{p.id.slice(0, 8)}... — {p.name}</li>
              ))}
            </ul>
            <p className="mt-2 text-red-400">
              If you see more than 2 photos here, your database has duplicates. 
              Run the SQL cleanup below to fix.
            </p>
          </details>
        )}

      </main>
    </div>
  )
}