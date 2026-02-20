import {
  HomeIcon, UsersIcon, BuildingOfficeIcon, ClipboardDocumentListIcon,
  ClockIcon, BanknotesIcon, ChartBarIcon, Cog6ToothIcon, SparklesIcon,
  ShieldCheckIcon, KeyIcon, UserGroupIcon, ComputerDesktopIcon,
  ExclamationTriangleIcon, CalendarDaysIcon, DocumentTextIcon,
  AcademicCapIcon, FlagIcon, UserCircleIcon, HeartIcon,
  CreditCardIcon, ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline'
import { PERMISSIONS, type Permission } from '@/constants/permissions'

export type NavItem = {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  permissions?: Permission[]
  requiresEmployeeProfile?: boolean
}

export type NavSection = {
  label: string
  items: NavItem[]
  isPersonal?: boolean
}

export const navigation: NavSection[] = [
  {
    label: 'My Workspace',
    isPersonal: true,
    items: [
      { name: 'My Dashboard',    href: '/portal',             icon: UserCircleIcon,         requiresEmployeeProfile: true },
      { name: 'My Shifts',       href: '/portal/shifts',      icon: CalendarDaysIcon,       requiresEmployeeProfile: true },
      { name: 'My Documents',    href: '/portal/documents',   icon: DocumentTextIcon,       requiresEmployeeProfile: true },
      { name: 'My Training',     href: '/portal/training',    icon: AcademicCapIcon,        requiresEmployeeProfile: true },
      { name: 'My Goals',        href: '/portal/goals',       icon: FlagIcon,               requiresEmployeeProfile: true },
      { name: 'My Benefits',     href: '/portal/benefits',    icon: HeartIcon,              requiresEmployeeProfile: true },
      { name: 'My Expenses',     href: '/portal/expenses',    icon: CreditCardIcon,         requiresEmployeeProfile: true },
      { name: 'My Offboarding',  href: '/portal/offboarding', icon: ArrowTrendingDownIcon,  requiresEmployeeProfile: true },
      { name: 'My Leave',        href: '/leave',              icon: ClipboardDocumentListIcon, requiresEmployeeProfile: true },
    ],
  },
  {
    label: 'HR Management',
    items: [
      { name: 'Dashboard',      href: '/dashboard',       icon: HomeIcon,                  permissions: [PERMISSIONS.VIEW_EMPLOYEES] },
      { name: 'Analytics Hub',  href: '/analytics',       icon: ChartBarIcon,              permissions: [PERMISSIONS.VIEW_ANALYTICS] },
      { name: 'Employees',      href: '/employees',       icon: UsersIcon,                 permissions: [PERMISSIONS.VIEW_EMPLOYEES] },
      { name: 'Departments',    href: '/departments',     icon: BuildingOfficeIcon,        permissions: [PERMISSIONS.MANAGE_DEPARTMENTS] },
      { name: 'Attendance',     href: '/attendance',      icon: ClockIcon,                 permissions: [PERMISSIONS.VIEW_ATTENDANCE] },
      { name: 'Leave Requests', href: '/leave/requests',  icon: ClipboardDocumentListIcon, permissions: [
        PERMISSIONS.VIEW_LEAVE_REQUESTS,
        PERMISSIONS.APPROVE_LEAVE,
        PERMISSIONS.MANAGE_LEAVE_REQUESTS,
        PERMISSIONS.MANAGE_LEAVE_POLICIES,
      ] },
    ],
  },
  {
    label: 'Operations',
    items: [
      { name: 'Payroll',           href: '/payroll',            icon: BanknotesIcon,         permissions: [PERMISSIONS.VIEW_PAYROLL] },
      { name: 'Benefits',          href: '/benefits',           icon: HeartIcon,             permissions: [PERMISSIONS.VIEW_BENEFITS] },
      { name: 'Expenses',          href: '/expenses',           icon: CreditCardIcon,        permissions: [PERMISSIONS.VIEW_EXPENSES] },
      { name: 'Expense Approvals', href: '/expenses/approvals', icon: CreditCardIcon,        permissions: [PERMISSIONS.APPROVE_EXPENSES, PERMISSIONS.MANAGE_EXPENSES] },
      { name: 'Training',          href: '/training',           icon: AcademicCapIcon,       permissions: [PERMISSIONS.VIEW_TRAINING] },
      { name: 'Shifts',            href: '/shifts',             icon: CalendarDaysIcon,      permissions: [PERMISSIONS.VIEW_ATTENDANCE] },
      { name: 'Time Tracking',     href: '/time-tracking',      icon: ClockIcon,             permissions: [PERMISSIONS.VIEW_ATTENDANCE] },
      { name: 'Offboarding',       href: '/offboarding',        icon: ArrowTrendingDownIcon, permissions: [PERMISSIONS.VIEW_OFFBOARDING] },
      { name: 'Assets',            href: '/assets',             icon: ComputerDesktopIcon,   permissions: [PERMISSIONS.VIEW_ASSETS] },
      { name: 'Performance',       href: '/performance',        icon: SparklesIcon,          permissions: [PERMISSIONS.VIEW_PERFORMANCE] },
      { name: 'Burnout Analytics', href: '/analytics/burnout',  icon: ExclamationTriangleIcon, permissions: [PERMISSIONS.VIEW_ANALYTICS] },
      { name: 'Recruitment',       href: '/recruitment',        icon: UserGroupIcon,         permissions: [PERMISSIONS.MANAGE_RECRUITMENT] },
      { name: 'Reports',           href: '/reports',            icon: ChartBarIcon,          permissions: [PERMISSIONS.VIEW_REPORTS] },
      { name: 'Compliance',        href: '/compliance',         icon: ShieldCheckIcon,       permissions: [PERMISSIONS.VIEW_COMPLIANCE] },
    ],
  },
  {
    label: 'System',
    items: [
      { name: 'Documents',           href: '/documents',           icon: DocumentTextIcon, permissions: [PERMISSIONS.MANAGE_SYSTEM_SETTINGS] },
      { name: 'Document Categories', href: '/document-categories', icon: DocumentTextIcon, permissions: [PERMISSIONS.MANAGE_DOCUMENT_CATEGORIES] },
      { name: 'Roles & Permissions', href: '/roles',               icon: KeyIcon,          permissions: [PERMISSIONS.MANAGE_ROLES] },
      { name: 'Settings',            href: '/settings',            icon: Cog6ToothIcon },
    ],
  },
]
