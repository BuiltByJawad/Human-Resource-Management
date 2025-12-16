
import { Request, Response } from 'express'
import { asyncHandler } from '../../shared/middleware/errorHandler'
import { onboardingService } from './onboarding.service'

const parseDate = (value?: any) => (value ? new Date(value) : undefined)

export const startProcess = asyncHandler(async (req: Request, res: Response) => {
  const employeeId = req.params.employeeId
  const process = await onboardingService.startProcess(employeeId, (req as any).user?.id, {
    startDate: parseDate(req.body.startDate),
    dueDate: parseDate(req.body.dueDate)
  })
  res.status(201).json({ success: true, data: process })
})

export const getProcess = asyncHandler(async (req: Request, res: Response) => {
  const employeeId = req.params.employeeId
  const process = await onboardingService.getProcess(employeeId)
  res.json({ success: true, data: process })
})

export const createTask = asyncHandler(async (req: Request, res: Response) => {
  const employeeId = req.params.employeeId
  const { title, description, assigneeUserId, dueDate } = req.body
  if (!title) throw new Error('Title is required')
  const task = await onboardingService.createTask(employeeId, {
    title,
    description,
    assigneeUserId,
    dueDate: parseDate(dueDate)
  })
  res.status(201).json({ success: true, data: task })
})

export const updateTask = asyncHandler(async (req: Request, res: Response) => {
  const taskId = req.params.taskId
  const updated = await onboardingService.updateTask(taskId, req.body)
  res.json({ success: true, data: updated })
})

export const completeTask = asyncHandler(async (req: Request, res: Response) => {
  const taskId = req.params.taskId
  const updated = await onboardingService.completeTask(taskId, (req as any).user?.id)
  res.json({ success: true, data: updated })
})
