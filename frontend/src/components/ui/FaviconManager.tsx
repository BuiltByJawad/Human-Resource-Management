'use client'

import { useEffect } from 'react'
import { useOrgStore } from '@/store/useOrgStore'

export function FaviconManager() {
  const { faviconUrl } = useOrgStore()

  useEffect(() => {
    if (!faviconUrl) return

    const head = document.head || document.getElementsByTagName('head')[0]
    if (!head) return

    let link: HTMLLinkElement | null = document.querySelector("link[rel='icon']")
    if (!link) {
      link = document.createElement('link')
      link.rel = 'icon'
      head.appendChild(link)
    }
    link.href = faviconUrl
  }, [faviconUrl])

  return null
}
