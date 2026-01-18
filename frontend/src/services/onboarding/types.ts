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
  dueDate?: string | null
  completedAt?: string | null
}

export interface OnboardingProcess {
  id: string
  employeeId: string
  tasks: OnboardingTask[]
}
