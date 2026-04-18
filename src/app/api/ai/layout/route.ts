// src/app/api/ai/layout/route.ts
import { NextResponse } from 'next/server'
import { suggestLayout } from '@/lib/ai'

export async function POST(request: Request) {
  try {
    const { photoCount, planName, theme } = await request.json()
    
    if (!photoCount || !planName) {
      return NextResponse.json(
        { error: 'photoCount and planName are required' },
        { status: 400 }
      )
    }
    
    const suggestion = await suggestLayout(photoCount, planName, theme)
    
    return NextResponse.json(suggestion)
  } catch (error) {
    console.error('Layout API error:', error)
    return NextResponse.json(
      { error: 'Failed to suggest layout' },
      { status: 500 }
    )
  }
}