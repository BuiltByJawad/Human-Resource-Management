"use server"

import { cookies } from 'next/headers'
import { headers } from 'next/headers'

import LeavePolicyPageClient from './LeavePolicyPageClient'
import type { LeavePolicyPayload } from '@/services/leave-policy/types'
import { extractTenantSlug } from '@/lib/tenant'

type LeavePolicyApiResponse = {
  success?: boolean
  data?: LeavePolicyPayload
}

function buildApiBase() {
  return (
    process.env.BACKEND_URL ||
    (process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api$/, '') : null) ||
    'http://localhost:5000'
  )
}

async function fetchWithToken<T = unknown>(path: string, token: string | null): Promise<T | null> {
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
        'Content-Type': 'application/json',
        ...(tenantSlug ? { 'X-Tenant-Slug': tenantSlug } : {}),
      },
      cache: 'no-store',
    })

    if (!response.ok) return null

    const payload = await response.json().catch(() => null)
    return (payload?.data ?? payload ?? null) as T | null
  } catch {
    return null
  }
}

function isLeavePolicyResponse(value: unknown): value is LeavePolicyApiResponse {
  if (!value || typeof value !== 'object') return false
  return 'success' in value || 'data' in (value as Record<string, unknown>)
}

async function fetchInitialLeavePolicy(token: string | null): Promise<LeavePolicyPayload> {
  const data = await fetchWithToken<LeavePolicyPayload | LeavePolicyApiResponse>('/api/org/leave-policy', token)
  if (!data) return {}
  if (isLeavePolicyResponse(data)) {
    return data.data ?? {}
  }
  return data
}

export default async function LeavePolicyPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('accessToken')?.value ?? null

  const initialLeavePolicy = await fetchInitialLeavePolicy(token)

  return <LeavePolicyPageClient initialLeavePolicy={initialLeavePolicy} />
}
