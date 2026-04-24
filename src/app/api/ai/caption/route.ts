// src/app/api/ai/caption/route.ts
import { NextResponse } from 'next/server'
import { generatePhotoCaption } from '@/lib/ai'

export async function POST(request: Request) {
  try {
    const { fileName, context, locale } = await request.json()
    
    if (!fileName) {
      return NextResponse.json({ error: 'fileName is required' }, { status: 400 })
    }
    
    const caption = await generatePhotoCaption(fileName, context, locale === 'sw' ? 'sw' : 'en')
    
    return NextResponse.json({ caption })
  } catch (error) {
    console.error('Caption API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate caption' },
      { status: 500 }
    )
  }
}
