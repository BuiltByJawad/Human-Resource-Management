export interface CreateLeaveRequestDto {
    leaveType: string;
    startDate: Date | string;
    endDate: Date | string;
    reason: string;
    emergencyContact?: string;
}

export interface UpdateLeaveRequestDto {
    leaveType?: string;
    startDate?: Date | string;
    endDate?: Date | string;
    reason?: string;
    emergencyContact?: string;
}

export interface ApproveLeaveDto {
    comments?: string;
}

export interface RejectLeaveDto {
    reason: string;
}

export interface LeaveBalanceDto {
    leaveType: string;
    totalDays: number;
    usedDays: number;
    remainingDays: number;
}

export interface LeaveQueryDto {
    page?: number;
    limit?: number;
    status?: 'pending' | 'approved' | 'rejected' | 'cancelled';
    employeeId?: string;
    leaveType?: string;
    startDate?: Date | string;
    endDate?: Date | string;
}
