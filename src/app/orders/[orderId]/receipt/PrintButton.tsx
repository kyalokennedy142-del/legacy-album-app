'use client'
// src/app/orders/[orderId]/receipt/PrintButton.tsx

import { FaPrint } from 'react-icons/fa'

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="no-print flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
      style={{
        background:  'var(--gold)',
        color:       'var(--dark)',
      }}
    >
      <FaPrint size={13} />
      Print / Save as PDF
    </button>
  )
}