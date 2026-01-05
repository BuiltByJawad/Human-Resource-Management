export type JobStatus = 'open' | 'closed' | 'draft'

export interface JobPosting {
  id: string
  title: string
  departmentId: string
  status: JobStatus
  description?: string
  _count?: {
    applicants: number
  }
}

export type ApplicantStatus = 'applied' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected'

export interface Applicant {
  id: string
  jobId: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  resumeUrl?: string
  status: ApplicantStatus
  appliedDate: string
}

export interface CreateJobPostingPayload {
  title: string
  departmentId: string
  description: string
  status?: JobStatus
}
