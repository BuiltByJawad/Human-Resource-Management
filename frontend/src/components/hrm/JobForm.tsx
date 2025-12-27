'use client'

import { Dialog } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { Button, Input, Select, TextArea } from '../ui/FormComponents'
import { useAuthStore } from '@/store/useAuthStore'
import { useToast } from '@/components/ui/ToastProvider'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useMutation, useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'
import { fetchDepartments } from '@/lib/hrmData'
import { handleCrudError } from '@/lib/apiError'
import { LoadingSpinner } from '../ui/CommonComponents'

interface JobFormProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
}

const jobSchema = yup.object().shape({
    title: yup.string().required('Job title is required'),
    departmentId: yup.string().required('Department is required'),
    description: yup.string().required('Description is required')
})

type JobFormData = yup.InferType<typeof jobSchema>

export default function JobForm({ isOpen, onClose, onSuccess }: JobFormProps) {
    const { token } = useAuthStore()
    const { showToast } = useToast()

    const { register, handleSubmit, control, reset, formState: { errors } } = useForm<JobFormData>({
        resolver: yupResolver(jobSchema),
        defaultValues: {
            title: '',
            departmentId: '',
            description: ''
        }
    })

    const { data: departments = [], isLoading: departmentsLoading } = useQuery({
        queryKey: ['departments', 'job-form', token, isOpen],
        queryFn: () => fetchDepartments(token ?? undefined),
        enabled: !!token && isOpen,
    })

    const createJob = useMutation({
        mutationFn: async (data: JobFormData) => {
            const response = await api.post('/recruitment/jobs', {
                ...data,
                status: 'open'
            })
            return response.data
        },
        onSuccess: () => {
            showToast('Job posting created successfully', 'success')
            onSuccess()
            onClose()
            reset()
        },
        onError: (error: any) => {
            handleCrudError({
                error,
                resourceLabel: 'Job posting',
                showToast,
                onUnauthorized: () => console.warn('Not authorized to create jobs'),
            })
        }
    })

    const onFormSubmit = (data: JobFormData) => {
        createJob.mutate(data)
    }

    const departmentOptions = Array.isArray(departments)
        ? departments.map(dept => ({ value: dept.id, label: dept.name }))
        : []

    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
            <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

            <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="mx-auto max-w-md w-full rounded-xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-4">
                        <Dialog.Title className="text-lg font-bold text-gray-900">Post New Job</Dialog.Title>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 pb-32">
                        <Input
                            label="Job Title"
                            placeholder="e.g. Senior Frontend Engineer"
                            required
                            error={errors.title?.message}
                            {...register('title')}
                        />

                        <Controller
                            control={control}
                            name="departmentId"
                            render={({ field }) => (
                                departmentsLoading ? (
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <LoadingSpinner size="sm" />
                                        <span>Loading departments...</span>
                                    </div>
                                ) : (
                                    <Select
                                        label="Department"
                                        value={field.value}
                                        onChange={field.onChange}
                                        options={[
                                            { value: '', label: 'Select Department' },
                                            ...departmentOptions
                                        ]}
                                        required
                                        error={errors.departmentId?.message}
                                    />
                                )
                            )}
                        />

                        <TextArea
                            label="Description"
                            placeholder="Job description and requirements..."
                            rows={4}
                            required
                            error={errors.description?.message}
                            {...register('description')}
                        />

                        <div className="flex justify-end space-x-3 mt-6">
                            <Button variant="secondary" onClick={onClose} type="button">
                                Cancel
                            </Button>
                            <Button type="submit" loading={createJob.isPending}>
                                Create Job
                            </Button>
                        </div>
                    </form>
                </Dialog.Panel>
            </div>
        </Dialog>
    )
}
