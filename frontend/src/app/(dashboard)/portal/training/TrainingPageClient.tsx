"use client"

import { useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'

import { fetchMyCourses } from '@/services/training/api'
import type { EmployeeTraining } from '@/services/training/types'
import { CourseCard } from '@/components/modules/training/CourseCard'
import { handleCrudError } from '@/lib/apiError'
import { useToast } from '@/components/ui/ToastProvider'

interface TrainingPageClientProps {
  initialCourses?: EmployeeTraining[]
}

export function TrainingPageClient({ initialCourses = [] }: TrainingPageClientProps) {
  const { showToast } = useToast()

  const coursesQuery = useQuery<EmployeeTraining[], Error>({
    queryKey: ['training', 'my-courses'],
    queryFn: () => fetchMyCourses(),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    initialData: initialCourses
  })

  useEffect(() => {
    if (coursesQuery.isError && coursesQuery.error) {
      handleCrudError({
        error: coursesQuery.error,
        resourceLabel: 'Training courses',
        showToast
      })
    }
  }, [coursesQuery.isError, coursesQuery.error, showToast])

  const courses = coursesQuery.data ?? []

  const inProgress = useMemo(
    () => courses.filter((t: EmployeeTraining) => t.status === 'in-progress' || t.status === 'assigned'),
    [courses]
  )
  const completed = useMemo(
    () => courses.filter((t: EmployeeTraining) => t.status === 'completed'),
    [courses]
  )

  return (
    <div className="p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Learning Center</h1>
          <p className="text-gray-600">Access your assigned training courses and track your progress.</p>
        </div>

            {coursesQuery.isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-64 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : coursesQuery.isError ? (
              <div className="text-red-600 text-sm">Failed to load courses. Please try again.</div>
            ) : (
              <div className="space-y-10">
                <section>
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-gray-900">
                    Active Courses
                    <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">{inProgress.length}</span>
                  </h2>
                  {inProgress.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {inProgress.map((t) => (
                        <CourseCard key={t.id} training={t} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">No active courses. Great job!</p>
                  )}
                </section>

                {completed.length > 0 && (
                  <section>
                    <h2 className="text-xl font-semibold mb-4 text-gray-700">Completed</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-80">
                      {completed.map((t) => (
                        <CourseCard key={t.id} training={t} />
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}
      </div>
    </div>
  )
}
