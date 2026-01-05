"use server"

import { cookies } from "next/headers"

import { TimeTrackingPageClient } from "./TimeTrackingPageClient"
import { getProjects } from "@/features/time-tracking"
import { fetchEmployeesForManagers, type EmployeeSummary } from "@/features/employees"
import type { Project } from "@/features/time-tracking"

export default async function TimeTrackingPage() {
    const cookieStore = await cookies()
    const token = cookieStore.get("accessToken")?.value ?? null

    const [projects, employees] = await Promise.all([
        token ? getProjects(token ?? undefined) : [],
        fetchEmployeesForManagers(token ?? undefined),
    ])

    return <TimeTrackingPageClient initialProjects={projects as Project[]} employees={employees as EmployeeSummary[]} />
}
