import { prisma } from '../../shared/config/database';

export class AnalyticsRepository {
    async getEmployeeCount(organizationId: string) {
        return prisma.employee.count({ where: { organizationId } });
    }

    async getActiveEmployeeCount(organizationId: string) {
        return prisma.employee.count({ where: { organizationId, status: 'active' } });
    }

    async getNewHiresCount(organizationId: string, startDate: Date, endDate: Date) {
        return prisma.employee.count({
            where: {
                organizationId,
                hireDate: { gte: startDate, lte: endDate },
            },
        });
    }

    async getAvgSalary(organizationId: string) {
        const result = await prisma.employee.aggregate({
            where: { organizationId },
            _avg: { salary: true },
        });
        return result._avg.salary || 0;
    }

    async getDepartmentCounts(organizationId: string) {
        return prisma.department.findMany({
            where: { organizationId },
            select: {
                id: true,
                name: true,
                _count: {
                    select: { employees: true }
                }
            }
        });
    }

    async getUpcomingReviewCycles(organizationId: string, startDate: Date, endDate: Date, limit: number) {
        return prisma.reviewCycle.findMany({
            where: {
                organizationId,
                endDate: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            orderBy: { endDate: 'asc' },
            take: limit,
        });
    }

    async getUpcomingApprovedLeaves(organizationId: string, startDate: Date, endDate: Date, limit: number) {
        return prisma.leaveRequest.findMany({
            where: {
                status: 'approved',
                startDate: {
                    gte: startDate,
                    lte: endDate,
                },
                employee: {
                    organizationId,
                },
            },
            include: {
                employee: {
                    select: {
                        firstName: true,
                        lastName: true,
                    },
                },
            },
            orderBy: { startDate: 'asc' },
            take: limit,
        });
    }
}

export const analyticsRepository = new AnalyticsRepository();
