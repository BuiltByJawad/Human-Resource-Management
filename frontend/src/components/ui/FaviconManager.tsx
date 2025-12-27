'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { useOrgStore } from '@/store/useOrgStore'
import { buildTenantStorageKey, getClientTenantSlug } from '@/lib/tenant'

const CACHE_KEY = 'favicon-cache'
const ORG_CONFIG_KEY = 'org-config'

const DEFAULT_TITLE = 'HRM Platform'

const envApiUrl = process.env.NEXT_PUBLIC_API_URL
const isAbsoluteHttpUrl = (value: string) => /^https?:\/\//i.test(value)
const isLikelyNextOrigin = (value: string) => /localhost:3000/i.test(value)
const API_URL =
  envApiUrl && isAbsoluteHttpUrl(envApiUrl) && !isLikelyNextOrigin(envApiUrl)
    ? envApiUrl
    : 'http://localhost:5000/api'

export function FaviconManager() {
  const pathname = usePathname()
  const { faviconUrl, siteName, tagline, companyName, companyAddress, logoUrl, updateOrg } = useOrgStore()
  const fetchedBranding = useRef(false)
  const prevSourceRef = useRef<string | null>(null)

  const resolveTenantKey = (baseKey: string) => {
    const tenantSlug = typeof window !== 'undefined' ? getClientTenantSlug() : null
    return buildTenantStorageKey(baseKey, tenantSlug)
  }

  useEffect(() => {
    if (typeof document === 'undefined') return
    let cachedSiteName = ''
    if (!(siteName || '').trim() && typeof window !== 'undefined') {
      try {
        const raw = window.localStorage.getItem(resolveTenantKey(ORG_CONFIG_KEY))
        if (raw) {
          const parsed = JSON.parse(raw)
          const value = parsed?.state?.siteName
          if (typeof value === 'string') {
            cachedSiteName = value
          }
        }
      } catch {
      }
    }

    const derivedTitle = ((siteName || '').trim() || (cachedSiteName || '').trim())
    if (!derivedTitle) {
      if (!document.title || document.title === DEFAULT_TITLE) {
        if (document.title !== DEFAULT_TITLE) {
          document.title = DEFAULT_TITLE
        }
      }
      return
    }

    const title = derivedTitle
    if (document.title !== title) {
      document.title = title
    }

    const id = window.setTimeout(() => {
      if (document.title !== title) {
        document.title = title
      }
    }, 0)

    return () => window.clearTimeout(id)
  }, [siteName, pathname])

  useEffect(() => {
    const head = document.head || document.getElementsByTagName('head')[0]
    if (!head) return

    const resolveHref = (href: string) => {
      const base = href || '/favicon.ico'
      if (typeof window === 'undefined') return base
      try {
        const url = new URL(base, window.location.origin)
        if (window.location.protocol === 'https:' && url.protocol === 'http:') {
          url.protocol = 'https:'
        }
        return url.toString()
      } catch {
        return base
      }
    }

    const targetHref = resolveHref(faviconUrl || '/favicon.ico')
    const versionedHref =
      faviconUrl && typeof faviconUrl === 'string'
        ? `${targetHref}${targetHref.includes('?') ? '&' : '?'}v=${encodeURIComponent(
            btoa(faviconUrl)
          )}`
        : targetHref

    const setLink = (rel: string, href: string, typeHint?: string) => {
      const links = Array.from(document.querySelectorAll(`link[rel='${rel}']`)) as HTMLLinkElement[]
      const type = typeHint || (href.endsWith('.svg') ? 'image/svg+xml' : 'image/x-icon')
      if (links.length === 0) {
        const link = document.createElement('link')
        link.rel = rel
        link.crossOrigin = 'anonymous'
        link.type = type
        link.href = href
        head.appendChild(link)
      } else {
        links.forEach((link) => {
          link.crossOrigin = 'anonymous'
          link.type = type
          link.href = href
        })
      }
    }

    const setFaviconLinks = (href: string, typeHint?: string) => {
      setLink('icon', href, typeHint)
      setLink('shortcut icon', href, typeHint)
      setLink('apple-touch-icon', href, typeHint)
    }

    const cachedRaw = typeof window !== 'undefined' ? localStorage.getItem(resolveTenantKey(CACHE_KEY)) : null
    if (cachedRaw) {
      try {
        const cached = JSON.parse(cachedRaw) as { source: string; dataUrl: string }
        if (cached?.source === targetHref && cached?.dataUrl) {
          setFaviconLinks(cached.dataUrl)
        }
      } catch {
        // ignore parse errors and continue
      }
    }

    // If source changed, clear stale cache
    if (prevSourceRef.current && prevSourceRef.current !== targetHref) {
      localStorage.removeItem(resolveTenantKey(CACHE_KEY))
    }
    prevSourceRef.current = targetHref

    // Always set the direct link immediately so a missing cache still shows something
    setFaviconLinks(versionedHref)

    if (!faviconUrl) return

    let cancelled = false

    const fetchAndCache = async () => {
      try {
        const response = await fetch(versionedHref, { cache: 'no-cache', mode: 'cors' })
        if (!response.ok) return
        const blob = await response.blob()
        const mimeType = response.headers.get('Content-Type') || undefined
        const reader = new FileReader()
        reader.onloadend = () => {
          if (cancelled) return
          const dataUrl = reader.result as string
          setFaviconLinks(dataUrl, mimeType || undefined)
          try {
            localStorage.setItem(
              resolveTenantKey(CACHE_KEY),
              JSON.stringify({ source: targetHref, dataUrl })
            )
          } catch {
            // ignore storage errors
          }
        }
        reader.readAsDataURL(blob)
      } catch {
        // ignore fetch errors; fallback already applied
      }
    }

    fetchAndCache()

    return () => {
      cancelled = true
    }
  }, [faviconUrl])

  // Fetch public branding once to hydrate favicon/logo even before visiting settings
  useEffect(() => {
    if (fetchedBranding.current) return
    fetchedBranding.current = true

    if ((siteName || '').trim() || (tagline || '').trim() || (companyName || '').trim() || (companyAddress || '').trim() || !!logoUrl) {
      return
    }

    const loadBranding = async () => {
      try {
        let url = `${API_URL}/organization/branding/public`
        if (typeof window !== 'undefined' && window.location?.protocol === 'https:' && url.startsWith('http://')) {
          url = url.replace(/^http:\/\//i, 'https://')
        }

        const tenantSlug = getClientTenantSlug()
        const res = await fetch(url, {
          headers: {
            ...(tenantSlug ? { 'X-Tenant-Slug': tenantSlug } : {}),
          },
        })
        const json = await res.json().catch(() => null)
        const data = json?.data || json
        if (data?.faviconUrl || data?.logoUrl || data?.siteName || data?.tagline || data?.companyName || data?.companyAddress) {
          const next: any = {}
          if (typeof data.siteName === 'string' && data.siteName.trim()) next.siteName = data.siteName
          if (typeof data.tagline === 'string') next.tagline = data.tagline
          if (typeof data.companyName === 'string') next.companyName = data.companyName
          if (typeof data.companyAddress === 'string') next.companyAddress = data.companyAddress
          if (typeof data.logoUrl === 'string' || data.logoUrl === null) next.logoUrl = data.logoUrl
          if (typeof data.faviconUrl === 'string' || data.faviconUrl === null) next.faviconUrl = data.faviconUrl
          if (Object.keys(next).length > 0) {
            updateOrg(next)
          }
        }
      } catch {
        // ignore; fallback already handled
      }
    }
    loadBranding()
  }, [updateOrg])

  return null
}
