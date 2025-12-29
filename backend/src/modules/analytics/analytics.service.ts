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

    async getUpcomingEvents(organizationId: string, query: DashboardQueryDto = {}) {
        const now = new Date();
        const startDate = query.startDate ? new Date(query.startDate) : now;
        const endDate = query.endDate
            ? new Date(query.endDate)
            : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        const limit = 8;

        const [reviewCycles, approvedLeaves] = await Promise.all([
            analyticsRepository.getUpcomingReviewCycles(organizationId, startDate, endDate, limit),
            analyticsRepository.getUpcomingApprovedLeaves(organizationId, startDate, endDate, limit),
        ]);

        const events = [
            ...reviewCycles.map((cycle) => ({
                id: `review-${cycle.id}`,
                title: cycle.title ?? 'Performance review cycle',
                date: cycle.endDate,
                type: 'review' as const,
            })),
            ...approvedLeaves.map((leave) => {
                const employeeName = `${leave.employee?.firstName ?? 'Employee'} ${
                    leave.employee?.lastName ?? ''
                }`.trim();

                return {
                    id: `leave-${leave.id}`,
                    title: `${employeeName || 'Employee'} on ${leave.leaveType.toLowerCase()} leave`,
                    date: leave.startDate,
                    type: 'leave' as const,
                };
            }),
        ]
            .filter((event) => !!event.date)
            .sort((a, b) => a.date.getTime() - b.date.getTime())
            .slice(0, limit);

        return events;
    }
}

export const analyticsService = new AnalyticsService();
