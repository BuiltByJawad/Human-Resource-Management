import { analyticsRepository } from './analytics.repository';
import { DashboardQueryDto } from './dto';

export class AnalyticsService {
    async getDashboardMetrics(query: DashboardQueryDto = {}) {
        const startDate = query.startDate ? new Date(query.startDate) : new Date(new Date().setMonth(new Date().getMonth() - 1));
        const endDate = query.endDate ? new Date(query.endDate) : new Date();

        const [totalEmployees, activeEmployees, newHires, avgSalary] = await Promise.all([
            analyticsRepository.getEmployeeCount(),
            analyticsRepository.getActiveEmployeeCount(),
            analyticsRepository.getNewHiresCount(startDate, endDate),
            analyticsRepository.getAvgSalary(),
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

    async getDepartmentStats() {
        const counts = await analyticsRepository.getDepartmentCounts();
        return counts;
    }
}

export const analyticsService = new AnalyticsService();
