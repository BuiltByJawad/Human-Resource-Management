import { cookies } from 'next/headers'

import { RecruitmentPageClient } from './RecruitmentPageClient'
import { fetchApplicantsByJob, fetchRecruitmentJobs } from '@/features/recruitment'

export default async function RecruitmentPage() {
    const cookieStore = await cookies()
    const token = cookieStore.get('accessToken')?.value ?? null

    const jobs = await fetchRecruitmentJobs(token ?? undefined)

    let initialSelectedJobId: string | null = null
    let initialApplicants: Awaited<ReturnType<typeof fetchApplicantsByJob>> = []

    if (jobs.length > 0) {
        initialSelectedJobId = jobs[0].id
        initialApplicants = await fetchApplicantsByJob(initialSelectedJobId, token ?? undefined)
    }

    return (
        <RecruitmentPageClient
            initialJobs={jobs}
            initialApplicants={initialApplicants}
            initialSelectedJobId={initialSelectedJobId}
        />
    )
}
