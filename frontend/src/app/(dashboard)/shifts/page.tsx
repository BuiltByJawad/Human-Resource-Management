"use server"

import { cookies } from "next/headers"
import { ShiftsPageClient } from "./ShiftsPageClient"
import type { Shift } from "@/services/shifts/types"

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

function getWeekRange(): { startDate: string; endDate: string } {
    const now = new Date()
    const dayOfWeek = now.getDay()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - dayOfWeek)
    startOfWeek.setHours(0, 0, 0, 0)

    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)
    endOfWeek.setHours(23, 59, 59, 999)

    return {
        startDate: startOfWeek.toISOString(),
        endDate: endOfWeek.toISOString(),
    }
}

async function fetchShifts(token: string | null): Promise<Shift[]> {
    const { startDate, endDate } = getWeekRange()
    const data = await fetchWithToken<Shift[]>(`/api/shifts?startDate=${startDate}&endDate=${endDate}`, token)
    return Array.isArray(data) ? data : []
}

async function fetchEmployees(token: string | null): Promise<{ id: string; firstName: string; lastName: string }[]> {
    const data = await fetchWithToken<{ id: string; firstName: string; lastName: string }[]>("/api/employees", token)
    return Array.isArray(data) ? data : []
}

export default async function ShiftsPage() {
    const cookieStore = await cookies()
    const token = cookieStore.get("accessToken")?.value ?? null

    const [shifts, employees] = await Promise.all([
        fetchShifts(token),
        fetchEmployees(token),
    ])

    return <ShiftsPageClient initialShifts={shifts} employees={employees} />
}
