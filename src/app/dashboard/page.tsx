import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getPlanConfig } from '@/lib/permissions'
import { getUserPlan } from '@/lib/permissions.server'

export const dynamic = 'force-dynamic'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const params = await searchParams
  const submitted = params.submitted
  const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
  const userPlan = await getUserPlan(user.id)
  const planConfig = getPlanConfig(userPlan.planTier)

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-950 to-black text-white">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-slate-900/50 backdrop-blur-md">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <h1 className="text-white">Legacy Album</h1>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-gray-400 sm:inline">{user.email}</span>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="rounded-lg border border-red-500/50 bg-red-500/20 px-4 py-2 text-sm font-medium transition-colors hover:bg-red-500/30"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-5xl">
          {submitted === 'true' ? (
            <div className="mb-8 rounded-lg border border-green-500/50 bg-green-500/20 px-4 py-3 text-green-300">
              Your order has been submitted. We&apos;ll notify you when it ships.
            </div>
          ) : null}

          <div className="mb-12">
            <h2 className="text-3xl font-bold text-white">Welcome back, {userName}</h2>
            <p className="mt-2 text-gray-400">Ready to preserve your memories?</p>
          </div>

          <div className="mb-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="glass rounded-2xl border border-[color:var(--border-strong)] p-6">
              <p className="text-label mb-2">Current Plan</p>
              <h3 className="text-2xl font-semibold text-white">{planConfig.name}</h3>
              <p className="mt-2 text-sm text-gray-300">{planConfig.summary}</p>
              <p className="mt-3 text-sm text-[color:var(--color-gold)]">
                {userPlan.isPaid ? 'Paid features are active' : 'Upgrade to unlock customise, review, and checkout'}
              </p>
              <Link
                href="/plans"
                className="mt-4 inline-flex min-h-11 items-center rounded-full bg-[color:var(--color-gold)] px-4 py-2 text-sm font-semibold text-slate-900"
              >
                {userPlan.isPaid ? 'Manage plan' : 'Upgrade now'}
              </Link>
            </div>

            <Link
              href="/plans"
              className="glass group rounded-2xl border border-white/10 p-6 transition-all hover:scale-105 hover:border-cyan-400/50"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/20 group-hover:bg-cyan-500/30">
                <svg className="h-6 w-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="mb-1 font-semibold text-white">Choose a Plan & Upload</h3>
              <p className="text-sm text-gray-400">Select your album tier to get started</p>
            </Link>

            <Link
              href="/orders"
              className="glass group rounded-2xl border border-white/10 p-6 transition-all hover:scale-105 hover:border-pink-400/50"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-pink-500/20 group-hover:bg-pink-500/30">
                <svg className="h-6 w-6 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="mb-1 font-semibold text-white">My Albums</h3>
              <p className="text-sm text-gray-400">View your orders</p>
            </Link>

            <Link
              href="/profile"
              className="glass group rounded-2xl border border-white/10 p-6 transition-all hover:scale-105 hover:border-purple-400/50"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/20 group-hover:bg-purple-500/30">
                <svg className="h-6 w-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <h3 className="mb-1 font-semibold text-white">Account Settings</h3>
              <p className="text-sm text-gray-400">Update email and password</p>
            </Link>
          </div>

          <div className="glass rounded-2xl p-6">
            <h3 className="mb-4 font-semibold text-white">Recent Activity</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 py-3 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/20">
                    <span className="text-sm text-cyan-400">Album</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Plan status ready for your next album</p>
                    <p className="text-xs text-gray-500">Today</p>
                  </div>
                </div>
                <Link href="/plans" className="text-xs text-cyan-400 hover:underline">
                  View
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
