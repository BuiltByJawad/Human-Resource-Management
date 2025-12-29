'use client'

import { useEffect, useRef } from 'react'
import { useOrgStore } from '@/store/useOrgStore'

interface BrandingData {
    siteName: string;
    shortName: string;
    tagline: string;
    logoUrl: string | null;
    faviconUrl: string | null;
}

interface StoreHydratorProps {
    branding: BrandingData;
}

/**
 * Hydrates client-side stores with server-fetched data immediately on mount
 * to prevent flicker/skeletons for data that is statically available.
 */
export function StoreHydrator({ branding }: StoreHydratorProps) {
    const { updateOrg, loaded } = useOrgStore()
    const hydrated = useRef(false)

    // We use useLayoutEffect or just a ref-guarded effect to sync data as early as possible
    if (!hydrated.current && typeof window !== 'undefined') {
        // Sync branding into the store immediately during first render if possible
        // This reduces the chance of seeing a skeleton
        updateOrg(branding)
        hydrated.current = true
    }

    return null
}
