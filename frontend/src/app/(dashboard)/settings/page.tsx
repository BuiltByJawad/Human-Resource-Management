"use server"

import { cookies } from "next/headers"

import { SettingsPageClient } from "./SettingsPageClient"
import type { BrandingSettingsPayload } from "@/services/settings/types"

type BrandingSettingsApiResponse = {
  success?: boolean
  data?: BrandingSettingsPayload
}

function buildApiBase() {
  return (
    process.env.BACKEND_URL ||
    (process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api$/, "") : null) ||
    "http://localhost:5000"
  )
}

async function fetchWithToken<T = any>(path: string, token: string | null): Promise<T | null> {
  if (!token) return null
  try {
    const base = buildApiBase()
    const response = await fetch(`${base}${path}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    })
    if (!response.ok) {
      return null
    }
    const payload = await response.json().catch(() => null)
    return (payload?.data ?? payload ?? null) as T | null
  } catch {
    return null
  }
}

function isBrandingSettingsResponse(value: unknown): value is BrandingSettingsApiResponse {
  if (!value || typeof value !== "object") return false
  return "success" in value || "data" in (value as Record<string, unknown>)
}

async function fetchInitialBrandingSettings(token: string | null): Promise<BrandingSettingsPayload> {
  const data = await fetchWithToken<BrandingSettingsPayload | BrandingSettingsApiResponse>("/api/settings", token)
  if (!data) return {}
  if (isBrandingSettingsResponse(data)) {
    return data.data ?? {}
  }
  return data
}

export default async function SettingsPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get("accessToken")?.value ?? null

  const initialBrandingSettings = await fetchInitialBrandingSettings(token)

  return <SettingsPageClient initialBrandingSettings={initialBrandingSettings} />
}
