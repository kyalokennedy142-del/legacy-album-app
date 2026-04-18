// src/app/orders/[orderId]/page.tsx
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { FaClock, FaArrowLeft, FaDownload, FaTruck } from 'react-icons/fa'
import Link from 'next/link'

type OrderDetailsProps = {
  params: Promise<{ orderId: string }>
}

type OrderPhoto = {
  public_url: string
  file_name: string
  sequence_number: number
}

type Order = {
  id: string
  status: string | null
  plan_id: string | null
  payment_method: string | null
  payment_status: string | null
  total_amount: number | null
  created_at: string
  user_id: string
  order_photos: OrderPhoto[] | null
}

async function OrderDetailsPage({ params }: OrderDetailsProps) {
  const { orderId } = await params
  const supabase = await createClient()

  // Check auth
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return redirect('/auth/login')

  // Fetch order with photos
  const { data: order, error } = await supabase
    .from('draft_orders')
    .select(`
      *,
      order_photos(public_url, file_name, sequence_number)
    `)
    .eq('id', orderId)
    .eq('user_id', user.id)
    .single<Order>()

  if (error || !order) {
    console.error('Order fetch error:', error)
    return notFound()
  }

  // Fetch customer name from profiles table if available
  let customerName = 'Valued Customer'
  if (order.user_id) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', order.user_id)
      .single()

    if (profile?.full_name) {
      customerName = profile.full_name
    }
  }

  // Format helpers
  const formatDate = (dateString: string): string =>
    new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

  const getStatusColor = (status: string | null): string => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-500/20 text-gray-300',
      reviewing: 'bg-yellow-500/20 text-yellow-300',
      placed: 'bg-purple-500/20 text-purple-300',
      confirmed: 'bg-blue-500/20 text-blue-300',
      paid: 'bg-green-500/20 text-green-300',
      processing: 'bg-cyan-500/20 text-cyan-300',
      shipped: 'bg-indigo-500/20 text-indigo-300',
      delivered: 'bg-emerald-500/20 text-emerald-300',
      cancelled: 'bg-red-500/20 text-red-300',
    }
    return colors[status ?? 'draft'] ?? 'bg-gray-500/20 text-gray-300'
  }

  const photos = order.order_photos ?? []

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-950 to-black text-white py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/orders"
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition"
          >
            <FaArrowLeft />
          </Link>
          <h1 className="text-2xl font-bold">Order Details</h1>
        </div>

        {/* Order Card */}
        <div className="glass rounded-2xl p-6 mb-6">
          {/* Status Badge */}
          <div className="flex items-center justify-between mb-6">
            <span
              className={`px-4 py-2 rounded-full text-sm font-bold ${getStatusColor(order.status)}`}
            >
              {(order.status ?? 'draft').toUpperCase()}
            </span>
            <span className="text-gray-400 text-sm flex items-center gap-2">
              <FaClock /> {formatDate(order.created_at)}
            </span>
          </div>

          {/* Order Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-400 mb-2">Order ID</h3>
              <p className="font-mono text-sm">{order.id}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-400 mb-2">Customer</h3>
              <p>{customerName}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-400 mb-2">Plan</h3>
              <p className="capitalize">{order.plan_id ?? 'Legacy'}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-400 mb-2">Payment Method</h3>
              <p className="capitalize">{order.payment_method ?? 'Not set'}</p>
            </div>
          </div>

          {/* Total */}
          <div className="border-t border-white/10 pt-4 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Total Amount</span>
              <span className="text-2xl font-bold text-cyan-400">
                KES {(order.total_amount ?? 2499).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Photo Preview */}
          {photos.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-400 mb-3">
                Photos ({photos.length})
              </h3>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                {photos.slice(0, 6).map((photo, idx) => (
                  <div
                    key={`${photo.public_url}-${idx}`}
                    className="aspect-square rounded-lg overflow-hidden bg-white/5"
                  >
                    {photo.public_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={photo.public_url}
                        alt={photo.file_name ?? 'Order photo'}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                ))}
              </div>
              {photos.length > 6 && (
                <p className="text-xs text-gray-500 mt-2">
                  +{photos.length - 6} more photos
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            {/* ✅ FIXED: Redirect to receipt page for Chrome print/PDF */}
            <Link
              href={`/orders/${orderId}/receipt`}
              target="_blank"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 text-slate-900 font-medium hover:bg-cyan-400 transition"
            >
              <FaDownload /> Download Receipt
            </Link>

            {order.status === 'placed' && order.payment_status !== 'paid' && (
              <Link
                href={`/checkout?orderId=${orderId}`}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500 text-white font-medium hover:bg-purple-400 transition"
              >
                Complete Payment
              </Link>
            )}

            {order.status === 'delivered' && (
              <span className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/20 text-green-300">
                <FaTruck /> Delivered - Thank you!
              </span>
            )}
          </div>
        </div>

        {/* Help Section */}
        <div className="glass rounded-2xl p-6 text-center">
          <p className="text-gray-400 mb-4">
            Questions about your order? We&apos;re here to help.
          </p>
          <a
            href={`https://wa.me/${process.env.NEXT_PUBLIC_SUPPORT_PHONE ?? '254700000000'}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-green-500 text-slate-900 font-medium hover:bg-green-400 transition"
          >
            💬 WhatsApp Support
          </a>
        </div>
      </div>
    </div>
  )
}

export default OrderDetailsPage