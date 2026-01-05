"use server"

import { cookies } from "next/headers"

import { PayrollPageClient } from "./PayrollPageClient"
import { fetchPayrollRecords } from "@/features/payroll"

export default async function PayrollPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get("accessToken")?.value ?? null

  const initialPayrolls = await fetchPayrollRecords(token ?? undefined)

  return <PayrollPageClient initialPayrolls={initialPayrolls ?? []} />
}
