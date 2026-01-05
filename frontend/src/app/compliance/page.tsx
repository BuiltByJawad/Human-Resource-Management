"use server"

import { cookies } from "next/headers"

import { CompliancePageClient } from "./CompliancePageClient"
import { fetchComplianceLogs, fetchComplianceRules } from "@/features/compliance"

export default async function CompliancePage() {
  const cookieStore = await cookies()
  const token = cookieStore.get("accessToken")?.value ?? null

  const [initialRules, initialLogs] = await Promise.all([
    fetchComplianceRules(token ?? undefined),
    fetchComplianceLogs(token ?? undefined),
  ])

  return <CompliancePageClient initialRules={initialRules} initialLogs={initialLogs} />
}
