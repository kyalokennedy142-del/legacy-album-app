// src/components/profile/ProfileContent.tsx
'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { FaLock, FaEnvelope, FaSpinner, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa'

interface ProfileContentProps {
  user: User
}

type FormStatus = 'idle' | 'loading' | 'success' | 'error'

export default function ProfileContent({ user }: ProfileContentProps) {
  const router = useRouter()
  const supabase = createClient()

  // Email update state
  const [newEmail, setNewEmail] = useState(user.email || '')
  const [emailStatus, setEmailStatus] = useState<FormStatus>('idle')
  const [emailError, setEmailError] = useState('')

  // Password update state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordStatus, setPasswordStatus] = useState<FormStatus>('idle')
  const [passwordError, setPasswordError] = useState('')

  // ✅ Update email
  const handleEmailUpdate = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      setEmailStatus('loading')
      setEmailError('')

      try {
        // Validate email format
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
          throw new Error('Please enter a valid email address')
        }

        const { error } = await supabase.auth.updateUser({ email: newEmail })

        if (error) {
          throw new Error(error.message)
        }

        setEmailStatus('success')
        // Note: If secure email change is enabled, user must confirm via email
      } catch (err: unknown) {
        // ✅ FIX #2: Type guard for unknown error
        const message = err instanceof Error ? err.message : 'Failed to update email'
        console.error('Email update failed:', err)
        setEmailError(message)
        setEmailStatus('error')
      }
    },
    [newEmail, supabase.auth]
  )

  // ✅ Update password (requires current password for security)
  const handlePasswordUpdate = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      setPasswordStatus('loading')
      setPasswordError('')

      try {
        // Validate passwords
        if (newPassword.length < 8) {
          throw new Error('New password must be at least 8 characters')
        }
        if (newPassword !== confirmPassword) {
          throw new Error('New passwords do not match')
        }

        // First, verify current password by signing in
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: user.email || '',
          password: currentPassword,
        })

        if (signInError) {
          throw new Error('Current password is incorrect')
        }

        // Now update the password
        const { error: updateError } = await supabase.auth.updateUser({
          password: newPassword,
        })

        if (updateError) {
          throw new Error(updateError.message)
        }

        // Clear form
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        setPasswordStatus('success')

        // Optional: Sign out and require re-login for security
        // await supabase.auth.signOut()
        // router.push('/auth/login?message=password-updated')
      } catch (err: unknown) {
        // ✅ FIX #1: Use 'unknown' + type guard (not 'never')
        const message = err instanceof Error ? err.message : 'Failed to update password'
        console.error('Password update failed:', err)
        setPasswordError(message)
        setPasswordStatus('error')
      }
    },
    [user.email, currentPassword, newPassword, confirmPassword, supabase.auth]
  )

  // ✅ Handle password reset (fixes redirect issue)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleForgotPassword = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      setEmailStatus('loading')
      setEmailError('')

      try {
        const origin = typeof window !== 'undefined' ? window.location.origin : ''

        const { error } = await supabase.auth.resetPasswordForEmail(newEmail, {
          // ✅ FIX #5: Redirect to profile page after reset, not dashboard
          redirectTo: `${origin}/profile?reset=success`,
        })

        if (error) {
          throw new Error(error.message)
        }

        setEmailStatus('success')
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to send reset email'
        console.error('Password reset failed:', err)
        setEmailError(message)
        setEmailStatus('error')
      }
    },
    [newEmail, supabase.auth]
  )

  // ✅ Handle sign out
  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }, [router, supabase.auth])

  return (
    <div className="space-y-8">
      {/* Email Section */}
      <div className="glass rounded-2xl p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FaEnvelope className="text-cyan-400" />
          Email Address
        </h2>

        <form onSubmit={handleEmailUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">
              Current Email
            </label>
            <input
              type="email"
              value={user.email || ''}
              disabled
              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-gray-400 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">
              New Email
            </label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => {
                setNewEmail(e.target.value)
                setEmailStatus('idle')
                setEmailError('')
              }}
              placeholder="new@example.com"
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              disabled={emailStatus === 'loading'}
            />
          </div>

          {emailError && (
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <FaExclamationTriangle className="w-4 h-4" />
              {emailError}
            </div>
          )}

          {emailStatus === 'success' && (
            <div className="flex items-center gap-2 text-green-400 text-sm">
              <FaCheckCircle className="w-4 h-4" />
              Email update initiated. Check your inbox to confirm.
            </div>
          )}

          <button
            type="submit"
            disabled={emailStatus === 'loading' || newEmail === user.email}
            className={`w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${
              emailStatus === 'loading'
                ? 'bg-cyan-500/50 text-white cursor-wait'
                : newEmail === user.email
                  ? 'bg-white/5 text-gray-500 cursor-not-allowed'
                  : 'bg-cyan-500 hover:bg-cyan-600 text-slate-900 hover:scale-[1.02]'
            }`}
          >
            {emailStatus === 'loading' ? (
              <>
                <FaSpinner className="animate-spin" /> Updating...
              </>
            ) : (
              <>Update Email</>
            )}
          </button>
        </form>
      </div>

      {/* Password Section */}
      <div className="glass rounded-2xl p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FaLock className="text-cyan-400" />
          Change Password
        </h2>

        <form onSubmit={handlePasswordUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => {
                setCurrentPassword(e.target.value)
                setPasswordStatus('idle')
                setPasswordError('')
              }}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              disabled={passwordStatus === 'loading'}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value)
                setPasswordStatus('idle')
                setPasswordError('')
              }}
              placeholder="••••••••"
              minLength={8}
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              disabled={passwordStatus === 'loading'}
              required
            />
            <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value)
                setPasswordStatus('idle')
                setPasswordError('')
              }}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              disabled={passwordStatus === 'loading'}
              required
            />
          </div>

          {passwordError && (
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <FaExclamationTriangle className="w-4 h-4" />
              {passwordError}
            </div>
          )}

          {passwordStatus === 'success' && (
            <div className="flex items-center gap-2 text-green-400 text-sm">
              <FaCheckCircle className="w-4 h-4" />
              Password updated successfully!
            </div>
          )}

          <button
            type="submit"
            disabled={
              passwordStatus === 'loading' ||
              !currentPassword ||
              !newPassword ||
              !confirmPassword
            }
            className={`w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${
              passwordStatus === 'loading'
                ? 'bg-cyan-500/50 text-white cursor-wait'
                : !currentPassword || !newPassword || !confirmPassword
                  ? 'bg-white/5 text-gray-500 cursor-not-allowed'
                  : 'bg-cyan-500 hover:bg-cyan-600 text-slate-900 hover:scale-[1.02]'
            }`}
          >
            {passwordStatus === 'loading' ? (
              <>
                <FaSpinner className="animate-spin" /> Updating...
              </>
            ) : (
              <>Update Password</>
            )}
          </button>
        </form>
      </div>

      {/* Sign Out Section */}
      <div className="glass rounded-2xl p-6">
        <h2 className="text-lg font-semibold mb-4 text-red-400">Danger Zone</h2>
        <button
          onClick={handleSignOut}
          className="w-full py-3 rounded-lg font-medium bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-300 hover:text-red-200 transition-all"
        >
          Sign Out
        </button>
      </div>
    </div>
  )
}