"use server"

import { cookies } from "next/headers"

import { DocumentsPageClient } from "./DocumentsPageClient"
import { getCompanyDocuments, type CompanyDocument } from "@/features/documents"

export default async function DocumentsPage() {
    const cookieStore = await cookies()
    const token = cookieStore.get("accessToken")?.value ?? null

    const documents: CompanyDocument[] = token ? await getCompanyDocuments(token ?? undefined) : []

    return <DocumentsPageClient initialDocuments={documents} />
}
