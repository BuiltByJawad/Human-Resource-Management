'use client'

import { useEffect, useRef } from 'react'
import { useBrandingStore } from '@/store/useBrandingStore'

interface BrandingData {
    siteName: string;
    shortName: string | null;
    tagline: string | null;
    logoUrl: string | null;
    faviconUrl: string | null;
    companyName?: string | null;
    companyAddress?: string | null;
    footerYear?: number | null;
}

interface StoreHydratorProps {
    branding: BrandingData;
}

/**
 * Hydrates client-side stores with server-fetched data immediately on mount
 * to prevent flicker/skeletons for data that is statically available.
 */
export function StoreHydrator({ branding }: StoreHydratorProps) {
    const { updateBranding, loaded } = useBrandingStore()
    const hydrated = useRef(false)

    // We use useLayoutEffect or just a ref-guarded effect to sync data as early as possible
    if (!hydrated.current && typeof window !== 'undefined') {
        // Sync branding into the store immediately during first render if possible
        // This reduces the chance of seeing a skeleton
        updateBranding({
            siteName: branding.siteName,
            shortName: branding.shortName ?? '',
            tagline: branding.tagline ?? '',
            companyName: branding.companyName ?? undefined,
            companyAddress: branding.companyAddress ?? undefined,
            logoUrl: branding.logoUrl,
            faviconUrl: branding.faviconUrl,
        })
        hydrated.current = true
    }

    return null
}
