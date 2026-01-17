'use client'

import { useCallback, useEffect, useState } from 'react'
import { useToast } from '@/components/ui/ToastProvider'
import type { Project, TimeEntry } from '@/services/time-tracking/types'
import { createProject, fetchTimesheet } from '@/services/time-tracking/api'

interface EmployeeOption {
  id: string
  firstName: string
  lastName: string
}

export interface UseTimeTrackingPageProps {
  initialProjects: Project[]
  employees: EmployeeOption[]
}

export function useTimeTrackingPage({ initialProjects, employees }: UseTimeTrackingPageProps) {
  const { showToast } = useToast()
  const [projects, setProjects] = useState<Project[]>(initialProjects)
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState<string>('')
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingTimesheet, setIsLoadingTimesheet] = useState(false)
  const [activeTab, setActiveTab] = useState<'projects' | 'timesheet'>('projects')
  const [projectForm, setProjectForm] = useState({
    name: '',
    description: '',
    client: '',
    startDate: '',
    endDate: '',
  })

  const loadTimesheet = useCallback(
    async (employeeId: string) => {
      if (!employeeId) {
        setTimeEntries([])
        return
      }
      setIsLoadingTimesheet(true)
      try {
        const entries = await fetchTimesheet(employeeId)
        setTimeEntries(entries)
      } catch {
        showToast('Failed to load timesheet', 'error')
      } finally {
        setIsLoadingTimesheet(false)
      }
    },
    [showToast],
  )

  useEffect(() => {
    if (selectedEmployee) {
      loadTimesheet(selectedEmployee)
    }
  }, [selectedEmployee, loadTimesheet])

  const handleCreateProject = useCallback(async () => {
    if (!projectForm.name.trim() || !projectForm.startDate) {
      showToast('Project name and start date are required', 'error')
      return
    }

    setIsSubmitting(true)
    try {
      const result = await createProject({
        name: projectForm.name,
        description: projectForm.description || undefined,
        client: projectForm.client || undefined,
        startDate: new Date(projectForm.startDate).toISOString(),
        endDate: projectForm.endDate ? new Date(projectForm.endDate).toISOString() : undefined,
      })
      if (result?.data) {
        setProjects((prev) => [...prev, result.data])
        showToast('Project created successfully', 'success')
        setShowCreateProjectModal(false)
        setProjectForm({ name: '', description: '', client: '', startDate: '', endDate: '' })
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create project'
      showToast(message, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }, [projectForm, showToast])

  return {
    projects,
    employees,
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
  }
}
