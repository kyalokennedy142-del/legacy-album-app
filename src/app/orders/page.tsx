// src/app/orders/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { FaBox, FaSpinner, FaArrowLeft, FaExclamationTriangle } from 'react-icons/fa'
import Link from 'next/link'

type Order = {
  id: string
  status: string | null
  plan_id: string | null
  payment_method: string | null
  payment_status: string | null
  total_amount: number | null
  created_at: string
}

export default function OrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string[]>([])

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        addDebug('Starting orders fetch...')
        
        const supabase = createClient()
        addDebug('Supabase client created')
        
        // Check auth first
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        addDebug(`Auth check: user=${user?.id ?? 'null'}, error=${authError?.message ?? 'none'}`)
        
        if (authError || !user) {
          throw new Error('Not authenticated. Please log in.')
        }

        // Fetch orders
        addDebug(`Fetching orders for user: ${user.id}`)
        const { data, error: fetchError } = await supabase
          .from('draft_orders')
          .select('id, status, plan_id, payment_method, payment_status, total_amount, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        addDebug(`Query result: ${data?.length ?? 0} orders, error=${fetchError?.message ?? 'none'}`)
        
        if (fetchError) {
          console.error('Supabase fetch error:', fetchError)
          throw new Error(`Failed to load orders: ${fetchError.message}`)
        }

        if (data) {
          setOrders(data as Order[])
          addDebug(`Successfully loaded ${data.length} orders`)
        }
      } catch (err: unknown) {
        console.error('Orders page error:', err)
        setError(err.message || 'Failed to load orders')
        addDebug(`Error: ${err.message}`)
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [])

  const addDebug = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setDebugInfo(prev => [...prev, `[${timestamp}] ${msg}`])
    console.log(`[Orders Debug] ${msg}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="flex items-center gap-3">
          <FaSpinner className="animate-spin text-cyan-400" />
          <span>Loading orders...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <FaBox className="text-cyan-400 text-2xl" />
            <h1 className="text-3xl font-bold">My Orders</h1>
          </div>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition"
          >
            <FaArrowLeft /> Back
          </button>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/20 border border-red-500/50 text-red-300">
            <div className="flex items-center gap-2">
              <FaExclamationTriangle />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Empty State */}
        {orders.length === 0 && !error ? (
          <div className="glass rounded-2xl p-12 text-center border border-white/10">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaBox className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No orders yet</h3>
            <p className="text-gray-400 mb-6">Start creating your legacy album today.</p>
            <Link 
              href="/plans"
              className="inline-block px-6 py-3 bg-cyan-500 text-slate-900 rounded-full font-medium hover:bg-cyan-600 transition"
            >
              Create Your First Album
            </Link>
          </div>
        ) : (
          /* Order List */
          <div className="space-y-4">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="glass rounded-xl p-5 hover:border-white/30 transition-all group border border-white/5 block"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        order.status === 'paid' ? 'bg-green-500/20 text-green-300 border-green-500/50' :
                        order.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50' :
                        'bg-gray-500/20 text-gray-300 border-gray-500/50'
                      }`}>
                        {(order.status ?? 'draft').toUpperCase()}
                      </span>
                      <span className="text-gray-400 text-sm">
                        {new Date(order.created_at).toLocaleDateString('en-KE')}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-white capitalize">
                      {order.plan_id?.replace(/-/g, ' ') ?? 'Legacy Album'}
                    </h3>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                      <span>Payment: <span className={order.payment_status === 'paid' ? 'text-green-400' : 'text-yellow-400'}>
                        {order.payment_status === 'paid' ? 'Paid' : 'Pending'}
                      </span></span>
                      {order.payment_method && <span className="capitalize">{order.payment_method}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-lg font-bold text-cyan-300">
                      KES {(order.total_amount ?? 2499).toLocaleString()}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Debug Panel (remove in production) */}
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-8 p-4 rounded-lg bg-white/5 text-sm">
            <summary className="cursor-pointer font-medium mb-2">🔍 Debug Logs</summary>
            <div className="space-y-1 font-mono text-xs text-gray-400 max-h-48 overflow-y-auto">
              {debugInfo.map((log, i) => <div key={i}>{log}</div>)}
            </div>
          </details>
        )}

      </div>
    </div>
  )
}