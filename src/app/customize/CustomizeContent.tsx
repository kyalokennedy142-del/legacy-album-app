// src/app/customize/CustomizeContent.tsx
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { FaMagic, FaSpinner, FaArrowRight, FaSave } from 'react-icons/fa'
import { clsx } from 'clsx'

type OrderPhoto = {
  id: string
  public_url: string
  file_name: string
  caption?: string
  sequence_number: number
}

export default function CustomizeContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = searchParams?.get('orderId')

  const [photos, setPhotos] = useState<OrderPhoto[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState('classic-grid')
  const [aiLoading, setAiLoading] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState(false)
  const [photoLoadError, setPhotoLoadError] = useState<string | null>(null)

  // ✅ FIX: Memoize Supabase client to avoid recreating on every render
  const supabase = useMemo(() => createClient(), [])

  // Load order photos
  useEffect(() => {
    if (!orderId) return

    const loadPhotos = async () => {
      try {
        const { data, error } = await supabase
          .from('order_photos')
          .select('id, public_url, file_name, caption, sequence_number')
          .eq('draft_order_id', orderId)
          .order('sequence_number', { ascending: true })

        if (error) {
          console.error('Failed to load photos:', error)
          setPhotoLoadError('Could not load photos. Please refresh.')
          return
        }

        if (data) {
          setPhotos(data as OrderPhoto[])
          setPhotoLoadError(null)
        }
      } catch (err) {
        console.error('Unexpected error loading photos:', err)
        setPhotoLoadError('An unexpected error occurred.')
      }
    }

    loadPhotos()
  }, [orderId, supabase])

  // ✅ AI Caption Generator
  const generateCaption = useCallback(
    async (photoId: string, fileName: string) => {
      setAiLoading((prev) => ({ ...prev, [photoId]: true }))

      try {
        const response = await fetch('/api/ai/caption', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileName }),
        })

        if (!response.ok) throw new Error('Failed to generate caption')

        const { caption } = await response.json()

        // Update photo with new caption using functional update to avoid stale state
        setPhotos((prev) =>
          prev.map((p) => (p.id === photoId ? { ...p, caption } : p))
        )

        // Save caption to Supabase
        const { error } = await supabase
          .from('order_photos')
          .update({ caption })
          .eq('id', photoId)

        if (error) {
          console.error('Failed to save caption:', error)
          // Revert local state on failure
          setPhotos((prev) =>
            prev.map((p) =>
              p.id === photoId ? { ...p, caption: undefined } : p
            )
          )
        }
      } catch (error) {
        console.error('Caption generation failed:', error)
        // TODO: Replace alert() with toast notification system
        alert('Could not generate caption. Please try again.')
      } finally {
        setAiLoading((prev) => ({ ...prev, [photoId]: false }))
      }
    },
    [supabase]
  )

  // ✅ AI Layout Suggestion
  const suggestLayout = useCallback(async () => {
    try {
      const response = await fetch('/api/ai/layout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photoCount: photos.length,
          planName: 'legacy',
        }),
      })

      if (!response.ok) throw new Error('Failed to get layout suggestion')

      const { layout, reason } = await response.json()
      setSelectedTemplate(layout)
      // TODO: Replace alert() with toast notification system
      alert(`💡 AI Suggestion: ${reason}`)
    } catch (error) {
      console.error('Layout suggestion failed:', error)
    }
  }, [photos.length])

  // Save template selection
  const handleSaveTemplate = useCallback(async () => {
    if (!orderId) return
    setSaving(true)

    try {
      const { error } = await supabase
        .from('draft_orders')
        .update({ template_id: selectedTemplate })
        .eq('id', orderId)

      if (error) throw error

      router.push(`/review?orderId=${orderId}`)
    } catch (error) {
      console.error('Failed to save template:', error)
      // TODO: Replace alert() with toast notification system
      alert('Could not save. Please try again.')
    } finally {
      setSaving(false)
    }
  }, [orderId, selectedTemplate, router, supabase])

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-950 to-black text-white py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FaMagic className="text-purple-400" /> Customize Your Album
          </h1>
          <button
            onClick={suggestLayout}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition"
          >
            <FaMagic /> AI Layout Suggestion
          </button>
        </div>

        {/* Photo Load Error */}
        {photoLoadError && (
          <div className="mb-4 p-4 rounded-lg bg-red-500/20 border border-red-500/50 text-red-300">
            {photoLoadError}
          </div>
        )}

        {/* Photo Grid with AI Captions */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          {photos.map((photo) => (
            <div key={photo.id} className="glass rounded-xl overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.public_url}
                alt={photo.file_name}
                className="w-full h-40 object-cover"
              />

              <div className="p-3">
                {/* Caption Input */}
                <input
                  type="text"
                  value={photo.caption || ''}
                  onChange={(e) => {
                    setPhotos((prev) =>
                      prev.map((p) =>
                        p.id === photo.id ? { ...p, caption: e.target.value } : p
                      )
                    )
                  }}
                  placeholder="Add a caption..."
                  className="w-full px-3 py-2 rounded-lg bg-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 mb-2"
                />

                {/* AI Caption Button */}
                <button
                  onClick={() => generateCaption(photo.id, photo.file_name)}
                  disabled={aiLoading[photo.id]}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-purple-500/20 text-purple-300 text-xs font-medium hover:bg-purple-500/30 transition disabled:opacity-50"
                >
                  {aiLoading[photo.id] ? (
                    <FaSpinner className="animate-spin" />
                  ) : (
                    <FaMagic />
                  )}
                  {aiLoading[photo.id] ? 'Thinking...' : '✨ AI Caption'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {photos.length === 0 && !photoLoadError && (
          <div className="text-center py-12 text-gray-400">
            <p>No photos uploaded yet. Upload photos to start customizing.</p>
          </div>
        )}

        {/* Template Selection */}
        <div className="glass rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Choose a Layout</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['minimal-grid', 'classic-grid', 'story-flow', 'collage-mix'].map(
              (template) => (
                <button
                  key={template}
                  onClick={() => setSelectedTemplate(template)}
                  className={clsx(
                    'p-4 rounded-xl border-2 transition-all text-center',
                    selectedTemplate === template
                      ? 'border-cyan-400 bg-cyan-400/10 text-cyan-300'
                      : 'border-white/10 hover:border-white/30 text-gray-400'
                  )}
                >
                  <div className="aspect-video bg-white/5 rounded-lg mb-2" />
                  <span className="text-sm capitalize">
                    {template.replace('-', ' ')}
                  </span>
                </button>
              )
            )}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-center">
          <button
            onClick={handleSaveTemplate}
            disabled={saving || photos.length === 0}
            className="flex items-center gap-3 px-8 py-4 rounded-full bg-linear-to-r from-cyan-400 to-cyan-500 text-slate-900 font-bold text-lg hover:scale-105 transition-all shadow-lg shadow-cyan-500/25 disabled:opacity-50 disabled:hover:scale-100"
          >
            {saving ? (
              <>
                <FaSpinner className="animate-spin" /> Saving...
              </>
            ) : (
              <>
                <FaSave /> Save & Continue
                <FaArrowRight />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}