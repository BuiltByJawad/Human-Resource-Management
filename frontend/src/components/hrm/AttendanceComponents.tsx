'use client'

import { Button, Card } from '../ui/FormComponents'
import { Badge } from '../ui/CommonComponents'
import { ClockIcon, ArrowRightOnRectangleIcon, ArrowLeftOnRectangleIcon } from '@heroicons/react/24/outline'
import type { AttendanceRecord } from '@/features/attendance'

interface AttendanceCardProps {
    status: 'checked_in' | 'checked_out'
    lastActionTime?: Date
    onClockIn: () => void
    onClockOut: () => void
    loading?: boolean
}

export function AttendanceCard({ status, lastActionTime, onClockIn, onClockOut, loading }: AttendanceCardProps) {
    const isCheckedIn = status === 'checked_in'

    return (
        <Card className="bg-white">
            <div className="flex flex-col items-center justify-center py-8 space-y-6">
                <div className={`p-4 rounded-full ${isCheckedIn ? 'bg-green-100' : 'bg-gray-100'}`}>
                    <ClockIcon className={`w-12 h-12 ${isCheckedIn ? 'text-green-600' : 'text-gray-500'}`} />
                </div>

                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900">
                        {isCheckedIn ? 'You are clocked in' : 'You are clocked out'}
                    </h2>
                    <p className="text-gray-500 mt-2">
                        {lastActionTime
                            ? `Last action: ${lastActionTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                            : 'No activity today'}
                    </p>
                </div>

                <div className="w-full max-w-xs">
                    {isCheckedIn ? (
                        <Button
                            variant="danger"
                            size="lg"
                            className="w-full flex items-center justify-center space-x-2"
                            onClick={onClockOut}
                            loading={loading}
                        >
                            <ArrowRightOnRectangleIcon className="w-5 h-5" />
                            <span>Clock Out</span>
                        </Button>
                    ) : (
                        <Button
                            variant="primary"
                            size="lg"
                            className="w-full flex items-center justify-center space-x-2"
                            onClick={onClockIn}
                            loading={loading}
                        >
                            <ArrowLeftOnRectangleIcon className="w-5 h-5" />
                            <span>Clock In</span>
                        </Button>
                    )}
                </div>
            </div>
        </Card>
    )
}

interface AttendanceHistoryProps {
    records: AttendanceRecord[]
    loading?: boolean
}

export function AttendanceHistory({ records, loading }: AttendanceHistoryProps) {
    if (loading) {
        return <div className="text-center py-8">Loading history...</div>
    }

    if ((Array.isArray(records) ? records : []).length === 0) {
        return (
            <Card title="Attendance History">
                <div className="text-center py-8 text-gray-500">No attendance records found.</div>
            </Card>
        )
    }

    return (
        <Card title="Attendance History" className="overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check In</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check Out</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Work Hours</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {(Array.isArray(records) ? records : []).map((record) => (
                            <tr key={record.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {new Date(record.checkIn).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {record.checkOut
                                        ? new Date(record.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                        : '-'
                                    }
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {record.workHours ? `${record.workHours} hrs` : '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <Badge variant={record.status === 'present' ? 'success' : 'warning'}>
                                        {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                                    </Badge>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    )
}
