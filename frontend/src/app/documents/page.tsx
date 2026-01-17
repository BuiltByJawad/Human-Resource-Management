"use server"

import { cookies } from "next/headers"
import { DocumentsPageClient } from "./DocumentsPageClient"
import { fetchCompanyDocumentsServer } from "@/services/documents/api"

export default async function DocumentsPage() {
    const cookieStore = await cookies()
    const token = cookieStore.get("accessToken")?.value ?? null

    const documents = await fetchCompanyDocumentsServer(token)

    return <DocumentsPageClient initialDocuments={documents} />
}
