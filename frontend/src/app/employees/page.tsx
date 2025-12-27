import { cookies } from 'next/headers'

import { EmployeesPageClient } from './EmployeesPageClient'
import type { Employee as EmployeeModel } from '@/components/hrm/EmployeeComponents'

interface Department {
  id: string
  name: string
}

interface Role {
  id: string
  name: string
}

type Employee = EmployeeModel

interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

interface EmployeesPayload {
  employees: Employee[]
  pagination: Pagination
}

function buildApiBase() {
  return (
    process.env.BACKEND_URL ||
    (process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api$/, '') : null) ||
    'http://localhost:5000'
  )
}

async function fetchWithToken(path: string, token: string | null, params?: URLSearchParams): Promise<any | null> {
  if (!token) return null
  try {
    const base = buildApiBase()
    const url = params ? `${base}${path}?${params.toString()}` : `${base}${path}`
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    })
    if (!response.ok) {
      return null
    }
    const payload = await response.json().catch(() => null)
    return payload?.data ?? payload ?? null
  } catch {
    return null
  }
}

async function fetchInitialEmployees(token: string | null): Promise<EmployeesPayload | null> {
  const params = new URLSearchParams({
    page: '1',
    limit: '9'
  })
  const data = await fetchWithToken('/api/employees', token, params)
  if (!data || typeof data !== 'object') {
    return null
  }
  const employees = Array.isArray(data.employees) ? data.employees : Array.isArray(data) ? data : []
  const pagination =
    typeof data.pagination === 'object'
      ? (data.pagination as Pagination)
      : { page: 1, limit: 9, total: employees.length, pages: 1 }
  return { employees, pagination }
}

export default async function EmployeesPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('accessToken')?.value ?? null

  const [departments, roles, employees] = await Promise.all([
    fetchWithToken('/api/departments', token),
    fetchWithToken('/api/roles', token),
    fetchInitialEmployees(token)
  ])

  return (
    <EmployeesPageClient
      initialDepartments={Array.isArray(departments) ? departments : []}
      initialRoles={Array.isArray(roles) ? roles : []}
      initialEmployees={employees}
    />
  )
}
