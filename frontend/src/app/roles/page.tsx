"use server"

import { cookies } from "next/headers"

import { RolesPageClient } from "./RolesPageClient"
import { fetchRolesWithToken, fetchRolePermissions } from "@/lib/hrmData"

export default async function RolesPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get("accessToken")?.value ?? null

  const [initialRoles, initialPermissionsPayload] = await Promise.all([
    fetchRolesWithToken(token ?? undefined),
    fetchRolePermissions(token ?? undefined),
  ])

  return (
    <RolesPageClient
      initialRoles={initialRoles}
      initialPermissionsPayload={initialPermissionsPayload}
    />
  )
}
