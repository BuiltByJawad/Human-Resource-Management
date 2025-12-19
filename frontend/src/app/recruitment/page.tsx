'use client'

import { useMemo, useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { KanbanBoard, Applicant, JobPosting, ApplicantStatus } from '@/components/hrm/RecruitmentComponents'
import { Button, Select } from '@/components/ui/FormComponents'
import { useToast } from '@/components/ui/ToastProvider'
import { useAuthStore } from '@/store/useAuthStore'
import Sidebar from '@/components/ui/Sidebar'
import Header from '@/components/ui/Header'
import JobForm from '@/components/hrm/JobForm'
import { fetchRecruitmentJobs, fetchApplicantsByJob, updateApplicantStatus } from '@/lib/hrmData'
import { LoadingSpinner } from '@/components/ui/CommonComponents'
import { handleCrudError } from '@/lib/apiError'

export default function RecruitmentPage() {
    const { showToast } = useToast()
    const { token } = useAuthStore()
    const queryClient = useQueryClient()

    const [selectedJobId, setSelectedJobId] = useState<string>('')
    const [isJobFormOpen, setIsJobFormOpen] = useState(false)

    const {
        data: jobs = [],
        isLoading: jobsLoading,
    } = useQuery<JobPosting[]>({
        queryKey: ['recruitment', 'jobs', token],
        queryFn: () => fetchRecruitmentJobs(token ?? undefined),
        enabled: !!token,
    })

    useEffect(() => {
        if (!jobsLoading && jobs.length > 0 && !selectedJobId) {
            setSelectedJobId(jobs[0].id)
        }
    }, [jobs, jobsLoading, selectedJobId])

    const normalizedApplicantsKey = ['recruitment', 'applicants', selectedJobId, token]

    const {
        data: applicants = [],
        isLoading: applicantsLoading,
        isFetching: applicantsFetching,
    } = useQuery<Applicant[]>({
        queryKey: normalizedApplicantsKey,
        queryFn: () => fetchApplicantsByJob(selectedJobId, token ?? undefined),
        enabled: !!token && !!selectedJobId,
    })

    const statusMutation = useMutation<void, unknown, { id: string, status: ApplicantStatus }, { previousData?: Applicant[] }>({
        mutationFn: async ({ id, status }) => {
            await updateApplicantStatus(id, status)
        },
        onMutate: async ({ id, status }) => {
            await queryClient.cancelQueries({ queryKey: normalizedApplicantsKey })
            const previousData = queryClient.getQueryData<Applicant[]>(normalizedApplicantsKey)
            if (previousData) {
                queryClient.setQueryData<Applicant[]>(normalizedApplicantsKey, prev =>
                    (prev || []).map(applicant =>
                        applicant.id === id ? { ...applicant, status } : applicant
                    )
                )
            }
            return { previousData }
        },
        onError: (error, _variables, context) => {
            if (context?.previousData) {
                queryClient.setQueryData(normalizedApplicantsKey, context.previousData)
            }
            handleCrudError({
                error,
                resourceLabel: 'Applicant',
                showToast,
                onUnauthorized: () => console.warn('Not authorized to update applicants'),
            })
        },
        onSuccess: () => {
            showToast('Applicant status updated', 'success')
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: normalizedApplicantsKey })
        }
    })

    const handleStatusChange = (applicantId: string, newStatus: ApplicantStatus) => {
        statusMutation.mutate({ id: applicantId, status: newStatus })
    }

    const jobOptions = useMemo(() => [
        { value: '', label: jobsLoading ? 'Loading...' : 'Select a Job Posting' },
        ...(Array.isArray(jobs) ? jobs : []).map(job => ({ value: job.id, label: job.title })),
    ], [jobs, jobsLoading])

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
                                <Button onClick={() => setIsJobFormOpen(true)}>
                                    Post Job
                                </Button>
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
                            queryClient.invalidateQueries({ queryKey: ['recruitment', 'jobs', token] })
                            setIsJobFormOpen(false)
                        }}
                    />
                </main>
            </div>
        </div>
    )
}
