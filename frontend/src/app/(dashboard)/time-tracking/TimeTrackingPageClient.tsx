"use client"

import DashboardShell from '@/components/ui/DashboardShell'
import { Modal } from '@/components/ui/Modal'
import { Input, TextArea } from '@/components/ui/FormComponents'
import { TimeTrackingHeader } from '@/components/features/time-tracking/TimeTrackingHeader'
import { TimeTrackingTabs } from '@/components/features/time-tracking/TimeTrackingTabs'
import { ProjectsGrid } from '@/components/features/time-tracking/ProjectsGrid'
import { TimesheetPanel } from '@/components/features/time-tracking/TimesheetPanel'
import { useTimeTrackingPage } from '@/hooks/useTimeTrackingPage'
import type { Project } from '@/services/time-tracking/types'

interface TimeTrackingPageClientProps {
  initialProjects: Project[]
  employees: { id: string; firstName: string; lastName: string }[]
}

export function TimeTrackingPageClient({ initialProjects, employees }: TimeTrackingPageClientProps) {
  const {
    projects,
    timeEntries,
    selectedEmployee,
    setSelectedEmployee,
    showCreateProjectModal,
    setShowCreateProjectModal,
    isSubmitting,
    isLoadingTimesheet,
    activeTab,
    setActiveTab,
    projectForm,
    setProjectForm,
    handleCreateProject,
  } = useTimeTrackingPage({ initialProjects, employees })

  return (
    <DashboardShell>
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <TimeTrackingHeader title="Time Tracking" subtitle="Manage projects and view employee timesheets" />

          <TimeTrackingTabs activeTab={activeTab} onChange={setActiveTab} />

          {activeTab === 'projects' ? (
            <ProjectsGrid projects={projects} onCreateProject={() => setShowCreateProjectModal(true)} />
          ) : (
            <TimesheetPanel
              employees={employees}
              selectedEmployee={selectedEmployee}
              onSelectEmployee={setSelectedEmployee}
              isLoading={isLoadingTimesheet}
              timeEntries={timeEntries}
            />
          )}
        </div>
      </div>

      <Modal
        isOpen={showCreateProjectModal}
        onClose={() => {
          setShowCreateProjectModal(false)
          setProjectForm({ name: '', description: '', client: '', startDate: '', endDate: '' })
        }}
        title="Create New Project"
      >
        <div className="space-y-4">
          <Input
            label="Project Name"
            required
            value={projectForm.name}
            onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
            placeholder="e.g., Website Redesign"
          />
          <TextArea
            label="Description"
            value={projectForm.description}
            onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
            placeholder="Brief description of the project..."
            rows={3}
          />
          <Input
            label="Client"
            value={projectForm.client}
            onChange={(e) => setProjectForm({ ...projectForm, client: e.target.value })}
            placeholder="e.g., Acme Corp"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              required
              value={projectForm.startDate}
              onChange={(e) => setProjectForm({ ...projectForm, startDate: e.target.value })}
            />
            <Input
              label="End Date"
              type="date"
              value={projectForm.endDate}
              onChange={(e) => setProjectForm({ ...projectForm, endDate: e.target.value })}
            />
          </div>
          <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
            <button
              type="button"
              onClick={handleCreateProject}
              disabled={isSubmitting}
              className="inline-flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto sm:text-sm disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Project'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowCreateProjectModal(false)
                setProjectForm({ name: '', description: '', client: '', startDate: '', endDate: '' })
              }}
              className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </DashboardShell>
  )
}
