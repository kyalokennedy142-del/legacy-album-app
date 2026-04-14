// src/lib/templates.ts
export type Template = {
  id: string
  name: string
  description: string
  preview: string // Color gradient or image URL for preview
  layout: 'grid' | 'storyteller' | 'timeline' | 'minimalist'
  maxPhotos: number
  features: string[]
}

export const TEMPLATES: Template[] = [
  {
    id: 'classic-grid',
    name: 'Classic Grid',
    description: 'Timeless 2x2 or 3x3 photo layouts with elegant borders',
    preview: 'from-amber-900/40 to-amber-700/40',
    layout: 'grid',
    maxPhotos: 100,
    features: ['Symmetrical layout', 'Vintage borders', 'Caption below each photo']
  },
  {
    id: 'storyteller',
    name: 'Storyteller',
    description: 'Large hero photos with flowing narrative sections',
    preview: 'from-rose-900/40 to-rose-700/40',
    layout: 'storyteller',
    maxPhotos: 50,
    features: ['Full-page hero images', 'Text wrap areas', 'Chapter dividers']
  },
  {
    id: 'timeline',
    name: 'Timeline',
    description: 'Chronological flow with date markers and milestones',
    preview: 'from-emerald-900/40 to-emerald-700/40',
    layout: 'timeline',
    maxPhotos: 75,
    features: ['Date stamps', 'Progress line', 'Milestone markers']
  },
  {
    id: 'minimalist',
    name: 'Minimalist',
    description: 'Clean, spacious layouts that let photos breathe',
    preview: 'from-slate-800/40 to-slate-600/40',
    layout: 'minimalist',
    maxPhotos: 30,
    features: ['Ample white space', 'Subtle typography', 'Focus on imagery']
  }
]