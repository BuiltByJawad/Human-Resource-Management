
import { prisma } from '../../shared/config/database';
import { PerformanceGoal, KeyResult } from '@prisma/client';

export class GoalsRepository {
    async createGoal(data: any): Promise<PerformanceGoal> {
        return prisma.performanceGoal.create({ data });
    }

    async getEmployeeGoals(employeeId: string): Promise<PerformanceGoal[]> {
        return prisma.performanceGoal.findMany({
            where: { employeeId },
            include: { keyResults: true },
            orderBy: { createdAt: 'desc' }
        });
    }

    async getGoalById(id: string): Promise<PerformanceGoal | null> {
        return prisma.performanceGoal.findUnique({
            where: { id },
            include: { keyResults: true }
        });
    }

    async updateGoal(id: string, data: any): Promise<PerformanceGoal> {
        return prisma.performanceGoal.update({
            where: { id },
            data
        });
    }

    async createKeyResult(data: any): Promise<KeyResult> {
        return prisma.keyResult.create({ data });
    }

    async getKeyResultById(id: string): Promise<KeyResult | null> {
        return prisma.keyResult.findUnique({ where: { id } });
    }

    async updateKeyResult(id: string, data: any): Promise<KeyResult> {
        return prisma.keyResult.update({
            where: { id },
            data
        });
    }
}

export const goalsRepository = new GoalsRepository();
