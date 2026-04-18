
// src/app/orders/[orderId]/pdf/route.ts
//
// GET /orders/[orderId]/pdf
//
// Fetches the order + its photos from Supabase, renders the
// OrderConfirmationPDF component server-side, and streams back
// a press-quality PDF — no client-side html2canvas involved.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { renderToBuffer, Document } from '@react-pdf/renderer'
import type { DocumentProps } from '@react-pdf/renderer'
import OrderConfirmationPDF from '@/components/OrderConfirmationPDF'
import { createElement } from 'react'
import type { ReactElement } from 'react'

// ── Supabase admin client (bypasses RLS — server only) ────────────────
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY   // service role, not anon

  if (!url || !key) {
    throw new Error('Supabase env vars are not set')
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  })
}

// ── Route handler ─────────────────────────────────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params

  if (!orderId) {
    return NextResponse.json({ error: 'Missing orderId' }, { status: 400 })
  }

  try {
    const supabase = getSupabase()

    // 1. Fetch the order row
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        id,
        customer_name,
        customer_email,
        selected_tier,
        total_amount,
        payment_method,
        payment_status,
        created_at
      `)
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      console.error('[pdf] order fetch error:', orderError)
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // 2. Fetch the associated photos
    const { data: photos = [], error: photosError } = await supabase
      .from('photos')
      .select('file_url, file_name')
      .eq('order_id', orderId)
      .order('sequence_number', { ascending: true })

    if (photosError) {
      // Non-fatal — render PDF without photos rather than failing
      console.warn('[pdf] photos fetch error:', photosError)
    }

    // 3. Normalise photos into the shape the PDF component expects
    const normalisedPhotos = (photos ?? []).map((p) => ({
      public_url: p.file_url  ?? '',
      file_name:  p.file_name ?? '',
    }))

    // 4. Format the order date
    const orderDate = new Date(order.created_at).toLocaleDateString('en-KE', {
      year:  'numeric',
      month: 'long',
      day:   'numeric',
    })

    // 5. Render PDF on the server
    const element = createElement(OrderConfirmationPDF, {
      orderId:       order.id,
      customerName:  order.customer_name,
      planName:      order.selected_tier,
      totalAmount:   Number(order.total_amount),
      paymentMethod: order.payment_method ?? 'M-Pesa',
      paymentStatus: order.payment_status ?? 'pending',
      photos:        normalisedPhotos,
      orderDate,
    }) as unknown as ReactElement<DocumentProps, typeof Document>

    const pdfBuffer = await renderToBuffer(element)
    const bytes     = new Uint8Array(pdfBuffer)

    const safeId = orderId.slice(0, 8).toUpperCase()

    return new NextResponse(bytes, {
      status: 200,
      headers: {
        'Content-Type':        'application/pdf',
        'Content-Disposition': `attachment; filename="legacy-album-${safeId}.pdf"`,
        'Content-Length':      bytes.length.toString(),
        'Cache-Control':       'no-store',
      },
    })
  } catch (err) {
    console.error('[pdf] unhandled error:', err)
    return NextResponse.json(
      { error: 'Failed to generate PDF. Please try again.' },
      { status: 500 }
    )
  }
}