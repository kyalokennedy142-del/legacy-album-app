// src/components/DownloadPDFButton.tsx
'use client'

import { useState } from 'react'
import { FaDownload, FaSpinner } from 'react-icons/fa'

type DownloadPDFButtonProps = {
  orderId: string
  className?: string
}

export default function DownloadPDFButton({ orderId, className = '' }: DownloadPDFButtonProps) {
  const [downloading, setDownloading] = useState(false)

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const response = await fetch(`/api/orders/${orderId}/pdf`)
      if (!response.ok) throw new Error('Failed to generate PDF')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `order-${orderId.slice(0, 8)}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download failed:', error)
      alert('Could not download PDF. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={downloading}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 text-slate-900 font-medium hover:bg-cyan-400 transition disabled:opacity-50 ${className}`}
    >
      {downloading ? (
        <>
          <FaSpinner className="animate-spin" /> Generating...
        </>
      ) : (
        <>
          <FaDownload /> Download Receipt
        </>
      )}
    </button>
  )
}