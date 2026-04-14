// src/components/TemplateCard.tsx
'use client'

import { motion } from 'framer-motion'
import { clsx } from 'clsx'
import { Template } from '@/lib/templates'
import { FaCheck } from 'react-icons/fa'

interface TemplateCardProps {
  template: Template
  isSelected: boolean
  onSelect: (template: Template) => void
}

export default function TemplateCard({ 
  template, 
  isSelected, 
  onSelect 
}: TemplateCardProps) {
  return (
    <motion.button
      type="button"
      onClick={() => onSelect(template)}
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      className={clsx(
        'relative glass rounded-2xl p-6 text-left w-full transition-all duration-300 border-2',
        isSelected 
          ? 'border-cyan-400 shadow-[0_0_30px_rgba(34,211,238,0.3)]' 
          : 'border-white/10 hover:border-white/30'
      )}
    >
      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute -top-3 -right-3 w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center shadow-lg">
          <FaCheck className="w-4 h-4 text-slate-900" />
        </div>
      )}

      {/* Preview area */}
      <div className={clsx(
        'h-32 rounded-xl mb-4 bg-linear-to-br',
        template.preview
      )}>
        {/* Mini layout preview */}
        <div className="w-full h-full p-3 flex items-center justify-center">
          {template.layout === 'grid' && (
            <div className="grid grid-cols-2 gap-1 w-full h-full">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white/20 rounded" />
              ))}
            </div>
          )}
          {template.layout === 'storyteller' && (
            <div className="flex flex-col gap-2 w-full h-full">
              <div className="h-1/2 bg-white/30 rounded" />
              <div className="h-1/4 bg-white/20 rounded" />
              <div className="h-1/4 bg-white/20 rounded" />
            </div>
          )}
          {template.layout === 'timeline' && (
            <div className="relative w-full h-full">
              <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/40" />
              {[...Array(3)].map((_, i) => (
                <div key={i} className="absolute left-1/2 -translate-x-1/2 w-3 h-3 bg-cyan-400 rounded-full" 
                     style={{ top: `${20 + i * 30}%` }} />
              ))}
            </div>
          )}
          {template.layout === 'minimalist' && (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-3/4 h-3/4 bg-white/20 rounded-lg" />
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <h3 className="text-lg font-bold text-white mb-1">{template.name}</h3>
      <p className="text-sm text-gray-400 mb-3">{template.description}</p>
      
      {/* Features */}
      <ul className="space-y-1 mb-4">
        {template.features.slice(0, 2).map((feature, i) => (
          <li key={i} className="text-xs text-gray-500 flex items-center gap-1">
            <span className="w-1 h-1 bg-cyan-400 rounded-full" />
            {feature}
          </li>
        ))}
      </ul>

      {/* Max photos badge */}
      <div className="inline-flex items-center gap-1 px-2 py-1 bg-white/10 rounded-full text-xs text-gray-300">
        Up to {template.maxPhotos} photos
      </div>
    </motion.button>
  )
}