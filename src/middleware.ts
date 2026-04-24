import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { checkRateLimit } from '@/lib/rateLimiter'
import { resolvePlanTier } from '@/lib/permissions'

const PUBLIC_ROUTES = ['/', '/plans']
const PAID_ROUTES = ['/customize', '/review', '/checkout']

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const isAuthRoute = pathname.startsWith('/auth')
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname)

  if (isAuthRoute && request.method === 'POST') {
    const forwardedFor = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const ip = forwardedFor?.split(',')[0]?.trim() || realIp || '127.0.0.1'
    const { allowed, remaining } = checkRateLimit(ip)

    if (!allowed) {
      return new NextResponse(
        JSON.stringify({ error: 'Too many requests. Please try again later.' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '60',
          },
        }
      )
    }

    const response = NextResponse.next()
    response.headers.set('X-RateLimit-Remaining', remaining.toString())
    return response
  }

  const response = NextResponse.next({ request })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user && !isAuthRoute && !isPublicRoute) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/auth/login'
    loginUrl.searchParams.set('from', `${pathname}${request.nextUrl.search}`)
    return NextResponse.redirect(loginUrl)
  }

  if (user && PAID_ROUTES.includes(pathname) && !request.nextUrl.searchParams.has('upgrade')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan_tier, payment_status, plan_expires_at')
      .eq('id', user.id)
      .maybeSingle()

    const planTier = resolvePlanTier(profile?.plan_tier)
    const expiresAt = profile?.plan_expires_at
    const isExpired =
      typeof expiresAt === 'string' && new Date(expiresAt).getTime() < Date.now()
    const isPaid = profile?.payment_status === 'paid' && !isExpired

    if (!isPaid || planTier === 'free') {
      const upgradeUrl = request.nextUrl.clone()
      upgradeUrl.searchParams.set('upgrade', '1')
      upgradeUrl.searchParams.set('from', `${pathname}${request.nextUrl.search}`)
      return NextResponse.redirect(upgradeUrl)
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico)$).*)',
  ],
}
