// src/components/DownloadPDFButton.tsx
'use client'

import { useState, useCallback } from 'react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { FaDownload, FaSpinner, FaExclamationCircle } from 'react-icons/fa'

interface DownloadPDFButtonProps {
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
  const [error, setError] = useState<string | null>(null)

  const handleDownload = useCallback(async () => {
    if (!targetRef.current) {
      setError('No content to capture')
      return
    }
    
    setIsGenerating(true)
    setError(null)
    
    try {
      const canvas = await html2canvas(targetRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      const imgWidth = 210
      const pageHeight = 297
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      let heightLeft = imgHeight
      let position = 0

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }
      
      pdf.setFontSize(8)
      pdf.setTextColor(100, 100, 100)
      pdf.text(
        `Legacy Album Proof • Generated ${new Date().toLocaleDateString('en-KE')}`,
        105,
        pageHeight - 10,
        { align: 'center' }
      )

      pdf.save(`${fileName}.pdf`)
      
    } catch (err) {
      console.error('PDF generation failed:', err)
      const message = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(`Could not generate PDF: ${message}`)
    } finally {
      setIsGenerating(false)
    }
  }, [fileName, targetRef])

  if (error) {
    return (
      <button
        onClick={() => setError(null)}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-red-500/20 text-red-300 border border-red-500/50 hover:bg-red-500/30 transition ${className}`}
      >
        <FaExclamationCircle /> Error - Click to Retry
      </button>
    )
  }

  return (
    <button
      onClick={handleDownload}
      disabled={isGenerating}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition border border-white/20 ${
        isGenerating 
          ? 'bg-gray-500/20 text-gray-400 cursor-wait' 
          : 'bg-white/10 hover:bg-white/20 text-white'
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