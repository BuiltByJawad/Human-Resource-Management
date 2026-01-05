export interface TrainingCourse {
  id: string
  title: string
  description?: string
  contentUrl?: string
  duration?: number
  createdAt: string
}

export interface EmployeeTraining {
  id: string
  employeeId: string
  courseId: string
  status: 'assigned' | 'in-progress' | 'completed'
  progress: number
  course: TrainingCourse
}
