import { cookies } from "next/headers"

import { PerformancePageClient } from "./PerformancePageClient"
import { PERMISSIONS } from "@/constants/permissions"

function buildApiBase() {
  return (
    process.env.BACKEND_URL ||
    (process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api$/, "") : null) ||
    "http://localhost:5000"
  )
}

async function fetchWithToken<T = any>(
  path: string,
  token: string | null,
  params?: URLSearchParams,
): Promise<T | null> {
  if (!token) return null
  try {
    const base = buildApiBase()
    const url = params ? `${base}${path}?${params.toString()}` : `${base}${path}`
    const response = await fetch(url, {
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

async function fetchInitialCycles(token: string | null) {
  const data = (await fetchWithToken<any[] | { data?: any[] }>(`/api/performance/cycles`, token)) ?? []
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.data)) return data.data
  return []
}

async function fetchCurrentUser(token: string | null) {
  const data = (await fetchWithToken(`/api/auth/me`, token)) as any
  if (!data) return null
  return data?.user ?? data ?? null
}

async function fetchInitialReviews(userId: string | null, token: string | null) {
  if (!userId) return []
  const data =
    (await fetchWithToken<any[] | { data?: any[] }>(`/api/performance/reviews/${userId}?include=feedback`, token)) ?? []
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.data)) return data.data
  return []
}

export default async function PerformancePage() {
  const cookieStore = await cookies()
  const token = cookieStore.get("accessToken")?.value ?? null

  const user = await fetchCurrentUser(token)
  const userId = user?.id ?? null
  const userPermissions: string[] = Array.isArray(user?.permissions) ? user!.permissions : []
  const canManageCycles = userPermissions.includes(PERMISSIONS.MANAGE_PERFORMANCE_CYCLES)

  const [initialCycles, initialReviews] = await Promise.all([
    fetchInitialCycles(token),
    fetchInitialReviews(userId, token),
  ])

  return (
    <PerformancePageClient
      initialCycles={initialCycles ?? []}
      initialReviews={initialReviews ?? []}
      currentUserId={userId}
      canManageCycles={canManageCycles}
    />
  )
}
