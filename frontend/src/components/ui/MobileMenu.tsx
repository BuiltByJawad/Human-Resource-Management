'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { XMarkIcon } from '@heroicons/react/24/outline'
import {
    HomeIcon,
    UsersIcon,
    BuildingOfficeIcon,
    ClipboardDocumentListIcon,
    ClockIcon,
    BanknotesIcon,
    ChartBarIcon,
    Cog6ToothIcon,
    SparklesIcon,
    ShieldCheckIcon,
    KeyIcon,
    UserGroupIcon,
    ComputerDesktopIcon
} from '@heroicons/react/24/outline'

interface MobileMenuProps {
    isOpen: boolean
    onClose: () => void
    user: {
        firstName?: string
        lastName?: string
        email?: string
    } | null
}

const navigation = [
    {
        label: 'Workspace',
        items: [
            { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
            { name: 'Employees', href: '/employees', icon: UsersIcon },
            { name: 'Departments', href: '/departments', icon: BuildingOfficeIcon },
            { name: 'Attendance', href: '/attendance', icon: ClockIcon },
            { name: 'Leave', href: '/leave', icon: ClipboardDocumentListIcon },
        ],
    },
    {
        label: 'Operations',
        items: [
            { name: 'Payroll', href: '/payroll', icon: BanknotesIcon },
            { name: 'Assets', href: '/assets', icon: ComputerDesktopIcon },
            { name: 'Performance', href: '/performance', icon: SparklesIcon },
            { name: 'Recruitment', href: '/recruitment', icon: UserGroupIcon },
            { name: 'Reports', href: '/reports', icon: ChartBarIcon },
            { name: 'Compliance', href: '/compliance', icon: ShieldCheckIcon },
        ],
    },
    {
        label: 'System',
        items: [
            { name: 'Roles & Permissions', href: '/roles', icon: KeyIcon },
            { name: 'Settings', href: '/settings', icon: Cog6ToothIcon }
        ],
    },
]

export default function MobileMenu({ isOpen, onClose, user }: MobileMenuProps) {
    const pathname = usePathname()

    if (!isOpen) return null

    const initials = user?.firstName && user?.lastName
        ? `${user.firstName[0]}${user.lastName[0]}`
        : 'U'

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 z-40 md:hidden"
                onClick={onClose}
            />

            {/* Drawer */}
            <div className="fixed top-0 left-0 h-[100dvh] w-72 bg-[#0B1120] text-white z-50 md:hidden overflow-y-auto shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center font-bold text-white shadow-lg">
                            HR
                        </div>
                        <div>
                            <p className="text-base font-bold">NovaHR</p>
                            <p className="text-[10px] text-slate-400 uppercase tracking-wider">Workspace</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
                    >
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="py-6 px-4 space-y-8">
                    {navigation.map((section) => (
                        <div key={section.label}>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-4 px-2">
                                {section.label}
                            </p>
                            <div className="space-y-1">
                                {section.items.map((item) => {
                                    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
                                    const Icon = item.icon

                                    return (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            onClick={onClose}
                                            className={`
                        flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
                        ${isActive
                                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20'
                                                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                                }
                      `}
                                        >
                                            <Icon className="h-5 w-5 flex-shrink-0" />
                                            <span className="font-medium text-sm">{item.name}</span>
                                        </Link>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* User Profile in Mobile Menu */}
                <div className="p-4 border-t border-white/5 mt-auto">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-black/20">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-semibold text-sm shadow-inner border-2 border-white/10">
                            {initials}
                        </div>
                        <div>
                            <p className="text-sm font-medium text-white truncate">{user?.firstName} {user?.lastName}</p>
                            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
