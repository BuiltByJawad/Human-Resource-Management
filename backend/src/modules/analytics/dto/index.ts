export interface DashboardQueryDto {
    startDate?: Date | string;
    endDate?: Date | string;
    departmentId?: string;
}

export interface AnalyticsMetrics {
    totalEmployees: number;
    activeEmployees: number;
    newHires: number;
    turnoverRate: number;
    avgSalary: number;
}
