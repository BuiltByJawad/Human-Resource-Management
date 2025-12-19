import api from '@/lib/axios'

export interface OffboardingTask {
  id: string
  title: string
  description?: string
  status: 'pending' | 'in_progress' | 'completed' | 'skipped'
  assigneeRole?: string
  completedAt?: string | null
  completedBy?: string | null
}

export interface OffboardingProcess {
  id: string
  employeeId: string
  exitDate: string
  reason?: string
  notes?: string
  status: 'pending' | 'in_progress' | 'completed'
  tasks: OffboardingTask[]
  employee?: {
    id: string
    firstName: string | null
    lastName: string | null
    email: string
    department?: { name: string } | null
  }
}

export const getOffboardingProcesses = async (): Promise<OffboardingProcess[]> => {
  const res = await api.get('/offboarding')
  return res.data.data || res.data
}

export const initiateOffboarding = async (payload: {
  employeeId: string
  exitDate: string
  reason?: string
  notes?: string
}): Promise<OffboardingProcess> => {
  const res = await api.post('/offboarding/initiate', payload)
  return res.data.data || res.data
}

export const getEmployeeOffboarding = async (employeeId: string): Promise<OffboardingProcess> => {
  const res = await api.get(`/offboarding/${employeeId}`)
  return res.data.data || res.data
}

export const updateOffboardingTask = async (
  taskId: string,
  payload: { status: 'pending' | 'in_progress' | 'completed' | 'skipped' }
) => {
  const res = await api.patch(`/offboarding/tasks/${taskId}`, payload)
  return res.data.data || res.data
}
