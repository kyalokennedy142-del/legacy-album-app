/* eslint-disable @next/next/no-html-link-for-pages */
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

export default function TestSupabasePage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState<string>('')

  useEffect(() => {
    const testConnection = async () => {
      try {
        // Create Supabase client using env variables
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

        if (!supabaseUrl || !supabaseKey) {
          throw new Error('Missing Supabase environment variables')
        }

        const supabase = createClient(supabaseUrl, supabaseKey)

        // Try a simple, safe query
        const { error } = await supabase.from('orders').select('id').limit(1)

        if (error) {
          // Expected if 'orders' table doesn't exist yet - that's OK!
          if (error.message.includes('relation "orders" does not exist')) {
            setStatus('success')
            setMessage('✅ Connected to Supabase! (Table "orders" not created yet - normal)')
          } else {
            throw error
          }
        } else {
          setStatus('success')
          setMessage('✅ Connected to Supabase! Orders table exists.')
        }
      } catch (err: unknown) {
        setStatus('error')
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        setMessage(`❌ Connection failed: ${errorMessage}`)
        console.error('Supabase test error:', err)
      }
    }

    testConnection()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-4">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-bold mb-4">Supabase Connection Test</h1>
        <p className={`text-lg ${status === 'error' ? 'text-red-400' : 'text-green-400'}`}>
          {message || 'Testing connection...'}
        </p>
        {status === 'loading' && (
          <div className="mt-4 animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" />
        )}
        <a href="/" className="mt-6 inline-block text-blue-400 hover:underline">
    
          ← Back to Home
        </a>
      </div>
    </div>
  )
}