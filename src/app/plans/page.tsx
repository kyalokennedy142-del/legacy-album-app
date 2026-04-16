// src/app/plans/page.tsx
'use client'

import Link from 'next/link'
import { FaCheck, FaCrown, FaGift, FaScroll, FaTree } from 'react-icons/fa'

// ✅ SPEC-ALIGNED TIERS (from product overview)
const PLANS = [
  {
    id: 'free-trial',
    name: 'Free Trial',
    icon: FaGift,
    price: 0,
    photos: 5,
    trialDays: 7,
    features: [
      '5 Photos',
      '2 Basic Templates',
      'Standard Print Preview',
      '7-Day Access',
      'Upgrade Anytime'
    ],
    popular: false,
    trial: true
  },
  {
    id: 'heritage',
    name: 'Heritage',
    icon: FaTree,
    price: 15000,
    photos: 20,
    features: [
      '5 Premium Templates',
      'Standard Matte Paper',
      'Softcover Binding',
      'Email Support',
      '7-10 Day Delivery'
    ],
    popular: false
  },
  {
    id: 'legacy',
    name: 'Legacy',
    icon: FaScroll,
    price: 25000,
    photos: 50,
    features: [
      'All 12 Templates',
      'Premium Lustre Paper',
      'Hardcover Binding',
      'AI Caption Suggestions',
      'Priority Support',
      '5-7 Day Delivery'
    ],
    popular: true // Recommended tier
  },
  {
    id: 'heirloom',
    name: 'Heirloom',
    icon: FaCrown,
    price: 40000,
    photos: -1, // unlimited
    features: [
      'Unlimited Photos',
      'Archival-Quality Paper',
      'Genuine Leather Cover',
      'Gold Foil Embossing',
      'Custom Font Library',
      'White-Glove Service',
      '3-5 Day Express Delivery'
    ],
    popular: false
  }
]

export default function PlansPage() {
  return (
    <div className="min-h-screen bg-linear-to-brrom-slate-900 via-slate-950 to-black text-white py-16 px-4">
      <div className="container mx-auto max-w-6xl">
        
        {/* Header */}
        <div className="text-center mb-12 animate-slide-down">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 neon-pink">
            Preserve Your Legacy
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Choose the perfect tier for your heirloom-quality photo album. 
            Every plan includes professional printing and doorstep delivery across Kenya.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {PLANS.map(plan => {
            const Icon = plan.icon
            return (
              <div 
                key={plan.id} 
                className={`glass rounded-2xl p-5 lg:p-6 border-2 transition-all flex flex-col relative ${
                  plan.popular 
                    ? 'border-pink-500/50 shadow-[0_0_25px_rgba(236,72,153,0.4)] lg:scale-105 z-10' 
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                {/* Popular/Trial Badge */}
                {(plan.popular || plan.trial) && (
                  <span className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-xs font-bold rounded-full shadow-lg ${
                    plan.trial 
                      ? 'bg-green-500/20 text-green-300 border border-green-500/50'
                      : 'bg-linear-to-r from-pink-500 to-pink-600 text-white'
                  }`}>
                    {plan.trial ? '🎁 Free Trial' : 'Most Popular'}
                  </span>
                )}

                {/* Icon + Name */}
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2.5 rounded-lg ${
                    plan.popular ? 'bg-pink-500/20' : plan.trial ? 'bg-green-500/20' : 'bg-white/10'
                  }`}>
                    <Icon className={`w-5 h-5 ${
                      plan.popular ? 'text-pink-400' : plan.trial ? 'text-green-400' : 'text-cyan-400'
                    }`} />
                  </div>
                  <h3 className="text-lg font-bold">{plan.name}</h3>
                </div>

                {/* Price */}
                <p className="text-2xl lg:text-3xl font-bold text-cyan-400 my-3">
                  {plan.price === 0 ? 'Free' : `KES ${plan.price.toLocaleString()}`}
                </p>
                {plan.trial && (
                  <p className="text-xs text-green-400 mb-2">
                    {plan.trialDays}-day access • No card required
                  </p>
                )}

                {/* Photo Limit */}
                <div className="flex items-center gap-2 text-sm text-gray-300 mb-4 pb-3 border-b border-white/10">
                  <FaCheck className="text-green-400 shrink-0" /> 
                  {plan.photos === -1 ? 'Unlimited photos' : `Up to ${plan.photos} photos`}
                </div>

                {/* Features List */}
                <ul className="space-y-2 mb-6 flex-1">
                  {plan.features.map(feature => (
                    <li key={feature} className="flex items-start gap-2 text-xs text-gray-300">
                      <FaCheck className="text-green-400 shrink-0 mt-0.5" /> 
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Select Button - Routes to Upload with Plan Param */}
                <Link 
                  href={`/upload?plan=${plan.id}`}
                  className={`w-full py-2.5 lg:py-3 rounded-full font-semibold text-center transition-all block text-sm ${
                    plan.popular
                      ? 'bg-linear-to-r from-pink-500 to-pink-600 text-white hover:scale-[1.02] shadow-lg shadow-pink-500/25'
                      : plan.trial
                      ? 'bg-green-500/20 hover:bg-green-500/30 text-green-300 border border-green-500/50'
                      : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                  }`}
                >
                  {plan.trial ? 'Start Free Trial' : `Select ${plan.name}`}
                </Link>

                {/* Delivery Note */}
                <p className="text-[10px] text-gray-500 text-center mt-3">
                  Free delivery across Kenya
                </p>
              </div>
            )
          })}
        </div>

        {/* Trust Badges */}
        <div className="mt-12 text-center">
          <p className="text-gray-500 text-sm mb-3">Trusted by families across Kenya</p>
          <div className="flex justify-center gap-4 text-gray-400 text-xs">
            <span className="flex items-center gap-1">🔒 Secure Payment</span>
            <span className="flex items-center gap-1">📦 Free Delivery</span>
            <span className="flex items-center gap-1">✨ Premium Quality</span>
          </div>
        </div>

      </div>
    </div>
  )
}