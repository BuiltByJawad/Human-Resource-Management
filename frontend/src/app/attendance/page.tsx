'use client'

import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import Sidebar from '@/components/ui/Sidebar'
import Header from '@/components/ui/Header'
import { AttendanceCard, AttendanceHistory, AttendanceRecord } from '@/components/hrm/AttendanceComponents'
import { useAuthStore } from '@/store/useAuthStore'
import { useToast } from '@/components/ui/ToastProvider'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

export default function AttendancePage() {
    const { token, user } = useAuthStore()
    const { showToast } = useToast()

    const [records, setRecords] = useState<AttendanceRecord[]>([])
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(false)
    const [currentStatus, setCurrentStatus] = useState<'checked_in' | 'checked_out'>('checked_out')
    const [currentRecordId, setCurrentRecordId] = useState<string | null>(null)
    const [lastActionTime, setLastActionTime] = useState<Date | undefined>(undefined)

    const fetchAttendance = useCallback(async () => {
        if (!token) return

        setLoading(true)
        try {
            const response = await axios.get(`${API_URL}/attendance`, {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    limit: 30 // Get last 30 records
                }
            })

            if (response.data.success) {
                const fetchedRecords: AttendanceRecord[] = response.data.data
                setRecords(fetchedRecords)

                // Determine current status based on today's most recent record
                const today = new Date()
                today.setHours(0, 0, 0, 0)

                const todayRecords = fetchedRecords.filter(record => {
                    const recordDate = new Date(record.checkIn)
                    recordDate.setHours(0, 0, 0, 0)
                    return recordDate.getTime() === today.getTime()
                })

                // Get the most recent record (first one since API returns DESC order)
                const todayRecord = todayRecords.length > 0 ? todayRecords[0] : null

                if (todayRecord) {
                    if (!todayRecord.checkOut) {
                        setCurrentStatus('checked_in')
                        setCurrentRecordId(todayRecord.id)
                        setLastActionTime(new Date(todayRecord.checkIn))
                    } else {
                        setCurrentStatus('checked_out')
                        setCurrentRecordId(null)
                        setLastActionTime(new Date(todayRecord.checkOut))
                    }
                } else {
                    setCurrentStatus('checked_out')
                    setCurrentRecordId(null)
                    setLastActionTime(undefined)
                }
            }
        } catch (error: any) {
            console.error('Failed to fetch attendance', error)
            setRecords([])
            setCurrentStatus('checked_out')
            setCurrentRecordId(null)
            setLastActionTime(undefined)
        } finally {
            setLoading(false)
        }
    }, [token, user?.id, showToast])

    useEffect(() => {
        fetchAttendance()
    }, [fetchAttendance])

    const getPosition = () => {
        return new Promise<GeolocationPosition>((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation is not supported by your browser'))
            } else {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 5000,
                    maximumAge: 0
                })
            }
        })
    }

    const handleClockIn = async () => {
        setActionLoading(true)
        try {
            // Get location first
            let locationData = {}
            try {
                showToast('Acquiring location...', 'info')
                const position = await getPosition()
                locationData = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                }
            } catch (geoError) {
                console.error('Geolocation failed', geoError)
                showToast('Location access is required to clock in. Please enable it.', 'error')
                setActionLoading(false)
                return
            }

            const response = await axios.post(`${API_URL}/attendance/clock-in`, locationData, {
                headers: { Authorization: `Bearer ${token}` }
            })

            if (response.data.success) {
                showToast('Clocked in successfully', 'success')
                fetchAttendance()
            }
        } catch (error: any) {
            console.error('Clock in failed', error)
            const errorMessage = typeof error.response?.data?.error === 'string'
                ? error.response.data.error
                : 'Failed to clock in'
            showToast(errorMessage, 'error')
        } finally {
            setActionLoading(false)
        }
    }

    const handleClockOut = async () => {
        if (!currentRecordId) return

        setActionLoading(true)
        try {
            // Get location (optional for clock out, but good to have)
            let locationData = {}
            try {
                const position = await getPosition()
                locationData = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                }
            } catch (geoError) {
                console.warn('Geolocation failed for clock out', geoError)
                // We allow clock out even without location if it fails, to avoid trapping users
            }

            const response = await axios.put(`${API_URL}/attendance/clock-out/${currentRecordId}`, locationData, {
                headers: { Authorization: `Bearer ${token}` }
            })

            if (response.data.success) {
                showToast('Clocked out successfully', 'success')
                fetchAttendance()
            }
        } catch (error: any) {
            console.error('Clock out failed', error)
            const errorMessage = typeof error.response?.data?.error === 'string'
                ? error.response.data.error
                : 'Failed to clock out'
            showToast(errorMessage, 'error')
        } finally {
            setActionLoading(false)
        }
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
                                <AttendanceHistory
                                    records={records}
                                    loading={loading}
                                />
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
}
