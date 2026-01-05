'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useBranding } from '@/components/providers/BrandingProvider'
import { useOrgStore } from '@/store/useOrgStore'

const DEFAULT_TITLE = 'HRM Platform'

export function FaviconManager() {
  const pathname = usePathname()
  const branding = useBranding()
  const siteName = branding?.siteName
  const storeFaviconUrl = useOrgStore((state) => state.faviconUrl)

  // Keep document.title in sync with branding
  useEffect(() => {
    if (typeof document === 'undefined') return

    const derivedTitle = (siteName || '').trim() || DEFAULT_TITLE

    if (document.title !== derivedTitle) {
      document.title = derivedTitle
    }
  }, [siteName, pathname])

  // Replace dummy favicon with Cloudinary/global one when available
  useEffect(() => {
    if (typeof document === 'undefined') return

    const faviconHref = storeFaviconUrl?.trim()

    if (!faviconHref) return

    const setAll = (rel: string, href: string) => {
      const nodes = Array.from(document.head.querySelectorAll<HTMLLinkElement>(`link[rel="${rel}"]`))

      if (nodes.length === 0) {
        const link = document.createElement('link')
        link.rel = rel
        link.href = href
        document.head.appendChild(link)
        return
      }

      nodes.forEach((node) => {
        if (node.href !== href) {
          node.href = href
        }
      })
    }

    setAll('icon', faviconHref)
    setAll('shortcut icon', faviconHref)
  }, [storeFaviconUrl, pathname])

  return null
}
