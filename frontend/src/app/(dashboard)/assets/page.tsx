"use server"

import { cookies } from "next/headers"

import { AssetsPageClient } from "./AssetsPageClient"
import type { Asset } from "@/services/assets/types"
import type { Employee } from "@/services/employees/types"
import { fetchAssetsServer } from "@/services/assets/api"
import { fetchEmployees } from "@/services/employees/api"

export default async function AssetPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get("accessToken")?.value ?? null

  const [initialAssets, employeesPage] = await Promise.all([
    fetchAssetsServer(token, {}),
    fetchEmployees({ page: 1, limit: 200 }, token ?? undefined),
  ])

  const employees: Employee[] = employeesPage.employees ?? []

  return (
    <AssetsPageClient
      initialAssets={initialAssets as Asset[]}
      initialEmployees={employees}
    />
  )
}
