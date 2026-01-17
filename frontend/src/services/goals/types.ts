export interface KeyResult {
  id: string
  goalId: string
  description: string
  targetValue: number
  currentValue: number
  unit: string
}

export interface PerformanceGoal {
  id: string
  title: string
  description?: string
  status: 'not-started' | 'in-progress' | 'completed' | 'cancelled'
  startDate: string
  endDate?: string
  keyResults: KeyResult[]
  progress?: number
}
