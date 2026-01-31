"use server"

import { cookies } from "next/headers"

import ReportsPageClient from "./ReportsPageClient"

type DashboardMetrics = {
  totalEmployees?: number
  presentToday?: number
  pendingLeaves?: number
  monthlyPayroll?: number
}

interface ReportsDashboardResponse {
  metrics?: DashboardMetrics
}

interface DepartmentRecord {
  id: string
  name: string
}

interface ApiDepartmentPayload {
  data?: DepartmentRecord[]
  departments?: DepartmentRecord[]
  dataWrapper?: { data?: DepartmentRecord[] }
}

type DepartmentOption = { value: string; label: string }

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

async function fetchInitialDashboard(token: string | null): Promise<ReportsDashboardResponse | null> {
  const data = await fetchWithToken<ReportsDashboardResponse>("/api/reports/dashboard", token)
  return data ?? null
}

async function fetchInitialDepartments(token: string | null): Promise<DepartmentOption[]> {
  const data = await fetchWithToken<ApiDepartmentPayload | DepartmentRecord[]>("/api/departments", token)
  if (!data) return []
  const normalize = (records: DepartmentRecord[]) =>
    records.map((dept) => ({ value: dept.id, label: dept.name })) as DepartmentOption[]

  if (Array.isArray(data)) {
    return normalize(data)
  }

  if (Array.isArray(data.departments)) {
    return normalize(data.departments)
  }

  if (Array.isArray(data.data)) {
    return normalize(data.data)
  }

  if (Array.isArray(data.dataWrapper?.data)) {
    return normalize(data.dataWrapper.data)
  }

  const nested = (data as unknown as { data?: { data?: DepartmentRecord[] } })?.data?.data
  if (Array.isArray(nested)) {
    return normalize(nested)
  }

  return []
}

export default async function ReportsPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get("accessToken")?.value ?? null

  const [initialDashboardData, initialDepartments] = await Promise.all([
    fetchInitialDashboard(token),
    fetchInitialDepartments(token),
  ])

  return (
    <ReportsPageClient
      initialDashboardData={initialDashboardData}
      initialDepartments={initialDepartments}
    />
  )
}
