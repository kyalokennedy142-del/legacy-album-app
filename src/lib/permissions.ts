export type PlanTier = 'free' | 'heritage' | 'legacy' | 'heirloom'

export type UserPlan = {
  planTier: PlanTier
  isPaid: boolean
  expiresAt: string | null
}

export type PlanConfig = {
  tier: PlanTier
  name: string
  priceKes: number
  photoLimit: number
  templates: 'basic' | 'all' | 'premium'
  watermarkPreview: boolean
  aiCaptions: boolean
  prioritySupport: boolean
  leatherAlbum: boolean
  summary: string
}

export const PLAN_CONFIGS: Record<PlanTier, PlanConfig> = {
  free: {
    tier: 'free',
    name: 'Free Trial',
    priceKes: 0,
    photoLimit: 5,
    templates: 'basic',
    watermarkPreview: true,
    aiCaptions: false,
    prioritySupport: false,
    leatherAlbum: false,
    summary: '7-day access with up to 5 photos and basic templates.',
  },
  heritage: {
    tier: 'heritage',
    name: 'Heritage',
    priceKes: 15000,
    photoLimit: 20,
    templates: 'basic',
    watermarkPreview: false,
    aiCaptions: false,
    prioritySupport: false,
    leatherAlbum: false,
    summary: 'Up to 20 photos with standard matte paper and softcover binding.',
  },
  legacy: {
    tier: 'legacy',
    name: 'Legacy',
    priceKes: 25000,
    photoLimit: 50,
    templates: 'all',
    watermarkPreview: false,
    aiCaptions: true,
    prioritySupport: true,
    leatherAlbum: false,
    summary: 'Up to 50 photos with premium lustre paper, AI captions, and priority support.',
  },
  heirloom: {
    tier: 'heirloom',
    name: 'Heirloom',
    priceKes: 40000,
    photoLimit: Number.POSITIVE_INFINITY,
    templates: 'premium',
    watermarkPreview: false,
    aiCaptions: true,
    prioritySupport: true,
    leatherAlbum: true,
    summary: 'Unlimited photos with genuine leather cover, gold foil embossing, and white-glove service.',
  },
}

export const PLAN_TIERS = Object.keys(PLAN_CONFIGS) as PlanTier[]

const tierOrder: Record<PlanTier, number> = { free: 0, heritage: 1, legacy: 2, heirloom: 3 }

export function getPlanConfig(planTier: PlanTier): PlanConfig {
  return PLAN_CONFIGS[planTier]
}

export function resolvePlanTier(value: string | null | undefined): PlanTier {
  return PLAN_TIERS.includes((value ?? '') as PlanTier)
    ? (value as PlanTier)
    : 'free'
}

export function getPlanTierFromAmount(amount: number | null | undefined): PlanTier {
  const normalizedAmount = Number(amount ?? 0)

  if (normalizedAmount >= PLAN_CONFIGS.heirloom.priceKes) {
    return 'heirloom'
  }

  if (normalizedAmount >= PLAN_CONFIGS.legacy.priceKes) {
    return 'legacy'
  }

  if (normalizedAmount >= PLAN_CONFIGS.heritage.priceKes) {
    return 'heritage'
  }

  return 'free'
}

export function getPlanLimit(planTier: PlanTier): number {
  return PLAN_CONFIGS[planTier].photoLimit
}

export function requirePaidAccess(plan: UserPlan) {
  if (!plan.isPaid || plan.planTier === 'free') {
    throw new Error('PAYMENT_REQUIRED')
  }
}

export function canAccessTier(userPlan: UserPlan, requiredTier: PlanTier): boolean {
  if (requiredTier === 'free') {
    return true
  }

  if (!userPlan.isPaid) {
    return false
  }

  return tierOrder[userPlan.planTier] >= tierOrder[requiredTier]
}

export function canUploadPhotoCount(plan: UserPlan | PlanTier, photoCount: number): boolean {
  const tier = typeof plan === 'string' ? plan : plan.planTier
  return photoCount <= getPlanLimit(tier)
}

export function shouldWatermarkPreview(plan: UserPlan | PlanTier): boolean {
  const tier = typeof plan === 'string' ? plan : plan.planTier
  return PLAN_CONFIGS[tier].watermarkPreview
}

export function planSupportsAi(plan: UserPlan | PlanTier): boolean {
  const tier = typeof plan === 'string' ? plan : plan.planTier
  return PLAN_CONFIGS[tier].aiCaptions
}

export function buildUpgradeRedirect(pathname: string, search = ''): string {
  const source = `${pathname}${search}` || '/plans'
  const params = new URLSearchParams({
    upgrade: '1',
    from: source,
  })

  return `/plans?${params.toString()}`
}
