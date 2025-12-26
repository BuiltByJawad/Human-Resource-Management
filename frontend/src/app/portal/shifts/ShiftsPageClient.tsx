'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { startOfMonth, endOfMonth, format } from 'date-fns'

import { shiftService, type Shift } from '@/services/shiftService'
import { ShiftCard } from '@/components/modules/shift/ShiftCard'
import Sidebar from '@/components/ui/Sidebar'
import Header from '@/components/ui/Header'
import { DatePicker } from '@/components/ui/FormComponents'
import { handleCrudError } from '@/lib/apiError'
import { useToast } from '@/components/ui/ToastProvider'
import { Skeleton } from '@/components/ui/Skeleton'
import { Card, CardContent } from '@/components/ui/card'

interface ShiftsPageClientProps {
  initialShifts?: Shift[]
  initialDateISO?: string
}

export function ShiftsPageClient({ initialShifts = [], initialDateISO }: ShiftsPageClientProps) {
  const { showToast } = useToast()
  const [selectedDate, setSelectedDate] = useState<Date>(initialDateISO ? new Date(initialDateISO) : new Date())

  const monthRange = useMemo(() => {
    const start = startOfMonth(selectedDate).toISOString()
    const end = endOfMonth(selectedDate).toISOString()
    return { start, end }
  }, [selectedDate])

  const {
    data: shifts = [],
    isLoading,
    isError,
    error,
    refetch
  } = useQuery<Shift[], Error>({
    queryKey: ['shifts', monthRange.start, monthRange.end],
    queryFn: () => shiftService.getShifts(monthRange.start, monthRange.end),
    retry: false,
    initialData: monthRange.start === startOfMonth(new Date(initialDateISO ?? Date.now())).toISOString() ? initialShifts : undefined
  })

  useEffect(() => {
    if (isError && error) {
      handleCrudError({
        error,
        resourceLabel: 'Shifts',
        showToast
      })
    }
  }, [isError, error, showToast])

  const selectedDayShifts = useMemo(
    () =>
      (shifts ?? []).filter((s: Shift) => {
        const d = new Date(s.startTime)
        return d.getDate() === selectedDate.getDate() && d.getMonth() === selectedDate.getMonth()
      }),
    [shifts, selectedDate]
  )

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900">My Shifts</h1>
              <p className="text-gray-600">Manage your schedule and swap requests.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-4 lg:col-span-3">
                <div className="border rounded-lg p-4 bg-white shadow-sm">
                  <h3 className="font-medium text-gray-900 mb-4">Select Date</h3>
                  <DatePicker value={selectedDate} onChange={(date) => date && setSelectedDate(date)} placeholder="Select a date" />
                </div>
              </div>

              <div className="md:col-span-8 lg:col-span-9">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">{format(selectedDate, 'EEEE, MMMM do, yyyy')}</h2>
                </div>

                {isLoading ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {[1, 2].map((i) => (
                      <Card key={i} className="bg-white">
                        <CardContent className="space-y-3 py-4">
                          <Skeleton className="h-4 w-1/2" />
                          <Skeleton className="h-4 w-1/3" />
                          <Skeleton className="h-3 w-full" />
                          <Skeleton className="h-10 w-full" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : isError ? (
                  <div className="text-red-600 text-sm">Failed to load shifts. Please try again.</div>
                ) : selectedDayShifts.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {selectedDayShifts.map((shift: Shift) => (
                      <ShiftCard key={shift.id} shift={shift} onSwapRequest={() => refetch()} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 border-2 border-dashed rounded-lg text-gray-400 bg-white">No shifts scheduled for this day.</div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
