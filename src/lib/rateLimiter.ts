type RateLimitStore = Map<string, { count: number; resetTime: number }>

const store: RateLimitStore = new Map()
const WINDOW_MS = 60 * 1000 // 1 minute
const MAX_REQUESTS = 5 // Max attempts per window

export function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const record = store.get(ip)

  if (!record || now > record.resetTime) {
    store.set(ip, { count: 1, resetTime: now + WINDOW_MS })
    return { allowed: true, remaining: MAX_REQUESTS - 1 }
  }

  if (record.count >= MAX_REQUESTS) {
    return { allowed: false, remaining: 0 }
  }

  record.count++
  store.set(ip, record)
  return { allowed: true, remaining: MAX_REQUESTS - record.count }
}

// Cleanup old entries every 5 minutes (prevents memory leaks in dev)
setInterval(() => {
  const now = Date.now()
  for (const [ip, record] of store.entries()) {
    if (now > record.resetTime) store.delete(ip)
  }
}, 5 * 60 * 1000)