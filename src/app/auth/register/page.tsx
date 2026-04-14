'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { FcGoogle } from 'react-icons/fc'
import { FaHeart, FaUserPlus } from 'react-icons/fa6'

export default function RegisterPage() {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Client-side validation
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            full_name: form.fullName,
          },
        },
      })

      if (error) throw error

      setSuccess(true)
      
      // Auto-redirect after 2 seconds
      setTimeout(() => {
        router.push('/auth/login')
      }, 2000)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Sign up failed'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Google sign up failed'
      setError(message)
    }
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-900 via-slate-950 to-black p-4">
        <div className="relative glass rounded-3xl p-8 w-full max-w-md text-center animate-popup">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2 neon-pink">Account Created! 🎉</h2>
          <p className="text-gray-400 mb-6">Redirecting to login page...</p>
          
          {/* Progress bar */}
          <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
            <div className="h-full bg-linear-to-r from-cyan-400 to-cyan-500 animate-progress" />
          </div>
        </div>
      </div>
    )
  }

  // Register form
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-900 via-slate-950 to-black p-4 relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-200 h-200 bg-pink-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-1/2 -right-1/2 w-200 h-200 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Sign Up Card */}
      <div className="relative glass rounded-3xl p-8 w-full max-w-md shadow-2xl border border-white/10 hover-scale animate-popup">
        {/* Glowing border */}
        <div className="absolute inset-0 rounded-3xl opacity-30 blur-md animate-gradient" />

        {/* Content */}
        <div className="relative z-10">
          {/* Title */}
          <div className="text-center mb-8 animate-slide-down">
            <h2 className="text-2xl font-bold text-white flex items-center justify-center gap-2 neon-pink">
              <FaUserPlus className="text-pink-500" />
              CREATE ACCOUNT
              <FaHeart className="text-pink-500 animate-pulse" />
            </h2>
            <p className="text-gray-400 text-sm mt-2">Join Legacy Album today</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSignUp} className="space-y-4">
            {/* Full Name */}
            <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <input
                type="text"
                value={form.fullName}
                onChange={(e) => setForm({...form, fullName: e.target.value})}
                placeholder="Full Name"
                className="w-full px-6 py-3 rounded-full bg-white/10 border-2 border-white/30 text-white placeholder-gray-400 
                  focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all"
                required
                disabled={loading}
              />
            </div>

            {/* Email */}
            <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({...form, email: e.target.value})}
                placeholder="Email"
                className="w-full px-6 py-3 rounded-full bg-white/10 border-2 border-white/30 text-white placeholder-gray-400 
                  focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all"
                required
                disabled={loading}
              />
            </div>

            {/* Password */}
            <div className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({...form, password: e.target.value})}
                placeholder="Password (min 6 characters)"
                className="w-full px-6 py-3 rounded-full bg-white/10 border-2 border-white/30 text-white placeholder-gray-400 
                  focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all"
                required
                disabled={loading}
                minLength={6}
              />
            </div>

            {/* Confirm Password */}
            <div className="animate-slide-up" style={{ animationDelay: '0.4s' }}>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(e) => setForm({...form, confirmPassword: e.target.value})}
                placeholder="Confirm Password"
                className="w-full px-6 py-3 rounded-full bg-white/10 border-2 border-white/30 text-white placeholder-gray-400 
                  focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all"
                required
                disabled={loading}
              />
            </div>

            {/* Sign Up Button */}
            <div className="animate-slide-up" style={{ animationDelay: '0.5s' }}>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-full bg-linear-to-r from-cyan-400 to-cyan-500 text-slate-900 font-semibold 
                  hover:from-cyan-300 hover:to-cyan-400 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed
                  hover:shadow-[0_0_20px_rgba(34,211,238,0.6)] hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </div>

            {/* Divider */}
            <div className="relative py-2 animate-slide-up" style={{ animationDelay: '0.6s' }}>
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20" />
              </div>
              <div className="relative flex justify-center text-xs text-gray-400">
                <span className="px-3 bg-transparent">Or sign up with</span>
              </div>
            </div>

            {/* Google Sign Up */}
            <div className="animate-slide-up" style={{ animationDelay: '0.7s' }}>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-white/10 hover:bg-white/20 
                  border border-white/30 rounded-full py-3 text-white font-medium transition-all
                  disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
              >
                <FcGoogle className="w-5 h-5" />
                Continue with Google
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-300 px-4 py-3 rounded-lg text-sm text-center animate-slide-up">
                {error}
              </div>
            )}

            {/* Already have account */}
            <p className="text-center text-sm text-gray-400 animate-slide-up" style={{ animationDelay: '0.8s' }}>
              Already have an account?{' '}
              <a href="/auth/login" className="text-pink-400 hover:text-pink-300 font-semibold transition-colors">
                Sign in
              </a>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}