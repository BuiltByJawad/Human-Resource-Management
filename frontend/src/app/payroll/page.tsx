'use client'

import { useState, useEffect } from 'react'
import { DataTable, Column } from '@/components/ui/DataTable'
import { PayslipModal } from '@/components/hrm/PayslipModal'
import { BanknotesIcon, CheckCircleIcon, ClockIcon, DocumentTextIcon } from '@heroicons/react/24/outline'

export default function PayrollPage() {
    const [records, setRecords] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedPayroll, setSelectedPayroll] = useState<any>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [stats, setStats] = useState({ totalCost: 0, pendingCount: 0, processedCount: 0 })

    const fetchPayroll = async () => {
        try {
            setLoading(true)
            const token = localStorage.getItem('token')
            const res = await fetch('http://localhost:5000/api/payroll', {
                headers: { Authorization: `Bearer ${token}` }
            })
            const data = await res.json()

            if (Array.isArray(data)) {
                setRecords(data)
                // Calculate stats
                const total = data.reduce((acc: number, curr: any) => acc + Number(curr.netSalary), 0)
                const pending = data.filter((r: any) => r.status === 'draft').length
                const processed = data.filter((r: any) => r.status === 'paid').length
                setStats({ totalCost: total, pendingCount: pending, processedCount: processed })
            } else {
                console.error('Invalid payroll data:', data)
                setRecords([])
            }
        } catch (error) {
            console.error('Failed to fetch payroll', error)
            setRecords([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchPayroll()
    }, [])

    const handleGenerate = async () => {
        const payPeriod = prompt('Enter Pay Period (YYYY-MM):', new Date().toISOString().slice(0, 7))
        if (!payPeriod) return

        try {
            const token = localStorage.getItem('token')
            const res = await fetch('http://localhost:5000/api/payroll/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ payPeriod })
            })

            if (res.ok) {
                alert('Payroll generated successfully!')
                fetchPayroll()
            } else {
                const errData = await res.json()
                alert(`Failed to generate payroll: ${errData.details || 'Unknown error'}`)
            }
        } catch (error) {
            console.error('Error generating payroll', error)
        }
    }

    const handleStatusUpdate = async (id: string, status: string) => {
        if (!confirm(`Mark this record as ${status}?`)) return

        try {
            const token = localStorage.getItem('token')
            await fetch(`http://localhost:5000/api/payroll/${id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ status })
            })
            fetchPayroll()
        } catch (error) {
            console.error('Error updating status', error)
        }
    }

    const columns: Column<any>[] = [
        {
            header: 'Employee',
            key: 'employee',
            render: (_, record) => (
                <div>
                    <div className="font-medium text-gray-900">{record.employee.firstName} {record.employee.lastName}</div>
                    <div className="text-xs text-gray-500">{record.employee.employeeNumber}</div>
                </div>
            )
        },
        {
            header: 'Period',
            key: 'payPeriod',
            render: (val) => <span className="font-mono text-sm">{val}</span>
        },
        {
            header: 'Net Salary',
            key: 'netSalary',
            render: (val) => <span className="font-semibold text-gray-900">${Number(val).toFixed(2)}</span>
        },
        {
            header: 'Status',
            key: 'status',
            render: (val) => {
                const colors: any = {
                    draft: 'bg-yellow-100 text-yellow-800',
                    processed: 'bg-blue-100 text-blue-800',
                    paid: 'bg-green-100 text-green-800',
                    error: 'bg-red-100 text-red-800'
                }
                return (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[val] || 'bg-gray-100'}`}>
                        {val.toUpperCase()}
                    </span>
                )
            }
        },
        {
            header: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <div className="flex space-x-2 justify-end">
                    <button
                        onClick={() => { setSelectedPayroll(record); setIsModalOpen(true) }}
                        className="text-blue-600 hover:text-blue-900 p-1"
                        title="View Payslip"
                    >
                        <DocumentTextIcon className="h-5 w-5" />
                    </button>
                    {record.status === 'draft' && (
                        <button
                            onClick={() => handleStatusUpdate(record.id, 'paid')}
                            className="text-green-600 hover:text-green-900 p-1"
                            title="Mark as Paid"
                        >
                            <CheckCircleIcon className="h-5 w-5" />
                        </button>
                    )}
                </div>
            )
        }
    ]

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Payroll Management</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage salaries, payslips, and payments.</p>
                </div>
                <button
                    onClick={handleGenerate}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center shadow-lg shadow-blue-900/20 transition-all hover:scale-105 active:scale-95"
                >
                    <BanknotesIcon className="h-5 w-5 mr-2" />
                    Generate Payroll
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Cost (Period)</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">${stats.totalCost.toFixed(2)}</p>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                            <BanknotesIcon className="h-6 w-6" />
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Pending Approvals</p>
                            <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.pendingCount}</p>
                        </div>
                        <div className="p-3 bg-yellow-50 rounded-xl text-yellow-600">
                            <ClockIcon className="h-6 w-6" />
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Processed</p>
                            <p className="text-2xl font-bold text-green-600 mt-1">{stats.processedCount}</p>
                        </div>
                        <div className="p-3 bg-green-50 rounded-xl text-green-600">
                            <CheckCircleIcon className="h-6 w-6" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Payroll Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200 bg-gray-50/50 flex justify-between items-center">
                    <h3 className="font-semibold text-gray-900">Payroll Records</h3>
                    <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded border">
                        {records.length} records found
                    </span>
                </div>
                <DataTable
                    data={records}
                    columns={columns}
                    loading={loading}
                    searchKeys={['payPeriod']}
                />
            </div>

            <PayslipModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                payroll={selectedPayroll}
            />
        </div>
    )
}
