'use client'

import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { KanbanBoard, Applicant, JobPosting, ApplicantStatus } from '@/components/hrm/RecruitmentComponents'
import { Button, Select } from '@/components/ui/FormComponents'
import { useToast } from '@/components/ui/ToastProvider'
import { useAuthStore } from '@/store/useAuthStore'
import Sidebar from '@/components/ui/Sidebar'
import Header from '@/components/ui/Header'
import JobForm from '@/components/hrm/JobForm'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

export default function RecruitmentPage() {
    const [applicants, setApplicants] = useState<Applicant[]>([])
    const [jobs, setJobs] = useState<JobPosting[]>([])
    const [selectedJobId, setSelectedJobId] = useState<string>('')
    const [loading, setLoading] = useState(true)
    const [isJobFormOpen, setIsJobFormOpen] = useState(false)
    const { showToast } = useToast()
    const { token } = useAuthStore()

    const fetchJobs = useCallback(async () => {
        try {
            const res = await axios.get(`${API_URL}/recruitment/jobs`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.data.success) {
                setJobs(res.data.data)
                if (res.data.data.length > 0 && !selectedJobId) {
                    setSelectedJobId(res.data.data[0].id)
                }
            }
        } catch (error) {
            console.error('Failed to fetch jobs', error)
            // showToast('Failed to fetch job postings', 'error')
        }
    }, [token, selectedJobId])

    const fetchApplicants = useCallback(async (jobId: string) => {
        setLoading(true)
        try {
            const res = await axios.get(`${API_URL}/recruitment/applicants?jobId=${jobId}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.data.success) {
                setApplicants(res.data.data)
            }
        } catch (error) {
            console.error('Failed to fetch applicants', error)
            // showToast('Failed to fetch applicants', 'error')
        } finally {
            setLoading(false)
        }
    }, [token])

    useEffect(() => {
        if (token) {
            fetchJobs()
        }
    }, [token, fetchJobs])

    useEffect(() => {
        if (selectedJobId && token) {
            fetchApplicants(selectedJobId)
        } else {
            setApplicants([])
            setLoading(false)
        }
    }, [selectedJobId, token, fetchApplicants])

    const handleStatusChange = async (applicantId: string, newStatus: ApplicantStatus) => {
        const previousApplicants = [...applicants]
        setApplicants(prev => prev.map(a =>
            a.id === applicantId ? { ...a, status: newStatus } : a
        ))

        try {
            await axios.patch(`${API_URL}/recruitment/applicants/${applicantId}/status`,
                { status: newStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            )
            showToast('Applicant status updated', 'success')
        } catch (error) {
            console.error('Failed to update status', error)
            showToast('Failed to update status', 'error')
            setApplicants(previousApplicants)
        }
    }

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
                                        options={[
                                            { value: '', label: 'Select a Job Posting' },
                                            ...jobs.map(job => ({ value: job.id, label: job.title }))
                                        ]}
                                    />
                                </div>
                                <Button onClick={() => setIsJobFormOpen(true)}>
                                    Post Job
                                </Button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-hidden bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                            {loading ? (
                                <div className="flex justify-center items-center h-full">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
                            fetchJobs()
                            setIsJobFormOpen(false)
                        }}
                    />
                </main>
            </div>
        </div>
    )
}
