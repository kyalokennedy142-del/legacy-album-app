// src/app/gallery/page.tsx
import { Suspense } from 'react'
import GalleryContent from './GalleryContent'

export const dynamic = 'force-dynamic'

export default function GalleryPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-900 via-slate-950 to-black text-white">
        <div className="animate-spin h-8 w-8 border-4 border-cyan-500 border-t-transparent rounded-full" />
      </div>
    }>
      <GalleryContent />
    </Suspense>
  )
}