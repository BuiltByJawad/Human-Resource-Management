export type PortalModuleIcon = 'shifts' | 'documents' | 'training' | 'goals' | 'benefits' | 'expenses' | 'offboarding' | 'leave'

export interface PortalModule {
  title: string
  description: string
  href: string
  color: string
  iconColor: string
  icon: PortalModuleIcon
}

export const DEFAULT_PORTAL_MODULES: PortalModule[] = [
  {
    title: 'My Shifts',
    description: 'View your roster and request swaps.',
    href: '/portal/shifts',
    color: 'bg-blue-50',
    iconColor: 'text-blue-600',
    icon: 'shifts'
  },
  {
    title: 'Documents',
    description: 'Access policies and company forms.',
    href: '/portal/documents',
    color: 'bg-orange-50',
    iconColor: 'text-orange-600',
    icon: 'documents'
  },
  {
    title: 'Training & LMS',
    description: 'Complete assigned courses.',
    href: '/portal/training',
    color: 'bg-purple-50',
    iconColor: 'text-purple-600',
    icon: 'training'
  },
  {
    title: 'Goals & OKRs',
    description: 'Track your performance goals.',
    href: '/portal/goals',
    color: 'bg-green-50',
    iconColor: 'text-green-600',
    icon: 'goals'
  },
  {
    title: 'My Benefits',
    description: 'View your insurance and perks.',
    href: '/portal/benefits',
    color: 'bg-pink-50',
    iconColor: 'text-pink-600',
    icon: 'benefits'
  },
  {
    title: 'My Expenses',
    description: 'Submit and track reimbursements.',
    href: '/portal/expenses',
    color: 'bg-amber-50',
    iconColor: 'text-amber-600',
    icon: 'expenses'
  },
  {
    title: 'My Offboarding',
    description: 'Track your departure requirements.',
    href: '/portal/offboarding',
    color: 'bg-red-50',
    iconColor: 'text-red-600',
    icon: 'offboarding'
  },
  {
    title: 'My Leave',
    description: 'Request time off and view balance.',
    href: '/leave',
    color: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    icon: 'leave'
  }
]
