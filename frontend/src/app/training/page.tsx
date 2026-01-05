"use server"

import { cookies } from "next/headers"

import { TrainingPageClient } from "./TrainingPageClient"
import { getAllCourses } from "@/features/training"
import { fetchEmployeesForManagers, type EmployeeSummary } from "@/features/employees"
import type { TrainingCourse } from "@/features/training"

export default async function TrainingPage() {
    const cookieStore = await cookies()
    const token = cookieStore.get("accessToken")?.value ?? null

    const [courses, employees] = await Promise.all([
        token ? getAllCourses(token ?? undefined) : [],
        fetchEmployeesForManagers(token ?? undefined),
    ])

    return <TrainingPageClient initialCourses={courses as TrainingCourse[]} employees={employees as EmployeeSummary[]} />
}
