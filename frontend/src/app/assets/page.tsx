"use server"

import { cookies } from "next/headers"

import { AssetsPageClient } from "./AssetsPageClient"
import { fetchAssets, type Asset } from "@/features/assets"
import { fetchEmployees, type Employee } from "@/features/employees"

export default async function AssetPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get("accessToken")?.value ?? null

  const [initialAssets, employeesPage] = await Promise.all([
    fetchAssets({}, token ?? undefined),
    fetchEmployees({ page: 1, limit: 200 }, token ?? undefined),
  ])

  const employees: Employee[] = employeesPage.employees ?? []

  return (
    <AssetsPageClient
      initialAssets={(initialAssets ?? []) as Asset[]}
      initialEmployees={employees}
    />
  )
}
