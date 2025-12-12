export interface CheckInDto {
    latitude: number;
    longitude: number;
}

export interface CheckOutDto {
    latitude: number;
    longitude: number;
}

export interface AttendanceQueryDto {
    page?: number;
    limit?: number;
    employeeId?: string;
    startDate?: Date | string;
    endDate?: Date | string;
}
