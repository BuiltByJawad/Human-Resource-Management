"use server"

import { cookies } from "next/headers"

import { CompliancePageClient } from "./CompliancePageClient"
import type { ComplianceRule, ComplianceLog } from "@/components/hrm/ComplianceComponents"

interface CompliancePayload<T> {
  data?: T[]
  items?: T[]
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

async function fetchInitialComplianceRules(token: string | null): Promise<ComplianceRule[]> {
  const data = await fetchWithToken<CompliancePayload<ComplianceRule> | ComplianceRule[]>(`/api/compliance/rules`, token)
  if (!data) return []
  if (Array.isArray(data)) return data
  if (Array.isArray(data.data)) return data.data
  if (Array.isArray(data.items)) return data.items
  const nested = (data as unknown as { data?: { data?: ComplianceRule[] } })?.data?.data
  if (Array.isArray(nested)) return nested
  return []
}

async function fetchInitialComplianceLogs(token: string | null): Promise<ComplianceLog[]> {
  const data = await fetchWithToken<CompliancePayload<ComplianceLog> | ComplianceLog[]>(`/api/compliance/logs`, token)
  if (!data) return []
  if (Array.isArray(data)) return data
  if (Array.isArray(data.data)) return data.data
  if (Array.isArray(data.items)) return data.items
  const nested = (data as unknown as { data?: { data?: ComplianceLog[] } })?.data?.data
  if (Array.isArray(nested)) return nested
  return []
}

export default async function CompliancePage() {
  const cookieStore = await cookies()
  const token = cookieStore.get("accessToken")?.value ?? null

  const [initialRules, initialLogs] = await Promise.all([
    fetchInitialComplianceRules(token),
    fetchInitialComplianceLogs(token),
  ])

  return <CompliancePageClient initialRules={initialRules} initialLogs={initialLogs} />
}
