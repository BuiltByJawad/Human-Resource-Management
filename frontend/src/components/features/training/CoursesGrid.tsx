"use client"

import { PlusIcon, AcademicCapIcon, UserPlusIcon, ClockIcon } from '@heroicons/react/24/outline'
import type { TrainingCourse } from '@/services/training/types'

interface CoursesGridProps {
  courses: TrainingCourse[]
  onCreateCourse: () => void
  onAssign: (course: TrainingCourse) => void
}

export function CoursesGrid({ courses, onCreateCourse, onAssign }: CoursesGridProps) {
  if (courses.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-xl border border-gray-100 shadow-sm">
        <AcademicCapIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">No training courses</h3>
        <p className="mt-2 text-sm text-gray-500">Get started by creating your first training course.</p>
        <button
          onClick={onCreateCourse}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <PlusIcon className="h-5 w-5" />
          Create Course
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={onCreateCourse}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <PlusIcon className="h-5 w-5" />
          Create Course
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <div
            key={course.id}
            className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-6"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 truncate">{course.title}</h3>
                {course.description && (
                  <p className="mt-1 text-sm text-gray-500 line-clamp-2">{course.description}</p>
                )}
              </div>
              <div className="ml-4 flex-shrink-0">
                <AcademicCapIcon className="h-8 w-8 text-blue-500" />
              </div>
            </div>

            <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
              {course.duration && (
                <span className="flex items-center gap-1">
                  <ClockIcon className="h-4 w-4" />
                  {course.duration} min
                </span>
              )}
              {course.contentUrl && (
                <a
                  href={course.contentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  View Content
                </a>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <button
                onClick={() => onAssign(course)}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <UserPlusIcon className="h-4 w-4" />
                Assign to Employee
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
