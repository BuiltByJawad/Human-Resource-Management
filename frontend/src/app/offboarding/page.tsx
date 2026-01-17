import { cookies } from "next/headers"

import { OffboardingAdminPageClient } from "./OffboardingAdminPageClient"
import {
  fetchOffboardingEmployeesServer,
  fetchOffboardingPermissions,
  fetchOffboardingProcessesServer,
} from "@/services/offboarding/api"

export default async function OffboardingAdminPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get("accessToken")?.value ?? null

  const permissions = await fetchOffboardingPermissions(token)
  const canManage = permissions.includes("offboarding.manage")

  const [initialProcesses, initialEmployees] = await Promise.all([
    fetchOffboardingProcessesServer(token),
    fetchOffboardingEmployeesServer(token),
  ])

  return (
    <OffboardingAdminPageClient
      initialProcesses={initialProcesses}
      initialEmployees={initialEmployees}
      initialCanManage={canManage}
    />
  )
}
