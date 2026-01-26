"use client"

import React from 'react'
import Sidebar from './Sidebar'
import Header from './Header'

interface DashboardShellProps {
    children: React.ReactNode
}

export default function DashboardShell({ children }: DashboardShellProps) {
    return (
        <div className="flex min-h-screen bg-gray-50/50">
            <Sidebar />
            <div className="flex-1 flex flex-col min-h-screen">
                <Header />
                <main className="flex-1 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    )
}
