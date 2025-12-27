"use server"

import { cookies } from "next/headers"

import { PayrollPageClient } from "./PayrollPageClient"
import type { PayrollRecord } from "./types"

function buildApiBase() {
  return (
    process.env.BACKEND_URL ||
    (process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api$/, "") : null) ||
    "http://localhost:5000"
  )
}

async function fetchPayroll(token: string | null): Promise<PayrollRecord[]> {
  if (!token) return []

  try {
    const base = buildApiBase()
    const response = await fetch(`${base}/api/payroll`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    })
    if (!response.ok) {
      return []
    }
    const payload = await response.json().catch(() => null)
    const root = payload?.data ?? payload ?? []
    if (Array.isArray(root)) return root as PayrollRecord[]
    if (Array.isArray(root?.items)) return root.items
    if (Array.isArray(root?.payrolls)) return root.payrolls
    return []
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error("Failed to fetch payroll", error)
    }
    return []
  }
}

export default async function PayrollPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get("accessToken")?.value ?? null

  const initialPayrolls = await fetchPayroll(token)

  return <PayrollPageClient initialPayrolls={initialPayrolls ?? []} />
}
