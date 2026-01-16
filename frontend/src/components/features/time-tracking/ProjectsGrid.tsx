"use client"

import { PlusIcon, FolderIcon, ClockIcon } from '@heroicons/react/24/outline'
import type { Project } from '@/services/time-tracking/api'

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  completed: 'bg-blue-100 text-blue-800',
  archived: 'bg-gray-100 text-gray-800',
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
}

interface ProjectsGridProps {
  projects: Project[]
  onCreateProject: () => void
}

export function ProjectsGrid({ projects, onCreateProject }: ProjectsGridProps) {
  if (projects.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-xl border border-gray-100 shadow-sm">
        <FolderIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">No projects</h3>
        <p className="mt-2 text-sm text-gray-500">Create a project to start tracking time.</p>
        <button
          onClick={onCreateProject}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <PlusIcon className="h-5 w-5" />
          New Project
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={onCreateProject}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <PlusIcon className="h-5 w-5" />
          New Project
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <div
            key={project.id}
            className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-6"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 truncate">{project.name}</h3>
                {project.client && <p className="text-sm text-gray-500">{project.client}</p>}
              </div>
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[project.status] || 'bg-gray-100 text-gray-800'}`}
              >
                {project.status}
              </span>
            </div>
            {project.description && (
              <p className="mt-2 text-sm text-gray-600 line-clamp-2">{project.description}</p>
            )}
            <div className="mt-4 text-xs text-gray-500 flex items-center gap-2">
              <ClockIcon className="h-4 w-4" />
              Started: {new Date(project.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
