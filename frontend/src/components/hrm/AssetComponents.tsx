import { useState, Fragment, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import {
    ComputerDesktopIcon,
    DevicePhoneMobileIcon,
    WrenchScrewdriverIcon,
    UserCircleIcon,
    XMarkIcon
} from '@heroicons/react/24/outline'
import { Button, Select, Input, TextArea, DatePicker } from '../ui/FormComponents'
import { CreatableSelect } from '../ui/CreatableSelect'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'

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
    const currentAssignment = (Array.isArray(asset.assignments) ? asset.assignments : []).find((a: any) => !a.returnedDate)

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

const assetSchema = yup.object().shape({
    name: yup.string().required('Asset name is required'),
    serialNumber: yup.string().required('Serial number is required'),
    type: yup.string().required('Type is required'),
    purchaseDate: yup.string().required('Purchase date is required'),
    purchasePrice: yup.number().nullable().transform((value, originalValue) => originalValue === '' ? null : value).notRequired()
})

type AssetFormData = yup.InferType<typeof assetSchema>

export const AssetForm = ({ isOpen, onClose, onSubmit, initialData }: AssetFormProps) => {
    const [loading, setLoading] = useState(false)

    const { register, handleSubmit, control, reset, formState: { errors } } = useForm<AssetFormData>({
        resolver: yupResolver(assetSchema) as any,
        defaultValues: {
            name: '',
            serialNumber: '',
            type: 'Laptop',
            purchaseDate: '',
            purchasePrice: null
        }
    })

    useEffect(() => {
        if (initialData) {
            reset({
                name: initialData.name,
                serialNumber: initialData.serialNumber,
                type: initialData.type,
                purchaseDate: initialData.purchaseDate ? new Date(initialData.purchaseDate).toISOString().split('T')[0] : '',
                purchasePrice: initialData.purchasePrice || null
            })
        } else {
            reset({
                name: '',
                serialNumber: '',
                type: 'Laptop',
                purchaseDate: '',
                purchasePrice: null
            })
        }
    }, [initialData, isOpen, reset])

    const onFormSubmit = async (data: AssetFormData) => {
        setLoading(true)
        try {
            await onSubmit(data)
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
                        <Dialog.Panel className="relative transform rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 max-h-[90vh] overflow-y-auto">
                            <div className="absolute right-0 top-0 pr-4 pt-4">
                                <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                                    <XMarkIcon className="h-6 w-6" />
                                </button>
                            </div>
                            <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900 mb-4">
                                {initialData ? 'Edit Asset' : 'Add New Asset'}
                            </Dialog.Title>
                            <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
                                <div>
                                    <Input
                                        label="Asset Name"
                                        placeholder="e.g. MacBook Pro M3"
                                        required
                                        error={errors.name?.message}
                                        {...register('name')}
                                    />
                                </div>
                                <div>
                                    <Input
                                        label="Serial Number"
                                        required
                                        error={errors.serialNumber?.message}
                                        {...register('serialNumber')}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Controller
                                            control={control}
                                            name="type"
                                            render={({ field }) => (
                                                <CreatableSelect
                                                    label="Type"
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                    options={ASSET_TYPES}
                                                    required
                                                    error={errors.type?.message}
                                                />
                                            )}
                                        />
                                    </div>
                                    <div>
                                        <Input
                                            label="Price"
                                            type="number"
                                            placeholder="0.00"
                                            error={errors.purchasePrice?.message}
                                            {...register('purchasePrice')}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Controller
                                        control={control}
                                        name="purchaseDate"
                                        render={({ field }) => (
                                            <DatePicker
                                                label="Purchase Date"
                                                required
                                                value={field.value}
                                                onChange={(date) => field.onChange(date ? date.toISOString().split('T')[0] : '')}
                                                error={errors.purchaseDate?.message}
                                            />
                                        )}
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

const assignmentSchema = yup.object().shape({
    employeeId: yup.string().required('Employee is required'),
    notes: yup.string()
})

type AssignmentFormData = yup.InferType<typeof assignmentSchema>

export const AssignmentModal = ({ isOpen, onClose, onAssign, employees }: AssignmentModalProps) => {
    const [loading, setLoading] = useState(false)

    const { register, handleSubmit, control, reset, formState: { errors } } = useForm<AssignmentFormData>({
        resolver: yupResolver(assignmentSchema) as any,
        defaultValues: {
            employeeId: '',
            notes: ''
        }
    })

    useEffect(() => {
        if (!isOpen) {
            reset()
        }
    }, [isOpen, reset])

    const onFormSubmit = async (data: AssignmentFormData) => {
        setLoading(true)
        try {
            await onAssign(data.employeeId, data.notes || '')
            onClose()
        } finally {
            setLoading(false)
        }
    }

    const employeeOptions = (Array.isArray(employees) ? employees : []).map(emp => ({
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
                            <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
                                <div>
                                    <Controller
                                        control={control}
                                        name="employeeId"
                                        render={({ field }) => (
                                            <Select
                                                label="Select Employee"
                                                value={field.value}
                                                onChange={field.onChange}
                                                options={employeeOptions}
                                                required
                                                placeholder="Select an employee..."
                                                error={errors.employeeId?.message}
                                            />
                                        )}
                                    />
                                </div>
                                <div>
                                    <TextArea
                                        label="Notes"
                                        placeholder="Condition, accessories included, etc."
                                        rows={3}
                                        error={errors.notes?.message}
                                        {...register('notes')}
                                    />
                                </div>
                                <div className="mt-5 sm:mt-6">
                                    <Button
                                        type="submit"
                                        loading={loading}
                                        className="w-full"
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

const maintenanceSchema = yup.object().shape({
    description: yup.string().required('Description is required'),
    cost: yup.number().nullable().transform((value, originalValue) => originalValue === '' ? null : value),
    date: yup.string().required('Date is required'),
    performedBy: yup.string()
})

type MaintenanceFormData = yup.InferType<typeof maintenanceSchema>

export const MaintenanceModal = ({ isOpen, onClose, onSubmit }: MaintenanceModalProps) => {
    const [loading, setLoading] = useState(false)

    const { register, handleSubmit, control, reset, formState: { errors } } = useForm<MaintenanceFormData>({
        resolver: yupResolver(maintenanceSchema) as any,
        defaultValues: {
            description: '',
            cost: null,
            date: new Date().toISOString().split('T')[0],
            performedBy: ''
        }
    })

    useEffect(() => {
        if (!isOpen) {
            reset({
                description: '',
                cost: null,
                date: new Date().toISOString().split('T')[0],
                performedBy: ''
            })
        }
    }, [isOpen, reset])

    const onFormSubmit = async (data: MaintenanceFormData) => {
        setLoading(true)
        try {
            await onSubmit(data)
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
                            <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900 mb-4">
                                Log Maintenance
                            </Dialog.Title>
                            <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
                                <div>
                                    <TextArea
                                        label="Description"
                                        placeholder="Describe the issue and resolution..."
                                        rows={3}
                                        required
                                        error={errors.description?.message}
                                        {...register('description')}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Controller
                                            control={control}
                                            name="date"
                                            render={({ field }) => (
                                                <DatePicker
                                                    label="Date"
                                                    required
                                                    value={field.value}
                                                    onChange={(date) => field.onChange(date ? date.toISOString().split('T')[0] : '')}
                                                    error={errors.date?.message}
                                                />
                                            )}
                                        />
                                    </div>
                                    <div>
                                        <Input
                                            label="Cost"
                                            type="number"
                                            placeholder="0.00"
                                            error={errors.cost?.message}
                                            {...register('cost')}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Input
                                        label="Performed By"
                                        placeholder="Technician or Vendor Name"
                                        error={errors.performedBy?.message}
                                        {...register('performedBy')}
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
