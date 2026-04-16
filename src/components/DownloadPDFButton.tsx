// src/components/DownloadPDFButton.tsx
'use client'

import { useState } from 'react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { FaDownload, FaSpinner } from 'react-icons/fa'

// ✅ Define our own options type (works with all html2canvas versions)
type CanvasOptions = {
  scale?: number
  useCORS?: boolean
  allowTaint?: boolean
  logging?: boolean
  backgroundColor?: string
  width?: number
  height?: number
}

interface DownloadPDFButtonProps {
  // ✅ Accept nullable ref (matches React.useRef return type)
  targetRef: React.RefObject<HTMLDivElement | null>
  fileName: string
  className?: string
}

export default function DownloadPDFButton({ 
  targetRef, 
  fileName, 
  className = '' 
}: DownloadPDFButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const handleDownload = async () => {
    // ✅ Proper null check before using ref
    const targetElement = targetRef.current
    if (!targetElement) {
      console.error('PDF target element not found')
      return
    }
    
    setIsGenerating(true)
    
    try {
      // ✅ Use our custom type + type assertion for compatibility
      const options: CanvasOptions = {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff'
      }

      const canvas = await html2canvas(targetElement, options as Parameters<typeof html2canvas>[1])

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      const imgWidth = 210 // A4 width in mm
      const pageHeight = 297 // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)
      
      // Add footer
      pdf.setFontSize(8)
      pdf.setTextColor(100, 100, 100)
      pdf.text(
        `Legacy Album Proof • Generated ${new Date().toLocaleDateString('en-KE')}`,
        105,
        pageHeight - 10,
        { align: 'center' }
      )

      pdf.save(`${fileName}.pdf`)
      
    } catch (error) {
      console.error('PDF generation failed:', error)
      alert('Could not generate PDF. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={isGenerating}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
        isGenerating 
          ? 'bg-gray-500/20 text-gray-400 cursor-wait' 
          : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
      } ${className}`}
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
  )
}