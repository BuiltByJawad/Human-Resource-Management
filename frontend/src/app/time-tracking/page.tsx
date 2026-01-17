"use server"

import { cookies } from "next/headers"
import { TimeTrackingPageClient } from "./TimeTrackingPageClient"
import type { Project, TimeEntry } from "@/services/time-tracking/types"

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

async function fetchProjects(token: string | null): Promise<Project[]> {
    const data = await fetchWithToken<Project[]>("/api/time-tracking/projects", token)
    return Array.isArray(data) ? data : []
}

async function fetchEmployees(token: string | null): Promise<{ id: string; firstName: string; lastName: string }[]> {
    const data = await fetchWithToken<{ id: string; firstName: string; lastName: string }[]>("/api/employees", token)
    return Array.isArray(data) ? data : []
}

export default async function TimeTrackingPage() {
    const cookieStore = await cookies()
    const token = cookieStore.get("accessToken")?.value ?? null

    const [projects, employees] = await Promise.all([
        fetchProjects(token),
        fetchEmployees(token),
    ])

    return <TimeTrackingPageClient initialProjects={projects} employees={employees} />
}
