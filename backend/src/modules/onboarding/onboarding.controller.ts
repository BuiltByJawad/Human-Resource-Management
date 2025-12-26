
import { Request, Response } from 'express'
import { asyncHandler } from '../../shared/middleware/errorHandler'
import { onboardingService } from './onboarding.service'
import { BadRequestError, ForbiddenError } from '../../shared/utils/errors'
import { requireRequestOrganizationId } from '../../shared/utils/tenant'

const parseDate = (value?: any) => (value ? new Date(value) : undefined)

export const startProcess = asyncHandler(async (req: Request, res: Response) => {
  const employeeId = req.params.employeeId
  const organizationId = requireRequestOrganizationId(req as any)
  const process = await onboardingService.startProcess(employeeId, organizationId, (req as any).user?.id, {
    startDate: parseDate(req.body.startDate),
    dueDate: parseDate(req.body.dueDate)
  })
  res.status(201).json({ success: true, data: process })
})

export const getProcess = asyncHandler(async (req: Request, res: Response) => {
  const employeeId = req.params.employeeId
  const authReq: any = req as any
  const role: string | undefined = authReq?.user?.role
  const selfEmployeeId: string | undefined = authReq?.user?.employeeId
  const privilegedRoles = ['Super Admin', 'HR Admin', 'Manager']

  if (!employeeId) throw new BadRequestError('Employee ID required')

  const organizationId = requireRequestOrganizationId(req as any)
  const isPrivileged = privilegedRoles.includes(role || '')

  if (!isPrivileged) {
    if (!selfEmployeeId) throw new BadRequestError('Employee profile missing')
    if (employeeId !== selfEmployeeId) {
      throw new ForbiddenError('You can only view your own onboarding process')
    }
  }

  const process = await onboardingService.getProcess(employeeId, organizationId)
  res.json({ success: true, data: process })
})

export const createTask = asyncHandler(async (req: Request, res: Response) => {
  const employeeId = req.params.employeeId
  const { title, description, assigneeUserId, dueDate } = req.body
  if (!title) throw new Error('Title is required')
  const organizationId = requireRequestOrganizationId(req as any)
  const task = await onboardingService.createTask(employeeId, organizationId, {
    title,
    description,
    assigneeUserId,
    dueDate: parseDate(dueDate)
  })
  res.status(201).json({ success: true, data: task })
})

export const updateTask = asyncHandler(async (req: Request, res: Response) => {
  const taskId = req.params.taskId
  const organizationId = requireRequestOrganizationId(req as any)
  const updated = await onboardingService.updateTask(taskId, organizationId, req.body)
  res.json({ success: true, data: updated })
})

export const completeTask = asyncHandler(async (req: Request, res: Response) => {
  const taskId = req.params.taskId
  const userId = (req as any).user?.id
  if (!userId) throw new BadRequestError('User not authenticated')
  const organizationId = requireRequestOrganizationId(req as any)
  const updated = await onboardingService.completeTask(taskId, organizationId, userId)
  res.json({ success: true, data: updated })
})
