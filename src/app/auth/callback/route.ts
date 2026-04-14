import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data.user) {
      // Forward user to dashboard or requested page
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Return user to login page if something went wrong
  return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_error`)
}