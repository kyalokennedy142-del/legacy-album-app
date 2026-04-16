// src/lib/generatePDF.ts
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

// ✅ Define our own options type (works with all html2canvas versions)
type CanvasCaptureOptions = {
  scale?: number
  useCORS?: boolean
  allowTaint?: boolean
  backgroundColor?: string
  logging?: boolean
  width?: number
  height?: number
  scrollX?: number
  scrollY?: number
  windowWidth?: number
  windowHeight?: number
}

interface PDFOptions {
  element: HTMLElement
  filename: string
  title?: string
  subtitle?: string
}

export async function generatePDF({ element, filename, title, subtitle }: PDFOptions): Promise<void> {
  // Create PDF (A4 size)
  const pdf = new jsPDF('p', 'mm', 'a4')
  const pdfWidth = pdf.internal.pageSize.getWidth()
  const pdfHeight = pdf.internal.pageSize.getHeight()

  // Add title header
  if (title) {
    pdf.setFontSize(20)
    pdf.setTextColor(30, 41, 59) // slate-800
    pdf.text(title, 20, 20)
  }

  if (subtitle) {
    pdf.setFontSize(12)
    pdf.setTextColor(100, 116, 139) // slate-500
    pdf.text(subtitle, 20, 30)
  }

  // ✅ FIX: Use our custom type + safe assertion for html2canvas options
  const options: CanvasCaptureOptions = {
    scale: 2, // Higher resolution
    useCORS: true, // Allow cross-origin images
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: false
  }

  // Type assertion to satisfy TypeScript (works with any html2canvas version)
  const canvas = await html2canvas(element, options as Parameters<typeof html2canvas>[1])

  const imgData = canvas.toDataURL('image/png')
  
  // Calculate dimensions to fit A4
  const imgWidth = pdfWidth - 40 // 20mm margin each side
  const imgHeight = (canvas.height * imgWidth) / canvas.width

  // Add image to PDF
  const yPosition = title ? 40 : 20
  pdf.addImage(imgData, 'PNG', 20, yPosition, imgWidth, imgHeight)

  // Add footer
  pdf.setFontSize(10)
  pdf.setTextColor(148, 163, 184) // slate-400
  pdf.text(`Legacy Album • Generated ${new Date().toLocaleDateString('en-KE')}`, 20, pdfHeight - 10)

  // Save PDF
  pdf.save(filename)
}