export const dynamic = 'force-dynamic'

import { cookies } from 'next/headers'

import { DocumentCategoriesPageClient } from './DocumentCategoriesPageClient'
import { fetchDocumentCategories } from '@/services/documentCategories/api'
import type { DocumentCategory } from '@/services/documentCategories/types'

export default async function DocumentCategoriesPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('accessToken')?.value ?? null

  let initialCategories: DocumentCategory[] = []
  try {
    initialCategories = await fetchDocumentCategories({ includeInactive: true }, token ?? undefined)
  } catch {
    initialCategories = []
  }

  return <DocumentCategoriesPageClient initialCategories={initialCategories} />
}
