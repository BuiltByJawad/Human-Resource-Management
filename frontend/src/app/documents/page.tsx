"use server"

import { cookies } from "next/headers"
import { DocumentsPageClient } from "./DocumentsPageClient"
import type { CompanyDocument } from "@/services/companyDocumentService"

function buildApiBase() {
    return (
        process.env.BACKEND_URL ||
        (process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api$/, "") : null) ||
        "http://localhost:5000"
    )
}

async function fetchWithToken<T = unknown>(path: string, token: string | null): Promise<T | null> {
    if (!token) return null
    try {
        const base = buildApiBase()
        const response = await fetch(`${base}${path}`, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            cache: "no-store",
        })
        if (!response.ok) return null
        const payload = await response.json().catch(() => null)
        return (payload?.data ?? payload ?? null) as T | null
    } catch {
        return null
    }
}

async function fetchDocuments(token: string | null): Promise<CompanyDocument[]> {
    const data = await fetchWithToken<CompanyDocument[]>("/api/documents/company", token)
    return Array.isArray(data) ? data : []
}

export default async function DocumentsPage() {
    const cookieStore = await cookies()
    const token = cookieStore.get("accessToken")?.value ?? null

    const documents = await fetchDocuments(token)

    return <DocumentsPageClient initialDocuments={documents} />
}
