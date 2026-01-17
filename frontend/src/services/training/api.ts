import { trainingService } from '@/services/trainingService'
import type { TrainingCourse, EmployeeTraining } from '@/services/training/types'

export type { TrainingCourse, EmployeeTraining }

export const createCourse = (payload: Partial<TrainingCourse>) => trainingService.createCourse(payload)

export const assignCourse = (employeeId: string, courseId: string) => trainingService.assignCourse(employeeId, courseId)
