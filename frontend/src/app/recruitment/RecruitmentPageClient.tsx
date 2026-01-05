"use client"

import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import Sidebar from "@/components/ui/Sidebar"
import Header from "@/components/ui/Header"
import { KanbanBoard, type Applicant, type JobPosting, type ApplicantStatus } from "@/features/recruitment"
import JobForm from "@/features/recruitment/components/JobForm"
import { Button, Select } from "@/components/ui/FormComponents"
import { LoadingSpinner } from "@/components/ui/CommonComponents"
import { useToast } from "@/components/ui/ToastProvider"
import { useAuth } from "@/features/auth/hooks/useAuth"
import {
  fetchRecruitmentJobs,
  fetchApplicantsByJob,
  updateApplicantStatus,
} from "@/features/recruitment"
import { handleCrudError } from "@/lib/apiError"

interface RecruitmentPageClientProps {
  initialJobs: JobPosting[]
  initialApplicants: Applicant[]
  initialSelectedJobId: string | null
}

export function RecruitmentPageClient({
  initialJobs,
  initialApplicants,
  initialSelectedJobId,
}: RecruitmentPageClientProps) {
  const { token } = useAuth()
  const { showToast } = useToast()
  const queryClient = useQueryClient()

  const [isJobFormOpen, setIsJobFormOpen] = useState(false)
  const [selectedJobId, setSelectedJobId] = useState(initialSelectedJobId ?? "")

  const {
    data: jobs = [],
    isLoading: jobsLoading,
  } = useQuery<JobPosting[]>({
    queryKey: ["recruitment", "jobs"],
    queryFn: () => fetchRecruitmentJobs(token ?? undefined),
    enabled: !!token,
    initialData: initialJobs,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  useEffect(() => {
    if (!jobsLoading && jobs.length > 0 && !selectedJobId) {
      setSelectedJobId(jobs[0].id)
    }
  }, [jobs, jobsLoading, selectedJobId])

  const applicantsQueryKey = ["recruitment", "applicants", selectedJobId]
  const initialApplicantsData =
    selectedJobId && selectedJobId === initialSelectedJobId ? initialApplicants : undefined

  const applicantsQueryResult = useQuery<Applicant[]>({
    queryKey: applicantsQueryKey,
    queryFn: () => fetchApplicantsByJob(selectedJobId, token ?? undefined),
    enabled: !!token && !!selectedJobId,
    staleTime: 2 * 60 * 1000,
    ...(initialApplicantsData ? { initialData: initialApplicantsData } : {}),
  })

  const {
    data: applicants = [],
    isLoading: applicantsLoading,
    isFetching: applicantsFetching,
  } = applicantsQueryResult

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ApplicantStatus }) => {
      await updateApplicantStatus(id, status, token ?? undefined)
    },
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: applicantsQueryKey })
      const previousData = queryClient.getQueryData<Applicant[]>(applicantsQueryKey)
      if (previousData) {
        queryClient.setQueryData<Applicant[]>(applicantsQueryKey, (prev = []) =>
          prev.map((applicant) => (applicant.id === id ? { ...applicant, status } : applicant)),
        )
      }
      return { previousData }
    },
    onError: (error, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(applicantsQueryKey, context.previousData)
      }
      handleCrudError({
        error,
        resourceLabel: "Applicant",
        showToast,
        onUnauthorized: () => console.warn("Not authorized to update applicants"),
      })
    },
    onSuccess: () => {
      showToast("Applicant status updated", "success")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: applicantsQueryKey })
    },
  })

  const handleStatusChange = (applicantId: string, newStatus: ApplicantStatus) => {
    statusMutation.mutate({ id: applicantId, status: newStatus })
  }

  const jobOptions = useMemo(
    () => [
      { value: "", label: jobsLoading ? "Loading..." : "Select a Job Posting" },
      ...jobs.map((job) => ({ value: job.id, label: job.title })),
    ],
    [jobs, jobsLoading],
  )

  const loadingBoard = (applicantsLoading || applicantsFetching) && !!selectedJobId

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-[1600px] mx-auto h-full flex flex-col space-y-6">
            <div className="flex justify-between items-center flex-shrink-0">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Recruitment Pipeline</h1>
                <p className="text-sm text-gray-500">Manage applicants and job postings</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-64">
                  <Select
                    value={selectedJobId}
                    onChange={(value) => setSelectedJobId(value)}
                    options={jobOptions}
                    disabled={jobsLoading}
                  />
                </div>
                <Button onClick={() => setIsJobFormOpen(true)}>Post Job</Button>
              </div>
            </div>

            <div className="flex-1 overflow-hidden bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              {!selectedJobId ? (
                <div className="flex flex-col items-center justify-center h-full text-sm text-gray-500">
                  <p>Select a job posting to view its applicants.</p>
                </div>
              ) : loadingBoard ? (
                <div className="flex justify-center items-center h-full">
                  <LoadingSpinner size="lg" />
                </div>
              ) : (
                <KanbanBoard applicants={applicants} onStatusChange={handleStatusChange} />
              )}
            </div>
          </div>

          <JobForm
            isOpen={isJobFormOpen}
            onClose={() => setIsJobFormOpen(false)}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ["recruitment", "jobs"] })
              setIsJobFormOpen(false)
            }}
          />
        </main>
      </div>
    </div>
  )
}
