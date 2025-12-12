export interface CreateReviewDto {
    employeeId: string;
    cycleId: string;
    type?: 'self' | 'peer' | 'manager' | '360';
    ratings?: any;
    comments?: string;
}

export interface CreateCycleDto {
    title: string;
    startDate: Date | string;
    endDate: Date | string;
}

export interface PerformanceQueryDto {
    page?: number;
    limit?: number;
    employeeId?: string;
    cycleId?: string;
    status?: string;
}
