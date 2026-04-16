// src/app/upload/page.tsx
import { Suspense } from 'react'
import UploadContent from './UploadContent'

export const dynamic = 'force-dynamic'

export default function UploadPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <UploadContent />
    </Suspense>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-900 via-slate-950 to-black text-white">
      <div className="animate-spin h-8 w-8 border-4 border-cyan-500 border-t-transparent rounded-full" />
    </div>
  )
}