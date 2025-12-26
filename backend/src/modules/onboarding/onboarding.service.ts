
import { prisma } from '../../shared/config/database'
import { NotFoundError, UnauthorizedError } from '../../shared/utils/errors'
import { OnboardingTaskStatus, OnboardingStatus } from '@prisma/client'

class OnboardingService {
  async ensureEmployee(employeeId: string, organizationId: string) {
    const employee = await prisma.employee.findFirst({ where: { id: employeeId, organizationId } })
    if (!employee) throw new NotFoundError('Employee not found')
    return employee
  }

  async getProcess(employeeId: string, organizationId: string) {
    await this.ensureEmployee(employeeId, organizationId)
    return prisma.onboardingProcess.findUnique({
      where: { employeeId },
      include: { tasks: { orderBy: { createdAt: 'asc' } } }
    })
  }

  async startProcess(employeeId: string, organizationId: string, createdBy?: string, data?: { startDate?: Date; dueDate?: Date }) {
    await this.ensureEmployee(employeeId, organizationId)
    const existing = await prisma.onboardingProcess.findUnique({ where: { employeeId } })
    if (existing) {
      return prisma.onboardingProcess.update({
        where: { employeeId },
        data: {
          status: OnboardingStatus.active,
          startDate: data?.startDate ?? existing.startDate,
          dueDate: data?.dueDate ?? existing.dueDate
        },
        include: { tasks: { orderBy: { createdAt: 'asc' } } }
      })
    }

    return prisma.onboardingProcess.create({
      data: {
        employeeId,
        status: OnboardingStatus.active,
        startDate: data?.startDate,
        dueDate: data?.dueDate,
        createdBy
      },
      include: { tasks: true }
    })
  }

  async createTask(employeeId: string, organizationId: string, payload: { title: string; description?: string; assigneeUserId?: string; dueDate?: Date }) {
    await this.ensureEmployee(employeeId, organizationId)
    let process = await prisma.onboardingProcess.findUnique({ where: { employeeId } })
    if (!process) {
      process = await prisma.onboardingProcess.create({
        data: { employeeId, status: OnboardingStatus.active, startDate: new Date() }
      })
    }
    return prisma.onboardingTask.create({
      data: {
        processId: process.id,
        title: payload.title,
        description: payload.description,
        assigneeUserId: payload.assigneeUserId,
        dueDate: payload.dueDate
      }
    })
  }

  async updateTask(taskId: string, organizationId: string, payload: Partial<{ title: string; description: string; assigneeUserId: string; dueDate: Date; status: OnboardingTaskStatus; notes: string; order: number }>) {
    const task = await prisma.onboardingTask.findFirst({
      where: { id: taskId, process: { employee: { organizationId } } }
    })
    if (!task) throw new NotFoundError('Task not found')

    const result = await prisma.onboardingTask.updateMany({
      where: { id: taskId, process: { employee: { organizationId } } },
      data: {
        title: payload.title,
        description: payload.description,
        assigneeUserId: payload.assigneeUserId,
        dueDate: payload.dueDate,
        status: payload.status,
        notes: payload.notes,
        order: payload.order
      }
    })

    if (!result.count) throw new NotFoundError('Task not found')

    return prisma.onboardingTask.findFirst({
      where: { id: taskId, process: { employee: { organizationId } } }
    })
  }

  async completeTask(taskId: string, organizationId: string, userId?: string) {
    const task = await prisma.onboardingTask.findFirst({
      where: { id: taskId, process: { employee: { organizationId } } },
      include: { assignee: true }
    })
    if (!task) throw new NotFoundError('Task not found')
    if (task.assigneeUserId && userId && task.assigneeUserId !== userId) {
      throw new UnauthorizedError('Only assignee can complete this task')
    }

    const result = await prisma.onboardingTask.updateMany({
      where: { id: taskId, process: { employee: { organizationId } } },
      data: { status: OnboardingTaskStatus.done, completedAt: new Date() }
    })

    if (!result.count) throw new NotFoundError('Task not found')

    return prisma.onboardingTask.findFirst({
      where: { id: taskId, process: { employee: { organizationId } } }
    })
  }
}

export const onboardingService = new OnboardingService()
