'use client'

import { useEffect, useRef } from 'react'
import { useOrgStore } from '@/store/useOrgStore'

const CACHE_KEY = 'favicon-cache'

const API_URL = process.env.NEXT_PUBLIC_API_URL || ''

export function FaviconManager() {
  const { faviconUrl, updateOrg } = useOrgStore()
  const fetchedBranding = useRef(false)
  const prevSourceRef = useRef<string | null>(null)

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

    const cachedRaw = typeof window !== 'undefined' ? localStorage.getItem(CACHE_KEY) : null
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
      localStorage.removeItem(CACHE_KEY)
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
              CACHE_KEY,
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
    const loadBranding = async () => {
      try {
        const res = await fetch(`${API_URL}/organization/branding/public`)
        const json = await res.json().catch(() => null)
        const data = json?.data || json
        if (data?.faviconUrl || data?.logoUrl || data?.siteName || data?.tagline || data?.companyName || data?.companyAddress) {
          updateOrg({
            siteName: data.siteName,
            tagline: data.tagline,
            companyName: data.companyName,
            companyAddress: data.companyAddress,
            logoUrl: data.logoUrl,
            faviconUrl: data.faviconUrl,
          })
        }
      } catch {
        // ignore; fallback already handled
      }
    }
    loadBranding()
  }, [updateOrg])

  return null
}
