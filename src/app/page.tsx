// src/app/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { FaImage, FaBook, FaShippingFast } from 'react-icons/fa'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // ✅ Auto-redirect authenticated users to dashboard
  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-950 to-black text-white flex flex-col items-center justify-center px-4 py-16">
      
      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h1 className="text-5xl md:text-6xl font-bold mb-6 neon-pink tracking-tight">
          Preserve Your Legacy
        </h1>
        <p className="text-xl text-gray-300 mb-8 leading-relaxed">
          Transform your phone photos into heirloom-quality printed albums. 
          Choose a template, add your stories, and we&lsquo;ll handle the rest.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/auth/login"
            className="px-8 py-4 bg-linear-to-r from-cyan-400 to-cyan-500 text-slate-900 font-bold rounded-full hover:scale-105 transition-transform shadow-[0_0_20px_rgba(34,211,238,0.4)]"
          >
            Get Started
          </Link>
          <Link 
            href="/auth/register"
            className="px-8 py-4 bg-white/10 border border-white/20 text-white font-medium rounded-full hover:bg-white/20 transition"
          >
            Create Account
          </Link>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-3 gap-6 max-w-4xl w-full">
        <div className="glass p-6 rounded-2xl text-center hover:border-cyan-400/50 transition-all">
          <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
            <FaImage className="w-6 h-6 text-cyan-400" />
          </div>
          <h3 className="font-semibold mb-2">Upload Photos</h3>
          <p className="text-sm text-gray-400">Drag & drop your favorite memories. We support JPG, PNG & WebP.</p>
        </div>

        <div className="glass p-6 rounded-2xl text-center hover:border-pink-400/50 transition-all">
          <div className="w-12 h-12 bg-pink-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
            <FaBook className="w-6 h-6 text-pink-400" />
          </div>
          <h3 className="font-semibold mb-2">Choose Template</h3>
          <p className="text-sm text-gray-400">Pick from 4 vintage-inspired layouts. Add captions & stories.</p>
        </div>

        <div className="glass p-6 rounded-2xl text-center hover:border-green-400/50 transition-all">
          <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
            <FaShippingFast className="w-6 h-6 text-green-400" />
          </div>
          <h3 className="font-semibold mb-2">We Print & Ship</h3>
          <p className="text-sm text-gray-400">Pay via M-Pesa or Card. Receive your album in 7-10 days.</p>
        </div>
      </div>

      {/* Footer Note */}
      <p className="mt-16 text-sm text-gray-500">
        Built with ❤️ in Kenya 🇰 • <span className="text-cyan-400">Legacy Album</span>
      </p>

    </div>
  )
}