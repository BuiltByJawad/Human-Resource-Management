import { ArrowLeftIcon, RocketLaunchIcon, UserIcon } from '@heroicons/react/24/outline'
import type { Employee } from '@/services/employees/types'

interface OnboardingHeaderProps {
  employee?: Employee
  isLoading: boolean
  onBack: () => void
  totalTasks: number
  completedTasks: number
}

export function OnboardingHeader({ employee, isLoading, onBack, totalTasks, completedTasks }: OnboardingHeaderProps) {
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
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
      <div className="flex flex-wrap items-center gap-3">
        <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Progress</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{progress}%</span>
            <span className="text-sm text-slate-500">
              {completedTasks}/{totalTasks} done
            </span>
          </div>
          <div className="mt-2 h-2 w-40 rounded-full bg-slate-100">
            <div
              className="h-2 rounded-full bg-blue-600 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
