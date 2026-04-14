// src/app/customize/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { TEMPLATES, type Template } from '@/lib/templates'
import TemplateCard from '@/components/TemplateCard'
import CaptionInput from '@/components/CaptionInput'
import { FaArrowLeft, FaArrowRight, FaPalette } from 'react-icons/fa'
import { clsx } from 'clsx'

type Photo = {
  id: string
  url: string
  name: string
  size: number
  path: string
  caption?: string
}

type OrderPhotoRow = {
  id: string
  public_url: string
  file_name: string
  file_size: number
  storage_path: string
  caption: string | null
  draft_order_id: string
  sequence_number: number
  uploaded_at: string
}

export default function CustomizePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname() // ✅ Track if component is mounted
  const orderId = searchParams?.get('orderId')
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [userId, setUserId] = useState<string | null>(null)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [captions, setCaptions] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [isRouterReady, setIsRouterReady] = useState(false) // ✅ Guard flag
  const supabase = createClient()

  // ✅ Mark router as ready after first render
  useEffect(() => {
    if (pathname) {
       
      setIsRouterReady(true)
    }
  }, [pathname])

  // ✅ Safe navigation helper
  const safeNavigate = (path: string) => {
    if (isRouterReady) {
      router.push(path)
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      // ✅ Wait for router + ensure orderId exists
      if (!isRouterReady || !orderId) {
        if (!orderId && isRouterReady) {
          safeNavigate('/upload')
        }
        return
      }

      // 1. Get user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        safeNavigate('/auth/login')
        return
      }
      setUserId(user.id)

      // 2. Verify draft order belongs to user
      const { error: orderError } = await supabase
        .from('draft_orders')
        .select('id')
        .eq('id', orderId)
        .eq('user_id', user.id)
        .single()

      if (orderError) {
        console.error('Draft order not found', orderError)
        safeNavigate('/upload')
        return
      }

      // 3. Load photos for this draft order
      const { data, error: photosError } = await supabase
        .from('order_photos')
        .select('*')
        .eq('draft_order_id', orderId)
        .order('sequence_number', { ascending: true })

      if (photosError) {
        console.error('Failed to load photos', photosError)
      } else if (data) {
        const loadedPhotos: Photo[] = (data as OrderPhotoRow[]).map((p) => ({
          id: p.id,
          url: p.public_url,
          name: p.file_name,
          size: p.file_size,
          path: p.storage_path,
          caption: p.caption || undefined
        }))
        setPhotos(loadedPhotos)
        
        const initialCaptions: Record<string, string> = {}
        ;(data as OrderPhotoRow[]).forEach((p) => {
          if (p.caption) initialCaptions[p.id] = p.caption
        })
        setCaptions(initialCaptions)
      }

      setLoading(false)
    }

    fetchData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRouterReady, orderId]) // ✅ Dependencies include readiness flag

  const handleCaptionChange = (photoId: string, value: string) => {
    setCaptions(prev => ({ ...prev, [photoId]: value }))
    
    supabase
      .from('order_photos')
      .update({ caption: value })
      .eq('id', photoId)
      .then(({ error }) => {
        if (error) console.error('Failed to save caption', error)
      })
  }

  const handleContinue = async () => {
    if (!selectedTemplate) {
      alert('Please select a template first')
      return
    }
    
    const { error } = await supabase
      .from('draft_orders')
      .update({ 
        template_id: selectedTemplate.id,
        status: 'reviewing'
      })
      .eq('id', orderId)

    if (error) {
      console.error('Failed to save template', error)
      alert('Could not save selection. Please try again.')
      return
    }

    // ✅ Use safe navigation
    safeNavigate(`/review?orderId=${orderId}`)
  }

  // ✅ Show loading until router is ready
  if (!isRouterReady || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-linear-to-br from-slate-900 via-slate-950 to-black">
        <div className="animate-spin h-8 w-8 border-4 border-cyan-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (photos.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white p-4 bg-linear-to-br from-slate-900 via-slate-950 to-black">
        <div className="text-center glass rounded-2xl p-8 max-w-md">
          <p className="text-lg mb-4">No photos found</p>
          <button
            onClick={() => safeNavigate('/upload')}
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
            onClick={() => safeNavigate('/upload')}
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
        <div className="flex justify-center pt-8">
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
      </main>
    </div>
  )
}