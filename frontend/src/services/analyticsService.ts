import api from '@/lib/axios';

export interface DashboardMetrics {
    totalEmployees: number;
    activeEmployees: number;
    newHires: number;
    turnoverRate: number;
    avgSalary: number;
}

export interface DepartmentStat {
    id: string;
    name: string;
    _count: { employees: number };
}

export const analyticsService = {
    getDashboardMetrics: async (params?: { startDate?: string; endDate?: string }): Promise<DashboardMetrics> => {
        const response = await api.get('/analytics/dashboard', { params });
        return response.data.data;
    },

    getDepartmentStats: async (): Promise<DepartmentStat[]> => {
        const response = await api.get('/analytics/departments');
        return response.data.data;
    },

    getUpcomingEvents: async (): Promise<{ id: string; title: string; date: string; type: string }[]> => {
        const response = await api.get('/analytics/events');
        const raw = response.data?.data ?? response.data;
        return Array.isArray(raw) ? raw : [];
    },
};
