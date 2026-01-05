"use server"

import { cookies } from "next/headers"

import { RolesPageClient } from "./RolesPageClient"
import { fetchRoles, fetchRolePermissions } from "@/features/roles"

export default async function RolesPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get("accessToken")?.value ?? null

  const [initialRoles, initialPermissionsPayload] = await Promise.all([
    fetchRoles(token ?? undefined),
    fetchRolePermissions(token ?? undefined),
  ])

  return (
    <RolesPageClient
      initialRoles={initialRoles}
      initialPermissionsPayload={initialPermissionsPayload}
    />
  )
}
