// src/app/orders/[orderId]/receipt/page.tsx
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { FaArrowLeft } from 'react-icons/fa'
import Link from 'next/link'
import PrintButton from './PrintButton'

// ── Types ──────────────────────────────────────────────────────────────
type OrderPhoto = {
  public_url:      string
  file_name:       string
  sequence_number: number
}

type Order = {
  id:             string
  status:         string | null
  plan_id:        string | null
  payment_method: string | null
  payment_status: string | null
  total_amount:   number | null
  created_at:     string
  user_id:        string
  order_photos:   OrderPhoto[] | null
}

type PageProps = {
  params: Promise<{ orderId: string }>
}

// ── Page ───────────────────────────────────────────────────────────────
export default async function ReceiptPage({ params }: PageProps) {
  const { orderId } = await params
  const supabase    = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/auth/login')

  // ✅ FIX 1: destructure as `data: order` — Supabase returns { data, error },
  // not { order, error }. The old code always got undefined and hit notFound().
  const { data: order, error } = await supabase
    .from('draft_orders')
    .select(`
      *,
      order_photos (public_url, file_name, sequence_number)
    `)
    .eq('id', orderId)
    .eq('user_id', user.id)
    .single<Order>()

  if (error || !order) return notFound()

  const photos     = order.order_photos ?? []
  const planLabel  = order.plan_id?.replace(/-/g, ' ') ?? 'Legacy'
  const orderDate  = new Date(order.created_at).toLocaleDateString('en-KE', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
  const isPaid     = order.payment_status?.toLowerCase() === 'paid'

  return (
    <>
      {/*
        ✅ FIX 2: plain <style> tag — `jsx` and `global` props are Pages Router
        (styled-jsx) syntax. App Router ignores them; this is the correct form.
      */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area {
            position: absolute;
            inset: 0;
            padding: 24px;
            background: white !important;
            color: black !important;
          }
          .no-print { display: none !important; }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      <div className="min-h-screen py-12 px-4" style={{ background: 'var(--bg)', color: 'var(--text-primary)' }}>
        <div className="mx-auto max-w-3xl">

          {/* ── Nav bar (hidden when printing) ── */}
          <div className="no-print flex items-center justify-between mb-6">
            <Link
              href={`/orders/${orderId}`}
              className="flex items-center gap-2 text-sm transition-opacity hover:opacity-70"
              style={{ color: 'var(--gold)' }}
            >
              <FaArrowLeft size={12} />
              Back to Order
            </Link>

            {/* ✅ FIX 3: onClick lives in a 'use client' component — can't call
                window.print() from an async server component */}
            <PrintButton />
          </div>

          {/* ── Printable receipt card ── */}
          <div
            className="print-area rounded-2xl p-8 shadow-sm"
            style={{
              background:  '#ffffff',
              color:       '#1a1410',
              border:      '1px solid #d4c4ad',
            }}
          >

            {/* Header */}
            <div
              className="flex justify-between items-start pb-6 mb-6"
              style={{ borderBottom: '1.5px solid #c9a050' }}
            >
              <div>
                <h1 className="text-2xl font-bold" style={{ color: '#1a1410' }}>
                  The Legacy Album
                </h1>
                <p className="text-sm mt-1" style={{ color: '#9c8a74', letterSpacing: '0.08em' }}>
                  ORDER RECEIPT
                </p>
              </div>
              <div className="text-right">
                <p className="font-mono text-sm" style={{ color: '#5c4d3a' }}>
                  #{order.id.slice(0, 8).toUpperCase()}
                </p>
                <p className="text-sm mt-1" style={{ color: '#9c8a74' }}>{orderDate}</p>
              </div>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-y-4 gap-x-6 mb-6 text-sm">
              {[
                ['Plan',           planLabel],
                ['Payment Method', order.payment_method ?? '—'],
                ['Photos',         String(photos.length)],
              ].map(([lbl, val]) => (
                <div key={lbl}>
                  <p style={{ color: '#9c8a74' }}>{lbl}</p>
                  <p className="font-medium capitalize mt-0.5" style={{ color: '#1a1410' }}>{val}</p>
                </div>
              ))}
              <div>
                <p style={{ color: '#9c8a74' }}>Payment Status</p>
                <p
                  className="font-medium mt-0.5"
                  style={{ color: isPaid ? '#4a7c59' : '#8a6a2e' }}
                >
                  {isPaid ? 'Paid' : 'Pending'}
                </p>
              </div>
            </div>

            {/* Photo thumbnails */}
            {photos.length > 0 && (
              <div className="mb-6">
                <p
                  className="text-xs mb-2 uppercase tracking-widest"
                  style={{ color: '#9c8a74' }}
                >
                  Photo Preview
                </p>
                <div className="grid grid-cols-6 gap-2">
                  {photos.slice(0, 12).map((photo, i) => (
                    <div
                      key={i}
                      className="aspect-square rounded overflow-hidden"
                      style={{ background: '#f2ebe0', border: '0.5px solid #d4c4ad' }}
                    >
                      {photo.public_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={photo.public_url}
                          alt=""
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      )}
                    </div>
                  ))}
                </div>
                {photos.length > 12 && (
                  <p className="text-xs mt-1" style={{ color: '#9c8a74' }}>
                    +{photos.length - 12} more photos included in your album
                  </p>
                )}
              </div>
            )}

            {/* Total */}
            <div
              className="flex justify-between items-center py-4 mb-6"
              style={{ borderTop: '1px solid #d4c4ad', borderBottom: '1px solid #d4c4ad' }}
            >
              <span className="font-medium" style={{ color: '#5c4d3a' }}>Total Amount</span>
              <span className="text-2xl font-bold" style={{ color: '#c9a050' }}>
                {order.total_amount != null
                  ? `KES ${order.total_amount.toLocaleString('en-KE')}`
                  : '—'}
              </span>
            </div>

            {/* Footer */}
            <div className="text-center text-xs" style={{ color: '#9c8a74' }}>
              <p>Thank you for preserving your memories with The Legacy Album.</p>
              <p className="mt-1">legacy-album.co.ke · support@legacy-album.co.ke</p>
            </div>

          </div>
        </div>
      </div>
    </>
  )
}