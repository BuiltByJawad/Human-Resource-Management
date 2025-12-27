import { analyticsRepository } from './analytics.repository';
import { DashboardQueryDto } from './dto';

export class AnalyticsService {
    async getDashboardMetrics(organizationId: string, query: DashboardQueryDto = {}) {
        const startDate = query.startDate ? new Date(query.startDate) : new Date(new Date().setMonth(new Date().getMonth() - 1));
        const endDate = query.endDate ? new Date(query.endDate) : new Date();

        const [totalEmployees, activeEmployees, newHires, avgSalary] = await Promise.all([
            analyticsRepository.getEmployeeCount(organizationId),
            analyticsRepository.getActiveEmployeeCount(organizationId),
            analyticsRepository.getNewHiresCount(organizationId, startDate, endDate),
            analyticsRepository.getAvgSalary(organizationId),
        ]);

        const turnoverRate = totalEmployees > 0 ? ((totalEmployees - activeEmployees) / totalEmployees) * 100 : 0;

        return {
            totalEmployees,
            activeEmployees,
            newHires,
            turnoverRate: parseFloat(turnoverRate.toFixed(2)),
            avgSalary: parseFloat(avgSalary.toFixed(2)),
        };
    }

    async getDepartmentStats(organizationId: string) {
        const counts = await analyticsRepository.getDepartmentCounts(organizationId);
        return counts;
    }
}

export const analyticsService = new AnalyticsService();
