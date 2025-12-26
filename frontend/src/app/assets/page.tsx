"use server"

import { cookies } from "next/headers"

import { AssetsPageClient } from "./AssetsPageClient"
import type { Asset } from "@/components/hrm/AssetComponents"

interface EmployeesPayload {
  data?: any[] | { employees?: any[] }
  employees?: any[]
}

interface AssetsPayload {
  success?: boolean
  data?: Asset[]
  assets?: Asset[]
}

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

async function fetchInitialAssets(token: string | null): Promise<Asset[]> {
  const data =
    (await fetchWithToken<AssetsPayload | Asset[]>(`/api/assets`, token)) ??
    []
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.data)) return data.data
  if (Array.isArray(data?.assets)) return data.assets
  return []
}

async function fetchInitialEmployees(token: string | null): Promise<any[]> {
  const params = new URLSearchParams({ limit: "200" })
  const data =
    (await fetchWithToken<EmployeesPayload | any[]>(`/api/employees`, token, params)) ?? []
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.employees)) return data.employees
  if (Array.isArray((data as EmployeesPayload)?.data)) return (data as EmployeesPayload).data as any[]
  if (Array.isArray((data as any)?.data?.employees)) return (data as any).data.employees
  return []
}

export default async function AssetPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get("accessToken")?.value ?? null

  const [initialAssets, initialEmployees] = await Promise.all([
    fetchInitialAssets(token),
    fetchInitialEmployees(token),
  ])

  return (
    <AssetsPageClient
      initialAssets={initialAssets ?? []}
      initialEmployees={initialEmployees ?? []}
    />
  )
}
