'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon, ExclamationTriangleIcon, ChartBarIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import { RiskScoreCard, AtRiskList, WorkPatternChart } from '@/components/analytics/BurnoutComponents';
import { Select } from '@/components/ui/CustomSelect';
import { PERMISSIONS } from '@/constants/permissions';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function BurnoutAnalyticsPage() {
    const router = useRouter();
    const { user, token, hasPermission } = useAuthStore();
    const [analyticsData, setAnalyticsData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [period, setPeriod] = useState(30);

    const canViewAnalytics = !!user && hasPermission(PERMISSIONS.VIEW_ANALYTICS);

    useEffect(() => {
        const fetchAnalytics = async () => {
            setIsLoading(true);
            try {
                const response = await axios.get(`${API_URL}/analytics/burnout?period=${period}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setAnalyticsData(response.data);
            } catch (error) {
                console.error('Error fetching burnout analytics:', error);
                setAnalyticsData(null);
            } finally {
                setIsLoading(false);
            }
        };

        if (token && user) {
            if (!canViewAnalytics) {
                setIsLoading(false);
                return;
            }
            fetchAnalytics();
        }
    }, [token, user, period, canViewAnalytics]);

    if (user && !canViewAnalytics) {
        return (
            <div className="min-h-screen bg-gray-50/50 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                    <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-200">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                            <ExclamationTriangleIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
                        </div>
                        <h3 className="mt-2 text-sm font-semibold text-gray-900">Access Denied</h3>
                        <p className="mt-1 text-sm text-gray-500">You do not have permission to view this page.</p>
                        <div className="mt-6">
                            <button
                                type="button"
                                onClick={() => router.push('/dashboard')}
                                className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                            >
                                <ArrowLeftIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                                Go back to Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50/50 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                    <div className="animate-pulse space-y-8">
                        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
                            <div className="h-24 bg-gray-200 rounded-xl"></div>
                            <div className="h-24 bg-gray-200 rounded-xl"></div>
                            <div className="h-24 bg-gray-200 rounded-xl"></div>
                            <div className="h-24 bg-gray-200 rounded-xl"></div>
                        </div>
                        <div className="h-96 bg-gray-200 rounded-2xl"></div>
                    </div>
                </div>
            </div>
        );
    }

    // If no data after loading, show empty state
    if (!analyticsData) {
        return (
            <div className="min-h-screen bg-gray-50/50 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                    <div className="text-center py-20">
                        <ExclamationTriangleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to load analytics</h3>
                        <p className="text-gray-500">Please try refreshing the page or check your connection.</p>
                    </div>
                </div>
            </div>
        );
    }

    const { summary, employees } = analyticsData;

    const stats = [
        { name: 'Total Employees', value: summary.totalEmployees, icon: UserGroupIcon, color: 'text-blue-600', bg: 'bg-blue-100' },
        { name: 'Critical Risk', value: summary.criticalRisk, icon: ExclamationTriangleIcon, color: 'text-red-600', bg: 'bg-red-100' },
        { name: 'High Risk', value: summary.highRisk, icon: ExclamationTriangleIcon, color: 'text-orange-600', bg: 'bg-orange-100' },
        { name: 'Avg Risk Score', value: summary.avgRiskScore.toFixed(1), icon: ChartBarIcon, color: 'text-purple-600', bg: 'bg-purple-100' },
    ];

    return (
        <div className="min-h-screen bg-gray-50/50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
                    <div className="flex items-start space-x-4">
                        <button
                            onClick={() => router.back()}
                            className="mt-1 p-2 rounded-full hover:bg-gray-200 transition-colors text-gray-500 hover:text-gray-900"
                            aria-label="Go back"
                        >
                            <ArrowLeftIcon className="h-6 w-6" />
                        </button>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Burnout Risk Analytics</h1>
                            <p className="mt-1 text-sm text-gray-500">Monitor employee wellbeing and identify at-risk team members.</p>
                        </div>
                    </div>
                    <div className="mt-4 md:mt-0 w-48">
                        <Select
                            value={period.toString()}
                            onChange={(value) => setPeriod(Number(value))}
                            options={[
                                { value: '7', label: 'Last 7 days' },
                                { value: '30', label: 'Last 30 days' },
                                { value: '60', label: 'Last 60 days' },
                                { value: '90', label: 'Last 90 days' },
                            ]}
                        />
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-4 mb-10">
                    {stats.map((item) => (
                        <div key={item.name} className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-100 hover:shadow-md transition-shadow">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className={`flex-shrink-0 rounded-md p-3 ${item.bg}`}>
                                        <item.icon className={`h-6 w-6 ${item.color}`} aria-hidden="true" />
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">{item.name}</dt>
                                            <dd>
                                                <div className="text-2xl font-bold text-gray-900">{item.value}</div>
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Risk Score Distribution */}
                    <div className="lg:col-span-1">
                        <RiskScoreCard summary={summary} />
                    </div>

                    {/* At Risk Employees List */}
                    <div className="lg:col-span-2">
                        <AtRiskList employees={employees.filter((e: any) => e.riskLevel === 'Critical' || e.riskLevel === 'High')} />
                    </div>
                </div>

                {/* Work Pattern Chart */}
                <div className="mt-6">
                    <WorkPatternChart employees={employees} />
                </div>
            </div>
        </div>
    );
}
