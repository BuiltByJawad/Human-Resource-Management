import api from '@/lib/axios'
import type { TrainingCourse, EmployeeTraining } from '@/services/training/types'

export type { TrainingCourse, EmployeeTraining }

const withAuthConfig = (token?: string) =>
  token ? { headers: { Authorization: `Bearer ${token}` } } : undefined

const buildApiBase = () =>
  process.env.BACKEND_URL ||
  (process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api$/, '') : null) ||
  'http://localhost:5000'

const fetchWithToken = async <T>(path: string, token: string | null): Promise<T | null> => {
  if (!token) return null
  try {
    const response = await fetch(`${buildApiBase()}${path}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })

    if (!response.ok) return null
    const payload = (await response.json().catch(() => null)) as { data?: T } | T | null
    if (!payload) return null
    return (payload as { data?: T }).data ?? (payload as T)
  } catch {
    return null
  }
}

const normalizeCourses = (payload: unknown): EmployeeTraining[] => {
  if (Array.isArray(payload)) return payload as EmployeeTraining[]
  const root = (payload as { courses?: unknown[] })?.courses
  return Array.isArray(root) ? (root as EmployeeTraining[]) : []
}

export const fetchMyCourses = async (token?: string): Promise<EmployeeTraining[]> => {
  const response = await api.get('/training/my-courses', withAuthConfig(token))
  const payload = response.data?.data ?? response.data
  return normalizeCourses(payload)
}

export const fetchMyCoursesServer = async (token: string | null): Promise<EmployeeTraining[]> => {
  const payload = await fetchWithToken<EmployeeTraining[] | { courses?: EmployeeTraining[] }>(
    '/api/training/my-courses',
    token
  )
  if (!payload) return []
  return normalizeCourses(payload)
}

export const updateTrainingProgress = async (
  trainingId: string,
  progress: number,
  token?: string
): Promise<EmployeeTraining> => {
  const response = await api.patch(`/training/${trainingId}/progress`, { progress }, withAuthConfig(token))
  const payload = response.data?.data ?? response.data
  return payload as EmployeeTraining
}

export const createCourse = async (payload: Partial<TrainingCourse>): Promise<TrainingCourse> => {
  const response = await api.post('/training/courses', payload)
  return (response.data?.data ?? response.data) as TrainingCourse
}

export const assignCourse = async (employeeId: string, courseId: string): Promise<unknown> => {
  const response = await api.post('/training/assign', { employeeId, courseId })
  return response.data?.data ?? response.data
}
