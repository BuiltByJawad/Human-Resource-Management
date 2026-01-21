import { useState } from 'react'
import { Button, Select, TextArea, Input, DatePicker } from '../ui/FormComponents'
import { CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline'
import { format, parseISO, isValid, startOfDay } from 'date-fns'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import type { LeaveRequest as LeaveRequestBase } from '@/types/hrm'

export type LeaveRequest = LeaveRequestBase

interface LeaveRequestFormProps {
    onSubmit: (data: LeaveRequestFormData) => Promise<void>
    onCancel: () => void
    loading?: boolean
}

const leaveRequestSchema = yup.object().shape({
    leaveType: yup.string().required('Leave type is required'),
    startDate: yup.string().required('Start date is required'),
    endDate: yup.string().required('End date is required'),
    reason: yup.string().required('Reason is required')
})

export type LeaveRequestFormData = yup.InferType<typeof leaveRequestSchema>

export function LeaveRequestForm({ onSubmit, onCancel, loading }: LeaveRequestFormProps) {
    const today = startOfDay(new Date())
    const parseDateValue = (value: string): Date | null => {
        if (!value) return null
        const parsed = parseISO(value)
        return isValid(parsed) ? parsed : null
    }
    const { register, handleSubmit, control, reset, formState: { errors } } = useForm<LeaveRequestFormData>({
        resolver: yupResolver(leaveRequestSchema),
        defaultValues: {
            leaveType: 'annual',
            startDate: '',
            endDate: '',
            reason: ''
        }
    })

    const onFormSubmit = async (data: LeaveRequestFormData) => {
        try {
            await onSubmit(data)
            reset()
        } catch {
            // Error handling is surfaced via toasts in the parent mutation.
        }
    }

    return (
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
            <Controller
                control={control}
                name="leaveType"
                render={({ field }) => (
                    <Select
                        label="Leave Type"
                        value={field.value}
                        onChange={field.onChange}
                        options={[
                            { value: 'annual', label: 'Annual Leave' },
                            { value: 'sick', label: 'Sick Leave' },
                            { value: 'personal', label: 'Personal Leave' },
                            { value: 'maternity', label: 'Maternity Leave' },
                            { value: 'paternity', label: 'Paternity Leave' },
                            { value: 'unpaid', label: 'Unpaid Leave' },
                        ]}
                        required
                        error={errors.leaveType?.message}
                    />
                )}
            />

            <div className="grid grid-cols-2 gap-4">
                <Controller
                    control={control}
                    name="startDate"
                    render={({ field }) => (
                        <DatePicker
                            label="Start Date"
                            required
                            value={field.value}
                            minDate={today}
                            onChange={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                            error={errors.startDate?.message}
                        />
                    )}
                />
                <Controller
                    control={control}
                    name="endDate"
                    render={({ field }) => (
                        <DatePicker
                            label="End Date"
                            required
                            value={field.value}
                            minDate={parseDateValue(control._formValues.startDate) ?? today}
                            onChange={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                            error={errors.endDate?.message}
                        />
                    )}
                />
            </div>

            <TextArea
                label="Reason"
                rows={3}
                placeholder="Please provide a reason for your leave request..."
                required
                error={errors.reason?.message}
                {...register('reason')}
            />

            <div className="flex justify-end space-x-3">
                <Button
                    type="button"
                    variant="secondary"
                    onClick={onCancel}
                >
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
    onCancel?: (id: string) => void
    canApprove: boolean
    canManageLeave: boolean
}

export function LeaveRequestCard({ request, onApprove, onReject, onCancel, canApprove, canManageLeave }: LeaveRequestCardProps) {
    const statusColors = {
        pending: 'bg-yellow-100 text-yellow-800',
        approved: 'bg-green-100 text-green-800',
        rejected: 'bg-red-100 text-red-800',
        cancelled: 'bg-gray-100 text-gray-700',
    }

    const statusIcons = {
        pending: ClockIcon,
        approved: CheckCircleIcon,
        rejected: XCircleIcon,
        cancelled: XCircleIcon,
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

            {(canApprove && request.status === 'pending') || (canManageLeave && (request.status === 'pending' || request.status === 'approved')) ? (
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
                    {canManageLeave && (request.status === 'pending' || request.status === 'approved') && (
                        <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 min-w-[120px] text-gray-700 hover:bg-gray-50 border-gray-200"
                            onClick={() => onCancel?.(request.id)}
                        >
                            Cancel
                        </Button>
                    )}
                    {canApprove && request.status === 'pending' && (
                        <>
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
                        </>
                    )}
                </div>
            ) : null}

            {request.status !== 'pending' && request.approver && (
                <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-400 text-center">
                    {request.status === 'approved' ? 'Approved' : 'Rejected'} by {request.approver.firstName} {request.approver.lastName}
                </div>
            )}
        </div>
    )
}
