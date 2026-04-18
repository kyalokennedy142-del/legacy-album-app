// src/components/AICaptionButton.tsx
'use client'

import { useState } from 'react'
import { FaMagic, FaSpinner } from 'react-icons/fa'

type AICaptionButtonProps = {
  fileName: string
  photoId: string
  onCaptionGenerated: (photoId: string, caption: string) => void
  className?: string
}

export default function AICaptionButton({
  fileName,
  photoId,
  onCaptionGenerated,
  className = '',
}: AICaptionButtonProps) {
  const [generating, setGenerating] = useState(false)

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const response = await fetch('/api/ai/caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName }),
      })
      
      if (!response.ok) throw new Error('Failed to generate caption')
      
      const { caption } = await response.json()
      onCaptionGenerated(photoId, caption)
    } catch (error) {
      console.error('Caption generation failed:', error)
      alert('Could not generate caption. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <button
      onClick={handleGenerate}
      disabled={generating}
      className={`flex items-center gap-1 px-3 py-1.5 rounded-md bg-purple-500/20 text-purple-300 text-xs font-medium hover:bg-purple-500/30 transition disabled:opacity-50 ${className}`}
      title="Generate AI caption"
    >
      {generating ? (
        <FaSpinner className="animate-spin" />
      ) : (
        <FaMagic />
      )}
      {generating ? 'Thinking...' : 'AI Caption'}
    </button>
  )
}