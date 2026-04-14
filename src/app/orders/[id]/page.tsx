/* eslint-disable @typescript-eslint/no-unused-vars */
// src/app/orders/[id]/page.tsx
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { FaBox, FaCheckCircle, FaClock, FaTruck, FaArrowLeft, FaDownload } from 'react-icons/fa'
import Link from 'next/link'

// ✅ FIX: Define proper types
type Photo = {
  id: string
  public_url: string
  file_name: string
  caption?: string
  sequence_number: number
}

type Order = {
  id: string
  status: string | null
  template_id: string | null
  total_amount: number | null
  payment_status: string | null
  created_at: string
  // Note: updated_at removed - doesn't exist in schema
}

export default async function OrderDetailsPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params
  const supabase = await createClient()
  
  // ✅ FIX: Correct destructuring syntax
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/auth/login')

  // ✅ FIX: Proper destructuring with error handling
  const { data: order, error: orderError } = await supabase
    .from('draft_orders')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (orderError || !order) {
    console.error('Failed to fetch order:', orderError)
    return notFound()
  }

  // ✅ FIX: Proper destructuring
  const { data: photos } = await supabase
    .from('order_photos')
    .select('*')
    .eq('draft_order_id', id)
    .order('sequence_number', { ascending: true })

  // ✅ FIX: Properly typed steps with status mapping
  const steps: Array<{ 
    label: string
    icon: typeof FaBox
    status: string 
    matchStatuses: string[]
  }> = [
    { 
      label: 'Order Placed', 
      icon: FaBox, 
      status: 'submitted',
      matchStatuses: ['submitted', 'paid', 'confirmed', 'printing', 'shipped', 'delivered']
    },
    { 
      label: 'Payment Confirmed', 
      icon: FaCheckCircle, 
      status: 'paid',
      matchStatuses: ['paid', 'confirmed', 'printing', 'shipped', 'delivered']
    },
    { 
      label: 'Printing', 
      icon: FaClock, 
      status: 'printing',
      matchStatuses: ['printing', 'shipped', 'delivered']
    },
    { 
      label: 'Shipped', 
      icon: FaTruck, 
      status: 'shipped',
      matchStatuses: ['shipped', 'delivered']
    }
  ]

  // ✅ FIX: Improved status checking logic
  const getStepStatus = (stepIndex: number) => {
    const currentStatus = order.status || 'draft'
    if (currentStatus === 'draft') return false
    
    const step = steps[stepIndex]
    return step.matchStatuses.includes(currentStatus)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric', month: 'long', day: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-950 to-black text-white py-12 px-4">
      <div className="container mx-auto max-w-5xl">
        
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <Link 
            href="/orders"
            className="p-2 hover:bg-white/10 rounded-full transition"
            aria-label="Back to orders"
          >
            <FaArrowLeft className="text-gray-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Order Details</h1>
            <p className="text-sm text-gray-400 font-mono">ID: {id.slice(0, 8)}...</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Status & Info */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Tracking Card */}
            <div className="glass rounded-2xl p-6">
              <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <FaTruck className="text-cyan-400" /> Tracking
              </h2>
              
              <div className="space-y-0">
                {steps.map((step, index) => {
                  const isCompleted = getStepStatus(index)
                  
                  return (
                    <div key={step.label} className="flex gap-4 relative">
                      {/* Vertical Line */}
                      {index < steps.length - 1 && (
                        <div 
                          className={`absolute left-2.75 top-8 -bottom-6 w-0.5 ${
                            isCompleted ? 'bg-cyan-500' : 'bg-white/10'
                          }`} 
                        />
                      )}
                      
                      {/* Icon */}
                      <div 
                        className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 ${
                          isCompleted ? 'bg-cyan-500 text-slate-900' : 'bg-white/10 text-gray-500'
                        }`}
                      >
                        <step.icon className="w-3 h-3" />
                      </div>
                      
                      {/* Text */}
                      <div className="pb-8">
                        <p className={`font-medium ${isCompleted ? 'text-white' : 'text-gray-500'}`}>
                          {step.label}
                        </p>
                        {/* ✅ FIX: Removed updated_at reference, only show date for completed steps if needed */}
                        {isCompleted && index === 0 && (
                          <p className="text-xs text-gray-400 mt-1">
                            {formatDate(order.created_at)}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Summary Card */}
            <div className="glass rounded-2xl p-6">
              <h2 className="text-lg font-semibold mb-4">Summary</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Template</span>
                  <span className="text-white capitalize">
                    {/* ✅ FIX: Global replace all dashes */}
                    {order.template_id?.replace(/-/g, ' ') || 'Custom'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Photos</span>
                  <span className="text-white">{photos?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total</span>
                  <span className="text-cyan-400 font-bold">
                    KES {order.total_amount?.toLocaleString() || '2,499'}
                  </span>
                </div>
                <div className="flex justify-between pt-3 border-t border-white/10">
                  <span className="text-gray-400">Status</span>
                  <span 
                    className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                      order.status === 'paid' || order.status === 'confirmed' 
                        ? 'bg-green-500/20 text-green-300' 
                        : order.status === 'submitted' 
                          ? 'bg-yellow-500/20 text-yellow-300' 
                          : 'bg-gray-500/20 text-gray-300'
                    }`}
                  >
                    {order.status || 'DRAFT'}
                  </span>
                </div>
              </div>
              
              {/* Invoice Button */}
              <button 
                className="w-full mt-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition disabled:opacity-50"
                disabled // TODO: Implement invoice generation
              >
                <FaDownload /> Download Invoice (PDF)
              </button>
            </div>

          </div>

          {/* Right Column: Photo Grid */}
          <div className="lg:col-span-2">
            <div className="glass rounded-2xl p-6">
              <h2 className="text-lg font-semibold mb-6">Your Photos</h2>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {(photos as Photo[] | null)?.map((photo) => (
                  <div 
                    key={photo.id} 
                    className="group relative aspect-square rounded-lg overflow-hidden bg-slate-800 border border-white/5"
                  >
                    {/* ✅ FIX: Added proper image attributes for accessibility */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={photo.public_url} 
                      alt={photo.caption || photo.file_name} 
                      className="w-full h-full object-cover transition-transform group-hover:scale-110"
                      loading="lazy"
                    />
                    
                    {/* Overlay with Caption */}
                    {photo.caption && (
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4 text-center">
                        <p className="text-sm text-white italic">&quot;{photo.caption}&quot;</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {(!photos || photos.length === 0) && (
                <div className="text-center py-12 text-gray-500">
                  No photos found for this order.
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}