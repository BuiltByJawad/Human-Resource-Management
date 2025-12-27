"use server"

import { cookies } from "next/headers"
import { headers } from 'next/headers'

import { SettingsPageClient, type OrgSettingsPayload } from "./SettingsPageClient"
import { extractTenantSlug } from '@/lib/tenant'

type OrgSettingsApiResponse = {
  success?: boolean
  data?: OrgSettingsPayload
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
    const headerList = await headers()
    const tenantSlug = extractTenantSlug({
      headerSlug: headerList.get('x-tenant-slug'),
      hostname: headerList.get('host'),
    })
    const response = await fetch(`${base}${path}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...(tenantSlug ? { 'X-Tenant-Slug': tenantSlug } : {}),
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

function isOrgSettingsResponse(value: unknown): value is OrgSettingsApiResponse {
  if (!value || typeof value !== "object") return false
  return "success" in value || "data" in (value as Record<string, unknown>)
}

async function fetchInitialOrgSettings(token: string | null): Promise<OrgSettingsPayload> {
  const data = await fetchWithToken<OrgSettingsPayload | OrgSettingsApiResponse>("/api/org/settings", token)
  if (!data) return {}
  if (isOrgSettingsResponse(data)) {
    return data.data ?? {}
  }
  return data
}

export default async function SettingsPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get("accessToken")?.value ?? null

  const initialOrgSettings = await fetchInitialOrgSettings(token)

  return <SettingsPageClient initialOrgSettings={initialOrgSettings} />
}
