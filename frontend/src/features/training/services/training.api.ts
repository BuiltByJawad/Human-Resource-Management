import api from '@/lib/axios'
import type { EmployeeTraining, TrainingCourse } from '@/features/training/types/training.types'

const withAuthConfig = (token?: string) => (token ? { headers: { Authorization: `Bearer ${token}` } } : undefined)

const unwrap = <T>(res: any): T => res?.data?.data ?? res?.data ?? res

export async function getMyCourses(token?: string): Promise<EmployeeTraining[]> {
  const response = await api.get('/training/my-courses', withAuthConfig(token))
  const data = unwrap<EmployeeTraining[]>(response)
  return Array.isArray(data) ? data : []
}

export async function updateProgress(trainingId: string, progress: number, token?: string) {
  const response = await api.patch(`/training/${trainingId}/progress`, { progress }, withAuthConfig(token))
  return unwrap<EmployeeTraining>(response)
}

export async function getAllCourses(token?: string): Promise<TrainingCourse[]> {
  try {
    const response = await api.get('/training/courses', withAuthConfig(token))
    const data = unwrap<TrainingCourse[]>(response)
    return Array.isArray(data) ? data : []
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Failed to fetch all courses:', error)
    }
    return []
  }
}

export async function createCourse(payload: Partial<TrainingCourse>, token?: string) {
  const response = await api.post('/training/courses', payload, withAuthConfig(token))
  return unwrap<TrainingCourse>(response)
}

export async function assignCourse(employeeId: string, courseId: string, token?: string) {
  const response = await api.post('/training/assign', { employeeId, courseId }, withAuthConfig(token))
  return unwrap<any>(response)
}
