'use client'

import { useState, useEffect } from 'react'
import { Dialog } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { Button, Input, Select, TextArea } from '../ui/FormComponents'
import axios from 'axios'
import { useAuthStore } from '@/store/useAuthStore'
import { useToast } from '@/components/ui/ToastProvider'

interface Department {
    id: string
    name: string
}

interface JobFormProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

export default function JobForm({ isOpen, onClose, onSuccess }: JobFormProps) {
    const [title, setTitle] = useState('')
    const [departmentId, setDepartmentId] = useState('')
    const [description, setDescription] = useState('')
    const [departments, setDepartments] = useState<Department[]>([])
    const [loading, setLoading] = useState(false)
    const { token } = useAuthStore()
    const { showToast } = useToast()

    useEffect(() => {
        if (isOpen && token) {
            fetchDepartments()
        }
    }, [isOpen, token])

    const fetchDepartments = async () => {
        try {
            const res = await axios.get(`${API_URL}/departments`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.data.success) {
                setDepartments(res.data.data)
            }
        } catch (error) {
            console.error('Failed to fetch departments', error)
            // showToast('Failed to load departments', 'error')
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!title || !departmentId) {
            showToast('Please fill in all required fields', 'error')
            return
        }

        setLoading(true)
        try {
            const res = await axios.post(`${API_URL}/recruitment/jobs`, {
                title,
                departmentId,
                description,
                status: 'open'
            }, {
                headers: { Authorization: `Bearer ${token}` }
            })

            if (res.data.success) {
                showToast('Job posting created successfully', 'success')
                onSuccess()
                onClose()
                // Reset form
                setTitle('')
                setDepartmentId('')
                setDescription('')
            }
        } catch (error) {
            console.error('Failed to create job', error)
            showToast('Failed to create job posting', 'error')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
            <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

            <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="mx-auto max-w-md w-full rounded-xl bg-white p-6 shadow-xl min-h-[500px]">
                    <div className="flex justify-between items-center mb-4">
                        <Dialog.Title className="text-lg font-bold text-gray-900">Post New Job</Dialog.Title>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4 pb-32">
                        <Input
                            label="Job Title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Senior Frontend Engineer"
                            required
                        />

                        <Select
                            label="Department"
                            value={departmentId}
                            onChange={(value) => setDepartmentId(value)}
                            options={[
                                { value: '', label: 'Select Department' },
                                ...departments.map(dept => ({ value: dept.id, label: dept.name }))
                            ]}
                            required
                        />

                        <TextArea
                            label="Description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Job description and requirements..."
                            rows={4}
                        />

                        <div className="flex justify-end space-x-3 mt-6">
                            <Button variant="secondary" onClick={onClose} type="button">
                                Cancel
                            </Button>
                            <Button type="submit" loading={loading}>
                                Create Job
                            </Button>
                        </div>
                    </form>
                </Dialog.Panel>
            </div>
        </Dialog>
    )
}
