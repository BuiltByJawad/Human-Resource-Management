import { cookies } from "next/headers"

import { OffboardingAdminPageClient } from "./OffboardingAdminPageClient"
import { fetchCurrentUser } from "@/features/auth"
import { getOffboardingProcesses } from "@/features/offboarding"
import { fetchEmployeesForManagers } from "@/features/employees"
import type { EmployeeOption } from "./OffboardingAdminPageClient"

export default async function OffboardingAdminPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get("accessToken")?.value ?? null

  const user = token ? await fetchCurrentUser(token) : null
  const permissions: string[] = Array.isArray(user?.permissions) ? user!.permissions : []
  const canManage = permissions.includes("offboarding.manage")

  const [initialProcesses, initialEmployees] = await Promise.all([
    token ? getOffboardingProcesses(token) : [],
    fetchEmployeesForManagers(token ?? undefined),
  ])

  return (
    <OffboardingAdminPageClient
      initialProcesses={initialProcesses}
      initialEmployees={initialEmployees as EmployeeOption[]}
      initialCanManage={canManage}
    />
  )
}
