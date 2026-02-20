"use client"

import React from 'react'
import Sidebar from './Sidebar'
import Header from '@/components/features/header/Header'

interface DashboardShellProps {
    children: React.ReactNode
}

export default function DashboardShell({ children }: DashboardShellProps) {
    return (
        <div className="flex h-screen overflow-hidden bg-gray-50/50">
            <Sidebar />
            <div className="flex-1 flex flex-col min-h-0">
                <Header />
                <main className="flex-1 min-h-0 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    )
}
