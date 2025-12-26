"use client"

import { useEffect, useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import Sidebar from '@/components/ui/Sidebar'
import Header from '@/components/ui/Header'
import { AttendanceCard, AttendanceHistory, type AttendanceRecord } from '@/components/hrm/AttendanceComponents'
import { useAuthStore } from '@/store/useAuthStore'
import { useToast } from '@/components/ui/ToastProvider'
import api from '@/lib/axios'
import { handleCrudError } from '@/lib/apiError'
import { Skeleton } from '@/components/ui/Skeleton'

interface AttendancePageClientProps {
  initialAttendance?: AttendanceRecord[]
}

export function AttendancePageClient({ initialAttendance = [] }: AttendancePageClientProps) {
  const { token } = useAuthStore()
  const { showToast } = useToast()
  const queryClient = useQueryClient()

  const attendanceQuery = useQuery<AttendanceRecord[]>({
    queryKey: ['attendance', token],
    queryFn: async () => {
      const response = await api.get('/attendance', {
        params: { limit: 30 },
      })
      return Array.isArray(response.data?.data) ? response.data.data : []
    },
    enabled: !!token,
    retry: false,
    initialData: initialAttendance,
    staleTime: 30_000,
  })

  useEffect(() => {
    if (attendanceQuery.isError && attendanceQuery.error) {
      handleCrudError({
        error: attendanceQuery.error,
        resourceLabel: 'Attendance',
        showToast,
      })
    }
  }, [attendanceQuery.isError, attendanceQuery.error, showToast])

  const { currentStatus, currentRecordId, lastActionTime } = useMemo(() => {
    const fetchedRecords = attendanceQuery.data || []
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const todayRecords = fetchedRecords.filter((record) => {
      const recordDate = new Date(record.checkIn)
      recordDate.setHours(0, 0, 0, 0)
      return recordDate.getTime() === today.getTime()
    })

    const todayRecord = todayRecords.length > 0 ? todayRecords[0] : null

    if (todayRecord) {
      if (!todayRecord.checkOut) {
        return {
          currentStatus: 'checked_in' as const,
          currentRecordId: todayRecord.id,
          lastActionTime: new Date(todayRecord.checkIn),
        }
      }
      return {
        currentStatus: 'checked_out' as const,
        currentRecordId: null,
        lastActionTime: new Date(todayRecord.checkOut),
      }
    }

    return {
      currentStatus: 'checked_out' as const,
      currentRecordId: null,
      lastActionTime: undefined,
    }
  }, [attendanceQuery.data])

  const getPosition = async () => {
    if (!navigator.geolocation) {
      throw new Error('Geolocation is not supported by your browser')
    }
    return new Promise<{ latitude: number; longitude: number }>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) =>
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }),
        reject,
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        },
      )
    })
  }

  const clockInMutation = useMutation({
    mutationFn: async (locationData: { latitude: number; longitude: number }) => {
      const response = await api.post('/attendance/clock-in', locationData)
      return response.data
    },
    onSuccess: () => {
      showToast('Clocked in successfully', 'success')
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
    },
    onError: (error) => {
      handleCrudError({ error, resourceLabel: 'Clock in', showToast })
    },
  })

  const clockOutMutation = useMutation({
    mutationFn: async ({
      attendanceId,
      locationData,
    }: {
      attendanceId: string
      locationData: { latitude?: number; longitude?: number }
    }) => {
      const response = await api.put(`/attendance/clock-out/${attendanceId}`, locationData)
      return response.data
    },
    onSuccess: () => {
      showToast('Clocked out successfully', 'success')
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
    },
    onError: (error) => {
      handleCrudError({ error, resourceLabel: 'Clock out', showToast })
    },
  })

  const actionLoading = clockInMutation.isPending || clockOutMutation.isPending

  const handleClockIn = async () => {
    try {
      showToast('Acquiring location...', 'info')
      const locationData = await getPosition()
      await clockInMutation.mutateAsync(locationData)
    } catch (geoError) {
      console.error('Geolocation failed', geoError)
      showToast('Location access is required to clock in. Please enable it.', 'error')
    }
  }

  const handleClockOut = async () => {
    if (!currentRecordId) {
      showToast('No active attendance record to clock out.', 'error')
      return
    }

    let locationData: { latitude?: number; longitude?: number } = {}
    try {
      locationData = await getPosition()
    } catch (geoError) {
      console.warn('Geolocation failed for clock out', geoError)
    }

    await clockOutMutation.mutateAsync({ attendanceId: currentRecordId, locationData })
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
              <p className="text-sm text-gray-500">Track your daily work hours</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <AttendanceCard
                  status={currentStatus}
                  lastActionTime={lastActionTime}
                  onClockIn={handleClockIn}
                  onClockOut={handleClockOut}
                  loading={actionLoading}
                />
              </div>
              <div className="lg:col-span-2">
                {attendanceQuery.isLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-32 w-full" />
                  </div>
                ) : attendanceQuery.isError ? (
                  <div className="text-red-600 text-sm">Failed to load attendance records. Please try again.</div>
                ) : (attendanceQuery.data?.length ?? 0) === 0 ? (
                  <div className="rounded-lg border border-dashed border-gray-200 bg-white p-6 text-sm text-gray-500">
                    No attendance records yet.
                  </div>
                ) : (
                  <AttendanceHistory records={attendanceQuery.data || []} loading={attendanceQuery.isLoading} />
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
