"use server"

import { cookies } from "next/headers"

import { PayrollPageClient } from "./PayrollPageClient"
import { fetchPayrollRecords } from "@/services/payroll/api"
import type { PayrollRecord } from "@/services/payroll/types"

export default async function PayrollPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get("accessToken")?.value ?? null

  let initialPayrolls: PayrollRecord[] = []
  try {
    initialPayrolls = await fetchPayrollRecords(token ?? undefined)
  } catch {
    initialPayrolls = []
  }

  return <PayrollPageClient initialPayrolls={initialPayrolls ?? []} />
}
