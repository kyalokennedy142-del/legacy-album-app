'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { FcGoogle } from 'react-icons/fc'
import { FaHeart, FaRightToBracket, FaKey } from 'react-icons/fa6'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showForgotModal, setShowForgotModal] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotSuccess, setForgotSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      router.push('/dashboard')
      router.refresh()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Sign in failed'
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
      const message = err instanceof Error ? err.message : 'Google sign in failed'
      setError(message)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setForgotLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      })
      if (error) throw error
      setForgotSuccess(true)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send reset email'
      setError(message)
    } finally {
      setForgotLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-900 via-slate-950 to-black p-4 relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-200 h-200 bg-pink-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-1/2 -right-1/2 w-200 h-200 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Login Card */}
      <div className="relative glass rounded-3xl p-8 w-full max-w-md shadow-2xl border border-white/10 animate-popup">
        {/* Glowing border */}
        <div className="absolute inset-0 rounded-3xl opacity-30 blur-md animate-gradient" />

        {/* Content */}
        <div className="relative z-10">
          {/* Title */}
          <div className="text-center mb-8 animate-slide-down">
            <h2 className="text-2xl font-bold text-white flex items-center justify-center gap-2 neon-pink">
              <FaRightToBracket className="text-pink-500" />
              LOGIN
              <FaHeart className="text-pink-500 animate-pulse" />
            </h2>
            <p className="text-gray-400 text-sm mt-2">Welcome back to Legacy Album</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSignIn} className="space-y-5">
            {/* Email - Staggered Animation */}
            <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full px-6 py-3 rounded-full bg-white/10 border-2 border-white/30 text-white placeholder-gray-400 
                  focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all"
                required
                disabled={loading}
              />
            </div>

            {/* Password - Staggered Animation */}
            <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full px-6 py-3 rounded-full bg-white/10 border-2 border-white/30 text-white placeholder-gray-400 
                  focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all"
                required
                disabled={loading}
              />
            </div>

            {/* Sign In Button - Staggered Animation */}
            <div className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-full bg-linear-to-r from-cyan-400 to-cyan-500 text-slate-900 font-semibold 
                  hover:from-cyan-300 hover:to-cyan-400 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed
                  hover:shadow-[0_0_20px_rgba(34,211,238,0.6)] hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>

            {/* Links Row - Staggered Animation */}
            <div className="flex justify-between text-sm animate-slide-up" style={{ animationDelay: '0.4s' }}>
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-gray-300 hover:text-white transition-colors flex items-center gap-1"
              >
                <FaKey className="w-3 h-3" /> Forgot Password?
              </button>
              <a href="/auth/register" className="text-pink-400 hover:text-pink-300 font-semibold transition-colors">
                Sign up
              </a>
            </div>

            {/* Divider */}
            <div className="relative py-2 animate-slide-up" style={{ animationDelay: '0.5s' }}>
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20" />
              </div>
              <div className="relative flex justify-center text-xs text-gray-400">
                <span className="px-3 bg-transparent">Or continue with</span>
              </div>
            </div>

            {/* Google Sign In - Staggered Animation */}
            <div className="animate-slide-up" style={{ animationDelay: '0.6s' }}>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-white/10 hover:bg-white/20 
                  border border-white/30 rounded-full py-3 text-white font-medium transition-all
                  disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]
                  hover:border-cyan-400/50 group"
              >
                <FcGoogle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                Continue with Google
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-300 px-4 py-3 rounded-lg text-sm text-center animate-slide-up">
                {error}
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="glass rounded-3xl p-8 w-full max-w-md border border-white/10 animate-popup">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaKey className="w-8 h-8 text-cyan-400" />
              </div>
              <h3 className="text-xl font-bold text-white neon-cyan">Reset Password</h3>
              <p className="text-gray-400 text-sm mt-2">
                Enter your email and we&apos;ll send you a reset link
              </p>
            </div>

            {forgotSuccess ? (
              <div className="text-center animate-slide-up">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-white font-semibold mb-2">Check your email!</p>
                <p className="text-gray-400 text-sm mb-6">
                  We&apos;ve sent a password reset link to <span className="text-cyan-400">{forgotEmail}</span>
                </p>
                <button
                  onClick={() => {
                    setShowForgotModal(false)
                    setForgotSuccess(false)
                    setForgotEmail('')
                  }}
                  className="w-full py-3 rounded-full bg-linear-to-r from-cyan-400 to-cyan-500 text-slate-900 font-semibold hover:scale-[1.02] transition-all"
                >
                  Back to Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full px-6 py-3 rounded-full bg-white/10 border-2 border-white/30 text-white placeholder-gray-400 
                    focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all"
                  required
                  disabled={forgotLoading}
                />

                {error && (
                  <div className="bg-red-500/20 border border-red-500/50 text-red-300 px-4 py-3 rounded-lg text-sm text-center">
                    {error}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="flex-1 py-3 rounded-full bg-white/10 text-white font-medium hover:bg-white/20 transition-all"
                    disabled={forgotLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="flex-1 py-3 rounded-full bg-linear-to-r from-cyan-400 to-cyan-500 text-slate-900 font-semibold 
                      hover:from-cyan-300 hover:to-cyan-400 transition-all disabled:opacity-50"
                  >
                    {forgotLoading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}