'use client'

import { useState, Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import {
    ComputerDesktopIcon,
    DevicePhoneMobileIcon,
    WrenchScrewdriverIcon,
    UserCircleIcon,
    XMarkIcon
} from '@heroicons/react/24/outline'
import { Button, Select } from '../ui/FormComponents'
import { CreatableSelect } from '../ui/CreatableSelect'

export interface AssetAssignment {
    id: string
    assetId: string
    employeeId: string
    assignedDate: string
    returnedDate?: string | null
    notes?: string
    employee: {
        id: string
        firstName: string
        lastName: string
        employeeNumber: string
    }
}

export interface MaintenanceLog {
    id: string
    assetId: string
    description: string
    cost?: number
    date: string
    performedBy?: string
}

export interface Asset {
    id: string
    name: string
    serialNumber: string
    type: string
    status: 'available' | 'assigned' | 'maintenance' | 'retired'
    purchaseDate: string
    purchasePrice?: number
    vendor?: string
    description?: string
    assignments: AssetAssignment[]
    maintenance?: MaintenanceLog[]
}

interface AssetCardProps {
    asset: Asset
    onAssign: (asset: Asset) => void
    onReturn: (asset: Asset) => void
    onEdit: (asset: Asset) => void
}

export const AssetCard = ({ asset, onAssign, onReturn, onEdit }: AssetCardProps) => {
    const currentAssignment = asset.assignments.find((a: any) => !a.returnedDate)

    const getIcon = () => {
        switch (asset.type.toLowerCase()) {
            case 'laptop': return <ComputerDesktopIcon className="h-8 w-8 text-blue-500" />
            case 'mobile': return <DevicePhoneMobileIcon className="h-8 w-8 text-green-500" />
            default: return <WrenchScrewdriverIcon className="h-8 w-8 text-gray-500" />
        }
    }

    const getStatusColor = () => {
        switch (asset.status) {
            case 'available': return 'bg-green-100 text-green-800'
            case 'assigned': return 'bg-blue-100 text-blue-800'
            case 'maintenance': return 'bg-yellow-100 text-yellow-800'
            case 'retired': return 'bg-red-100 text-red-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-gray-50 rounded-lg">
                    {getIcon()}
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor()}`}>
                    {asset.status.toUpperCase()}
                </span>
            </div>

            <h3 className="font-semibold text-gray-900 mb-1">{asset.name}</h3>
            <p className="text-sm text-gray-500 mb-4 font-mono">{asset.serialNumber}</p>

            {currentAssignment && (
                <div className="flex items-center mb-4 p-2 bg-blue-50 rounded-lg">
                    <UserCircleIcon className="h-5 w-5 text-blue-600 mr-2" />
                    <div className="text-xs">
                        <p className="font-medium text-blue-900">
                            {currentAssignment.employee.firstName} {currentAssignment.employee.lastName}
                        </p>
                        <p className="text-blue-700">{currentAssignment.employee.employeeNumber}</p>
                    </div>
                </div>
            )}

            <div className="flex space-x-2 mt-auto pt-4 border-t border-gray-100">
                {asset.status === 'available' && (
                    <Button
                        onClick={() => onAssign(asset)}
                        variant="primary"
                        size="sm"
                        className="flex-1"
                    >
                        Assign
                    </Button>
                )}
                {asset.status === 'assigned' && (
                    <Button
                        onClick={() => onReturn(asset)}
                        variant="warning"
                        size="sm"
                        className="flex-1"
                    >
                        Return
                    </Button>
                )}
                <Button
                    onClick={() => onEdit(asset)}
                    variant="outline"
                    size="sm"
                >
                    Edit
                </Button>
            </div>
        </div>
    )
}

interface AssetFormProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (data: any) => Promise<void>
    initialData?: Asset
}

const ASSET_TYPES = [
    { value: 'Laptop', label: 'Laptop' },
    { value: 'Desktop', label: 'Desktop' },
    { value: 'Monitor', label: 'Monitor' },
    { value: 'Mobile', label: 'Mobile' },
    { value: 'Tablet', label: 'Tablet' },
    { value: 'Accessory', label: 'Accessory' },
    { value: 'License', label: 'License' }
]

export const AssetForm = ({ isOpen, onClose, onSubmit, initialData }: AssetFormProps) => {
    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        serialNumber: initialData?.serialNumber || '',
        type: initialData?.type || 'Laptop',
        purchaseDate: initialData?.purchaseDate ? new Date(initialData.purchaseDate).toISOString().split('T')[0] : '',
        purchasePrice: initialData?.purchasePrice || ''
    })
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            await onSubmit(formData)
            onClose()
        } finally {
            setLoading(false)
        }
    }

    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/50 transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
                        <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                            <div className="absolute right-0 top-0 pr-4 pt-4">
                                <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                                    <XMarkIcon className="h-6 w-6" />
                                </button>
                            </div>
                            <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900 mb-4">
                                {initialData ? 'Edit Asset' : 'Add New Asset'}
                            </Dialog.Title>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Asset Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g. MacBook Pro M3"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Serial Number</label>
                                    <input
                                        type="text"
                                        required
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                                        value={formData.serialNumber}
                                        onChange={e => setFormData({ ...formData, serialNumber: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <CreatableSelect
                                            label="Type"
                                            value={formData.type}
                                            onChange={(val) => setFormData({ ...formData, type: val })}
                                            options={ASSET_TYPES}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Price</label>
                                        <input
                                            type="number"
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                                            value={formData.purchasePrice}
                                            onChange={e => setFormData({ ...formData, purchasePrice: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Purchase Date</label>
                                    <input
                                        type="date"
                                        required
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                                        value={formData.purchaseDate}
                                        onChange={e => setFormData({ ...formData, purchaseDate: e.target.value })}
                                    />
                                </div>
                                <div className="mt-5 sm:mt-6">
                                    <Button
                                        type="submit"
                                        loading={loading}
                                        className="w-full"
                                    >
                                        {loading ? 'Saving...' : 'Save Asset'}
                                    </Button>
                                </div>
                            </form>
                        </Dialog.Panel>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    )
}

interface AssignmentModalProps {
    isOpen: boolean
    onClose: () => void
    onAssign: (employeeId: string, notes: string) => Promise<void>
    employees: any[]
}

export const AssignmentModal = ({ isOpen, onClose, onAssign, employees }: AssignmentModalProps) => {
    const [employeeId, setEmployeeId] = useState('')
    const [notes, setNotes] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!employeeId) return
        setLoading(true)
        try {
            await onAssign(employeeId, notes)
            onClose()
        } finally {
            setLoading(false)
        }
    }

    const employeeOptions = employees.map(emp => ({
        value: emp.id,
        label: `${emp.firstName} ${emp.lastName} (${emp.employeeNumber})`
    }))

    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/50 transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
                        <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                            <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900 mb-4">
                                Assign Asset
                            </Dialog.Title>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <Select
                                        label="Select Employee"
                                        value={employeeId}
                                        onChange={setEmployeeId}
                                        options={employeeOptions}
                                        required
                                        placeholder="Select an employee..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Notes</label>
                                    <textarea
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                                        rows={3}
                                        value={notes}
                                        onChange={e => setNotes(e.target.value)}
                                        placeholder="Condition, accessories included, etc."
                                    />
                                </div>
                                <div className="mt-5 sm:mt-6">
                                    <Button
                                        type="submit"
                                        loading={loading}
                                        className="w-full"
                                        disabled={!employeeId}
                                    >
                                        {loading ? 'Assigning...' : 'Confirm Assignment'}
                                    </Button>
                                </div>
                            </form>
                        </Dialog.Panel>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    )
}

interface MaintenanceModalProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (data: any) => Promise<void>
}

export const MaintenanceModal = ({ isOpen, onClose, onSubmit }: MaintenanceModalProps) => {
    const [formData, setFormData] = useState({
        description: '',
        cost: '',
        date: new Date().toISOString().split('T')[0],
        performedBy: ''
    })
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            await onSubmit(formData)
            onClose()
            setFormData({
                description: '',
                cost: '',
                date: new Date().toISOString().split('T')[0],
                performedBy: ''
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/50 transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
                        <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                            <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900 mb-4">
                                Log Maintenance
                            </Dialog.Title>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Description</label>
                                    <textarea
                                        required
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                                        rows={3}
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Describe the issue and resolution..."
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Date</label>
                                        <input
                                            type="date"
                                            required
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                                            value={formData.date}
                                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Cost</label>
                                        <input
                                            type="number"
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                                            value={formData.cost}
                                            onChange={e => setFormData({ ...formData, cost: e.target.value })}
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Performed By</label>
                                    <input
                                        type="text"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                                        value={formData.performedBy}
                                        onChange={e => setFormData({ ...formData, performedBy: e.target.value })}
                                        placeholder="Technician or Vendor Name"
                                    />
                                </div>
                                <div className="mt-5 sm:mt-6">
                                    <Button
                                        type="submit"
                                        loading={loading}
                                        className="w-full"
                                    >
                                        {loading ? 'Saving...' : 'Save Log'}
                                    </Button>
                                </div>
                            </form>
                        </Dialog.Panel>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    )
}
