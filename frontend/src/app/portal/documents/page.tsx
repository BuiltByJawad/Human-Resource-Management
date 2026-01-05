import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import type { CompanyDocument } from '@/features/documents'
import { DocumentsPageClient } from './DocumentsPageClient'
import { fetchCurrentUser } from '@/features/auth/services/auth.api'
import { getDocuments } from '@/features/documents'

export default async function DocumentsPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('accessToken')?.value ?? null
  const user = await fetchCurrentUser(token ?? undefined)
  const employeeId = user?.employee?.id ?? null
  if (!employeeId) {
    redirect('/dashboard')
  }

  const initialDocuments = token ? await getDocuments(undefined, token ?? undefined) : []
  return <DocumentsPageClient initialDocuments={initialDocuments} initialCategory="All" />
}
