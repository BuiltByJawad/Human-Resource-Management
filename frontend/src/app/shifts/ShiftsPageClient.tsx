"use client"

import { useState, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
    PlusIcon,
    CalendarDaysIcon,
    ArrowLeftIcon,
    ArrowPathIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ClockIcon,
    MapPinIcon,
} from "@heroicons/react/24/outline"
import { shiftService, type Shift } from "@/services/shiftService"
import { useToast } from "@/components/ui/ToastProvider"
import { Modal } from "@/components/ui/Modal"
import { Input } from "@/components/ui/FormComponents"

interface ShiftsPageClientProps {
    initialShifts: Shift[]
    employees: { id: string; firstName: string; lastName: string }[]
}

const shiftTypeColors: Record<string, string> = {
    Regular: "bg-blue-100 text-blue-800 border-blue-200",
    Overtime: "bg-orange-100 text-orange-800 border-orange-200",
    OnCall: "bg-purple-100 text-purple-800 border-purple-200",
}

const statusColors: Record<string, string> = {
    scheduled: "bg-yellow-100 text-yellow-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
}

export function ShiftsPageClient({ initialShifts, employees }: ShiftsPageClientProps) {
    const router = useRouter()
    const { showToast } = useToast()

    const [shifts, setShifts] = useState<Shift[]>(initialShifts)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [currentWeekStart, setCurrentWeekStart] = useState(() => {
        const now = new Date()
        const dayOfWeek = now.getDay()
        const start = new Date(now)
        start.setDate(now.getDate() - dayOfWeek)
        start.setHours(0, 0, 0, 0)
        return start
    })

    const [shiftForm, setShiftForm] = useState({
        employeeId: "",
        startTime: "",
        endTime: "",
        type: "Regular",
        location: "",
    })

    const weekDays = useMemo(() => {
        const days: Date[] = []
        for (let i = 0; i < 7; i++) {
            const day = new Date(currentWeekStart)
            day.setDate(currentWeekStart.getDate() + i)
            days.push(day)
        }
        return days
    }, [currentWeekStart])

    const shiftsByDay = useMemo(() => {
        const grouped: Record<string, Shift[]> = {}
        weekDays.forEach((day) => {
            const dateKey = day.toISOString().split("T")[0]
            grouped[dateKey] = []
        })

        shifts.forEach((shift) => {
            const shiftDate = new Date(shift.startTime).toISOString().split("T")[0]
            if (grouped[shiftDate]) {
                grouped[shiftDate].push(shift)
            }
        })

        return grouped
    }, [shifts, weekDays])

    const navigateWeek = (direction: "prev" | "next") => {
        setCurrentWeekStart((prev) => {
            const newStart = new Date(prev)
            newStart.setDate(prev.getDate() + (direction === "next" ? 7 : -7))
            return newStart
        })
    }

    const refreshShifts = useCallback(async () => {
        const endOfWeek = new Date(currentWeekStart)
        endOfWeek.setDate(currentWeekStart.getDate() + 6)
        endOfWeek.setHours(23, 59, 59, 999)

        try {
            const data = await shiftService.getShifts(
                currentWeekStart.toISOString(),
                endOfWeek.toISOString()
            )
            setShifts(data)
        } catch {
            showToast("Failed to refresh shifts", "error")
        }
    }, [currentWeekStart, showToast])

    const handleCreateShift = useCallback(async () => {
        if (!shiftForm.employeeId || !shiftForm.startTime || !shiftForm.endTime) {
            showToast("Please fill in all required fields", "error")
            return
        }

        setIsSubmitting(true)
        try {
            await shiftService.scheduleShift({
                employeeId: shiftForm.employeeId,
                startTime: new Date(shiftForm.startTime).toISOString(),
                endTime: new Date(shiftForm.endTime).toISOString(),
                type: shiftForm.type,
                location: shiftForm.location || undefined,
            })

            showToast("Shift scheduled successfully", "success")
            setShowCreateModal(false)
            setShiftForm({ employeeId: "", startTime: "", endTime: "", type: "Regular", location: "" })
            refreshShifts()
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Failed to schedule shift"
            showToast(message, "error")
        } finally {
            setIsSubmitting(false)
        }
    }, [shiftForm, showToast, refreshShifts])

    const formatTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        })
    }

    const formatDateHeader = (date: Date) => {
        return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
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
                        <h1 className="text-2xl font-bold text-gray-900">Shift Scheduling</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Manage employee shifts and schedules
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={refreshShifts}
                            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <ArrowPathIcon className="h-4 w-4" />
                            Refresh
                        </button>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                        >
                            <PlusIcon className="h-5 w-5" />
                            Schedule Shift
                        </button>
                    </div>
                </div>

                {/* Week Navigation */}
                <div className="flex items-center justify-between mb-6 bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
                    <button
                        onClick={() => navigateWeek("prev")}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
                    </button>
                    <div className="text-center">
                        <h2 className="text-lg font-semibold text-gray-900">
                            {weekDays[0].toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                        </h2>
                        <p className="text-sm text-gray-500">
                            {formatDateHeader(weekDays[0])} - {formatDateHeader(weekDays[6])}
                        </p>
                    </div>
                    <button
                        onClick={() => navigateWeek("next")}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <ChevronRightIcon className="h-5 w-5 text-gray-600" />
                    </button>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-2">
                    {weekDays.map((day) => {
                        const dateKey = day.toISOString().split("T")[0]
                        const dayShifts = shiftsByDay[dateKey] || []
                        const isToday = new Date().toDateString() === day.toDateString()

                        return (
                            <div
                                key={dateKey}
                                className={`bg-white rounded-xl border shadow-sm min-h-[200px] ${isToday ? "border-blue-300 ring-2 ring-blue-100" : "border-gray-100"
                                    }`}
                            >
                                <div
                                    className={`px-3 py-2 border-b ${isToday ? "bg-blue-50 border-blue-100" : "bg-gray-50 border-gray-100"
                                        }`}
                                >
                                    <p className="text-xs font-medium text-gray-500">
                                        {day.toLocaleDateString("en-US", { weekday: "short" })}
                                    </p>
                                    <p className={`text-lg font-bold ${isToday ? "text-blue-600" : "text-gray-900"}`}>
                                        {day.getDate()}
                                    </p>
                                </div>
                                <div className="p-2 space-y-2">
                                    {dayShifts.length === 0 ? (
                                        <p className="text-xs text-gray-400 text-center py-4">No shifts</p>
                                    ) : (
                                        dayShifts.map((shift) => (
                                            <div
                                                key={shift.id}
                                                className={`p-2 rounded-lg border text-xs ${shiftTypeColors[shift.type] || "bg-gray-100 text-gray-800 border-gray-200"
                                                    }`}
                                            >
                                                <p className="font-semibold truncate">
                                                    {shift.employee?.firstName} {shift.employee?.lastName}
                                                </p>
                                                <div className="flex items-center gap-1 mt-1 text-xs opacity-80">
                                                    <ClockIcon className="h-3 w-3" />
                                                    {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                                                </div>
                                                {shift.location && (
                                                    <div className="flex items-center gap-1 mt-0.5 text-xs opacity-80">
                                                        <MapPinIcon className="h-3 w-3" />
                                                        {shift.location}
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Create Shift Modal */}
                <Modal
                    isOpen={showCreateModal}
                    onClose={() => {
                        setShowCreateModal(false)
                        setShiftForm({ employeeId: "", startTime: "", endTime: "", type: "Regular", location: "" })
                    }}
                    title="Schedule New Shift"
                >
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Employee <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={shiftForm.employeeId}
                                onChange={(e) => setShiftForm({ ...shiftForm, employeeId: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Select employee...</option>
                                {employees.map((emp) => (
                                    <option key={emp.id} value={emp.id}>
                                        {emp.firstName} {emp.lastName}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Start Time"
                                type="datetime-local"
                                required
                                value={shiftForm.startTime}
                                onChange={(e) => setShiftForm({ ...shiftForm, startTime: e.target.value })}
                            />
                            <Input
                                label="End Time"
                                type="datetime-local"
                                required
                                value={shiftForm.endTime}
                                onChange={(e) => setShiftForm({ ...shiftForm, endTime: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Shift Type</label>
                            <select
                                value={shiftForm.type}
                                onChange={(e) => setShiftForm({ ...shiftForm, type: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="Regular">Regular</option>
                                <option value="Overtime">Overtime</option>
                                <option value="OnCall">On Call</option>
                            </select>
                        </div>
                        <Input
                            label="Location"
                            value={shiftForm.location}
                            onChange={(e) => setShiftForm({ ...shiftForm, location: e.target.value })}
                            placeholder="e.g., Office, Remote, Site A"
                        />
                        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
                            <button
                                type="button"
                                onClick={handleCreateShift}
                                disabled={isSubmitting}
                                className="inline-flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto sm:text-sm disabled:opacity-50"
                            >
                                {isSubmitting ? "Scheduling..." : "Schedule Shift"}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowCreateModal(false)
                                    setShiftForm({ employeeId: "", startTime: "", endTime: "", type: "Regular", location: "" })
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
