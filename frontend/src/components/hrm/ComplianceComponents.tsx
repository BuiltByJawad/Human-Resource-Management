import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input, TextArea, Select } from '@/components/ui/FormComponents'
import { DataTable, Column } from '@/components/ui/DataTable'
import { PencilSquareIcon, TrashIcon, PlayIcon } from '@heroicons/react/24/outline'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'

export interface ComplianceRule {
    id: string
    name: string
    description?: string
    type: string
    threshold: number
    isActive: boolean
}

export interface ComplianceLog {
    id: string
    violationDate: string
    details: string
    status: string
    employee: {
        firstName: string
        lastName: string
        department?: {
            name: string
        }
    }
    rule: {
        name: string
    }
}

interface RuleFormProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (data: Partial<ComplianceRule>) => Promise<void>
    loading?: boolean
}

const ruleSchema = yup.object().shape({
    name: yup.string().required('Rule name is required'),
    description: yup.string(),
    type: yup.string().required('Rule type is required'),
    threshold: yup.number().required('Threshold is required').min(0, 'Threshold must be positive')
})

type RuleFormData = yup.InferType<typeof ruleSchema>

export const RuleForm = ({ isOpen, onClose, onSubmit, loading }: RuleFormProps) => {
    const { register, handleSubmit, control, reset, formState: { errors } } = useForm<RuleFormData>({
        resolver: yupResolver(ruleSchema) as any,
        defaultValues: {
            name: '',
            description: '',
            type: 'max_hours_per_week',
            threshold: 48
        }
    })

    const onFormSubmit = async (data: RuleFormData) => {
        await onSubmit(data)
        reset()
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add Compliance Rule">
            <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 pb-32">
                <Input
                    label="Rule Name"
                    placeholder="e.g. Max Hours Per Week"
                    required
                    error={errors.name?.message}
                    {...register('name')}
                />
                <TextArea
                    label="Description"
                    placeholder="Description of the rule"
                    error={errors.description?.message}
                    {...register('description')}
                />
                <Controller
                    control={control}
                    name="type"
                    render={({ field }) => (
                        <Select
                            label="Rule Type"
                            value={field.value}
                            onChange={field.onChange}
                            options={[
                                { value: 'max_hours_per_week', label: 'Max Hours Per Week' },
                                // Add more types as backend supports them
                            ]}
                            required
                            error={errors.type?.message}
                        />
                    )}
                />
                <Input
                    label="Threshold (Hours)"
                    type="number"
                    required
                    error={errors.threshold?.message}
                    {...register('threshold')}
                />
                <div className="flex justify-end space-x-3 pt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? 'Saving...' : 'Create Rule'}
                    </button>
                </div>
            </form>
        </Modal>
    )
}

interface RuleListProps {
    rules: ComplianceRule[]
    onToggle: (id: string) => void
}

export const RuleList = ({ rules, onToggle }: RuleListProps) => {
    const columns: Column<ComplianceRule>[] = [
        { header: 'Name', key: 'name' },
        { header: 'Type', key: 'type' },
        { header: 'Threshold', key: 'threshold', render: (val) => `${val} hours` },
        {
            header: 'Status',
            key: 'isActive',
            render: (val, rule) => (
                <button
                    onClick={() => onToggle(rule.id)}
                    className={`px-2 py-1 rounded-full text-xs font-medium ${val ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}
                >
                    {val ? 'Active' : 'Inactive'}
                </button>
            )
        }
    ]

    return <DataTable data={rules} columns={columns} searchKeys={['name', 'type']} />
}

interface ViolationLogProps {
    logs: ComplianceLog[]
}

export const ViolationLog = ({ logs }: ViolationLogProps) => {
    const columns: Column<ComplianceLog>[] = [
        {
            header: 'Date',
            key: 'violationDate',
            render: (val) => new Date(val).toLocaleDateString()
        },
        {
            header: 'Employee',
            key: 'employee',
            render: (val: any) => `${val.firstName} ${val.lastName}`
        },
        {
            header: 'Rule',
            key: 'rule',
            render: (val: any) => val.name
        },
        { header: 'Details', key: 'details' },
        {
            header: 'Status',
            key: 'status',
            render: (val) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${val === 'open' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                    {val.toUpperCase()}
                </span>
            )
        }
    ]

    return <DataTable data={logs} columns={columns} searchKeys={['employee.firstName', 'employee.lastName', 'rule.name', 'details', 'status']} />
}
