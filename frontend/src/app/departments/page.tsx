"use server"

import { cookies } from 'next/headers'

import { DepartmentsPageClient } from './DepartmentsPageClient'
import type { Department } from '@/components/hrm/DepartmentComponents'

interface ApiDepartmentPayload {
  data?: Department[] | { data?: Department[] }
  departments?: Department[]
}

interface EmployeesPayload {
  data?: any[] | { employees?: any[] }
  employees?: any[]
}

function buildApiBase() {
  return (
    process.env.BACKEND_URL ||
    (process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api$/, '') : null) ||
    'http://localhost:5000'
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
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
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

async function fetchInitialDepartments(token: string | null): Promise<Department[]> {
  const data = (await fetchWithToken<ApiDepartmentPayload | Department[]>(`/api/departments`, token)) ?? []
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.departments)) return data.departments
  if (Array.isArray((data as ApiDepartmentPayload)?.data)) return (data as ApiDepartmentPayload).data as Department[]
  if (Array.isArray((data as any)?.data?.data)) return (data as any).data.data
  return []
}

async function fetchInitialManagerList(token: string | null): Promise<any[]> {
  const params = new URLSearchParams({
    limit: '100',
  })
  const data = (await fetchWithToken<EmployeesPayload | any[]>(`/api/employees`, token, params)) ?? []
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.employees)) return data.employees
  if (Array.isArray((data as EmployeesPayload)?.data)) return (data as EmployeesPayload).data as any[]
  if (Array.isArray((data as any)?.data?.employees)) return (data as any).data.employees
  return []
}

export default async function DepartmentsPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('accessToken')?.value ?? null

  const [initialDepartments, initialEmployees] = await Promise.all([
    fetchInitialDepartments(token),
    fetchInitialManagerList(token),
  ])

  return (
    <DepartmentsPageClient
      initialDepartments={initialDepartments ?? []}
      initialEmployees={initialEmployees ?? []}
    />
  )
}