import api from '@/lib/axios'
import type {
  Applicant,
  ApplicantStatus,
  CreateJobPostingPayload,
  JobPosting,
} from '@/features/recruitment/types/recruitment.types'

const withAuthConfig = (token?: string) => (token ? { headers: { Authorization: `Bearer ${token}` } } : undefined)

export async function fetchRecruitmentJobs(token?: string): Promise<JobPosting[]> {
  const response = await api.get('/recruitment/jobs', withAuthConfig(token))
  const data = response.data?.data ?? response.data
  return Array.isArray(data) ? (data as JobPosting[]) : []
}

export async function fetchApplicantsByJob(jobId: string, token?: string): Promise<Applicant[]> {
  if (!jobId) return []
  const response = await api.get('/recruitment/applicants', {
    params: { jobId },
    ...withAuthConfig(token),
  })
  const data = response.data?.data ?? response.data
  return Array.isArray(data) ? (data as Applicant[]) : []
}

export async function updateApplicantStatus(applicantId: string, status: ApplicantStatus, token?: string): Promise<void> {
  await api.patch(
    `/recruitment/applicants/${applicantId}/status`,
    { status },
    withAuthConfig(token),
  )
}

export async function createJobPosting(payload: CreateJobPostingPayload, token?: string) {
  const response = await api.post(
    '/recruitment/jobs',
    {
      ...payload,
      status: payload.status ?? 'open',
    },
    withAuthConfig(token),
  )
  return response.data?.data ?? response.data
}
