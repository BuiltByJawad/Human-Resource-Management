"use server"

import { cookies } from "next/headers"

import { PayrollPageClient } from "./PayrollPageClient"
import { fetchPayrollRecords } from "@/lib/hrmData"
import type { PayrollRecord } from "@/types/hrm"

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
