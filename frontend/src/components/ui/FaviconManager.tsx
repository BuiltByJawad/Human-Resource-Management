'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useBranding } from '@/components/providers/BrandingProvider'
import { useOrgStore } from '@/store/useOrgStore'

const DEFAULT_TITLE = 'HRM Platform'

/**
 * FaviconManager now primarily handles dynamic document title synchronization.
 * Favicon links are now handled server-side in RootLayout's generateMetadata.
 */
export function FaviconManager() {
  const pathname = usePathname()
  const branding = useBranding()
  const { siteName: storeSiteName, faviconUrl: storeFaviconUrl, faviconVersion } = useOrgStore()

  const siteName = branding?.siteName || storeSiteName
  const effectiveFaviconUrl = storeFaviconUrl ?? branding?.faviconUrl ?? '/favicon.ico'

  const buildVersionedUrl = (url: string, version: number) => {
    if (!version) return url
    const separator = url.includes('?') ? '&' : '?'
    return `${url}${separator}v=${version}`
  }

  useEffect(() => {
    if (typeof document === 'undefined') return

    const derivedTitle = (siteName || '').trim() || DEFAULT_TITLE

    if (document.title !== derivedTitle) {
      document.title = derivedTitle
    }
  }, [siteName, pathname])

  useEffect(() => {
    if (typeof document === 'undefined') return

    const href = buildVersionedUrl(effectiveFaviconUrl, faviconVersion)

    const selectors = ['link[rel="icon"]', 'link[rel="shortcut icon"]']
    const nodes = selectors.flatMap((selector) => Array.from(document.head.querySelectorAll<HTMLLinkElement>(selector)))

    if (nodes.length === 0) {
      const link = document.createElement('link')
      link.rel = 'icon'
      link.href = href
      document.head.appendChild(link)
      return
    }

    nodes.forEach((node) => {
      if (node.href !== href) {
        node.href = href
      }
    })
  }, [effectiveFaviconUrl, faviconVersion])

  return null
}
