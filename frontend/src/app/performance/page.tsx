import { cookies } from "next/headers"

import { PerformancePageClient } from "./PerformancePageClient"
import { PERMISSIONS } from "@/shared/constants/permissions"
import { fetchCurrentUser } from "@/features/auth/services/auth.api"
import { fetchPerformanceCycles, fetchPerformanceReviews } from "@/features/performance"

export default async function PerformancePage() {
  const cookieStore = await cookies()
  const token = cookieStore.get("accessToken")?.value ?? null

  const user = await fetchCurrentUser(token ?? undefined)
  const userId = user?.id ?? null
  const userPermissions: string[] = Array.isArray(user?.permissions) ? user.permissions : []
  const canManageCycles = userPermissions.includes(PERMISSIONS.MANAGE_PERFORMANCE_CYCLES)

  const [initialCycles, initialReviews] = await Promise.all([
    fetchPerformanceCycles(token ?? undefined),
    userId ? fetchPerformanceReviews(userId, token ?? undefined) : Promise.resolve([]),
  ])

  return (
    <PerformancePageClient
      initialCycles={initialCycles ?? []}
      initialReviews={initialReviews ?? []}
      currentUserId={userId}
      canManageCycles={canManageCycles}
    />
  )
}
