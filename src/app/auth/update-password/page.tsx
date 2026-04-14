'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { FaLock } from 'react-icons/fa6'

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Check if user has a session (came from reset email)
    const checkSession = async () => {
      const {  data:{ session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth/login')
      }
    }
    checkSession()
  }, [router, supabase])

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setSuccess(true)
      setTimeout(() => router.push('/auth/login'), 2000)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update password'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-900 via-slate-950 to-black p-4">
      <div className="relative glass rounded-3xl p-8 w-full max-w-md shadow-2xl border border-white/10 animate-popup">
        <div className="absolute inset-0 rounded-3xl opacity-30 blur-md animate-gradient" />
        
        <div className="relative z-10 text-center">
          <div className="w-16 h-16 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaLock className="w-8 h-8 text-cyan-400" />
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-2 neon-cyan">Set New Password</h2>
          <p className="text-gray-400 text-sm mb-6">Enter your new password below</p>

          {success ? (
            <div className="animate-slide-up">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-white font-semibold mb-2">Password Updated!</p>
              <p className="text-gray-400 text-sm">Redirecting to login...</p>
            </div>
          ) : (
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="New Password"
                className="w-full px-6 py-3 rounded-full bg-white/10 border-2 border-white/30 text-white placeholder-gray-400 
                  focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all"
                required
                disabled={loading}
                minLength={6}
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm New Password"
                className="w-full px-6 py-3 rounded-full bg-white/10 border-2 border-white/30 text-white placeholder-gray-400 
                  focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all"
                required
                disabled={loading}
                minLength={6}
              />

              {error && (
                <div className="bg-red-500/20 border border-red-500/50 text-red-300 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-full bg-linear-to-r from-cyan-400 to-cyan-500 text-slate-900 font-semibold 
                  hover:from-cyan-300 hover:to-cyan-400 transition-all disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}