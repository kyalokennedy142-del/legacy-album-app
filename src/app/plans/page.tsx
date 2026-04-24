import Link from 'next/link'
import { FaCheck, FaCrown, FaGift, FaShieldAlt, FaTruck, FaWhatsapp, FaTree } from 'react-icons/fa'
import { PLAN_CONFIGS } from '@/lib/permissions'

const launchDeadline = new Date('2026-05-10T23:59:59+03:00').getTime()

function getCountdownLabel() {
  const now = Date.now()
  const distance = Math.max(launchDeadline - now, 0)
  const days = Math.floor(distance / (1000 * 60 * 60 * 24))
  const hours = Math.floor((distance / (1000 * 60 * 60)) % 24)
  return `${days}d ${hours}h left`
}

export default async function PlansPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>
}) {
  const params = await searchParams
  const upgradeFrom = params.from ?? '/customize'
  const countdown = getCountdownLabel()
  const plans = [
    {
      id: 'free',
      icon: FaGift,
      cta: 'Start Free Trial',
      highlight: false,
      notes: ['7-day access', 'No card required', 'Up to 5 photos'],
      features: ['5 Photos', '2 Basic Templates', 'Standard Print Preview', '7-Day Access', 'Upgrade Anytime'],
    },
    {
      id: 'heritage',
      icon: FaTree,
      cta: 'Select Heritage',
      highlight: false,
      notes: ['Up to 20 photos', '5 Premium Templates', 'Standard Matte Paper'],
      features: ['Softcover Binding', 'Email Support', '7-10 Day Delivery'],
    },
    {
      id: 'legacy',
      icon: FaShieldAlt,
      cta: 'Select Legacy',
      highlight: true,
      notes: ['Up to 50 photos', 'All 12 Templates', 'Premium Lustre Paper'],
      features: ['Hardcover Binding', 'AI Caption Suggestions', 'Priority Support', '5-7 Day Delivery'],
    },
    {
      id: 'heirloom',
      icon: FaCrown,
      cta: 'Select Heirloom',
      highlight: false,
      notes: ['Unlimited photos', 'Unlimited Photos', 'Archival-Quality Paper'],
      features: ['Genuine Leather Cover', 'Gold Foil Embossing', 'Custom Font Library', 'White-Glove Service', '3-5 Day Express Delivery'],
    },
  ] as const

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(201,160,80,0.16),_transparent_30%),linear-gradient(180deg,#f8f4e9_0%,#f3ede0_35%,#e9e2d2_100%)] px-4 py-10 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 rounded-[32px] border border-white/60 bg-white/70 p-6 shadow-[0_24px_70px_rgba(30,41,59,0.12)] backdrop-blur-sm">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-[color:var(--color-gold)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-900">
              Launch Offer - 50% Off
            </span>
            <span className="rounded-full bg-[color:var(--color-navy)] px-3 py-1 text-xs font-semibold text-white">
              {countdown}
            </span>
          </div>
          <h1 className="font-display text-5xl text-[color:var(--color-navy)]">Preserve Your Legacy</h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-700">
            Choose the perfect tier for your heirloom-quality photo album. Every plan
            includes professional printing and doorstep delivery across Kenya.
          </p>

          <div className="mt-5 flex flex-wrap gap-3 text-sm text-slate-700">
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2">
              <FaShieldAlt className="text-[color:var(--color-gold)]" />
              100% Satisfaction or Your Money Back
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2">
              <FaTruck className="text-[color:var(--color-gold)]" />
              Nairobi 2-3 days, Rest of Kenya 5-7 days
            </span>
          </div>
        </div>

        <div className="mb-8 grid gap-6 lg:grid-cols-4">
          {plans.map((plan) => {
            const config = PLAN_CONFIGS[plan.id]
            const Icon = plan.icon

            return (
              <div
                key={plan.id}
                className={`rounded-[30px] border p-6 shadow-[0_18px_50px_rgba(30,41,59,0.12)] ${
                  plan.highlight
                    ? 'border-[color:var(--color-gold)] bg-[color:var(--color-navy)] text-white'
                    : 'border-white/60 bg-white/78 text-slate-900'
                }`}
              >
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-full ${
                        plan.highlight ? 'bg-white/12 text-[color:var(--color-gold)]' : 'bg-[rgba(201,160,80,0.14)] text-[color:var(--color-gold)]'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-label">Plan</p>
                      <h2 className="text-2xl font-semibold">{config.name}</h2>
                    </div>
                  </div>
                  {plan.highlight ? (
                    <span className="rounded-full bg-[color:var(--color-gold)] px-3 py-1 text-xs font-semibold text-slate-900">
                      Best Value
                    </span>
                  ) : null}
                </div>

                <p className={`mb-4 text-4xl font-semibold ${plan.highlight ? 'text-white' : 'text-[color:var(--color-navy)]'}`}>
                  {config.priceKes === 0 ? 'Free' : `KES ${config.priceKes.toLocaleString('en-KE')}`}
                </p>

                <ul className={`mb-5 space-y-2 text-sm ${plan.highlight ? 'text-slate-100' : 'text-slate-700'}`}>
                  {plan.notes.map((note) => (
                    <li key={note} className="flex items-start gap-2">
                      <FaCheck className="mt-0.5 shrink-0 text-[color:var(--color-gold)]" />
                      <span>{note}</span>
                    </li>
                  ))}
                </ul>

                <div className="mb-6 rounded-2xl border border-white/10 bg-black/5 p-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-gold)]">
                    Included
                  </p>
                  <ul className={`space-y-2 text-sm ${plan.highlight ? 'text-slate-100' : 'text-slate-700'}`}>
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <FaCheck className="mt-0.5 shrink-0 text-[color:var(--color-gold)]" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  href={plan.id === 'free' ? '/upload?plan=free' : `/upload?plan=${plan.id}&from=${encodeURIComponent(upgradeFrom)}`}
                  className={`touch-target flex min-h-11 items-center justify-center rounded-full px-5 py-3 text-center font-semibold transition active:scale-[0.98] ${
                    plan.highlight
                      ? 'bg-[color:var(--color-gold)] text-slate-900'
                      : 'bg-[color:var(--color-navy)] text-white'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            )
          })}
        </div>

        <div className="mb-8 rounded-[30px] border border-white/60 bg-white/75 p-6 shadow-[0_18px_50px_rgba(30,41,59,0.12)]">
          <h2 className="mb-4 text-2xl font-semibold text-[color:var(--color-navy)]">Why Kenyan families trust Legacy Album</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl bg-[rgba(248,244,233,0.9)] p-4">
              <p className="text-label mb-2">Materials</p>
              <p className="text-sm text-slate-700">200gsm archival paper, lay-flat binding, soft-touch and leather cover options.</p>
            </div>
            <div className="rounded-2xl bg-[rgba(248,244,233,0.9)] p-4">
              <p className="text-label mb-2">Shipping</p>
              <p className="text-sm text-slate-700">Nairobi 2-3 days. Rest of Kenya 5-7 days. Delivery updates by WhatsApp.</p>
            </div>
            <div className="rounded-2xl bg-[rgba(248,244,233,0.9)] p-4">
              <p className="text-label mb-2">Support</p>
              <p className="text-sm text-slate-700">Human support for M-Pesa, templates, and order help when you need it.</p>
            </div>
            <div className="rounded-2xl bg-[rgba(248,244,233,0.9)] p-4">
              <p className="text-label mb-2">Testimonials</p>
              <p className="text-sm text-slate-700">Collecting stories from our first 10 customers. Your review could be next.</p>
            </div>
          </div>
        </div>

        <div className="rounded-[30px] border border-[rgba(30,41,59,0.12)] bg-[color:var(--color-navy)] p-6 text-white shadow-[0_18px_50px_rgba(30,41,59,0.2)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Need help choosing between Legacy and Heirloom?</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-200">
                Message us on WhatsApp and we’ll recommend the best option based on your photo count,
                album finish, and delivery timeline.
              </p>
            </div>
            <a
              href="https://wa.me/254740481359?text=Hi%20Legacy%20Album%2C%20which%20plan%20should%20I%20choose%3F"
              target="_blank"
              rel="noreferrer"
              className="touch-target inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white px-5 py-3 font-semibold text-[color:var(--color-navy)] transition active:scale-[0.98]"
            >
              <FaWhatsapp />
              Ask on WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
