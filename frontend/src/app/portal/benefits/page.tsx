import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { BenefitsPageClient, type BenefitsResponse } from './BenefitsPageClient'
import { fetchCurrentUser } from '@/features/auth'
import { getEmployeeBenefits } from '@/features/benefits'

export default async function MyBenefitsPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('accessToken')?.value ?? null
  const user = token ? await fetchCurrentUser(token) : null
  const employeeId = user?.employee?.id ?? null
  if (!employeeId) {
    redirect('/dashboard')
  }

  const enrollments = await getEmployeeBenefits(employeeId, token ?? undefined)
  const benefits = (enrollments ?? []).map((enrollment) => ({
    id: enrollment.id,
    benefitPlanId: enrollment.benefitPlanId,
    coverageStartDate: enrollment.coverageStartDate,
    status: enrollment.status,
    planName: enrollment.benefitPlan?.name ?? '',
    planType: enrollment.benefitPlan?.type ?? '',
    cost: enrollment.benefitPlan?.costToEmployee ?? 0,
  }))
  const initialBenefits: BenefitsResponse = { benefits, summary: null }

  return <BenefitsPageClient employeeId={employeeId} initialBenefits={initialBenefits} />
}
