'use client'

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-(--color-navy) px-4 text-white">
        <div className="max-w-md rounded-[28px] border border-white/15 bg-white/8 p-6 text-center">
          <p className="text-label mb-2">Something went wrong</p>
          <h1 className="mb-3 text-3xl font-semibold">We hit a snag preserving your album</h1>
          <p className="mb-5 text-sm leading-6 text-slate-200">
            Try again first. If it keeps happening, contact support on WhatsApp and we&apos;ll help.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => unstable_retry()}
              className="touch-target flex min-h-11 flex-1 items-center justify-center rounded-full bg-(--color-gold) px-4 py-3 font-semibold text-slate-900"
            >
              Try again
            </button>
            <a
              href="https://wa.me/254740481359?text=Hi%20Legacy%20Album%2C%20I%20need%20support%20after%20an%20error."
              target="_blank"
              rel="noreferrer"
              className="touch-target flex min-h-11 flex-1 items-center justify-center rounded-full border border-white/20 bg-white/5 px-4 py-3 font-semibold text-white"
            >
              Contact support
            </a>
          </div>
          <p className="mt-4 text-xs text-slate-300">{error.message}</p>
        </div>
      </body>
    </html>
  )
}
