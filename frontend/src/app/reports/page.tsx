'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import axios from 'axios';
import { DataTable, Column } from '@/components/ui/DataTable';
import { ReportFilters, DashboardStats, SummaryCard, ExportButton } from '@/components/reports/ReportsComponents';
import { ArrowLeftIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

type TabType = 'overview' | 'employees' | 'attendance' | 'leave' | 'payroll';

function LoadingSkeleton() {
    return (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
                    <div className="h-8 bg-gray-300 rounded w-16"></div>
                </div>
            ))}
        </div>
    );
}

function TableSkeleton() {
    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden animate-pulse">
            <div className="p-4 border-b border-gray-200">
                <div className="h-10 bg-gray-200 rounded w-64"></div>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            {[1, 2, 3, 4, 5].map((i) => (
                                <th key={i} className="px-6 py-3">
                                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <tr key={i}>
                                {[1, 2, 3, 4, 5].map((j) => (
                                    <td key={j} className="px-6 py-4">
                                        <div className="h-4 bg-gray-100 rounded w-24"></div>
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No data available</h3>
            <p className="mt-1 text-sm text-gray-500">{message}</p>
        </div>
    );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
    return (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
            <ExclamationCircleIcon className="mx-auto h-12 w-12 text-red-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Load Data</h3>
            <p className="text-sm text-gray-500 mb-6">{message}</p>
            <button
                onClick={onRetry}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
                Try Again
            </button>
        </div>
    );
}

export default function ReportsPage() {
    const router = useRouter();
    const { token } = useAuthStore();
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [departmentId, setDepartmentId] = useState('');
    const [departments, setDepartments] = useState<Array<{ value: string; label: string }>>([]);

    const [dashboardData, setDashboardData] = useState<any>(null);
    const [employeesData, setEmployeesData] = useState<any[]>([]);
    const [attendanceData, setAttendanceData] = useState<any>(null);
    const [leaveData, setLeaveData] = useState<any>(null);
    const [payrollData, setPayrollData] = useState<any>(null);

    const fetchDepartments = useCallback(async () => {
        try {
            const response = await axios.get(`${API_URL}/departments`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDepartments(response.data.map((dept: any) => ({
                value: dept.id,
                label: dept.name
            })));
        } catch (error) {
            console.error('Error fetching departments:', error);
        }
    }, [token]);

    const fetchDashboardData = useCallback(async () => {
        if (!token) return;

        setIsLoading(true);
        setError(null);
        try {
            const response = await axios.get(`${API_URL}/reports/dashboard`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDashboardData(response.data.data);
        } catch (error: any) {
            console.error('Error fetching dashboard data:', error);
            const errorMsg = error.response?.status === 403
                ? 'You don\'t have permission to view reports'
                : error.response?.data?.message || 'Failed to load dashboard data';
            setError(errorMsg);
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    const fetchTabData = useCallback(async () => {
        if (activeTab === 'overview') {
            fetchDashboardData();
            return;
        }

        // Security guard: prevent fetching if we already have cached data and no filters
        const hasData = activeTab === 'employees' ? employeesData.length > 0 :
            activeTab === 'attendance' ? attendanceData !== null :
                activeTab === 'leave' ? leaveData !== null :
                    activeTab === 'payroll' ? payrollData !== null : false;

        if (hasData && !startDate && !endDate && !departmentId) {
            // We have cached data and no filters, just exit
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (startDate) params.append('startDate', startDate.toISOString());
            if (endDate) params.append('endDate', endDate.toISOString());
            if (departmentId) params.append('departmentId', departmentId);

            const endpoint = `/reports/${activeTab}`;
            const response = await axios.get(`${API_URL}${endpoint}?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            switch (activeTab) {
                case 'employees':
                    setEmployeesData(response.data.data || response.data);
                    break;
                case 'attendance':
                    setAttendanceData(response.data.data);
                    break;
                case 'leave':
                    setLeaveData(response.data.data);
                    break;
                case 'payroll':
                    setPayrollData(response.data.data);
                    break;
            }
        } catch (error: any) {
            console.error(`Error fetching ${activeTab} data:`, error);
            const errorMsg = error.response?.status === 403
                ? 'You don\'t have permission to view this report'
                : error.response?.data?.message || `Failed to load ${activeTab} data`;
            setError(errorMsg);
        } finally {
            setIsLoading(false);
        }
    }, [activeTab, employeesData.length, attendanceData, leaveData, payrollData, startDate, endDate, departmentId, token, fetchDashboardData]);

    useEffect(() => {
        if (!token) {
            setError('Please log in to access reports');
            return;
        }
        fetchDepartments();
    }, [token, fetchDepartments]);

    useEffect(() => {
        if (!token) return;

        const hasData = activeTab === 'overview' ? dashboardData !== null :
            activeTab === 'employees' ? employeesData.length > 0 :
                activeTab === 'attendance' ? attendanceData !== null :
                    activeTab === 'leave' ? leaveData !== null :
                        activeTab === 'payroll' ? payrollData !== null : false;

        if (!hasData) {
            fetchTabData();
        } else {
            setIsLoading(false);
        }
    }, [activeTab, token, fetchTabData, dashboardData, employeesData.length, attendanceData, leaveData, payrollData]);

    useEffect(() => {
        if (!token || activeTab === 'overview') return;
        fetchTabData();
    }, [startDate, endDate, departmentId, activeTab, token, fetchTabData]);

    const handleExportCSV = async () => {
        try {
            const params = new URLSearchParams();
            if (startDate) params.append('startDate', startDate.toISOString());
            if (endDate) params.append('endDate', endDate.toISOString());
            if (departmentId) params.append('departmentId', departmentId);
            params.append('format', 'csv');

            const response = await axios.get(`${API_URL}/reports/employees?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `employees_${format(new Date(), 'yyyy-MM-dd')}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Error exporting CSV:', error);
        }
    };

    const tabs = [
        { id: 'overview' as TabType, name: 'Overview', description: 'Dashboard metrics' },
        { id: 'employees' as TabType, name: 'Employees', description: 'Employee directory' },
        { id: 'attendance' as TabType, name: 'Attendance', description: 'Clock records' },
        { id: 'leave' as TabType, name: 'Leave', description: 'Leave requests' },
        { id: 'payroll' as TabType, name: 'Payroll', description: 'Salary records' },
    ];

    const employeeColumns: Column<any>[] = [
        { key: 'employeeNumber', header: 'Employee #' },
        { key: 'name', header: 'Name', render: (_, item) => `${item.firstName} ${item.lastName}` },
        { key: 'email', header: 'Email' },
        { key: 'department', header: 'Department', render: (_, item) => item.department?.name || 'N/A' },
        { key: 'hireDate', header: 'Hire Date', render: (value) => format(new Date(value), 'MMM dd, yyyy') },
        { key: 'salary', header: 'Salary', render: (value) => `$${Number(value).toLocaleString()}` },
        {
            key: 'status',
            header: 'Status',
            render: (value) => (
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${value === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                    {value}
                </span>
            )
        }
    ];

    const attendanceColumns: Column<any>[] = [
        { key: 'employee', header: 'Employee', render: (_, item) => `${item.employee?.firstName} ${item.employee?.lastName}` },
        { key: 'checkIn', header: 'Check In', render: (value) => format(new Date(value), 'MMM dd, yyyy HH:mm') },
        { key: 'checkOut', header: 'Check Out', render: (value) => value ? format(new Date(value), 'HH:mm') : 'N/A' },
        { key: 'workHours', header: 'Work Hours', render: (value) => value ? `${Number(value).toFixed(2)}h` : 'N/A' },
        {
            key: 'status',
            header: 'Status',
            render: (value) => (
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${value === 'present' ? 'bg-green-100 text-green-800' :
                    value === 'late' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                    }`}>
                    {value}
                </span>
            )
        }
    ];

    const leaveColumns: Column<any>[] = [
        { key: 'employee', header: 'Employee', render: (_, item) => `${item.employee?.firstName} ${item.employee?.lastName}` },
        { key: 'leaveType', header: 'Type' },
        { key: 'startDate', header: 'Start Date', render: (value) => format(new Date(value), 'MMM dd, yyyy') },
        { key: 'daysRequested', header: 'Days' },
        {
            key: 'status',
            header: 'Status',
            render: (value) => (
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${value === 'approved' ? 'bg-green-100 text-green-800' :
                    value === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                    }`}>
                    {value}
                </span>
            )
        }
    ];

    const payrollColumns: Column<any>[] = [
        { key: 'employee', header: 'Employee', render: (_, item) => `${item.employee?.firstName} ${item.employee?.lastName}` },
        { key: 'baseSalary', header: 'Base Salary', render: (value) => `$${Number(value).toLocaleString()}` },
        { key: 'allowances', header: 'Allowances', render: (value) => `$${Number(value).toLocaleString()}` },
        { key: 'deductions', header: 'Deductions', render: (value) => `$${Number(value).toLocaleString()}` },
        { key: 'netSalary', header: 'Net Salary', render: (value) => `$${Number(value).toLocaleString()}` }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-start space-x-4">
                        <button
                            onClick={() => router.back()}
                            className="mt-1 p-2 rounded-full hover:bg-gray-200 transition-colors text-gray-500 hover:text-gray-900"
                        >
                            <ArrowLeftIcon className="h-6 w-6" />
                        </button>
                        <div>
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent tracking-tight">
                                Reports & Analytics
                            </h1>
                            <p className="mt-2 text-sm text-gray-600 font-medium">
                                Comprehensive insights and data exports for your organization
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
                    <nav className="flex overflow-x-auto">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                disabled={activeTab === tab.id}
                                onClick={() => {
                                    if (activeTab === tab.id) return;
                                    setError(null);
                                    setIsLoading(true);
                                    setActiveTab(tab.id);
                                }}
                                className={`flex-1 min-w-fit px-6 py-4 text-sm font-medium transition-all duration-200 border-b-2 ${activeTab === tab.id
                                    ? 'border-blue-500 text-blue-600 bg-blue-50/50 cursor-default'
                                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50 cursor-pointer'
                                    }`}
                            >
                                <div className="flex flex-col items-center space-y-1">
                                    <span>{tab.name}</span>
                                    <span className="text-xs text-gray-500 font-normal">{tab.description}</span>
                                </div>
                            </button>
                        ))}
                    </nav>
                </div>

                {error ? (
                    <ErrorState message={error} onRetry={() => fetchTabData()} />
                ) : (
                    <>
                        {activeTab === 'overview' && (
                            <>
                                {isLoading ? (
                                    <LoadingSkeleton />
                                ) : dashboardData ? (
                                    <DashboardStats
                                        totalEmployees={dashboardData?.metrics?.totalEmployees ?? 0}
                                        presentToday={dashboardData?.metrics?.presentToday ?? 0}
                                        pendingLeaves={dashboardData?.metrics?.pendingLeaves ?? 0}
                                        monthlyPayroll={dashboardData?.metrics?.monthlyPayroll ?? 0}
                                    />
                                ) : null}
                            </>
                        )}

                        {activeTab !== 'overview' && (
                            <ReportFilters
                                startDate={startDate}
                                endDate={endDate}
                                departmentId={departmentId}
                                onStartDateChange={setStartDate}
                                onEndDateChange={setEndDate}
                                onDepartmentChange={setDepartmentId}
                                departments={departments}
                            />
                        )}

                        {activeTab === 'employees' && (
                            <div>
                                {!isLoading && employeesData.length > 0 && (
                                    <div className="flex justify-end mb-4">
                                        <ExportButton onClick={handleExportCSV} />
                                    </div>
                                )}
                                {isLoading ? (
                                    <TableSkeleton />
                                ) : employeesData.length === 0 ? (
                                    <EmptyState message="No employees found. Try adjusting your filters." />
                                ) : (
                                    <DataTable
                                        data={employeesData}
                                        columns={employeeColumns}
                                        loading={false}
                                        searchKeys={['firstName', 'lastName', 'email', 'employeeNumber', 'department.name']}
                                    />
                                )}
                            </div>
                        )}

                        {activeTab === 'attendance' && (
                            <div>
                                {isLoading ? (
                                    <TableSkeleton />
                                ) : !attendanceData || attendanceData.attendance?.length === 0 ? (
                                    <EmptyState message="No attendance records found. Try adjusting your filters." />
                                ) : (
                                    <>
                                        {attendanceData.summary && (
                                            <div className="mb-6">
                                                <SummaryCard
                                                    title="Attendance Summary"
                                                    data={{
                                                        'Total Records': attendanceData.summary.totalRecords,
                                                        'Present Days': attendanceData.summary.presentDays,
                                                        'Absent Days': attendanceData.summary.absentDays,
                                                        'Late Days': attendanceData.summary.lateDays,
                                                        'Total Work Hours': `${attendanceData.summary.totalWorkHours.toFixed(2)}h`,
                                                        'Total Overtime': `${attendanceData.summary.totalOvertimeHours.toFixed(2)}h`
                                                    }}
                                                />
                                            </div>
                                        )}
                                        <DataTable
                                            data={attendanceData.attendance}
                                            columns={attendanceColumns}
                                            loading={false}
                                        />
                                    </>
                                )}
                            </div>
                        )}

                        {activeTab === 'leave' && (
                            <div>
                                {isLoading ? (
                                    <TableSkeleton />
                                ) : !leaveData || leaveData.leaveRequests?.length === 0 ? (
                                    <EmptyState message="No leave requests found. Try adjusting your filters." />
                                ) : (
                                    <>
                                        {leaveData.summary && (
                                            <div className="mb-6">
                                                <SummaryCard
                                                    title="Leave Summary"
                                                    data={{
                                                        'Total Requests': leaveData.summary.totalRequests,
                                                        'Approved': leaveData.summary.approvedRequests,
                                                        'Pending': leaveData.summary.pendingRequests,
                                                        'Rejected': leaveData.summary.rejectedRequests,
                                                        'Total Days Requested': leaveData.summary.totalDaysRequested
                                                    }}
                                                />
                                            </div>
                                        )}
                                        <DataTable
                                            data={leaveData.leaveRequests}
                                            columns={leaveColumns}
                                            loading={false}
                                        />
                                    </>
                                )}
                            </div>
                        )}

                        {activeTab === 'payroll' && (
                            <div>
                                {isLoading ? (
                                    <TableSkeleton />
                                ) : !payrollData || payrollData.payrollRecords?.length === 0 ? (
                                    <EmptyState message="No payroll records found. Try adjusting your filters." />
                                ) : (
                                    <>
                                        {payrollData.summary && (
                                            <div className="mb-6">
                                                <SummaryCard
                                                    title="Payroll Summary"
                                                    data={{
                                                        'Total Records': payrollData.summary.totalRecords,
                                                        'Total Base Salary': `$${payrollData.summary.totalBaseSalary.toLocaleString()}`,
                                                        'Total Allowances': `$${payrollData.summary.totalAllowances.toLocaleString()}`,
                                                        'Total Deductions': `$${payrollData.summary.totalDeductions.toLocaleString()}`,
                                                        'Total Net Salary': `$${payrollData.summary.totalNetSalary.toLocaleString()}`
                                                    }}
                                                />
                                            </div>
                                        )}
                                        <DataTable
                                            data={payrollData.payrollRecords}
                                            columns={payrollColumns}
                                            loading={false}
                                        />
                                    </>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
