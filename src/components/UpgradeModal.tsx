'use client'

import Link from 'next/link'
import { FaCrown, FaLock, FaTimes } from 'react-icons/fa'

type UpgradeModalProps = {
  isOpen: boolean
  onClose?: () => void
  fromPath?: string
  title?: string
  message?: string
}

export default function UpgradeModal({
  isOpen,
  onClose,
  fromPath = '/customize',
  title = 'Upgrade to Continue',
  message = 'Premium editing, review, and checkout are unlocked once you upgrade your plan.',
}: UpgradeModalProps) {
  if (!isOpen) {
    return null
  }

  const params = new URLSearchParams({
    upgrade: '1',
    from: fromPath,
  })

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(10,15,25,0.7)] p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-modal-title"
    >
      <div className="surface-raised animate-popup w-full max-w-lg border border-(--border-strong) p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="flex gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-full text-(--color-gold)"
              style={{ backgroundColor: 'rgba(201,160,80,0.15)' }}
            >
              <FaCrown className="h-5 w-5" />
            </div>
            <div>
              <p className="text-label">Premium Access</p>
              <h2 id="upgrade-modal-title" className="text-2xl font-semibold text-white">
                {title}
              </h2>
            </div>
          </div>
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="touch-target rounded-full border border-white/10 bg-white/5 text-gray-300 transition hover:bg-white/10 hover:text-white"
              aria-label="Close upgrade modal"
            >
              <FaTimes className="m-3 h-4 w-4" />
            </button>
          ) : null}
        </div>

        <p className="mb-5 text-sm leading-6 text-gray-300">{message}</p>

        <div className="mb-5 rounded-2xl border border-(--border) bg-white/5 p-4 text-sm text-gray-200">
          <div className="mb-2 flex items-center gap-2 text-(--color-gold)">
            <FaLock className="h-4 w-4" />
            <span className="font-medium">What you unlock</span>
          </div>
          <p>AI captions, premium templates, payment flow, and export-ready album previews.</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href={`/plans?${params.toString()}`}
            className="touch-target flex min-h-11 flex-1 items-center justify-center rounded-full bg-(--color-gold) px-5 py-3 font-semibold text-slate-900 transition active:scale-[0.98] hover:brightness-105"
          >
            Preserve My Memories
          </Link>
          <Link
            href="https://wa.me/254740481359?text=Hi%20Legacy%20Album%2C%20I%20need%20help%20choosing%20a%20plan."
            target="_blank"
            rel="noreferrer"
            className="touch-target flex min-h-11 flex-1 items-center justify-center rounded-full border border-white/15 bg-white/5 px-5 py-3 font-semibold text-white transition active:scale-[0.98] hover:bg-white/10"
          >
            Ask on WhatsApp
          </Link>
        </div>
      </div>
    </div>
  )
}
