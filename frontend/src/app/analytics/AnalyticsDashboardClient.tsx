"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    UsersIcon,
    UserPlusIcon,
    ArrowTrendingDownIcon,
    CurrencyDollarIcon,
    ArrowRightIcon,
    ChartBarIcon,
    ArrowPathIcon
} from '@heroicons/react/24/outline'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/features/auth'
import { getDashboardMetrics, getDepartmentStats, type DashboardMetrics, type DepartmentStat } from '@/features/analytics'
import Sidebar from '@/components/ui/Sidebar'
import Header from '@/components/ui/Header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/FormComponents'

interface AnalyticsDashboardClientProps {
    initialMetrics: DashboardMetrics | null;
    initialDeptStats: DepartmentStat[] | [];
}

export function AnalyticsDashboardClient({ initialMetrics, initialDeptStats }: AnalyticsDashboardClientProps) {
    const router = useRouter()
    const { token } = useAuth()
    const [period, setPeriod] = useState('30')

    const { data: metrics, isLoading: metricsLoading, refetch: refetchMetrics } = useQuery({
        queryKey: ['analytics-metrics', period, token],
        queryFn: () => getDashboardMetrics({
            startDate: new Date(new Date().setDate(new Date().getDate() - parseInt(period))).toISOString(),
            endDate: new Date().toISOString()
        }, token ?? undefined),
        initialData: initialMetrics || undefined
    })

    const { data: deptStats = [], isLoading: deptsLoading, refetch: refetchDepts } = useQuery({
        queryKey: ['analytics-departments', token],
        queryFn: () => getDepartmentStats(token ?? undefined),
        initialData: initialDeptStats
    })

    const handleRefresh = () => {
        refetchMetrics()
        refetchDepts()
    }

    const kpis = [
        {
            name: 'Total Employees',
            value: metrics?.totalEmployees ?? 0,
            icon: UsersIcon,
            color: 'text-blue-600',
            bg: 'bg-blue-100'
        },
        {
            name: 'Active Employees',
            value: metrics?.activeEmployees ?? 0,
            icon: UsersIcon,
            color: 'text-green-600',
            bg: 'bg-green-100'
        },
        {
            name: 'New Hires',
            value: metrics?.newHires ?? 0,
            icon: UserPlusIcon,
            color: 'text-purple-600',
            bg: 'bg-purple-100'
        },
        {
            name: 'Turnover Rate',
            value: `${metrics?.turnoverRate ?? 0}%`,
            icon: ArrowTrendingDownIcon,
            color: 'text-orange-600',
            bg: 'bg-orange-100'
        },
        {
            name: 'Avg. Monthly Salary',
            value: `$${(metrics?.avgSalary ?? 0).toLocaleString()}`,
            icon: CurrencyDollarIcon,
            color: 'text-emerald-600',
            bg: 'bg-emerald-100'
        }
    ]

    const totalDeptEmployees = deptStats.reduce((acc, current) => acc + current._count.employees, 0)

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <Header />
                <main className="flex-1 p-6">
                    <div className="max-w-7xl mx-auto">
                        {/* Header Section */}
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Organization Analytics</h1>
                                <p className="mt-1 text-sm text-gray-500">Comprehensive overview of company workforce and performance.</p>
                            </div>
                            <div className="mt-4 md:mt-0 flex items-center space-x-3">
                                <select
                                    value={period}
                                    onChange={(e) => setPeriod(e.target.value)}
                                    className="rounded-md border-gray-300 py-2 pl-3 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                                >
                                    <option value="7">Last 7 days</option>
                                    <option value="30">Last 30 days</option>
                                    <option value="90">Last 90 days</option>
                                    <option value="365">Last year</option>
                                </select>
                                <Button onClick={handleRefresh} variant="secondary" className="flex items-center gap-2">
                                    <ArrowPathIcon className={`w-4 h-4 ${(metricsLoading || deptsLoading) ? 'animate-spin' : ''}`} />
                                    Refresh
                                </Button>
                            </div>
                        </div>

                        {/* KPI Grid */}
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 mb-10">
                            {kpis.map((item) => (
                                <Card key={item.name} className="border-none shadow-md hover:shadow-lg transition-all duration-300 bg-white group">
                                    <CardContent className="p-6">
                                        <div className="flex flex-col space-y-4">
                                            <div className={`p-3 rounded-xl w-fit transition-transform group-hover:scale-110 duration-300 ${item.bg}`}>
                                                <item.icon className={`h-6 w-6 ${item.color}`} aria-hidden="true" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{item.name}</p>
                                                <p className="text-2xl font-black text-gray-900 mt-1">{item.value}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Department Distribution */}
                            <Card className="lg:col-span-2 border-none shadow-sm">
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <ChartBarIcon className="w-5 h-5 text-blue-600" />
                                        Department Distribution
                                    </CardTitle>
                                    <CardDescription>Workforce breakdown by department</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-5">
                                        {deptStats.length === 0 ? (
                                            <p className="text-center py-10 text-gray-500 italic">No department data available</p>
                                        ) : (
                                            deptStats.map((dept) => {
                                                const percentage = totalDeptEmployees > 0 ? (dept._count.employees / totalDeptEmployees) * 100 : 0
                                                return (
                                                    <div key={dept.id}>
                                                        <div className="flex justify-between items-center mb-1.5">
                                                            <span className="text-sm font-semibold text-gray-700">{dept.name}</span>
                                                            <span className="text-xs font-bold text-gray-500">
                                                                {dept._count.employees} employees ({percentage.toFixed(1)}%)
                                                            </span>
                                                        </div>
                                                        <div className="w-full bg-gray-100 rounded-full h-3">
                                                            <div
                                                                className="bg-blue-600 h-3 rounded-full transition-all duration-700 ease-out"
                                                                style={{ width: `${percentage}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                )
                                            })
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Quick Actions & Links */}
                            <div className="space-y-6">
                                <Card className="border-none shadow-sm bg-gradient-to-br from-red-500 to-orange-600 text-white">
                                    <CardHeader>
                                        <CardTitle className="text-lg">Burnout Risk</CardTitle>
                                        <CardDescription className="text-white/80">AI-driven wellbeing analysis</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm mb-6">Identify team members at risk of burnout based on work patterns and engagement.</p>
                                        <Button
                                            onClick={() => router.push('/analytics/burnout')}
                                            className="w-full bg-white/20 hover:bg-white/30 border-none text-white font-semibold flex items-center justify-center gap-2"
                                        >
                                            View Burnout Report
                                            <ArrowRightIcon className="w-4 h-4" />
                                        </Button>
                                    </CardContent>
                                </Card>

                                <Card className="border-none shadow-sm h-[calc(100%-190px)]">
                                    <CardHeader>
                                        <CardTitle className="text-lg">Growth Insights</CardTitle>
                                        <CardDescription>Hiring trends and projections</CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex flex-col items-center justify-center pt-8">
                                        <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mb-4 border-2 border-dashed border-gray-200">
                                            <ArrowTrendingDownIcon className="w-10 h-10 text-gray-300" />
                                        </div>
                                        <p className="text-sm text-gray-500 text-center px-4">Historical growth trends will appear here as the system gathers more data over time.</p>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
}
