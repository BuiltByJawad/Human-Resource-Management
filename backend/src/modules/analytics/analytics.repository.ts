import { prisma } from '../../shared/config/database';

export class AnalyticsRepository {
    async getEmployeeCount() {
        return prisma.employee.count({});
    }

    async getActiveEmployeeCount() {
        return prisma.employee.count({ where: { status: 'active' } });
    }

    async getNewHiresCount(startDate: Date, endDate: Date) {
        return prisma.employee.count({
            where: {
                hireDate: { gte: startDate, lte: endDate },
            },
        });
    }

    async getAvgSalary() {
        const result = await prisma.employee.aggregate({
            _avg: { salary: true },
        });
        return result._avg.salary || 0;
    }

    async getDepartmentCounts() {
        return prisma.department.findMany({
            select: {
                id: true,
                name: true,
                _count: {
                    select: { employees: true }
                }
            }
        });
    }

    async getUpcomingReviewCycles(startDate: Date, endDate: Date, limit: number) {
        return prisma.reviewCycle.findMany({
            where: {
                endDate: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            orderBy: { endDate: 'asc' },
            take: limit,
        });
    }

    async getUpcomingApprovedLeaves(startDate: Date, endDate: Date, limit: number) {
        return prisma.leaveRequest.findMany({
            where: {
                status: 'approved',
                startDate: {
                    gte: startDate,
                    lte: endDate,
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
