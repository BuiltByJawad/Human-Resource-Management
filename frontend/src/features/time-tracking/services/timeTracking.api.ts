import api from '@/lib/axios'
import type { Project, TimeEntry } from '@/features/time-tracking/types/timeTracking.types'

const withAuthConfig = (token?: string) => (token ? { headers: { Authorization: `Bearer ${token}` } } : undefined)
const unwrap = <T>(res: any): T => res?.data?.data ?? res?.data ?? res

export async function getProjects(token?: string): Promise<Project[]> {
  const res = await api.get('/time-tracking/projects', withAuthConfig(token))
  const data = unwrap<Project[]>(res)
  return Array.isArray(data) ? data : []
}

export async function createProject(payload: Partial<Project>, token?: string): Promise<Project> {
  const res = await api.post('/time-tracking/projects', payload, withAuthConfig(token))
  return unwrap<Project>(res)
}

export async function getTimesheet(employeeId: string, startDate?: string, endDate?: string, token?: string): Promise<TimeEntry[]> {
  const params = new URLSearchParams()
  if (startDate) params.append('startDate', startDate)
  if (endDate) params.append('endDate', endDate)
  const query = params.toString() ? `?${params.toString()}` : ''

  const res = await api.get(`/time-tracking/timesheet/${employeeId}${query}`, withAuthConfig(token))
  const data = unwrap<TimeEntry[]>(res)
  return Array.isArray(data) ? data : []
}

export async function clockIn(projectId?: string, description?: string, token?: string): Promise<TimeEntry> {
  const res = await api.post(
    '/time-tracking/clock-in',
    { projectId, description },
    withAuthConfig(token),
  )
  return unwrap<TimeEntry>(res)
}

export async function clockOut(token?: string): Promise<TimeEntry> {
  const res = await api.post('/time-tracking/clock-out', undefined, withAuthConfig(token))
  return unwrap<TimeEntry>(res)
}

export async function logManualEntry(
  payload: {
    projectId?: string
    date: string
    startTime: string
    endTime: string
    description?: string
    type?: string
  },
  token?: string,
): Promise<TimeEntry> {
  const res = await api.post('/time-tracking/manual-entry', payload, withAuthConfig(token))
  return unwrap<TimeEntry>(res)
}
