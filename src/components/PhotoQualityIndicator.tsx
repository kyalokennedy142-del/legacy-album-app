'use client'

import { FaCheckCircle, FaExclamationTriangle, FaImages } from 'react-icons/fa'

export type PhotoQualityWarning = {
  type: 'blurry' | 'duplicate' | 'low-light'
  message: string
}

type PhotoQualityIndicatorProps = {
  score: number
  warnings: PhotoQualityWarning[]
}

export default function PhotoQualityIndicator({
  score,
  warnings,
}: PhotoQualityIndicatorProps) {
  const healthy = warnings.length === 0

  return (
    <div
      className={`rounded-2xl border p-3 text-sm ${
        healthy
          ? 'border-emerald-400/25 bg-emerald-500/10 text-emerald-200'
          : 'border-amber-400/25 bg-amber-500/10 text-amber-100'
      }`}
    >
      <div className="mb-2 flex items-center gap-2">
        {healthy ? <FaCheckCircle className="h-4 w-4" /> : <FaExclamationTriangle className="h-4 w-4" />}
        <span className="font-medium">Quality score {score}/100</span>
      </div>

      {healthy ? (
        <p className="flex items-center gap-2 text-xs text-emerald-100/80">
          <FaImages className="h-3 w-3" />
          This photo looks strong for print.
        </p>
      ) : (
        <ul className="space-y-1 text-xs text-amber-50/85">
          {warnings.map((warning) => (
            <li key={`${warning.type}-${warning.message}`}>{warning.message}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
