// src/app/dashboard/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const params = await searchParams
  const submitted = params.submitted
  const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-950 to-black text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold neon-pink">Legacy Album</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400 hidden sm:inline">{user.email}</span>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg text-sm font-medium transition-colors"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          
          {/* Success Banner */}
          {submitted === 'true' && (
            <div className="bg-green-500/20 border border-green-500/50 text-green-300 px-4 py-3 rounded-lg mb-8 animate-slide-up">
              🎉 Your order has been submitted! We&apos;ll notify you when it ships.
            </div>
          )}

          {/* Welcome */}
          <div className="mb-12 animate-slide-down">
            <h2 className="text-3xl font-bold mb-2">
              Welcome back, {userName}! 👋
            </h2>
            <p className="text-gray-400">
              Ready to preserve your memories?
            </p>
          </div>

          {/* Quick Actions - Updated to go through /plans */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            
            {/* Upload Photos → Plans First */}
            <Link
              href="/plans"
              className="glass p-6 rounded-2xl border border-white/10 hover:border-cyan-400/50 transition-all hover:scale-105 group"
            >
              <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-cyan-500/30">
                <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-semibold mb-1 text-white">Choose a Plan & Upload</h3>
              <p className="text-sm text-gray-400">Select your album tier to get started</p>
            </Link>

            {/* My Albums */}
            <Link
              href="/orders"
              className="glass p-6 rounded-2xl border border-white/10 hover:border-pink-400/50 transition-all hover:scale-105 group"
            >
              <div className="w-12 h-12 bg-pink-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-pink-500/30">
                <svg className="w-6 h-6 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="font-semibold mb-1 text-white">My Albums</h3>
              <p className="text-sm text-gray-400">View your orders</p>
            </Link>

            {/* Account Settings */}
            <Link
              href="/profile"
              className="glass p-6 rounded-2xl border border-white/10 hover:border-purple-400/50 transition-all hover:scale-105 group"
            >
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-purple-500/30">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="font-semibold mb-1 text-white">Account Settings</h3>
              <p className="text-sm text-gray-400">Update email & password</p>
            </Link>
          </div>

          {/* Recent Activity */}
          <div className="glass rounded-2xl p-6">
            <h3 className="font-semibold mb-4 text-white">Recent Activity</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-white/10 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                    <span className="text-cyan-400 text-sm">📦</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">New album created</p>
                    <p className="text-xs text-gray-500">Today</p>
                  </div>
                </div>
                <Link href="/orders" className="text-xs text-cyan-400 hover:underline">
                  View →
                </Link>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}