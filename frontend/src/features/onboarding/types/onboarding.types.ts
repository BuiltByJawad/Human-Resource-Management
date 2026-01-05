export interface OnboardingTaskPayload {
  title: string
  description?: string
  assigneeUserId?: string
  dueDate?: string
}

export interface OnboardingTask {
  id: string
  title: string
  description?: string
  assigneeUserId?: string
  dueDate?: string
  completedAt?: string | null
  status?: 'pending' | 'in_progress' | 'completed'
}

export interface OnboardingProcess {
  id: string
  employeeId: string
  status?: string
  tasks: OnboardingTask[]
}
