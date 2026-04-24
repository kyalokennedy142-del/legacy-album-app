import { getPlanConfig, type PlanTier } from '@/lib/permissions'

const FALLBACKS = [
  'Preserving our heritage, one moment at a time',
  'A timeless memory, lovingly kept',
  'Capturing the warmth of our shared story',
]

type AutoLayoutPhoto = {
  id: string
  fileName: string
  caption?: string | null
  publicUrl?: string
  sequenceNumber?: number
}

type AutoLayoutResult = {
  layout: string
  reason: string
  groupedMoments: Array<{
    title: string
    photoIds: string[]
  }>
  orderedPhotoIds: string[]
  suggestedCaptions: Array<{
    photoId: string
    caption: string
  }>
}

const randomFallback = () =>
  FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)]

const SYSTEM_PROMPT = `
You are a professional photographer and storyteller specialising in Kenyan heritage and family albums.
Your tone is warm, nostalgic, and deeply respectful of African culture and family.

Rules:
1. If the filename contains a date (e.g. IMG_20231012), open with "A treasured moment from..." or similar.
2. If the filename implies a wedding, graduation, or ceremony, celebrate that milestone warmly.
3. If the filename is generic (e.g. DSC001, photo_1), write a poetic caption about love, heritage, or belonging.
4. Keep captions between 10 and 20 words.
5. Use British English spelling.
6. Output ONLY the caption. No quotes.
`.trim()

async function openAiChat<T>(messages: Array<{ role: 'system' | 'user'; content: string }>, maxTokens = 200) {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    return null as T | null
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.6,
      max_tokens: maxTokens,
      messages,
      response_format: { type: 'json_object' },
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err?.error?.message ?? `OpenAI API error ${response.status}`)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content?.trim()

  return content ? (JSON.parse(content) as T) : null
}

export async function generatePhotoCaption(
  fileName: string,
  context?: string,
  locale: 'en' | 'sw' = 'en'
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    return randomFallback()
  }

  try {
    const localeInstruction =
      locale === 'sw'
        ? 'Write the caption in clear, warm Swahili.'
        : 'Write the caption in warm English for Kenyan families.'

    const userMessage = [
      `Generate a caption for this photo file: "${fileName}".`,
      context ? `Additional context: ${context}.` : '',
      localeInstruction,
    ]
      .filter(Boolean)
      .join(' ')

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 80,
        temperature: 0.7,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMessage },
        ],
      }),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err?.error?.message ?? `OpenAI API error ${response.status}`)
    }

    const data = await response.json()
    return data.choices?.[0]?.message?.content?.trim() || randomFallback()
  } catch (err) {
    console.error('[ai] generatePhotoCaption error:', err)
    return randomFallback()
  }
}

export async function generateBatchCaptions(
  photos: Array<{ fileName: string; context?: string; locale?: 'en' | 'sw' }>
): Promise<string[]> {
  const CONCURRENCY = 5
  const results: string[] = []

  for (let i = 0; i < photos.length; i += CONCURRENCY) {
    const chunk = photos.slice(i, i + CONCURRENCY)
    const batch = await Promise.all(
      chunk.map((p) => generatePhotoCaption(p.fileName, p.context, p.locale ?? 'en'))
    )
    results.push(...batch)
  }

  return results
}

function pickLayout(photoCount: number, planTier: PlanTier) {
  if (planTier === 'heirloom' && photoCount > 20) {
    return 'story-flow'
  }

  if (photoCount <= 12) {
    return 'minimal-grid'
  }

  return photoCount > 30 ? 'collage-mix' : 'classic-grid'
}

function buildGroupedMoments(photos: AutoLayoutPhoto[]) {
  const groups = new Map<string, AutoLayoutPhoto[]>()

  for (const photo of photos) {
    const match = photo.fileName.match(/(19|20)\d{2}[-_]?(\d{2})?[-_]?(\d{2})?/)
    const key = match?.[1] ? `Moments from ${match[1]}` : 'Highlights'
    const existing = groups.get(key) ?? []
    existing.push(photo)
    groups.set(key, existing)
  }

  return [...groups.entries()].map(([title, grouped]) => ({
    title,
    photoIds: grouped.map((photo) => photo.id),
  }))
}

function buildFallbackLayout(photos: AutoLayoutPhoto[], planTier: PlanTier): AutoLayoutResult {
  const orderedPhotos = [...photos].sort((a, b) => {
    const sequenceA = a.sequenceNumber ?? 0
    const sequenceB = b.sequenceNumber ?? 0
    return sequenceA - sequenceB
  })
  const layout = pickLayout(orderedPhotos.length, planTier)
  const groupedMoments = buildGroupedMoments(orderedPhotos)

  return {
    layout,
    reason:
      layout === 'story-flow'
        ? 'Your album has enough moments for a flowing story with hero images and grouped events.'
        : 'This arrangement keeps the strongest memories easy to scan and print beautifully.',
    groupedMoments,
    orderedPhotoIds: orderedPhotos.map((photo) => photo.id),
    suggestedCaptions: orderedPhotos.slice(0, 8).map((photo, index) => ({
      photoId: photo.id,
      caption:
        photo.caption?.trim() ||
        `Memory ${index + 1}: ${photo.fileName.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')}`,
    })),
  }
}

export async function generateAutoLayout(
  photos: AutoLayoutPhoto[],
  planTier: PlanTier
): Promise<AutoLayoutResult> {
  if (photos.length === 0) {
    return buildFallbackLayout([], planTier)
  }

  const cappedPhotos = photos.slice(0, Math.min(photos.length, getPlanConfig(planTier).photoLimit))
  const fallback = buildFallbackLayout(cappedPhotos, planTier)
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    return fallback
  }

  try {
    const aiResult = await openAiChat<AutoLayoutResult>(
      [
        {
          role: 'system',
          content:
            'You are an album designer. Return JSON with layout, reason, groupedMoments, orderedPhotoIds, and suggestedCaptions. Use only IDs provided.',
        },
        {
          role: 'user',
          content: JSON.stringify({
            planTier,
            availableLayouts: ['minimal-grid', 'classic-grid', 'story-flow', 'collage-mix'],
            photos: cappedPhotos.map((photo) => ({
              id: photo.id,
              fileName: photo.fileName,
              caption: photo.caption ?? null,
              sequenceNumber: photo.sequenceNumber ?? null,
            })),
          }),
        },
      ],
      500
    )

    if (!aiResult?.orderedPhotoIds?.length) {
      return fallback
    }

    return {
      layout: aiResult.layout || fallback.layout,
      reason: aiResult.reason || fallback.reason,
      groupedMoments:
        aiResult.groupedMoments?.filter((group) => group.photoIds?.length) || fallback.groupedMoments,
      orderedPhotoIds: aiResult.orderedPhotoIds,
      suggestedCaptions: aiResult.suggestedCaptions || fallback.suggestedCaptions,
    }
  } catch (error) {
    console.error('[ai] generateAutoLayout error:', error)
    return fallback
  }
}
