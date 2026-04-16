// src/app/orders/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { FaBox, FaClock, FaArrowRight, FaMoneyBillWave } from 'react-icons/fa'
import Link from 'next/link'

// ✅ FIX: Define proper type for order
type Order = {
  id: string
  status: string | null
  template_id: string | null
  total_amount: number | null
  payment_status: string | null
  created_at: string
}

export default async function OrdersPage() {
  const supabase = await createClient()
  
  // ✅ FIX: Correct destructuring syntax (was double braces)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/auth/login')

  // ✅ FIX: Proper destructuring with error handling
  const { data: orders, error } = await supabase
    .from('draft_orders')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch orders:', error)
    // You might want to show an error UI here instead of empty state
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-500/20 text-green-300 border-green-500/50'
      case 'submitted': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50'
      case 'confirmed': return 'bg-blue-500/20 text-blue-300 border-blue-500/50'
      case 'shipped': return 'bg-purple-500/20 text-purple-300 border-purple-500/50'
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/50'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric', month: 'short', day: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-950 to-black text-white py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3 neon-pink">
            <FaBox aria-hidden="true" /> My Albums
          </h1>
          <Link 
            href="/upload"
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-slate-900 rounded-full font-medium transition flex items-center gap-2"
          >
            New Album <FaArrowRight />
          </Link>
        </div>

        {/* Empty State */}
        {!orders || orders.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaBox className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No orders yet</h3>
            <p className="text-gray-400 mb-6">Start preserving your memories today.</p>
            <Link 
              href="/upload"
              className="inline-block px-6 py-3 bg-cyan-500 text-slate-900 rounded-full font-medium hover:bg-cyan-600 transition"
            >
              Create Your First Album
            </Link>
          </div>
        ) : (
          /* Order List */
          <div className="space-y-4">
            {(orders as Order[]).map((order) => (
              <div key={order.id} className="glass rounded-xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-white/30 transition-all group">
                
                {/* Order Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(order.status || 'draft')}`}>
                      {(order.status || 'draft').toUpperCase()}
                    </span>
                    <span className="text-gray-400 text-sm flex items-center gap-1">
                      <FaClock /> {formatDate(order.created_at)}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-white capitalize">
                    {/* ✅ FIX: Replace all dashes, not just first one */}
                    {order.template_id?.replace(/-/g, ' ') || 'Custom Album'}
                  </h3>
                  
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      <FaMoneyBillWave /> KES {order.total_amount?.toLocaleString() || '2,499'}
                    </span>
                    <span className="flex items-center gap-1">
                      Payment: <span className={order.payment_status === 'paid' ? 'text-green-400' : 'text-yellow-400'}>
                        {order.payment_status === 'paid' ? 'Paid' : 'Pending'}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Action Button */}
                <Link 
                  href={`/orders/${order.id}`}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white text-sm font-medium transition flex items-center gap-2 group-hover:border-cyan-500/50 group-hover:text-cyan-400"
                >
                  View Details <FaArrowRight className="w-3 h-3" />
                </Link>

              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}