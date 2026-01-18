"use client"

import { useCallback } from "react"
import { useRouter } from "next/navigation"
import type { Shift, ShiftEmployee } from "@/services/shifts/types"
import { useShiftsPage } from "@/hooks/useShiftsPage"
import { ShiftsHeader } from "@/components/features/shifts/ShiftsHeader"
import { ShiftsWeekNavigator } from "@/components/features/shifts/ShiftsWeekNavigator"
import { ShiftsCalendarGrid } from "@/components/features/shifts/ShiftsCalendarGrid"
import { CreateShiftModal } from "@/components/features/shifts/CreateShiftModal"

interface ShiftsPageClientProps {
    initialShifts: Shift[]
    employees: ShiftEmployee[]
}

export function ShiftsPageClient({ initialShifts, employees }: ShiftsPageClientProps) {
    const router = useRouter()
    const {
        employees: shiftEmployees,
        shiftForm,
        shiftTypeColors,
        weekDays,
        shiftsByDay,
        showCreateModal,
        isSubmitting,
        formatTime,
        formatDateHeader,
        navigateWeek,
        refreshShifts,
        setShiftForm,
        setShowCreateModal,
        resetShiftForm,
        handleCreateShift,
    } = useShiftsPage({ initialShifts, employees })

    const handleCloseModal = useCallback(() => {
        setShowCreateModal(false)
        resetShiftForm()
    }, [resetShiftForm, setShowCreateModal])

    return (
        <div className="min-h-screen bg-gray-50/50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                <ShiftsHeader
                    onBack={() => router.back()}
                    onRefresh={refreshShifts}
                    onCreate={() => setShowCreateModal(true)}
                />

                <ShiftsWeekNavigator
                    title={weekDays[0].toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                    subtitle={`${formatDateHeader(weekDays[0])} - ${formatDateHeader(weekDays[6])}`}
                    onPrev={() => navigateWeek("prev")}
                    onNext={() => navigateWeek("next")}
                />

                <ShiftsCalendarGrid
                    weekDays={weekDays}
                    shiftsByDay={shiftsByDay}
                    shiftTypeColors={shiftTypeColors}
                    formatTime={formatTime}
                />

                <CreateShiftModal
                    isOpen={showCreateModal}
                    onClose={handleCloseModal}
                    shiftForm={shiftForm}
                    onChange={setShiftForm}
                    onSubmit={handleCreateShift}
                    isSubmitting={isSubmitting}
                    employees={shiftEmployees}
                />
            </div>
        </div>
    )
}
