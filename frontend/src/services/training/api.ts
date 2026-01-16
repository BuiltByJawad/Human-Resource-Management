import { trainingService, type TrainingCourse, type EmployeeTraining } from '@/services/trainingService'

export type { TrainingCourse, EmployeeTraining }

export const createCourse = (payload: Partial<TrainingCourse>) => trainingService.createCourse(payload)

export const assignCourse = (employeeId: string, courseId: string) => trainingService.assignCourse(employeeId, courseId)
