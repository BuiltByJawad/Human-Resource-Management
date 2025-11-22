import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input, TextArea, Select } from '@/components/ui/FormComponents'
import { DataTable, Column } from '@/components/ui/DataTable'
import { PencilSquareIcon, TrashIcon, PlayIcon } from '@heroicons/react/24/outline'

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

export const RuleForm = ({ isOpen, onClose, onSubmit, loading }: RuleFormProps) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        type: 'max_hours_per_week',
        threshold: 48
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        await onSubmit(formData)
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add Compliance Rule">
            <form onSubmit={handleSubmit} className="space-y-4 pb-32">
                <Input
                    label="Rule Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                />
                <TextArea
                    label="Description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
                <Select
                    label="Rule Type"
                    value={formData.type}
                    onChange={(value) => setFormData({ ...formData, type: value })}
                    options={[
                        { value: 'max_hours_per_week', label: 'Max Hours Per Week' },
                        // Add more types as backend supports them
                    ]}
                />
                <Input
                    label="Threshold (Hours)"
                    type="number"
                    value={formData.threshold}
                    onChange={(e) => setFormData({ ...formData, threshold: parseInt(e.target.value) })}
                    required
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

    return <DataTable data={rules} columns={columns} />
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

    return <DataTable data={logs} columns={columns} />
}
