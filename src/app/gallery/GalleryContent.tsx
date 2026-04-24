// src/app/gallery/GalleryContent.tsx
'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { FaArrowLeft, FaArrowRight, FaCheck, FaSpinner } from 'react-icons/fa'
import { clsx } from 'clsx'

type GalleryPhoto = {
  id: string
  public_url: string
  file_name: string
  file_size: number
  uploaded_at: string
}

export const PLAN_LIMITS: Record<string, number> = { 
  free: 10,
  legacy: 50, 
  heirloom: Infinity 
}
export function GalleryContent() {
  const router = useRouter()
  const searchParams = useSearchParams()  // ✅ Now safe inside Suspense boundary
  const orderId = searchParams?.get('orderId')
  const plan = searchParams?.get('plan') || 'legacy'
  
  const [, setUserId] = useState<string | null>(null)
  const [galleryPhotos, setGalleryPhotos] = useState<GalleryPhoto[]>([])
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
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

  // Load user's gallery photos
  useEffect(() => {
    if (!orderId) {
      console.warn('⚠️ No orderId in URL')
      safePush('/upload')
      return
    }

    const loadGallery = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !user) {
          safePush('/auth/login')
          return
        }
        setUserId(user.id)

        const galleryResponse = await supabase
          .from('user_gallery')
          .select('id, public_url, file_name, file_size, uploaded_at')
          .eq('user_id', user.id)
          .order('uploaded_at', { ascending: false })

        const photoData = galleryResponse.data
        const photosError = galleryResponse.error

        if (photosError) {
          console.error('❌ Gallery fetch error:', photosError)
          setError('Could not load your photos')
          return
        }

        setGalleryPhotos(photoData || [])
      } catch (err) {
        console.error('💥 Unexpected error in loadGallery:', err)
        setError('Failed to load gallery')
      } finally {
        setLoading(false)
      }
    }

    loadGallery()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, safePush])

  // Toggle photo selection with plan limits
  const togglePhotoSelection = useCallback((photoId: string) => {
    setSelectedPhotoIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(photoId)) {
        newSet.delete(photoId)
      } else {
        const maxPhotos = PLAN_LIMITS[plan] || 50
        if (newSet.size >= maxPhotos) {
          alert(`You can only select up to ${maxPhotos} photos for the ${plan} plan`)
          return prev
        }
        newSet.add(photoId)
      }
      return newSet
    })
  }, [plan])

  // Save selected photos to order_photos
  const handleContinue = async () => {
    if (selectedPhotoIds.size === 0) {
      alert('Please select at least one photo')
      return
    }
    if (!orderId) {
      alert('Order ID missing. Please restart.')
      return
    }
    
    setSaving(true)
    
    try {
      const photosToInsert = galleryPhotos
        .filter(p => selectedPhotoIds.has(p.id))
        .map((photo, index) => ({
          draft_order_id: orderId,
          storage_path: '', // We're referencing gallery, not duplicating storage
          public_url: photo.public_url,
          file_name: photo.file_name,
          file_size: photo.file_size,
          sequence_number: index,
        }))

      const { error } = await supabase
        .from('order_photos')
        .insert(photosToInsert)

      if (error) throw error

      console.log('✅ Saved', selectedPhotoIds.size, 'photos to order')
      safePush(`/customize?orderId=${orderId}`)
      
    } catch (err) {
      console.error('❌ Failed to save photos to order:', err)
      alert('Could not save selection. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-linear-to-br from-slate-900 via-slate-950 to-black">
        <div className="text-center">
          <FaSpinner className="w-8 h-8 animate-spin mx-auto mb-4 text-cyan-400" />
          <p className="text-gray-400">Loading your gallery...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !orderId) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-linear-to-br from-slate-900 via-slate-950 to-black p-4">
        <div className="text-center glass rounded-2xl p-8 max-w-md">
          <p className="text-lg mb-4 text-red-300">{error || 'Gallery not found'}</p>
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
            <FaArrowLeft /> Back to Upload
          </button>
          <h1 className="text-xl font-bold">Select Photos for Your Album</h1>
          <div className="w-20" />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        
        {/* Plan Info + Selection Counter */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 glass rounded-xl p-4">
          <div>
            <p className="text-sm text-gray-400">Selected Plan:</p>
            <p className="font-semibold capitalize">{plan}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400">Selected:</p>
            <p className="font-bold text-cyan-400">
              {selectedPhotoIds.size} / {PLAN_LIMITS[plan] === Infinity ? '∞' : PLAN_LIMITS[plan]} photos
            </p>
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          {galleryPhotos.map(photo => {
            const isSelected = selectedPhotoIds.has(photo.id)
            return (
              <div 
                key={photo.id} 
                className={clsx(
                  'relative glass rounded-xl overflow-hidden cursor-pointer transition-all',
                  isSelected ? 'ring-2 ring-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)]' : 'hover:ring-1 hover:ring-white/30'
                )}
                onClick={() => togglePhotoSelection(photo.id)}
              >
                {/* Selection Checkbox */}
                <div className={clsx(
                  'absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition-all',
                  isSelected ? 'bg-cyan-500 text-slate-900' : 'bg-black/50 text-white'
                )}>
                  {isSelected ? <FaCheck className="w-3 h-3" /> : <div className="w-3 h-3 border-2 border-white rounded-full" />}
                </div>

                {/* Photo Preview */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={photo.public_url} 
                  alt={photo.file_name}
                  className="w-full h-32 object-cover"
                />

                {/* File Info */}
                <div className="p-2">
                  <p className="text-xs text-gray-300 truncate">{photo.file_name}</p>
                  <p className="text-[10px] text-gray-500">
                    {(photo.file_size / 1024 / 1024).toFixed(1)} MB
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Empty State */}
        {galleryPhotos.length === 0 && (
          <div className="text-center glass rounded-2xl p-8 mb-8">
            <p className="text-lg mb-4">No photos in your gallery yet</p>
            <button
              onClick={() => safePush('/upload')}
              className="px-6 py-3 bg-cyan-500 text-slate-900 rounded-full font-medium hover:bg-cyan-400 transition"
            >
              Upload Photos First
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => safePush('/upload')}
            disabled={saving}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white/10 text-white font-medium hover:bg-white/20 transition disabled:opacity-50"
          >
            <FaArrowLeft /> Upload More
          </button>
          
          <button
            onClick={handleContinue}
            disabled={saving || selectedPhotoIds.size === 0}
            className={clsx(
              'flex items-center justify-center gap-2 px-8 py-3 rounded-full font-bold text-lg transition-all',
              selectedPhotoIds.size > 0 && !saving
                ? 'bg-linear-to-r from-cyan-400 to-cyan-500 text-slate-900 hover:scale-105 shadow-[0_0_20px_rgba(34,211,238,0.4)]'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            )}
          >
            {saving ? (
              <>
                <FaSpinner className="animate-spin" /> Saving...
              </>
            ) : (
              <>
                Continue to Customize ({selectedPhotoIds.size})
                <FaArrowRight />
              </>
            )}
          </button>
        </div>

      </main>
    </div>
  )
}
export default GalleryContent
