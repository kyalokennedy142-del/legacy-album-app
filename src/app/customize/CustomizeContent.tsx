'use client'

import Image from 'next/image'
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useRouter, useSearchParams } from 'next/navigation'
import { clsx } from 'clsx'
import {
  FaArrowRight,
  FaCheckCircle,
  FaCloudUploadAlt,
  FaLanguage,
  FaMagic,
  FaSpinner,
  FaWhatsapp,
} from 'react-icons/fa'
import { createClient } from '@/lib/supabase/client'
import UpgradeModal from '@/components/UpgradeModal'
import PhotoQualityIndicator, { type PhotoQualityWarning } from '@/components/PhotoQualityIndicator'
import {
  getPlanConfig,
  planSupportsAi,
  resolvePlanTier,
  shouldWatermarkPreview,
  type PlanTier,
} from '@/lib/permissions'

type OrderPhoto = {
  id: string
  public_url: string
  file_name: string
  caption?: string | null
  sequence_number: number
}

type PhotoAssessment = {
  score: number
  warnings: PhotoQualityWarning[]
}

const TEMPLATE_OPTIONS = [
  { id: 'minimal-grid', name: 'Minimal Grid', badge: 'Clean and calm' },
  { id: 'classic-grid', name: 'Classic Grid', badge: 'Balanced storytelling' },
  { id: 'story-flow', name: 'Story Flow', badge: 'Pixory-style narrative' },
  { id: 'collage-mix', name: 'Collage Mix', badge: 'Lively highlight spread' },
]

const PROGRESS_COPY = [
  'Preserving your memories...',
  'Choosing standout moments...',
  'Arranging a beautiful print-ready flow...',
  'Adding warm story prompts...',
]

const DB_NAME = 'legacy-album-drafts'
const STORE_NAME = 'customize'

function openDraftDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, 1)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function persistDraft(key: string, value: unknown) {
  const db = await openDraftDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).put(value, key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

async function readDraft<T>(key: string): Promise<T | null> {
  const db = await openDraftDb()
  return await new Promise<T | null>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const request = tx.objectStore(STORE_NAME).get(key)
    request.onsuccess = () => resolve((request.result as T | undefined) ?? null)
    request.onerror = () => reject(request.error)
  })
}

function normaliseName(fileName: string) {
  return fileName.toLowerCase().replace(/\.[^.]+$/, '').replace(/[^a-z0-9]/g, '')
}

function assessPhoto(photo: OrderPhoto, duplicates: Set<string>): PhotoAssessment {
  const warnings: PhotoQualityWarning[] = []
  let score = 88
  const lowerName = photo.file_name.toLowerCase()

  if (duplicates.has(photo.id)) {
    warnings.push({
      type: 'duplicate',
      message: 'Looks similar to another upload. Consider keeping only the strongest version.',
    })
    score -= 22
  }

  if (lowerName.includes('blur') || lowerName.includes('screenshot') || lowerName.includes('img_0')) {
    warnings.push({
      type: 'blurry',
      message: 'This image may print softly. Swap it if you have a sharper original.',
    })
    score -= 18
  }

  if (lowerName.includes('night') || lowerName.includes('dark')) {
    warnings.push({
      type: 'low-light',
      message: 'Low-light photos can lose detail on paper. Brighten or replace if needed.',
    })
    score -= 10
  }

  return {
    score: Math.max(45, score),
    warnings,
  }
}

export default function CustomizeContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = searchParams?.get('orderId')
  const showUpgrade = searchParams?.get('upgrade') === '1'
  const prefersReducedMotion = useReducedMotion()
  const supabase = useMemo(() => createClient(), [])
  const [isPending, startTransition] = useTransition()

  const [photos, setPhotos] = useState<OrderPhoto[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState('classic-grid')
  const [userPlanTier, setUserPlanTier] = useState<PlanTier>('legacy')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [photoLoadError, setPhotoLoadError] = useState<string | null>(null)
  const [captionLanguage, setCaptionLanguage] = useState<'en' | 'sw'>('en')
  const [autoLayoutLoading, setAutoLayoutLoading] = useState(false)
  const [autoLayoutReason, setAutoLayoutReason] = useState<string | null>(null)
  const [progressStep, setProgressStep] = useState(0)
  const dragPhotoIdRef = useRef<string | null>(null)

  const draftKey = orderId ? `customize:${orderId}` : null

  const syncDraft = useCallback(async () => {
    if (!draftKey || !orderId) {
      return
    }

    await persistDraft(draftKey, {
      selectedTemplate,
      photos,
      captionLanguage,
      savedAt: new Date().toISOString(),
    })
  }, [captionLanguage, draftKey, orderId, photos, selectedTemplate])

  useEffect(() => {
    if (!orderId) {
      setLoading(false)
      setPhotoLoadError('We could not find your draft album. Please restart from upload.')
      return
    }

    const loadData = async () => {
      setLoading(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      const [{ data: photoData, error: photoError }, { data: orderData }, { data: profileData }] =
        await Promise.all([
          supabase
            .from('order_photos')
            .select('id, public_url, file_name, caption, sequence_number')
            .eq('draft_order_id', orderId)
            .order('sequence_number', { ascending: true }),
          supabase
            .from('draft_orders')
            .select('template_id, plan_id')
            .eq('id', orderId)
            .eq('user_id', user.id)
            .maybeSingle(),
          supabase
            .from('profiles')
            .select('plan_tier')
            .eq('id', user.id)
            .maybeSingle(),
        ])

      if (photoError) {
        setPhotoLoadError('Could not load your photos. Please refresh and try again.')
        setLoading(false)
        return
      }

      setPhotos((photoData as OrderPhoto[] | null) ?? [])
      setSelectedTemplate(orderData?.template_id ?? 'classic-grid')
      setUserPlanTier(resolvePlanTier(profileData?.plan_tier ?? orderData?.plan_id))

      if (draftKey) {
        const localDraft = await readDraft<{
          selectedTemplate?: string
          photos?: OrderPhoto[]
          captionLanguage?: 'en' | 'sw'
        }>(draftKey)

        if (localDraft?.photos?.length) {
          setPhotos(localDraft.photos)
        }
        if (localDraft?.selectedTemplate) {
          setSelectedTemplate(localDraft.selectedTemplate)
        }
        if (localDraft?.captionLanguage) {
          setCaptionLanguage(localDraft.captionLanguage)
        }
      }

      setLoading(false)
    }

    void loadData()
  }, [draftKey, orderId, router, supabase])

  useEffect(() => {
    if (!draftKey || loading) {
      return
    }

    const handle = window.setTimeout(() => {
      void syncDraft()
    }, 350)

    return () => window.clearTimeout(handle)
  }, [draftKey, loading, syncDraft])

  useEffect(() => {
    if (!autoLayoutLoading) {
      return
    }

    const handle = window.setInterval(() => {
      setProgressStep((prev) => (prev + 1) % PROGRESS_COPY.length)
    }, 1100)

    return () => window.clearInterval(handle)
  }, [autoLayoutLoading])

  const duplicateIds = useMemo(() => {
    const seen = new Map<string, string>()
    const duplicates = new Set<string>()

    for (const photo of photos) {
      const normalized = normaliseName(photo.file_name)
      const existing = seen.get(normalized)
      if (existing) {
        duplicates.add(existing)
        duplicates.add(photo.id)
      } else {
        seen.set(normalized, photo.id)
      }
    }

    return duplicates
  }, [photos])

  const assessments = useMemo(() => {
    return Object.fromEntries(photos.map((photo) => [photo.id, assessPhoto(photo, duplicateIds)]))
  }, [duplicateIds, photos])

  const currentPlan = getPlanConfig(userPlanTier)
  const premiumBlocked = showUpgrade || userPlanTier === 'free'
  const aiEnabled = planSupportsAi(userPlanTier) && !premiumBlocked

  const handleCaptionChange = (photoId: string, caption: string) => {
    setPhotos((prev) => prev.map((photo) => (photo.id === photoId ? { ...photo, caption } : photo)))
  }

  const saveCaption = useCallback(async (photoId: string, caption: string | null | undefined) => {
    await supabase.from('order_photos').update({ caption }).eq('id', photoId)
  }, [supabase])

  const handleGenerateCaption = async (photoId: string, fileName: string) => {
    if (!aiEnabled) {
      return
    }

    setStatusMessage('Generating a warm caption...')

    try {
      const response = await fetch('/api/ai/caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName, locale: captionLanguage }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate caption')
      }

      const { caption } = await response.json()
      setPhotos((prev) => prev.map((photo) => (photo.id === photoId ? { ...photo, caption } : photo)))
      await saveCaption(photoId, caption)
      setStatusMessage('Caption added.')
    } catch (error) {
      console.error('[customize] caption generation failed', error)
      setStatusMessage('We could not generate that caption. Please try again.')
    }
  }

  const handleAutoLayout = async () => {
    if (!orderId || premiumBlocked) {
      return
    }

    setAutoLayoutLoading(true)
    setAutoLayoutReason(null)
    setStatusMessage(null)

    try {
      const response = await fetch('/api/ai/layout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, planTier: userPlanTier }),
      })

      if (!response.ok) {
        throw new Error('Could not generate layout')
      }

      const layout = await response.json()
      setSelectedTemplate(layout.layout ?? 'classic-grid')
      setAutoLayoutReason(layout.reason ?? null)

      setPhotos((prev) => {
        const byId = new Map(prev.map((photo) => [photo.id, photo]))
        const ordered = (layout.orderedPhotoIds as string[])
          .map((id) => byId.get(id))
          .filter(Boolean)
          .map((photo, index) => ({ ...(photo as OrderPhoto), sequence_number: index }))

        const captions = new Map(
          ((layout.suggestedCaptions as Array<{ photoId: string; caption: string }>) ?? []).map((item) => [
            item.photoId,
            item.caption,
          ])
        )

        return ordered.map((photo) => ({
          ...photo,
          caption: photo.caption?.trim() || captions.get(photo.id) || photo.caption,
        }))
      })

      setStatusMessage('Album draft ready. Review the suggested flow below.')
    } catch (error) {
      console.error('[customize] auto layout failed', error)
      setStatusMessage('We could not auto-arrange the album. You can still customise it manually.')
    } finally {
      setAutoLayoutLoading(false)
    }
  }

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId)
    setStatusMessage('Layout switched. Your captions and order were kept.')
  }

  const handleDropReorder = (targetId: string) => {
    const draggedId = dragPhotoIdRef.current
    if (!draggedId || draggedId === targetId) {
      return
    }

    setPhotos((prev) => {
      const next = [...prev]
      const fromIndex = next.findIndex((photo) => photo.id === draggedId)
      const toIndex = next.findIndex((photo) => photo.id === targetId)

      if (fromIndex < 0 || toIndex < 0) {
        return prev
      }

      const [moved] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, moved)

      return next.map((photo, index) => ({ ...photo, sequence_number: index }))
    })
  }

  const handleSaveAndContinue = async () => {
    if (!orderId || premiumBlocked) {
      return
    }

    setSaving(true)
    setStatusMessage('Saving your album...')

    try {
      await Promise.all([
        supabase.from('draft_orders').update({ template_id: selectedTemplate }).eq('id', orderId),
        ...photos.map((photo, index) =>
          supabase
            .from('order_photos')
            .update({
              caption: photo.caption ?? null,
              sequence_number: index,
            })
            .eq('id', photo.id)
        ),
      ])

      setStatusMessage('Saved. Moving you to review.')
      startTransition(() => {
        router.push(`/review?orderId=${orderId}`)
      })
    } catch (error) {
      console.error('[customize] save failed', error)
      setStatusMessage('We could not save your changes. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(201,160,80,0.18),transparent_40%),linear-gradient(180deg,#111827_0%,#0f172a_100%)]x-4 py-16 text-white">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.5fr_0.8fr]">
          <div className="space-y-4">
            <div className="skeleton-block h-14 rounded-3xl" />
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="skeleton-block aspect-4/5 rounded-3xl" />
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <div className="skeleton-block h-40 rounded-3xl" />
            <div className="skeleton-block h-64 rounded-3xl" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(201,160,80,0.15),transparent_35%),linear-gradient(180deg,#111827_0%,#0f172a_55%,#132238_100%)] px-4 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 rounded-4xl border border-white/10 bg-[rgba(15,23,42,0.72)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-label mb-2">Album Editor</p>
            <h1 className="font-display text-4xl text-white">Create My Album</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Inspired by the guided Pixory flow, but tuned for Kenya: faster auto-create, warm captions,
              and premium print planning for Legacy Album.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleAutoLayout}
              disabled={autoLayoutLoading || premiumBlocked || photos.length === 0}
              className="touch-target flex min-h-11 items-center justify-center gap-2 rounded-full bg-(--color-gold) px-5 py-3 font-semibold text-slate-900 transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {autoLayoutLoading ? <FaSpinner className="animate-spin" /> : <FaMagic />}
              Generate for Me
            </button>
            <a
              href="https://wa.me/254740481359?text=Hi%20Legacy%20Album%2C%20I%20want%20to%20send%20photos%20via%20WhatsApp."
              target="_blank"
              rel="noreferrer"
              className="touch-target flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-3 font-semibold text-white transition active:scale-[0.98] hover:bg-white/10"
            >
              <FaWhatsapp />
              Send photos via WhatsApp
            </a>
          </div>
        </div>

        {autoLayoutLoading ? (
          <div className="mb-6 rounded-3xl border border-(--border-strong) bg-[rgba(201,160,80,0.08)] p-5">
            <div className="mb-3 flex items-center gap-3">
              <FaMagic className="text-(--color-gold)" />
              <p className="font-medium text-white">{PROGRESS_COPY[progressStep]}</p>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div className="animate-progress h-full rounded-full bg-(--color-gold)" />
            </div>
            <p className="mt-2 text-xs text-slate-300">Usually ready in under 10 seconds.</p>
          </div>
        ) : null}

        {statusMessage ? (
          <div className="mb-6 flex items-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
            <FaCheckCircle className="h-4 w-4" />
            {statusMessage}
          </div>
        ) : null}

        {photoLoadError ? (
          <div className="rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {photoLoadError}
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[1.5fr_0.8fr]">
          <section className={clsx('space-y-5', premiumBlocked && 'pointer-events-none blur-[2px]')}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-slate-400">
                  {photos.length} photo{photos.length === 1 ? '' : 's'} selected
                </p>
                <p className="text-xs text-slate-500">
                  {currentPlan.photoLimit === Number.POSITIVE_INFINITY
                    ? 'Unlimited photos on this plan'
                    : `${currentPlan.photoLimit} photo limit on ${currentPlan.name}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setCaptionLanguage((current) => (current === 'en' ? 'sw' : 'en'))
                }
                className="touch-target inline-flex min-h-11 items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white transition active:scale-[0.98] hover:bg-white/10"
              >
                <FaLanguage />
                Captions: {captionLanguage === 'en' ? 'English' : 'Swahili'}
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {photos.map((photo, index) => {
                const assessment = assessments[photo.id]

                return (
                  <motion.article
                    key={photo.id}
                    draggable={!premiumBlocked}
                    onDragStart={() => {
                      dragPhotoIdRef.current = photo.id
                    }}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => handleDropReorder(photo.id)}
                    initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
                    whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.15 }}
                    transition={{ delay: prefersReducedMotion ? 0 : index * 0.04, duration: 0.35 }}
                    className="overflow-hidden rounded-[28px] border border-white/10 bg-[rgba(15,23,42,0.76)] shadow-[0_20px_60px_rgba(0,0,0,0.28)]"
                  >
                    <div className="relative aspect-4/5">
                      <Image
                        src={photo.public_url}
                        alt={photo.file_name}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                        className="object-cover"
                      />
                      {shouldWatermarkPreview(userPlanTier) ? (
                        <div className="absolute inset-0 flex items-end justify-end bg-[linear-gradient(180deg,transparent_45%,rgba(15,23,42,0.55)_100%)] p-4">
                          <span className="rounded-full bg-[rgba(248,244,233,0.92)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-900">
                            Legacy Preview
                          </span>
                        </div>
                      ) : null}
                    </div>

                    <div className="space-y-3 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="line-clamp-1 text-sm font-medium text-white">{photo.file_name}</p>
                        <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] text-slate-300">
                          #{index + 1}
                        </span>
                      </div>

                      <PhotoQualityIndicator score={assessment.score} warnings={assessment.warnings} />

                      <textarea
                        value={photo.caption ?? ''}
                        onChange={(event) => handleCaptionChange(photo.id, event.target.value)}
                        onBlur={() => void saveCaption(photo.id, photo.caption)}
                        placeholder={
                          captionLanguage === 'sw'
                            ? 'Andika maelezo mafupi ya picha hii...'
                            : 'Write a memory, date, or story for this photo...'
                        }
                        className="min-h-24 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500"
                      />

                      <button
                        type="button"
                        onClick={() => void handleGenerateCaption(photo.id, photo.file_name)}
                        disabled={!aiEnabled}
                        className="touch-target flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-(--border-strong) bg-[rgba(201,160,80,0.12)] px-4 py-3 text-sm font-semibold text-(--color-cream) transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <FaMagic />
                        {captionLanguage === 'sw' ? 'Tengeneza Maelezo ya AI' : 'Generate AI Caption'}
                      </button>
                    </div>
                  </motion.article>
                )
              })}
            </div>

            {photos.length === 0 ? (
              <div className="rounded-[28px] border border-white/10 bg-white/5 p-10 text-center">
                <FaCloudUploadAlt className="mx-auto mb-4 h-10 w-10 text-slate-400" />
                <p className="text-lg text-white">No photos are ready for layout yet.</p>
                <p className="mt-2 text-sm text-slate-400">Upload first, then come back to customise your album.</p>
              </div>
            ) : null}
          </section>

          <aside className="space-y-5">
            <section className="rounded-[28px] border border-white/10 bg-[rgba(15,23,42,0.82)] p-5">
              <p className="text-label mb-2">Your Plan</p>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-2xl font-semibold text-white">{currentPlan.name}</h2>
                <span className="rounded-full bg-[rgba(201,160,80,0.12)] px-3 py-1 text-xs font-semibold text-(--color-gold)">
                  KES {currentPlan.priceKes.toLocaleString('en-KE')}
                </span>
              </div>
              <p className="text-sm leading-6 text-slate-300">{currentPlan.summary}</p>
              {autoLayoutReason ? (
                <div className="mt-4 rounded-2xl border border-(--border) bg-white/5 p-4 text-sm text-slate-200">
                  <p className="mb-1 font-medium text-white">AI suggestion</p>
                  <p>{autoLayoutReason}</p>
                </div>
              ) : null}
            </section>

            <section className="rounded-[28px] border border-white/10 bg-[rgba(15,23,42,0.82)] p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-label mb-1">Templates</p>
                  <h2 className="text-xl font-semibold text-white">Switch without losing progress</h2>
                </div>
              </div>

              <div className="space-y-3">
                {TEMPLATE_OPTIONS.map((template) => {
                  const selected = selectedTemplate === template.id
                  return (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => handleTemplateSelect(template.id)}
                      className={clsx(
                        'touch-target min-h-11 w-full rounded-2xl border p-4 text-left transition active:scale-[0.98]',
                        selected
                          ? 'border-(--color-gold) bg-[rgba(201,160,80,0.12)] shadow-[0_0_24px_rgba(201,160,80,0.18)]'
                          : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8'
                      )}
                    >
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <span className="font-medium text-white">{template.name}</span>
                        <span className="text-xs text-(--color-gold)">{template.badge}</span>
                      </div>
                      <div className="aspect-16/7 rounded-2xl bg-[linear-gradient(135deg,rgba(248,244,233,0.08),rgba(201,160,80,0.18),rgba(30,41,59,0.32))]" />
                    </button>
                  )
                })}
              </div>
            </section>

            <section className="rounded-[28px] border border-white/10 bg-[rgba(15,23,42,0.82)] p-5">
              <p className="text-label mb-2">Next Step</p>
              <h2 className="mb-2 text-xl font-semibold text-white">Review your print proof</h2>
              <p className="mb-4 text-sm leading-6 text-slate-300">
                We’ll save your captions, order, and chosen layout, then take you into review and payment.
              </p>

              <button
                type="button"
                onClick={handleSaveAndContinue}
                disabled={saving || isPending || photos.length === 0 || premiumBlocked}
                className="touch-target flex min-h-11 w-full items-center justify-center gap-3 rounded-full bg-(--color-gold) px-5 py-3 font-semibold text-slate-900 transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving || isPending ? <FaSpinner className="animate-spin" /> : <FaArrowRight />}
                {saving || isPending ? 'Saving your album...' : 'Use This Layout'}
              </button>
            </section>
          </aside>
        </div>
      </div>

      <UpgradeModal
        isOpen={showUpgrade}
        fromPath={`/customize${orderId ? `?orderId=${orderId}` : ''}`}
        onClose={() => router.push('/plans')}
        message="Custom layouts, AI captions, review, and checkout are part of our paid album experience. Upgrade to keep building your story."
      />
    </div>
  )
}
