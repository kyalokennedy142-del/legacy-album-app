import type { Metadata, Viewport } from 'next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'The Legacy Album Project',
    template: '%s | Legacy Album',
  },
  description:
    'Transform your digital memories into premium, leather-bound heirloom albums. Preserve your story beautifully.',
  keywords: ['photo album', 'heirloom album', 'memory preservation', 'leather photo book', 'Kenya', 'Africa'],
  authors: [{ name: 'The Legacy Album Project' }],
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://legacyalbum.co.ke'),
  openGraph: {
    type: 'website',
    siteName: 'The Legacy Album Project',
    title: 'The Legacy Album Project',
    description: 'Premium leather-bound photo albums that preserve your memories for generations.',
    locale: 'en_KE',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Legacy Album Project',
    description: 'Premium leather-bound photo albums that preserve your memories for generations.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#faf7f2' },
    { media: '(prefers-color-scheme: dark)', color: '#0e0c0a' },
  ],
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-background text-foreground">
        {children}
        <SpeedInsights />
      </body>
    </html>
  )
}
