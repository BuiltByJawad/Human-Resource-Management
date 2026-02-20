"use client"

import { useCallback } from "react"
import { useRouter } from "next/navigation"
import type { Shift, ShiftEmployee } from "@/services/shifts/types"
import { useShiftsPage } from "@/hooks/useShiftsPage"
import {
    CreateShiftModal,
    ShiftsCalendarGrid,
    ShiftsHeader,
    ShiftsWeekNavigator,
} from "@/components/features/shifts"

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
        <div className="p-4 md:p-6">
            <div className="max-w-7xl mx-auto">
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
