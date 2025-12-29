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
  const { siteName: storeSiteName } = useOrgStore()

  const siteName = branding?.siteName || storeSiteName

  useEffect(() => {
    if (typeof document === 'undefined') return

    const derivedTitle = (siteName || '').trim() || DEFAULT_TITLE

    if (document.title !== derivedTitle) {
      document.title = derivedTitle
    }
  }, [siteName, pathname])

  return null
}
