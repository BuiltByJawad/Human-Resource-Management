import { cookies } from "next/headers"

import { OffboardingAdminPageClient } from "./OffboardingAdminPageClient"
import type { OffboardingProcess } from "@/services/offboardingService"
import type { EmployeeOption } from "./OffboardingAdminPageClient"

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

async function fetchCurrentUser(token: string | null) {
  const data = (await fetchWithToken(`/api/auth/me`, token)) as any
  if (!data) return null
  return data?.user ?? data ?? null
}

async function fetchProcesses(token: string | null): Promise<OffboardingProcess[]> {
  const data = (await fetchWithToken<OffboardingProcess[] | { data?: OffboardingProcess[] }>(`/api/offboarding`, token)) ?? []
  if (Array.isArray(data)) return data
  if (Array.isArray((data as any)?.data)) return (data as any).data
  return []
}

async function fetchEmployees(token: string | null): Promise<EmployeeOption[]> {
  const params = new URLSearchParams({ limit: "200" })
  const data = (await fetchWithToken<any>(`/api/employees`, token, params)) ?? []
  const employeesArray = Array.isArray(data?.employees) ? data.employees : Array.isArray(data) ? data : []
  return employeesArray.map((emp: any) => ({
    id: emp.id,
    name: `${emp.firstName ?? ""} ${emp.lastName ?? ""}`.trim() || emp.email,
    email: emp.email,
  }))
}

export default async function OffboardingAdminPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get("accessToken")?.value ?? null

  const user = await fetchCurrentUser(token)
  const permissions: string[] = Array.isArray(user?.permissions) ? user!.permissions : []
  const canManage = permissions.includes("offboarding.manage")

  const [initialProcesses, initialEmployees] = await Promise.all([fetchProcesses(token), fetchEmployees(token)])

  return (
    <OffboardingAdminPageClient
      initialProcesses={initialProcesses}
      initialEmployees={initialEmployees}
      initialCanManage={canManage}
    />
  )
}
