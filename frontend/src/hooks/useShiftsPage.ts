'use client'

import { useCallback, useMemo, useState } from 'react'

import { fetchShifts, createShift } from '@/services/shifts/api'
import type { Shift, ShiftEmployee, ShiftFormState, ShiftType } from '@/services/shifts/types'
import { useToast } from '@/components/ui/ToastProvider'

const DEFAULT_SHIFT_FORM: ShiftFormState = {
  employeeId: '',
  startTime: '',
  endTime: '',
  type: 'Regular',
  location: '',
}

const shiftTypeColors: Record<ShiftType, string> = {
  Regular: 'bg-blue-100 text-blue-800 border-blue-200',
  Overtime: 'bg-orange-100 text-orange-800 border-orange-200',
  OnCall: 'bg-purple-100 text-purple-800 border-purple-200',
}

interface UseShiftsPageOptions {
  initialShifts: Shift[]
  employees: ShiftEmployee[]
}

export const useShiftsPage = ({ initialShifts, employees }: UseShiftsPageOptions) => {
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
  const [shiftForm, setShiftForm] = useState<ShiftFormState>(DEFAULT_SHIFT_FORM)

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
      const dateKey = day.toISOString().split('T')[0]
      grouped[dateKey] = []
    })

    shifts.forEach((shift) => {
      const shiftDate = new Date(shift.startTime).toISOString().split('T')[0]
      if (grouped[shiftDate]) {
        grouped[shiftDate].push(shift)
      }
    })

    return grouped
  }, [shifts, weekDays])

  const navigateWeek = useCallback((direction: 'prev' | 'next') => {
    setCurrentWeekStart((prev) => {
      const newStart = new Date(prev)
      newStart.setDate(prev.getDate() + (direction === 'next' ? 7 : -7))
      return newStart
    })
  }, [])

  const refreshShifts = useCallback(async () => {
    const endOfWeek = new Date(currentWeekStart)
    endOfWeek.setDate(currentWeekStart.getDate() + 6)
    endOfWeek.setHours(23, 59, 59, 999)

    try {
      const data = await fetchShifts(currentWeekStart.toISOString(), endOfWeek.toISOString())
      setShifts(data)
    } catch {
      showToast('Failed to refresh shifts', 'error')
    }
  }, [currentWeekStart, showToast])

  const handleCreateShift = useCallback(async () => {
    if (!shiftForm.employeeId || !shiftForm.startTime || !shiftForm.endTime) {
      showToast('Please fill in all required fields', 'error')
      return
    }

    setIsSubmitting(true)
    try {
      await createShift(shiftForm)
      showToast('Shift scheduled successfully', 'success')
      setShowCreateModal(false)
      setShiftForm(DEFAULT_SHIFT_FORM)
      await refreshShifts()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to schedule shift'
      showToast(message, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }, [refreshShifts, shiftForm, showToast])

  const formatTime = useCallback((dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }, [])

  const formatDateHeader = useCallback((date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }, [])

  const resetShiftForm = useCallback(() => setShiftForm(DEFAULT_SHIFT_FORM), [])

  return {
    employees,
    shifts,
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
  }
}
