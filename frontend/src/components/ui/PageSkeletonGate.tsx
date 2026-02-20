'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

interface PageSkeletonGateProps {
  children: React.ReactNode
}

const CACHE_PREFIX = 'page-skeleton-cache:'
const AUTH_PREFIXES = ['/login', '/auth']

export function PageSkeletonGate({ children }: PageSkeletonGateProps) {
  const pathname = usePathname()
  const [shouldRender, setShouldRender] = useState(false)

  useEffect(() => {
    if (!pathname) return
    if (AUTH_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
      setShouldRender(true)
      return
    }
    const key = `${CACHE_PREFIX}${pathname}`
    try {
      const cached = window.localStorage.getItem(key) === 'true'
      if (cached) {
        setShouldRender(false)
        return
      }
      setShouldRender(true)
      window.localStorage.setItem(key, 'true')
    } catch {
      setShouldRender(true)
    }
  }, [pathname])

  if (!shouldRender) {
    return <div className="min-h-screen w-full bg-slate-50" />
  }
  return <>{children}</>
}
