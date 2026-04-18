// src/lib/ai.ts
// OpenAI integration with a 'Kenyan Storyteller' persona.
// Model: gpt-4o-mini — cost-effective and high quality for short captions.

const FALLBACKS = [
  'Preserving our heritage, one moment at a time.',
  'A timeless memory, lovingly kept.',
  'Capturing the warmth of our shared story.',
]

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
5. Use British English spelling (standard in Kenya — "colour", "honour", "flavour").
6. Output ONLY the caption. No quotes, no explanations, no full stops at the end unless it reads naturally.
`.trim()

/**
 * Generate a warm, culturally resonant caption for a photo.
 *
 * @param fileName - Raw file name, e.g. "IMG_20231012_family.jpg"
 * @param context  - Optional context, e.g. "My parents' anniversary"
 */
export async function generatePhotoCaption(
  fileName: string,
  context?: string,
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    console.error('[ai] OPENAI_API_KEY is not set')
    return randomFallback()
  }

  try {
    const userMessage = [
      `Generate a caption for this photo file: "${fileName}".`,
      context ? `Additional context: ${context}` : '',
    ]
      .filter(Boolean)
      .join(' ')

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model:       'gpt-4o-mini',
        max_tokens:  80,
        temperature: 0.7,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user',   content: userMessage },
        ],
      }),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err?.error?.message ?? `OpenAI API error ${response.status}`)
    }

    const data = await response.json()
    const caption = data.choices?.[0]?.message?.content?.trim()

    return caption || randomFallback()
  } catch (err) {
    console.error('[ai] generatePhotoCaption error:', err)
    return randomFallback()
  }
}

/**
 * Generate captions for multiple photos in parallel.
 * Capped at 5 concurrent requests to stay within OpenAI rate limits.
 */
export async function generateBatchCaptions(
  photos: Array<{ fileName: string; context?: string }>,
): Promise<string[]> {
  const CONCURRENCY = 5
  const results: string[] = []

  for (let i = 0; i < photos.length; i += CONCURRENCY) {
    const chunk = photos.slice(i, i + CONCURRENCY)
    const batch = await Promise.all(
      chunk.map((p) => generatePhotoCaption(p.fileName, p.context)),
    )
    results.push(...batch)
  }

  return results
}