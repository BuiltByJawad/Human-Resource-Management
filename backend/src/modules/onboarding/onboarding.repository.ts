
import { OnboardingProcess } from '@prisma/client'
import { prisma } from '../../shared/config/database'

export class OnboardingRepository {
  async createProcess(data: any): Promise<OnboardingProcess> {
    return prisma.onboardingProcess.create({
      data,
      include: { tasks: true }
    })
  }

  async getProcessByEmployeeId(employeeId: string): Promise<OnboardingProcess | null> {
    return prisma.onboardingProcess.findUnique({
      where: { employeeId },
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

  async getProcessById(id: string): Promise<OnboardingProcess | null> {
    return prisma.onboardingProcess.findUnique({
      where: { id },
      include: { tasks: true }
    })
  }

  async updateProcess(id: string, data: any): Promise<OnboardingProcess> {
    return prisma.onboardingProcess.update({
      where: { id },
      data
    })
  }

  async getAllProcesses(): Promise<OnboardingProcess[]> {
    return prisma.onboardingProcess.findMany({
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
