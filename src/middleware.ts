// src/middleware.ts (ROOT LEVEL - Next.js reads this automatically)
import { updateSession } from '@/lib/supabase/middleware'
import { checkRateLimit } from '@/lib/rateLimiter'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Apply rate limiting only to auth POST requests (login/register)
  const isAuthRoute = request.nextUrl.pathname.startsWith('/auth')
  
  if (isAuthRoute && request.method === 'POST') {
    // Get client IP from headers (type-safe, proxy-aware)
    const forwardedFor = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const ip = forwardedFor?.split(',')[0].trim() || realIp || '127.0.0.1'
    
    // Check rate limit
    const { allowed, remaining } = checkRateLimit(ip)

    if (!allowed) {
      return new NextResponse(
        JSON.stringify({ error: 'Too many requests. Please try again later.' }),
        { 
          status: 429,
          headers: { 
            'Content-Type': 'application/json',
            'Retry-After': '60'
          }
        }
      )
    }

    // Attach rate limit headers for debugging
    const response = NextResponse.next()
    response.headers.set('X-RateLimit-Remaining', remaining.toString())
    return response
  }

  // Handle Supabase auth session for all other requests
  return await updateSession(request)
}

// Matcher: Apply middleware to all routes except static assets
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}