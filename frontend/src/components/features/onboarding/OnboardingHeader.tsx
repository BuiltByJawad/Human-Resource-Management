import { ArrowLeftIcon, RocketLaunchIcon, UserIcon } from '@heroicons/react/24/outline'
import type { Employee } from '@/services/employees/types'

interface OnboardingHeaderProps {
  employee?: Employee
  isLoading: boolean
  onBack: () => void
}

export function OnboardingHeader({ employee, isLoading, onBack }: OnboardingHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div className="flex items-start gap-4">
        <button
          onClick={onBack}
          className="mt-1 p-2 rounded-full hover:bg-white hover:shadow-sm transition-all text-gray-400 hover:text-gray-900 border border-transparent hover:border-gray-200"
          aria-label="Go back"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            <RocketLaunchIcon className="h-8 w-8 text-blue-600" />
            Onboarding Workflow
          </h1>
          <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
            <UserIcon className="h-4 w-4" />
            {isLoading ? (
              <div className="h-4 w-32 bg-gray-200 animate-pulse rounded"></div>
            ) : (
              <span>
                Managing onboarding for{' '}
                <span className="font-semibold text-gray-900">
                  {employee?.firstName} {employee?.lastName}
                </span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
