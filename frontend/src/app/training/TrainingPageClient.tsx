"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
    PlusIcon,
    AcademicCapIcon,
    UserPlusIcon,
    ArrowLeftIcon,
    PlayIcon,
    CheckCircleIcon,
    ClockIcon,
} from "@heroicons/react/24/outline"
import { useAuth } from "@/features/auth"
import { createCourse, assignCourse, type TrainingCourse, type EmployeeTraining } from "@/features/training"
import { useToast } from "@/components/ui/ToastProvider"
import { Modal } from "@/components/ui/Modal"
import { Input, TextArea } from "@/components/ui/FormComponents"

interface TrainingPageClientProps {
    initialCourses: TrainingCourse[]
    employees: { id: string; firstName: string; lastName: string }[]
}

const statusColors: Record<string, string> = {
    assigned: "bg-yellow-100 text-yellow-800",
    "in-progress": "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
}

const statusIcons: Record<string, React.ElementType> = {
    assigned: ClockIcon,
    "in-progress": PlayIcon,
    completed: CheckCircleIcon,
}

export function TrainingPageClient({ initialCourses, employees }: TrainingPageClientProps) {
    const router = useRouter()
    const { showToast } = useToast()
    const { token } = useAuth()

    const [courses, setCourses] = useState<TrainingCourse[]>(initialCourses)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [showAssignModal, setShowAssignModal] = useState(false)
    const [selectedCourse, setSelectedCourse] = useState<TrainingCourse | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Form state for creating course
    const [courseForm, setCourseForm] = useState({
        title: "",
        description: "",
        contentUrl: "",
        duration: "",
    })

    // Form state for assigning course
    const [assignForm, setAssignForm] = useState({
        employeeId: "",
    })

    const handleCreateCourse = useCallback(async () => {
        if (!courseForm.title.trim()) {
            showToast("Course title is required", "error")
            return
        }

        setIsSubmitting(true)
        try {
            const newCourse = await createCourse({
                title: courseForm.title,
                description: courseForm.description || undefined,
                contentUrl: courseForm.contentUrl || undefined,
                duration: courseForm.duration ? parseInt(courseForm.duration, 10) : undefined,
            }, token ?? undefined)

            setCourses((prev) => [...prev, newCourse])
            showToast("Course created successfully", "success")
            setShowCreateModal(false)
            setCourseForm({ title: "", description: "", contentUrl: "", duration: "" })
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Failed to create course"
            showToast(message, "error")
        } finally {
            setIsSubmitting(false)
        }
    }, [courseForm, showToast])

    const handleAssignCourse = useCallback(async () => {
        if (!selectedCourse || !assignForm.employeeId) {
            showToast("Please select an employee", "error")
            return
        }

        setIsSubmitting(true)
        try {
            await assignCourse(assignForm.employeeId, selectedCourse.id, token ?? undefined)
            showToast("Course assigned successfully", "success")
            setShowAssignModal(false)
            setAssignForm({ employeeId: "" })
            setSelectedCourse(null)
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Failed to assign course"
            showToast(message, "error")
        } finally {
            setIsSubmitting(false)
        }
    }, [selectedCourse, assignForm, showToast])

    const openAssignModal = (course: TrainingCourse) => {
        setSelectedCourse(course)
        setShowAssignModal(true)
    }

    return (
        <div className="min-h-screen bg-gray-50/50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={() => router.back()}
                        className="inline-flex items-center justify-center p-2 rounded-full hover:bg-gray-200 transition-colors text-gray-500 hover:text-gray-900"
                        aria-label="Go back"
                    >
                        <ArrowLeftIcon className="h-6 w-6" />
                    </button>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Training Management</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Create and manage training courses for your organization
                        </p>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        <PlusIcon className="h-5 w-5" />
                        Create Course
                    </button>
                </div>

                {/* Courses Grid */}
                {courses.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-xl border border-gray-100 shadow-sm">
                        <AcademicCapIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-lg font-medium text-gray-900">No training courses</h3>
                        <p className="mt-2 text-sm text-gray-500">
                            Get started by creating your first training course.
                        </p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <PlusIcon className="h-5 w-5" />
                            Create Course
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {courses.map((course) => (
                            <div
                                key={course.id}
                                className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-6"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                                            {course.title}
                                        </h3>
                                        {course.description && (
                                            <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                                                {course.description}
                                            </p>
                                        )}
                                    </div>
                                    <div className="ml-4 flex-shrink-0">
                                        <AcademicCapIcon className="h-8 w-8 text-blue-500" />
                                    </div>
                                </div>

                                <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
                                    {course.duration && (
                                        <span className="flex items-center gap-1">
                                            <ClockIcon className="h-4 w-4" />
                                            {course.duration} min
                                        </span>
                                    )}
                                    {course.contentUrl && (
                                        <a
                                            href={course.contentUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:underline"
                                        >
                                            View Content
                                        </a>
                                    )}
                                </div>

                                <div className="mt-4 pt-4 border-t border-gray-100">
                                    <button
                                        onClick={() => openAssignModal(course)}
                                        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                                    >
                                        <UserPlusIcon className="h-4 w-4" />
                                        Assign to Employee
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Create Course Modal */}
                <Modal
                    isOpen={showCreateModal}
                    onClose={() => {
                        setShowCreateModal(false)
                        setCourseForm({ title: "", description: "", contentUrl: "", duration: "" })
                    }}
                    title="Create Training Course"
                >
                    <div className="space-y-4">
                        <Input
                            label="Course Title"
                            required
                            value={courseForm.title}
                            onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                            placeholder="e.g., Safety Compliance Training"
                        />
                        <TextArea
                            label="Description"
                            value={courseForm.description}
                            onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                            placeholder="Brief description of the course content..."
                            rows={3}
                        />
                        <Input
                            label="Content URL"
                            value={courseForm.contentUrl}
                            onChange={(e) => setCourseForm({ ...courseForm, contentUrl: e.target.value })}
                            placeholder="https://youtube.com/watch?v=... or PDF link"
                        />
                        <Input
                            label="Duration (minutes)"
                            type="number"
                            value={courseForm.duration}
                            onChange={(e) => setCourseForm({ ...courseForm, duration: e.target.value })}
                            placeholder="e.g., 60"
                        />
                        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
                            <button
                                type="button"
                                onClick={handleCreateCourse}
                                disabled={isSubmitting}
                                className="inline-flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto sm:text-sm disabled:opacity-50"
                            >
                                {isSubmitting ? "Creating..." : "Create Course"}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowCreateModal(false)
                                    setCourseForm({ title: "", description: "", contentUrl: "", duration: "" })
                                }}
                                className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </Modal>

                {/* Assign Course Modal */}
                <Modal
                    isOpen={showAssignModal}
                    onClose={() => {
                        setShowAssignModal(false)
                        setAssignForm({ employeeId: "" })
                        setSelectedCourse(null)
                    }}
                    title={`Assign: ${selectedCourse?.title || "Course"}`}
                >
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Select Employee <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={assignForm.employeeId}
                                onChange={(e) => setAssignForm({ employeeId: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Choose an employee...</option>
                                {employees.map((emp) => (
                                    <option key={emp.id} value={emp.id}>
                                        {emp.firstName} {emp.lastName}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
                            <button
                                type="button"
                                onClick={handleAssignCourse}
                                disabled={isSubmitting || !assignForm.employeeId}
                                className="inline-flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto sm:text-sm disabled:opacity-50"
                            >
                                {isSubmitting ? "Assigning..." : "Assign Course"}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowAssignModal(false)
                                    setAssignForm({ employeeId: "" })
                                    setSelectedCourse(null)
                                }}
                                className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </Modal>
            </div>
        </div>
    )
}
