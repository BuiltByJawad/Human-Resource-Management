'use client'

import { useEffect, useState } from 'react'

import type { LoginHighlight } from '@/services/login/types'

interface LoginHighlightsClientProps {
  highlights: LoginHighlight[]
}

export default function LoginHighlightsClient({ highlights }: LoginHighlightsClientProps) {
  const [showHighlights, setShowHighlights] = useState(false)

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null

    if ('requestIdleCallback' in window) {
      const handle = window.requestIdleCallback(() => setShowHighlights(true))
      return () => window.cancelIdleCallback(handle)
    }

    timeoutId = globalThis.setTimeout(() => setShowHighlights(true), 300)
    return () => {
      if (timeoutId !== null) {
        globalThis.clearTimeout(timeoutId)
      }
    }
  }, [])

  if (!showHighlights || highlights.length === 0) {
    return null
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {highlights.map((highlight) => (
        <div key={highlight.title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-wide text-blue-100/70">{highlight.title}</p>
          <p className="text-base font-medium text-white">{highlight.description}</p>
        </div>
      ))}
    </div>
  )
}
