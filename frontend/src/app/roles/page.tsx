"use server"

import { cookies } from "next/headers"

import { RolesPageClient } from "./RolesPageClient"
import type { Role, Permission } from "@/components/hrm/RoleComponents"

interface RolesPayload {
  data?: Role[]
  roles?: Role[]
}

interface PermissionsPayload {
  data?: Permission[]
  grouped?: Record<string, Permission[]>
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
    return (payload ?? null) as T | null
  } catch {
    return null
  }
}

async function fetchInitialRoles(token: string | null): Promise<Role[]> {
  const data = await fetchWithToken<RolesPayload | Role[]>(`/api/roles`, token)
  if (!data) return []
  if (Array.isArray(data)) return data
  if (Array.isArray((data as any)?.data)) return (data as any).data
  if (Array.isArray((data as any)?.roles)) return (data as any).roles as Role[]
  if (Array.isArray((data as any)?.data?.roles)) return (data as any).data.roles as Role[]
  if (Array.isArray((data as any)?.data?.data)) return (data as any).data.data as Role[]
  if (Array.isArray((data as any)?.data?.data?.roles)) return (data as any).data.data.roles as Role[]
  return []
}

async function fetchInitialRolePermissions(
  token: string | null,
): Promise<{ permissions: Permission[]; grouped: Record<string, Permission[]> }> {
  const data = await fetchWithToken<PermissionsPayload & { grouped?: Record<string, Permission[]> }>(
    `/api/roles/permissions`,
    token,
  )
  if (!data) {
    return { permissions: [], grouped: {} }
  }

  const permissions = Array.isArray(data.data) ? data.data : []
  const grouped = data.grouped ?? {}
  return { permissions, grouped }
}

export default async function RolesPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get("accessToken")?.value ?? null

  const [initialRoles, initialPermissionsPayload] = await Promise.all([
    fetchInitialRoles(token),
    fetchInitialRolePermissions(token),
  ])

  return (
    <RolesPageClient
      initialRoles={initialRoles}
      initialPermissionsPayload={initialPermissionsPayload}
    />
  )
}
