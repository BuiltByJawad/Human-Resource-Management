'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Sidebar from '@/components/ui/Sidebar'
import Header from '@/components/ui/Header'
import { useAuthStore } from '@/store/useAuthStore'
import { useToast } from '@/components/ui/ToastProvider'
import { Asset, AssignmentModal, MaintenanceModal } from '@/components/hrm/AssetComponents'
import {
    ArrowLeftIcon,
    CalendarIcon,
    CurrencyDollarIcon,
    UserCircleIcon,
    WrenchScrewdriverIcon
} from '@heroicons/react/24/outline'
import api from '@/lib/axios'
import { handleCrudError } from '@/lib/apiError'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Skeleton } from '@/components/ui/Skeleton'

export default function AssetDetailsPage() {
    const params = useParams()
    const router = useRouter()
    const { token } = useAuthStore()
    const { showToast } = useToast()
    const queryClient = useQueryClient()

    const assetId = (params?.id ?? '') as string

    const [activeTab, setActiveTab] = useState<'history' | 'maintenance'>('history')
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
    const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false)
    const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false)

    const assetQuery = useQuery<Asset, Error>({
        queryKey: ['asset', assetId],
        queryFn: async () => {
            const response = await api.get(`/assets/${assetId}`)
            const raw = response.data?.data
            if (raw?.asset) return raw.asset as Asset
            return (raw as Asset) ?? null
        },
        enabled: !!assetId,
        retry: false,
    })

    const employeesQuery = useQuery<any[], Error>({
        queryKey: ['employees'],
        queryFn: async () => {
            const response = await api.get('/employees')
            const raw = response.data?.data
            if (Array.isArray(raw)) return raw
            if (Array.isArray(raw?.employees)) return raw.employees
            return []
        },
        enabled: !!token,
        retry: false,
    })

    const assignMutation = useMutation({
        mutationFn: async ({ employeeId, notes }: { employeeId: string; notes: string }) => {
            const response = await api.post(`/assets/${assetId}/assign`, { employeeId, notes })
            return response.data
        },
        onSuccess: () => {
            showToast('Asset assigned successfully', 'success')
            queryClient.invalidateQueries({ queryKey: ['asset', assetId] })
            setIsAssignModalOpen(false)
        },
        onError: (error) => handleCrudError({ error, resourceLabel: 'Assign asset', showToast }),
    })

    const returnMutation = useMutation({
        mutationFn: async () => {
            const response = await api.post(`/assets/${assetId}/return`)
            return response.data
        },
        onSuccess: () => {
            showToast('Asset returned successfully', 'success')
            queryClient.invalidateQueries({ queryKey: ['asset', assetId] })
        },
        onError: (error) => handleCrudError({ error, resourceLabel: 'Return asset', showToast }),
    })

    const maintenanceMutation = useMutation({
        mutationFn: async (data: any) => {
            const response = await api.post(`/assets/${assetId}/maintenance`, data)
            return response.data
        },
        onSuccess: () => {
            showToast('Maintenance log added', 'success')
            queryClient.invalidateQueries({ queryKey: ['asset', assetId] })
            setIsMaintenanceModalOpen(false)
        },
        onError: (error) => handleCrudError({ error, resourceLabel: 'Add maintenance log', showToast }),
    })

    const handleAssign = async (employeeId: string, notes: string) => {
        await assignMutation.mutateAsync({ employeeId, notes })
    }

    const handleReturn = () => {
        setIsReturnDialogOpen(true)
    }
    const confirmReturn = async () => {
        await returnMutation.mutateAsync()
        setIsReturnDialogOpen(false)
    }

    const handleMaintenanceSubmit = async (data: any) => {
        await maintenanceMutation.mutateAsync(data)
    }

    if (assetQuery.isLoading) {
        return (
            <div className="flex h-screen bg-gray-50">
                <Sidebar />
                <div className="flex-1 flex flex-col">
                    <Header />
                    <main className="flex-1 p-6">
                        <div className="max-w-5xl mx-auto space-y-6">
                            <Skeleton className="h-4 w-24" />
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
                                <Skeleton className="h-6 w-1/3" />
                                <Skeleton className="h-4 w-1/4" />
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                                    <Skeleton className="h-4 w-1/2" />
                                    <Skeleton className="h-4 w-1/2" />
                                    <Skeleton className="h-4 w-1/2" />
                                </div>
                            </div>
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-3">
                                <Skeleton className="h-4 w-1/3" />
                                <Skeleton className="h-24 w-full" />
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        )
    }

    if (assetQuery.isError) {
        handleCrudError({ error: assetQuery.error, resourceLabel: 'Asset details', showToast })
        return (
            <div className="flex h-screen bg-gray-50">
                <Sidebar />
                <div className="flex-1 flex flex-col">
                    <Header />
                    <main className="flex-1 p-6 flex items-center justify-center">
                        <div className="text-center space-y-3">
                            <p className="text-gray-700 font-medium">Unable to load asset details.</p>
                            <button
                                onClick={() => router.push('/assets')}
                                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                Back to Assets
                            </button>
                        </div>
                    </main>
                </div>
            </div>
        )
    }

    const asset = assetQuery.data
    if (!asset) {
        return (
            <div className="flex h-screen bg-gray-50">
                <Sidebar />
                <div className="flex-1 flex flex-col">
                    <Header />
                    <main className="flex-1 p-6 flex items-center justify-center">
                        <div className="text-center text-gray-600">
                            Asset not found.
                            <div className="mt-3">
                                <button
                                    onClick={() => router.push('/assets')}
                                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    Back to Assets
                                </button>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        )
    }

    const currentAssignment = asset.assignments.find(a => !a.returnedDate)

    return (
        <div className="flex h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header />
                <main className="flex-1 overflow-y-auto p-4 md:p-6">
                    <div className="max-w-5xl mx-auto space-y-6">
                        {/* Back Button */}
                        <button
                            onClick={() => router.back()}
                            className="flex items-center text-sm text-gray-500 hover:text-gray-700"
                        >
                            <ArrowLeftIcon className="h-4 w-4 mr-1" />
                            Back to Assets
                        </button>

                        {/* Header Section */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <h1 className="text-2xl font-bold text-gray-900">{asset.name}</h1>
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium 
                                            ${asset.status === 'available' ? 'bg-green-100 text-green-800' :
                                                asset.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                                                    asset.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-red-100 text-red-800'}`}
                                        >
                                            {asset.status.toUpperCase()}
                                        </span>
                                    </div>
                                    <p className="text-gray-500 font-mono">{asset.serialNumber}</p>
                                </div>
                                <div className="flex gap-2">
                                    {asset.status === 'available' && (
                                        <button
                                            onClick={() => setIsAssignModalOpen(true)}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                                        >
                                            Assign Asset
                                        </button>
                                    )}
                                    {asset.status === 'assigned' && (
                                        <button
                                            onClick={handleReturn}
                                            className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 text-sm font-medium"
                                            disabled={returnMutation.isPending}
                                        >
                                            {returnMutation.isPending ? 'Returning...' : 'Return Asset'}
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 pt-6 border-t border-gray-100">
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Type</p>
                                    <p className="font-medium text-gray-900">{asset.type}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Purchase Date</p>
                                    <div className="flex items-center gap-2">
                                        <CalendarIcon className="h-4 w-4 text-gray-400" />
                                        <p className="font-medium text-gray-900">
                                            {new Date(asset.purchaseDate).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Purchase Price</p>
                                    <div className="flex items-center gap-2">
                                        <CurrencyDollarIcon className="h-4 w-4 text-gray-400" />
                                        <p className="font-medium text-gray-900">
                                            {asset.purchasePrice ? `$${asset.purchasePrice.toLocaleString()}` : '-'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Current Assignment Card */}
                        {currentAssignment && (
                            <div className="bg-blue-50 rounded-xl border border-blue-100 p-6">
                                <h3 className="text-sm font-semibold text-blue-900 uppercase tracking-wider mb-4">Currently Assigned To</h3>
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-bold text-lg">
                                        {currentAssignment.employee.firstName[0]}{currentAssignment.employee.lastName[0]}
                                    </div>
                                    <div>
                                        <p className="text-lg font-semibold text-gray-900">
                                            {currentAssignment.employee.firstName} {currentAssignment.employee.lastName}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            ID: {currentAssignment.employee.employeeNumber} • Since {new Date(currentAssignment.assignedDate).toLocaleDateString()}
                                        </p>
                                        {currentAssignment.notes && (
                                            <p className="text-sm text-gray-500 mt-1 italic">&quot;{currentAssignment.notes}&quot;</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tabs */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="flex border-b border-gray-200">
                                <button
                                    onClick={() => setActiveTab('history')}
                                    className={`flex-1 px-6 py-4 text-sm font-medium text-center border-b-2 transition-colors
                                        ${activeTab === 'history'
                                            ? 'border-blue-500 text-blue-600 bg-blue-50/50'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                                >
                                    Assignment History
                                </button>
                                <button
                                    onClick={() => setActiveTab('maintenance')}
                                    className={`flex-1 px-6 py-4 text-sm font-medium text-center border-b-2 transition-colors
                                        ${activeTab === 'maintenance'
                                            ? 'border-blue-500 text-blue-600 bg-blue-50/50'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                                >
                                    Maintenance Logs
                                </button>
                            </div>

                            <div className="p-6">
                                {activeTab === 'history' ? (
                                    <div className="space-y-6">
                                        {asset.assignments.length === 0 ? (
                                            <p className="text-center text-gray-500 py-8">No assignment history found.</p>
                                        ) : (
                                            <div className="flow-root">
                                                <ul className="-mb-8">
                                                    {asset.assignments.map((assignment, idx) => (
                                                        <li key={assignment.id}>
                                                            <div className="relative pb-8">
                                                                {idx !== asset.assignments.length - 1 && (
                                                                    <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                                                                )}
                                                                <div className="relative flex space-x-3">
                                                                    <div>
                                                                        <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white
                                                                            ${assignment.returnedDate ? 'bg-gray-400' : 'bg-blue-500'}`}>
                                                                            <UserCircleIcon className="h-5 w-5 text-white" />
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                                                                        <div>
                                                                            <p className="text-sm text-gray-500">
                                                                                Assigned to <span className="font-medium text-gray-900">{assignment.employee.firstName} {assignment.employee.lastName}</span>
                                                                            </p>
                                                                            {assignment.notes && (
                                                                                <p className="mt-1 text-sm text-gray-500 italic">&quot;{assignment.notes}&quot;</p>
                                                                            )}
                                                                        </div>
                                                                        <div className="whitespace-nowrap text-right text-sm text-gray-500">
                                                                            <time dateTime={assignment.assignedDate}>{new Date(assignment.assignedDate).toLocaleDateString()}</time>
                                                                            {assignment.returnedDate && (
                                                                                <>
                                                                                    <span className="mx-1">-</span>
                                                                                    <time dateTime={assignment.returnedDate}>{new Date(assignment.returnedDate).toLocaleDateString()}</time>
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="flex justify-end">
                                            <button
                                                onClick={() => setIsMaintenanceModalOpen(true)}
                                                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center"
                                            >
                                                <WrenchScrewdriverIcon className="h-4 w-4 mr-1" />
                                                Add Maintenance Log
                                            </button>
                                        </div>
                                        {asset.maintenance && asset.maintenance.length > 0 ? (
                                            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                                                <table className="min-w-full divide-y divide-gray-300">
                                                    <thead className="bg-gray-50">
                                                        <tr>
                                                            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Date</th>
                                                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Description</th>
                                                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Cost</th>
                                                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Performed By</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-200 bg-white">
                                                        {asset.maintenance.map((log) => (
                                                            <tr key={log.id}>
                                                                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900">
                                                                    {new Date(log.date).toLocaleDateString()}
                                                                </td>
                                                                <td className="px-3 py-4 text-sm text-gray-500">{log.description}</td>
                                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                                    {log.cost ? `$${log.cost.toLocaleString()}` : '-'}
                                                                </td>
                                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{log.performedBy || '-'}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            <p className="text-center text-gray-500 py-8">No maintenance records found.</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            <AssignmentModal
                isOpen={isAssignModalOpen}
                onClose={() => setIsAssignModalOpen(false)}
                onAssign={handleAssign}
                employees={employeesQuery.data || []}
            />

            <MaintenanceModal
                isOpen={isMaintenanceModalOpen}
                onClose={() => setIsMaintenanceModalOpen(false)}
                onSubmit={handleMaintenanceSubmit}
            />
            <ConfirmDialog
                isOpen={isReturnDialogOpen}
                onClose={() => setIsReturnDialogOpen(false)}
                onConfirm={confirmReturn}
                title="Return asset"
                message="Mark this asset as returned? It will be available for reassignment."
                confirmText={returnMutation.isPending ? 'Returning...' : 'Return'}
                cancelText="Keep assigned"
                loading={returnMutation.isPending}
                type="warning"
            />
        </div>
    )
}
