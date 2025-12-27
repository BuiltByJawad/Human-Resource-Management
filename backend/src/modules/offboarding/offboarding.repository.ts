
import { prisma } from '../../shared/config/database';
import { OffboardingProcess, OffboardingTask } from '@prisma/client';

export class OffboardingRepository {
    async createProcess(data: any): Promise<OffboardingProcess> {
        return prisma.offboardingProcess.create({
            data,
            include: { tasks: true },
        });
    }

    async getProcessByEmployeeId(employeeId: string, organizationId: string): Promise<OffboardingProcess | null> {
        return prisma.offboardingProcess.findFirst({
            where: { employeeId, employee: { organizationId } },
            include: {
                tasks: true,
                employee: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        department: { select: { name: true } },
                        email: true,
                    },
                },
            },
        });
    }

    async getProcessById(id: string, organizationId: string): Promise<OffboardingProcess | null> {
        return prisma.offboardingProcess.findFirst({
            where: { id, employee: { organizationId } },
            include: { tasks: true, employee: { select: { id: true, firstName: true, lastName: true, email: true, department: { select: { name: true } } } } },
        });
    }

    async createTask(data: any): Promise<OffboardingTask> {
        return prisma.offboardingTask.create({ data });
    }

    async createTasks(data: any[]): Promise<void> {
        await prisma.offboardingTask.createMany({ data });
    }

    async updateTask(id: string, data: any, organizationId: string): Promise<OffboardingTask | null> {
        const existing = await prisma.offboardingTask.findFirst({
            where: { id, process: { employee: { organizationId } } },
        });
        if (!existing) {
            return null;
        }

        return prisma.offboardingTask.update({
            where: { id },
            data,
        });
    }

    async updateProcess(id: string, data: any, organizationId: string): Promise<OffboardingProcess | null> {
        const updated = await prisma.offboardingProcess.updateMany({
            where: { id, employee: { organizationId } },
            data,
        });

        if (!updated.count) {
            return null;
        }

        return prisma.offboardingProcess.findFirst({
            where: { id, employee: { organizationId } },
            include: { tasks: true },
        });
    }

    async getAllProcesses(organizationId: string): Promise<OffboardingProcess[]> {
        return prisma.offboardingProcess.findMany({
            where: { employee: { organizationId } },
            include: {
                employee: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        department: { select: { name: true } },
                    },
                },
            },
            orderBy: { exitDate: 'desc' },
        });
    }
}

export const offboardingRepository = new OffboardingRepository();
