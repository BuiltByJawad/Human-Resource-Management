"use server"

import { cookies } from "next/headers"

import { ReportsPageClient } from "./ReportsPageClient"
import { fetchReportsDashboard, fetchDepartments } from "@/features/reports"

export default async function ReportsPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get("accessToken")?.value ?? null

  const [initialDashboardData, initialDepartments] = await Promise.all([
    token ? fetchReportsDashboard(token ?? undefined) : null,
    fetchDepartments(token ?? undefined),
  ])

  return (
    <ReportsPageClient
      initialDashboardData={initialDashboardData}
      initialDepartments={initialDepartments}
    />
  )
}
