import { timeTrackingService, type Project, type TimeEntry } from '@/services/timeTrackingService'

export type { Project, TimeEntry }

export interface CreateProjectPayload {
  name: string
  description?: string
  client?: string
  startDate: string
  endDate?: string
}

export const createProject = (payload: CreateProjectPayload) => timeTrackingService.createProject(payload)

export const fetchTimesheet = (employeeId: string) => timeTrackingService.getTimesheet(employeeId)
