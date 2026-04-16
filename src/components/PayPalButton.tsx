/* eslint-disable @typescript-eslint/no-unused-vars */
// src/components/PayPalButton.tsx
'use client'

import { PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js'
import { useState } from 'react'

interface PayPalButtonProps {
  orderId: string
  amount: number
  currency?: string
  onSuccess: () => void
  onError: (error: string) => void
}

export default function PayPalButton({
  orderId,
  amount,
  currency = 'KES',
  onSuccess,
  onError,
}: PayPalButtonProps) {
  const [{ isPending }] = usePayPalScriptReducer()
  const [isCreating, setIsCreating] = useState(false)

  const createOrder = async (): Promise<string> => {
    setIsCreating(true)
    try {
      const response = await fetch('/api/paypal/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, amount, currency }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create PayPal order')
      }

      const { id } = await response.json()
      return id
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create order'
      onError(message)
      throw error
    } finally {
      setIsCreating(false)
    }
  }

  const handleApprove = async ({ orderID }: { orderID: string }) => {
    // Redirect to capture endpoint — it handles the redirect to confirmation/error
    window.location.href = `/api/paypal/capture?token=${orderID}&orderId=${orderId}`
  }

  const handleError = (error: Record<string, unknown>) => {
    console.error('PayPal error:', error)
    onError(typeof error?.message === 'string' ? error.message : 'PayPal payment failed')
  }

  if (isPending || isCreating) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full" />
        <span className="ml-2 text-sm text-gray-400">Loading PayPal...</span>
      </div>
    )
  }

  return (
    <PayPalButtons
      style={{ layout: 'vertical', shape: 'rect', label: 'paypal' }}
      createOrder={createOrder}
      onApprove={handleApprove}
      onError={handleError}
      fundingSource="paypal"
    />
  )
}