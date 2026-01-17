import { timeTrackingService } from '@/services/timeTrackingService'
import type { Project, TimeEntry } from '@/services/time-tracking/types'

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
