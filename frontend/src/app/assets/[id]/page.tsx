"use server"

import { cookies } from 'next/headers'
import { AssetDetailsPageClient } from './AssetDetailsPageClient'
import { fetchAssetByIdServer } from '@/services/assets/api'
import { fetchEmployees } from '@/services/employees/api'
import type { Employee } from '@/services/employees/types'

interface AssetDetailsPageProps {
  params: { id: string }
}

export default async function AssetDetailsPage({ params }: AssetDetailsPageProps) {
  const cookieStore = await cookies()
  const token = cookieStore.get('accessToken')?.value ?? null
  const assetId = params?.id ?? ''

  const [initialAsset, employeesPage] = await Promise.all([
    assetId ? fetchAssetByIdServer(token, assetId) : Promise.resolve(null),
    fetchEmployees({ page: 1, limit: 200 }, token ?? undefined),
  ])

  const employees: Employee[] = employeesPage.employees ?? []

  return <AssetDetailsPageClient initialAsset={initialAsset} initialEmployees={employees} />
}
