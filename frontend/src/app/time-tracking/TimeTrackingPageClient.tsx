"use client"

import { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
    PlusIcon,
    ClockIcon,
    ArrowLeftIcon,
    FolderIcon,
    CalendarIcon,
    UserIcon,
} from "@heroicons/react/24/outline"
import { timeTrackingService, type Project, type TimeEntry } from "@/services/timeTrackingService"
import { useToast } from "@/components/ui/ToastProvider"
import { Modal } from "@/components/ui/Modal"
import { Input, TextArea } from "@/components/ui/FormComponents"

interface TimeTrackingPageClientProps {
    initialProjects: Project[]
    employees: { id: string; firstName: string; lastName: string }[]
}

const statusColors: Record<string, string> = {
    active: "bg-green-100 text-green-800",
    completed: "bg-blue-100 text-blue-800",
    archived: "bg-gray-100 text-gray-800",
    pending: "bg-yellow-100 text-yellow-800",
    approved: "bg-green-100 text-green-800",
}

export function TimeTrackingPageClient({ initialProjects, employees }: TimeTrackingPageClientProps) {
    const router = useRouter()
    const { showToast } = useToast()

    const [projects, setProjects] = useState<Project[]>(initialProjects)
    const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
    const [selectedEmployee, setSelectedEmployee] = useState<string>("")
    const [showCreateProjectModal, setShowCreateProjectModal] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isLoadingTimesheet, setIsLoadingTimesheet] = useState(false)
    const [activeTab, setActiveTab] = useState<"projects" | "timesheet">("projects")

    const [projectForm, setProjectForm] = useState({
        name: "",
        description: "",
        client: "",
        startDate: "",
        endDate: "",
    })

    const loadTimesheet = useCallback(async (employeeId: string) => {
        if (!employeeId) {
            setTimeEntries([])
            return
        }

        setIsLoadingTimesheet(true)
        try {
            const entries = await timeTrackingService.getTimesheet(employeeId)
            setTimeEntries(entries)
        } catch {
            showToast("Failed to load timesheet", "error")
        } finally {
            setIsLoadingTimesheet(false)
        }
    }, [showToast])

    useEffect(() => {
        if (selectedEmployee) {
            loadTimesheet(selectedEmployee)
        }
    }, [selectedEmployee, loadTimesheet])

    const handleCreateProject = useCallback(async () => {
        if (!projectForm.name.trim() || !projectForm.startDate) {
            showToast("Project name and start date are required", "error")
            return
        }

        setIsSubmitting(true)
        try {
            const result = await timeTrackingService.createProject({
                name: projectForm.name,
                description: projectForm.description || undefined,
                client: projectForm.client || undefined,
                startDate: new Date(projectForm.startDate).toISOString(),
                endDate: projectForm.endDate ? new Date(projectForm.endDate).toISOString() : undefined,
            })

            if (result?.data) {
                setProjects((prev) => [...prev, result.data])
                showToast("Project created successfully", "success")
                setShowCreateProjectModal(false)
                setProjectForm({ name: "", description: "", client: "", startDate: "", endDate: "" })
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Failed to create project"
            showToast(message, "error")
        } finally {
            setIsSubmitting(false)
        }
    }, [projectForm, showToast])

    const formatDuration = (minutes?: number) => {
        if (!minutes) return "-"
        const hours = Math.floor(minutes / 60)
        const mins = minutes % 60
        return `${hours}h ${mins}m`
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        })
    }

    const formatTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        })
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
                        <h1 className="text-2xl font-bold text-gray-900">Time Tracking</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Manage projects and view employee timesheets
                        </p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab("projects")}
                        className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${activeTab === "projects"
                                ? "border-blue-600 text-blue-600"
                                : "border-transparent text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        <FolderIcon className="h-4 w-4 inline mr-2" />
                        Projects
                    </button>
                    <button
                        onClick={() => setActiveTab("timesheet")}
                        className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${activeTab === "timesheet"
                                ? "border-blue-600 text-blue-600"
                                : "border-transparent text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        <CalendarIcon className="h-4 w-4 inline mr-2" />
                        Timesheets
                    </button>
                </div>

                {/* Projects Tab */}
                {activeTab === "projects" && (
                    <div>
                        <div className="flex justify-end mb-4">
                            <button
                                onClick={() => setShowCreateProjectModal(true)}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                            >
                                <PlusIcon className="h-5 w-5" />
                                New Project
                            </button>
                        </div>

                        {projects.length === 0 ? (
                            <div className="text-center py-16 bg-white rounded-xl border border-gray-100 shadow-sm">
                                <FolderIcon className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-4 text-lg font-medium text-gray-900">No projects</h3>
                                <p className="mt-2 text-sm text-gray-500">
                                    Create a project to start tracking time.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {projects.map((project) => (
                                    <div
                                        key={project.id}
                                        className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-6"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-lg font-semibold text-gray-900 truncate">
                                                    {project.name}
                                                </h3>
                                                {project.client && (
                                                    <p className="text-sm text-gray-500">{project.client}</p>
                                                )}
                                            </div>
                                            <span
                                                className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[project.status] || "bg-gray-100 text-gray-800"
                                                    }`}
                                            >
                                                {project.status}
                                            </span>
                                        </div>
                                        {project.description && (
                                            <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                                                {project.description}
                                            </p>
                                        )}
                                        <div className="mt-4 text-xs text-gray-500">
                                            Started: {formatDate(project.startDate)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Timesheet Tab */}
                {activeTab === "timesheet" && (
                    <div>
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6">
                            <div className="flex items-center gap-4">
                                <UserIcon className="h-5 w-5 text-gray-400" />
                                <select
                                    value={selectedEmployee}
                                    onChange={(e) => setSelectedEmployee(e.target.value)}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">Select an employee to view timesheet...</option>
                                    {employees.map((emp) => (
                                        <option key={emp.id} value={emp.id}>
                                            {emp.firstName} {emp.lastName}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {!selectedEmployee ? (
                            <div className="text-center py-16 bg-white rounded-xl border border-gray-100 shadow-sm">
                                <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-4 text-lg font-medium text-gray-900">Select an employee</h3>
                                <p className="mt-2 text-sm text-gray-500">
                                    Choose an employee above to view their timesheet.
                                </p>
                            </div>
                        ) : isLoadingTimesheet ? (
                            <div className="text-center py-16 bg-white rounded-xl border border-gray-100 shadow-sm">
                                <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto" />
                                <p className="mt-4 text-sm text-gray-500">Loading timesheet...</p>
                            </div>
                        ) : timeEntries.length === 0 ? (
                            <div className="text-center py-16 bg-white rounded-xl border border-gray-100 shadow-sm">
                                <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-4 text-lg font-medium text-gray-900">No time entries</h3>
                                <p className="mt-2 text-sm text-gray-500">
                                    This employee has no time entries yet.
                                </p>
                            </div>
                        ) : (
                            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Date
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Project
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Time
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Duration
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {timeEntries.map((entry) => (
                                            <tr key={entry.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {formatDate(entry.date)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    {entry.project?.name || "-"}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    {formatTime(entry.startTime)}
                                                    {entry.endTime && ` - ${formatTime(entry.endTime)}`}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    {formatDuration(entry.duration)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span
                                                        className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[entry.status] || "bg-gray-100 text-gray-800"
                                                            }`}
                                                    >
                                                        {entry.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* Create Project Modal */}
                <Modal
                    isOpen={showCreateProjectModal}
                    onClose={() => {
                        setShowCreateProjectModal(false)
                        setProjectForm({ name: "", description: "", client: "", startDate: "", endDate: "" })
                    }}
                    title="Create New Project"
                >
                    <div className="space-y-4">
                        <Input
                            label="Project Name"
                            required
                            value={projectForm.name}
                            onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                            placeholder="e.g., Website Redesign"
                        />
                        <TextArea
                            label="Description"
                            value={projectForm.description}
                            onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                            placeholder="Brief description of the project..."
                            rows={3}
                        />
                        <Input
                            label="Client"
                            value={projectForm.client}
                            onChange={(e) => setProjectForm({ ...projectForm, client: e.target.value })}
                            placeholder="e.g., Acme Corp"
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Start Date"
                                type="date"
                                required
                                value={projectForm.startDate}
                                onChange={(e) => setProjectForm({ ...projectForm, startDate: e.target.value })}
                            />
                            <Input
                                label="End Date"
                                type="date"
                                value={projectForm.endDate}
                                onChange={(e) => setProjectForm({ ...projectForm, endDate: e.target.value })}
                            />
                        </div>
                        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
                            <button
                                type="button"
                                onClick={handleCreateProject}
                                disabled={isSubmitting}
                                className="inline-flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto sm:text-sm disabled:opacity-50"
                            >
                                {isSubmitting ? "Creating..." : "Create Project"}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowCreateProjectModal(false)
                                    setProjectForm({ name: "", description: "", client: "", startDate: "", endDate: "" })
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
