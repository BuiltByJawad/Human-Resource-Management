"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/ui/Sidebar';
import Header from '@/components/ui/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    CalendarDaysIcon,
    DocumentTextIcon,
    AcademicCapIcon,
    FlagIcon,
    ArrowRightIcon
} from '@heroicons/react/24/outline';

const modules = [
    {
        title: 'My Shifts',
        description: 'View your roster and request swaps.',
        Icon: CalendarDaysIcon,
        href: '/portal/shifts',
        color: 'bg-blue-50',
        iconColor: 'text-blue-600'
    },
    {
        title: 'Documents',
        description: 'Access policies and company forms.',
        Icon: DocumentTextIcon,
        href: '/portal/documents',
        color: 'bg-orange-50',
        iconColor: 'text-orange-600'
    },
    {
        title: 'Training & LMS',
        description: 'Complete assigned courses.',
        Icon: AcademicCapIcon,
        href: '/portal/training',
        color: 'bg-purple-50',
        iconColor: 'text-purple-600'
    },
    {
        title: 'Goals & OKRs',
        description: 'Track your performance goals.',
        Icon: FlagIcon,
        href: '/portal/goals',
        color: 'bg-green-50',
        iconColor: 'text-green-600'
    }
];

export default function PortalDashboard() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <Header />
                <main className="flex-1 p-6">
                    <div className="max-w-7xl mx-auto">
                        <div className="mb-8">
                            <h1 className="text-2xl font-bold text-gray-900">Employee Portal</h1>
                            <p className="text-gray-600">Welcome back! Select a module to get started.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {modules.map((module) => (
                                <Link key={module.title} href={module.href} className="group">
                                    <Card className="h-full hover:shadow-lg transition-all hover:border-blue-200 bg-white">
                                        <CardHeader>
                                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${module.color}`}>
                                                <module.Icon className={`w-6 h-6 ${module.iconColor}`} />
                                            </div>
                                            <CardTitle className="group-hover:text-blue-600 transition-colors text-lg">
                                                {module.title}
                                            </CardTitle>
                                            <CardDescription>
                                                {module.description}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="flex justify-end pt-0">
                                            <ArrowRightIcon className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors" />
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
