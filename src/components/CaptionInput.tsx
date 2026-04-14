// src/components/CaptionInput.tsx
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { clsx } from 'clsx'

interface CaptionInputProps {
  photoName: string
  photoUrl?: string
  value: string
  onChange: (value: string) => void
  index: number
}

export default function CaptionInput({ 
  photoName, 
  photoUrl, 
  value, 
  onChange,
  index 
}: CaptionInputProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <motion.div 
      className="glass rounded-xl p-4 flex gap-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      {/* Thumbnail */}
      <div className="w-16 h-16 rounded-lg bg-slate-800 shrink-0 overflow-hidden">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt={photoName} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
            📷
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate mb-1">{photoName}</p>
        
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsExpanded(true)}
          onBlur={() => !value && setIsExpanded(false)}
          placeholder="Add a story, memory, or caption..."
          className={clsx(
            'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500',
            'focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent',
            'transition-all duration-200 resize-none',
            isExpanded ? 'h-20' : 'h-10'
          )}
        />
      </div>
    </motion.div>
  )
}