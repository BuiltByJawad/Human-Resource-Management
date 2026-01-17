export interface Project {
  id: string
  name: string
  description?: string
  client?: string
  status: string
  startDate: string
  endDate?: string
}

export interface TimeEntry {
  id: string
  employeeId: string
  projectId?: string
  project?: Project
  date: string
  startTime: string
  endTime?: string
  duration?: number
  description?: string
  type: string
  status: string
  employee?: {
    firstName: string
    lastName: string
  }
}
