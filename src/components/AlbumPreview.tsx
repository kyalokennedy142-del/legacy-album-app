/* eslint-disable @next/next/no-img-element */
'use client'

import { useRef, useState } from 'react'
import { generatePDF } from '@/lib/generatePDF'
import { FaDownload, FaSpinner } from 'react-icons/fa'

type Photo = {
  id: string
  public_url: string
  file_name: string
  caption?: string
  sequence_number: number
}

type Template = {
  id: string
  name: string
  layout: 'grid' | 'storyteller' | 'timeline' | 'minimalist'
}

interface AlbumPreviewProps {
  photos: Photo[]
  template: Template
  orderNumber: string
  customerName: string
  createdAt: string
}

export default function AlbumPreview({
  photos,
  template,
  orderNumber,
  customerName,
  createdAt
}: AlbumPreviewProps) {
  const previewRef = useRef<HTMLDivElement>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const handleDownload = async () => {
    if (!previewRef.current) return

    setIsGenerating(true)
    try {
      await generatePDF({
        element: previewRef.current,
        filename: `legacy-album-${orderNumber.slice(0, 8)}.pdf`,
        title: 'Legacy Album Proof',
        subtitle: `${template.name} Template`
      })
    } catch (error) {
      console.error('PDF generation failed:', error)
      alert('Failed to generate PDF. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const renderLayout = () => {
    switch (template.layout) {
      case 'grid':
        return (
          <div className="grid grid-cols-2 gap-4 p-4">
            {photos.map((photo) => (
              <div key={photo.id} className="break-inside-avoid">
                <img
                  src={photo.public_url}
                  alt={photo.file_name}
                  className="w-full h-48 object-cover rounded-lg"
                  crossOrigin="anonymous"
                />
                {photo.caption && (
                  <p className="text-sm text-gray-600 mt-2 italic text-center">
                    &ldquo;{photo.caption}&rdquo;
                  </p>
                )}
              </div>
            ))}
          </div>
        )

      case 'storyteller':
        return (
          <div className="space-y-8 p-4">
            {photos.map((photo) => (
              <div key={photo.id} className="break-inside-avoid page-break-after">
                <img
                  src={photo.public_url}
                  alt={photo.file_name}
                  className="w-full h-64 object-cover rounded-lg"
                  crossOrigin="anonymous"
                />
                {photo.caption && (
                  <p className="text-base text-gray-700 mt-4 leading-relaxed">
                    {photo.caption}
                  </p>
                )}
              </div>
            ))}
          </div>
        )

      case 'timeline':
        return (
          <div className="space-y-6 p-4">
            {photos.map((photo, index) => (
              <div key={photo.id} className="flex gap-4 break-inside-avoid">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-cyan-500" />
                  <div className="w-0.5 flex-1 bg-gray-300 mt-2" />
                </div>
                <div className="flex-1 pb-6">
                  <span className="text-xs font-bold text-cyan-600">#{index + 1}</span>
                  <img
                    src={photo.public_url}
                    alt={photo.file_name}
                    className="w-full h-40 object-cover rounded-lg mt-2"
                    crossOrigin="anonymous"
                  />
                  {photo.caption && (
                    <p className="text-sm text-gray-600 mt-2">{photo.caption}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )

      case 'minimalist':
        return (
          <div className="space-y-12 p-4">
            {photos.map((photo) => (
              <div key={photo.id} className="break-inside-avoid text-center">
                <img
                  src={photo.public_url}
                  alt={photo.file_name}
                  className="w-4/5 mx-auto h-56 object-contain"
                  crossOrigin="anonymous"
                />
                {photo.caption && (
                  <p className="text-base text-gray-600 mt-6 italic">
                    &ldquo;{photo.caption}&rdquo;
                  </p>
                )}
              </div>
            ))}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div>
      {/* Download Button */}
      <button
        onClick={handleDownload}
        disabled={isGenerating}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition border border-white/20 mb-6 ${
          isGenerating
            ? 'bg-gray-500/20 text-gray-400 cursor-wait'
            : 'bg-white/10 hover:bg-white/20 text-white'
        }`}
      >
        {isGenerating ? (
          <>
            <FaSpinner className="animate-spin" /> Generating PDF...
          </>
        ) : (
          <>
            <FaDownload /> Download Proof (PDF)
          </>
        )}
      </button>

      {/* Preview Container (what gets printed to PDF) */}
      <div
        ref={previewRef}
        className="bg-white text-slate-900 p-8 rounded-xl max-w-2xl mx-auto"
        style={{ width: '210mm', minHeight: '297mm' }} // A4 dimensions
      >
        {/* Header */}
        <div className="border-b border-gray-200 pb-4 mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Legacy Album Proof</h1>
          <p className="text-slate-500">{template.name} Template</p>
          <div className="flex justify-between mt-2 text-xs text-slate-400">
            <span>Order: {orderNumber.slice(0, 8)}</span>
            <span>{customerName}</span>
            <span>{new Date(createdAt).toLocaleDateString('en-KE')}</span>
          </div>
        </div>

        {/* Dynamic Layout */}
        {renderLayout()}

        {/* Footer */}
        <div className="border-t border-gray-200 pt-4 mt-8 text-center text-xs text-slate-400">
          Legacy Album • Proof for printing • Not for distribution • 
          Generated {new Date().toLocaleDateString()}
        </div>
      </div>
    </div>
  )
}