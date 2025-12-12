import { prisma } from '../../shared/config/database';

export class AnalyticsRepository {
    async getEmployeeCount() {
        return prisma.employee.count();
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
        return prisma.employee.groupBy({
            by: ['departmentId'],
            _count: true,
        });
    }
}

export const analyticsRepository = new AnalyticsRepository();
