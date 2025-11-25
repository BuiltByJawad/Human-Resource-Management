import { useState } from 'react'
import { Button, Input, Select, DatePicker } from '@/components/ui/FormComponents'
import { format } from 'date-fns'
import { CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline'

export interface LeaveRequest {
    id: string
    leaveType: 'annual' | 'sick' | 'personal' | 'maternity' | 'paternity'
    startDate: string
    endDate: string
    reason?: string
    status: 'pending' | 'approved' | 'rejected'
    employee: {
        id: string
        firstName: string
        lastName: string
        email: string
    }
    approver?: {
        id: string
        firstName: string
        lastName: string
    }
    createdAt: string
}

interface LeaveRequestFormProps {
    onSubmit: (data: any) => void
    onCancel: () => void
    loading?: boolean
}

export function LeaveRequestForm({ onSubmit, onCancel, loading }: LeaveRequestFormProps) {
    const [formData, setFormData] = useState({
        leaveType: 'annual',
        startDate: '',
        endDate: '',
        reason: ''
    })
    const [errors, setErrors] = useState<Record<string, string>>({})

    const validateForm = () => {
        const newErrors: Record<string, string> = {}

        if (!formData.leaveType) newErrors.leaveType = 'Leave type is required'
        if (!formData.startDate) newErrors.startDate = 'Start date is required'
        if (!formData.endDate) newErrors.endDate = 'End date is required'

        if (formData.startDate && formData.endDate) {
            if (new Date(formData.startDate) > new Date(formData.endDate)) {
                newErrors.endDate = 'End date must be after start date'
            }
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }))
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (validateForm()) {
            onSubmit(formData)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 pb-32">
            <Select
                label="Leave Type"
                required
                value={formData.leaveType}
                onChange={(value) => handleChange('leaveType', value)}
                options={[
                    { value: 'annual', label: 'Annual Leave' },
                    { value: 'sick', label: 'Sick Leave' },
                    { value: 'personal', label: 'Personal Leave' },
                    { value: 'maternity', label: 'Maternity Leave' },
                    { value: 'paternity', label: 'Paternity Leave' },
                ]}
                error={errors.leaveType}
            />

            <div className="grid grid-cols-2 gap-4">
                <DatePicker
                    label="Start Date"
                    required
                    value={formData.startDate}
                    onChange={(date) => handleChange('startDate', date ? date.toISOString().split('T')[0] : '')}
                    error={errors.startDate}
                />
                <DatePicker
                    label="End Date"
                    required
                    value={formData.endDate}
                    onChange={(date) => handleChange('endDate', date ? date.toISOString().split('T')[0] : '')}
                    error={errors.endDate}
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <textarea
                    value={formData.reason}
                    onChange={(e) => handleChange('reason', e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Optional reason for leave..."
                />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
                <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit" loading={loading}>
                    Submit Request
                </Button>
            </div>
        </form>
    )
}

interface LeaveRequestCardProps {
    request: LeaveRequest
    onApprove?: (id: string) => void
    onReject?: (id: string) => void
    canManage: boolean
}

export function LeaveRequestCard({ request, onApprove, onReject, canManage }: LeaveRequestCardProps) {
    const statusColors = {
        pending: 'bg-yellow-100 text-yellow-800',
        approved: 'bg-green-100 text-green-800',
        rejected: 'bg-red-100 text-red-800',
    }

    const statusIcons = {
        pending: ClockIcon,
        approved: CheckCircleIcon,
        rejected: XCircleIcon,
    }

    const StatusIcon = statusIcons[request.status]

    return (
        <div className="bg-white rounded-lg shadow p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="font-semibold text-gray-900">
                        {request.employee.firstName} {request.employee.lastName}
                    </h3>
                    <p className="text-sm text-gray-500">{request.employee.email}</p>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[request.status]}`}>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                </span>
            </div>

            <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div className="flex justify-between">
                    <span className="text-gray-500">Type:</span>
                    <span className="font-medium capitalize">{request.leaveType}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-500">Duration:</span>
                    <span className="font-medium">
                        {format(new Date(request.startDate), 'MMM d, yyyy')} - {format(new Date(request.endDate), 'MMM d, yyyy')}
                    </span>
                </div>
                {request.reason && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-xs italic">
                        &quot;{request.reason}&quot;
                    </div>
                )}
            </div>

            {canManage && request.status === 'pending' && (
                <div className="flex space-x-2 mt-4 pt-4 border-t border-gray-100">
                    <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
                        onClick={() => onReject?.(request.id)}
                    >
                        Reject
                    </Button>
                    <Button
                        size="sm"
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => onApprove?.(request.id)}
                    >
                        Approve
                    </Button>
                </div>
            )}

            {request.status !== 'pending' && request.approver && (
                <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-400 text-center">
                    {request.status === 'approved' ? 'Approved' : 'Rejected'} by {request.approver.firstName} {request.approver.lastName}
                </div>
            )}
        </div>
    )
}
