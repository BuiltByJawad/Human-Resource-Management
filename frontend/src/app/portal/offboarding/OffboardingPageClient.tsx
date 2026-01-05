"use client"

import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'

import Sidebar from '@/components/ui/Sidebar'
import Header from '@/components/ui/Header'
import { useToast } from '@/components/ui/ToastProvider'
import { Skeleton } from '@/components/ui/Skeleton'
import { getEmployeeOffboarding, type OffboardingProcess } from '@/features/offboarding'
import { useAuth } from '@/features/auth'
import { handleCrudError } from '@/lib/apiError'

interface OffboardingPageClientProps {
  employeeId: string | null
  initialProcess: OffboardingProcess | null
}

export function OffboardingPageClient({ employeeId, initialProcess }: OffboardingPageClientProps) {
  const { showToast } = useToast()
  const { token } = useAuth()

  const {
    data: process,
    isLoading,
    isError,
    error
  } = useQuery<OffboardingProcess | null, Error>({
    queryKey: ['offboarding', employeeId],
    queryFn: () => getEmployeeOffboarding(employeeId as string, token ?? undefined),
    enabled: !!employeeId && !!token,
    retry: false,
    initialData: employeeId ? initialProcess : null
  })

  useEffect(() => {
    if (isError && error) {
      handleCrudError({
        error,
        resourceLabel: 'Offboarding',
        showToast
      })
    }
  }, [isError, error, showToast])

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Offboarding</h1>
              <p className="text-gray-600">Track your exit tasks and next steps.</p>
            </div>

            {!employeeId ? (
              <div className="bg-white border border-amber-100 rounded-lg p-6 text-amber-700">
                We couldn&apos;t find your employee profile. Please contact HR for assistance.
              </div>
            ) : isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : !process ? (
              <div className="bg-white border border-dashed rounded-lg p-6 text-gray-500">
                No offboarding process has been initiated for you.
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="text-sm text-gray-500">Exit Date</p>
                    <p className="text-xl font-semibold text-gray-900">
                      {process.exitDate ? format(new Date(process.exitDate), 'PP') : 'Pending'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                      {process.status}
                    </span>
                  </div>
                </div>
                {process.reason && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Reason</p>
                    <p className="text-sm text-gray-600">{process.reason}</p>
                  </div>
                )}
                {process.notes && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Notes</p>
                    <p className="text-sm text-gray-600 whitespace-pre-line">{process.notes}</p>
                  </div>
                )}

                <div className="space-y-3">
                  <h2 className="text-lg font-semibold text-gray-900">Your Tasks</h2>
                  {process.tasks.length === 0 ? (
                    <p className="text-sm text-gray-500">No tasks assigned.</p>
                  ) : (
                    <div className="space-y-3">
                      {process.tasks.map((task) => (
                        <div key={task.id} className="border rounded-lg p-4">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div>
                              <p className="font-medium text-gray-900">{task.title}</p>
                              {task.description && <p className="text-sm text-gray-600 mt-1">{task.description}</p>}
                              <p className="text-xs text-gray-500 mt-1">Assigned to {task.assigneeRole || '—'}</p>
                            </div>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                task.status === 'completed'
                                  ? 'bg-green-100 text-green-700'
                                  : task.status === 'in_progress'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {task.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
