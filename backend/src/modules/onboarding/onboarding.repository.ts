
import { prisma } from '../../shared/config/database';
import { OnboardingTemplate, OnboardingTask, OnboardingProcess, OnboardingTaskInstance } from '@prisma/client';

export class OnboardingRepository {
    // --- Templates ---
    async createTemplate(data: any): Promise<OnboardingTemplate> {
        return prisma.onboardingTemplate.create({ data });
    }

    async getTemplates(): Promise<OnboardingTemplate[]> {
        return prisma.onboardingTemplate.findMany({
            include: { tasks: { orderBy: { order: 'asc' } } },
            orderBy: { createdAt: 'desc' },
        });
    }

    async getTemplateById(id: string): Promise<OnboardingTemplate | null> {
        return prisma.onboardingTemplate.findUnique({
            where: { id },
            include: { tasks: { orderBy: { order: 'asc' } } },
        });
    }

    async createTask(data: any): Promise<OnboardingTask> {
        return prisma.onboardingTask.create({ data });
    }

    // --- Processes ---
    async createProcess(data: any): Promise<OnboardingProcess> {
        return prisma.onboardingProcess.create({
            data,
            include: { tasks: true },
        });
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
                        role: { select: { name: true } },
                    },
                },
            },
        });
    }

    async getProcessById(id: string): Promise<OnboardingProcess | null> {
        return prisma.onboardingProcess.findUnique({
            where: { id },
            include: {
                tasks: true,
            },
        });
    }

    async createTaskInstances(data: any[]): Promise<void> {
        await prisma.onboardingTaskInstance.createMany({
            data,
        });
    }

    async updateTaskInstance(id: string, data: any): Promise<OnboardingTaskInstance> {
        return prisma.onboardingTaskInstance.update({
            where: { id },
            data,
        });
    }

    async updateProcess(id: string, data: any): Promise<OnboardingProcess> {
        return prisma.onboardingProcess.update({
            where: { id },
            data,
        });
    }

    // Dashboard / Analytics
    async getAllProcesses(): Promise<OnboardingProcess[]> {
        return prisma.onboardingProcess.findMany({
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
            orderBy: { startDate: 'desc' },
        });
    }
}

export const onboardingRepository = new OnboardingRepository();
