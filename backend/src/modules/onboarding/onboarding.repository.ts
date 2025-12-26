
import { OnboardingProcess } from '@prisma/client'
import { prisma } from '../../shared/config/database'

export class OnboardingRepository {
  async createProcess(data: any): Promise<OnboardingProcess> {
    return prisma.onboardingProcess.create({
      data,
      include: { tasks: true }
    })
  }

  async getProcessByEmployeeId(employeeId: string, organizationId: string): Promise<OnboardingProcess | null> {
    return prisma.onboardingProcess.findFirst({
      where: { employeeId, employee: { organizationId } },
      include: {
        tasks: { orderBy: { dueDate: 'asc' } },
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            department: { select: { name: true } },
            role: { select: { name: true } }
          }
        }
      }
    })
  }

  async getProcessById(id: string, organizationId: string): Promise<OnboardingProcess | null> {
    return prisma.onboardingProcess.findFirst({
      where: { id, employee: { organizationId } },
      include: { tasks: true }
    })
  }

  async updateProcess(id: string, data: any, organizationId: string): Promise<OnboardingProcess | null> {
    const updated = await prisma.onboardingProcess.updateMany({
      where: { id, employee: { organizationId } },
      data
    })

    if (!updated.count) return null

    return prisma.onboardingProcess.findFirst({
      where: { id, employee: { organizationId } },
      include: { tasks: true }
    })
  }

  async getAllProcesses(organizationId: string): Promise<OnboardingProcess[]> {
    return prisma.onboardingProcess.findMany({
      where: { employee: { organizationId } },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            department: { select: { name: true } }
          }
        }
      },
      orderBy: { startDate: 'desc' }
    })
  }
}

export const onboardingRepository = new OnboardingRepository()
