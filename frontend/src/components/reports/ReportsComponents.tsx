'use client';

import { StatsCard } from '@/components/ui/DataTable';
import { DatePicker } from '@/components/ui/DatePicker';
import { Select } from '@/components/ui/CustomSelect';
import { UserGroupIcon, ClockIcon, DocumentTextIcon, BanknotesIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

interface ReportFiltersProps {
    startDate: Date | null;
    endDate: Date | null;
    departmentId: string;
    onStartDateChange: (date: Date | null) => void;
    onEndDateChange: (date: Date | null) => void;
    onDepartmentChange: (value: string) => void;
    departments: Array<{ value: string; label: string }>;
}

export function ReportFilters({
    startDate,
    endDate,
    departmentId,
    onStartDateChange,
    onEndDateChange,
    onDepartmentChange,
    departments
}: ReportFiltersProps) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6 transition-all duration-200 hover:shadow-md">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                <button
                    onClick={() => {
                        onStartDateChange(null);
                        onEndDateChange(null);
                        onDepartmentChange('');
                    }}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                    Clear All
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <DatePicker
                    label="Start Date"
                    value={startDate}
                    onChange={onStartDateChange}
                    maxDate={endDate || new Date()}
                />
                <DatePicker
                    label="End Date"
                    value={endDate}
                    onChange={onEndDateChange}
                    minDate={startDate || undefined}
                    maxDate={new Date()}
                />
                <Select
                    label="Department"
                    value={departmentId}
                    onChange={onDepartmentChange}
                    options={[{ value: '', label: 'All Departments' }, ...departments]}
                />
            </div>
        </div>
    );
}

interface DashboardStatsProps {
    totalEmployees: number;
    presentToday: number;
    pendingLeaves: number;
    monthlyPayroll: number;
}

export function DashboardStats({ totalEmployees, presentToday, pendingLeaves, monthlyPayroll }: DashboardStatsProps) {
    return (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <div className="group">
                <StatsCard
                    title="Total Employees"
                    value={totalEmployees}
                    icon={UserGroupIcon}
                    className="transition-all duration-200 hover:scale-105"
                />
            </div>
            <div className="group">
                <StatsCard
                    title="Present Today"
                    value={presentToday}
                    icon={ClockIcon}
                    className="transition-all duration-200 hover:scale-105"
                />
            </div>
            <div className="group">
                <StatsCard
                    title="Pending Leaves"
                    value={pendingLeaves}
                    icon={DocumentTextIcon}
                    className="transition-all duration-200 hover:scale-105"
                />
            </div>
            <div className="group">
                <StatsCard
                    title="Monthly Payroll"
                    value={`$${monthlyPayroll.toLocaleString()}`}
                    icon={BanknotesIcon}
                    className="transition-all duration-200 hover:scale-105"
                />
            </div>
        </div>
    );
}

interface SummaryCardProps {
    title: string;
    data: Record<string, number | string>;
}

export function SummaryCard({ title, data }: SummaryCardProps) {
    return (
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-sm border border-gray-100 p-6 transition-all duration-200 hover:shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <span className="h-1 w-8 bg-blue-500 rounded-full mr-3"></span>
                {title}
            </h3>
            <dl className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(data).map(([key, value]) => (
                    <div key={key} className="bg-white rounded-lg p-4 border border-gray-100 transition-all duration-200 hover:border-blue-200 hover:shadow-sm">
                        <dt className="text-xs text-gray-600 uppercase tracking-wide font-medium mb-1">
                            {key.replace(/_/g, ' ')}
                        </dt>
                        <dd className="text-xl font-bold text-gray-900">
                            {typeof value === 'number' ? value.toLocaleString() : value}
                        </dd>
                    </div>
                ))}
            </dl>
        </div>
    );
}

export function ExportButton({ onClick, loading }: { onClick: () => void; loading?: boolean }) {
    return (
        <button
            onClick={onClick}
            disabled={loading}
            className="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-md"
        >
            <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
            {loading ? 'Exporting...' : 'Export CSV'}
        </button>
    );
}
