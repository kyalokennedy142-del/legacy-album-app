// src/app/api/generate-pdf/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer, Document } from '@react-pdf/renderer'
import type { DocumentProps } from '@react-pdf/renderer'
import OrderConfirmationPDF, {
  type OrderConfirmationPDFProps,
} from '@/components/OrderConfirmationPDF'
import { createElement } from 'react'
import type { ReactElement } from 'react'

export async function POST(req: NextRequest) {
  try {
    const body: OrderConfirmationPDFProps = await req.json()

    const required: (keyof OrderConfirmationPDFProps)[] = [
      'orderId', 'customerName', 'planName',
      'totalAmount', 'paymentMethod', 'paymentStatus', 'orderDate',
    ]
    for (const field of required) {
      if (body[field] === undefined || body[field] === null) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
    }

    // ✅ FIX: renderToBuffer expects ReactElement<DocumentProps> — i.e. a
    // component whose root is <Document>. Our component satisfies this at
    // runtime, but TypeScript only sees FunctionComponentElement<OurProps>.
    // The cast is safe because OrderConfirmationPDF returns a <Document>.
    const element = createElement(OrderConfirmationPDF, {
      ...body,
      photos: body.photos ?? [],
    }) as unknown as ReactElement<DocumentProps, typeof Document>

    const pdfBuffer = await renderToBuffer(element)
    // ✅ FIX: NextResponse BodyInit doesn't accept Node's Buffer directly.
    // Uint8Array shares the same underlying memory — zero-copy conversion.
    const bytes = new Uint8Array(pdfBuffer)

    const safeOrderId = body.orderId.slice(0, 8).toUpperCase()

    return new NextResponse(bytes, {
      status: 200,
      headers: {
        'Content-Type':        'application/pdf',
        'Content-Disposition': `attachment; filename="legacy-album-${safeOrderId}.pdf"`,
        'Content-Length':       bytes.length.toString(),
        'Cache-Control':       'no-store',
      },
    })
  } catch (err) {
    console.error('[PDF generation error]', err)
    return NextResponse.json(
      { error: 'Failed to generate PDF. Please try again.' },
      { status: 500 }
    )
  }
}