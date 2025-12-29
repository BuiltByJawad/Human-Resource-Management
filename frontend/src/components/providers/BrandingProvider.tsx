'use client'

import React, { createContext, useContext, ReactNode } from 'react'

export interface BrandingData {
    siteName: string;
    shortName: string;
    tagline: string;
    logoUrl: string | null;
    faviconUrl: string | null;
}

const BrandingContext = createContext<BrandingData | null>(null)

export function BrandingProvider({
    children,
    branding
}: {
    children: ReactNode;
    branding: BrandingData
}) {
    return (
        <BrandingContext.Provider value={branding}>
            {children}
        </BrandingContext.Provider>
    )
}

export function useBranding() {
    const context = useContext(BrandingContext)
    return context
}
