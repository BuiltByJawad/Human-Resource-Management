export type PortalModuleIcon = 'shifts' | 'documents' | 'training' | 'goals'

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
  }
]
