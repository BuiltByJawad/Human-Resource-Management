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
