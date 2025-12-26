import { prisma } from '../../shared/config/database';
import { Prisma } from '@prisma/client';

export class PerformanceRepository {
    async findAllReviews(params: { skip: number; take: number; where?: any }) {
        return prisma.performanceReview.findMany({
            ...params,
            include: {
                employee: { select: { id: true, firstName: true, lastName: true } },
                reviewer: { select: { id: true, firstName: true, lastName: true } },
                cycle: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async countReviews(where?: any) {
        return prisma.performanceReview.count({ where });
    }

    async findReviewById(organizationId: string, id: string) {
        return prisma.performanceReview.findFirst({
            where: { id, organizationId },
            include: { employee: true, reviewer: true, cycle: true },
        });
    }

    async createReview(data: any) {
        return prisma.performanceReview.create({ data });
    }

    async findAllCycles(organizationId: string) {
        return prisma.reviewCycle.findMany({ where: { organizationId }, orderBy: { createdAt: 'desc' } });
    }

    async createCycle(data: any) {
        return prisma.reviewCycle.create({ data });
    }

    async findCycleById(organizationId: string, id: string) {
        return prisma.reviewCycle.findFirst({ where: { id, organizationId } });
    }

    async findEmployeeById(organizationId: string, id: string) {
        return prisma.employee.findFirst({ where: { id, organizationId } });
    }
}

export const performanceRepository = new PerformanceRepository();
