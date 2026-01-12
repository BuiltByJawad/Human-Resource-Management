export interface GeneratePayrollDto {
    payPeriod: string; // Format: YYYY-MM
    employeeIds?: string[]; // Optional: specific employees only
}

export interface UpdatePayrollStatusDto {
    status: 'draft' | 'processed' | 'paid';
    paidAt?: string;
    paymentMethod?: string;
    paymentReference?: string;
}

export interface PayrollQueryDto {
    payPeriod?: string;
    status?: 'draft' | 'processed' | 'paid';
    employeeId?: string;
    page?: number;
    limit?: number;
}

export interface PayrollRecordResponse {
    id: string;
    employeeId: string;
    payPeriod: string;
    baseSalary: number;
    allowances: number;
    deductions: number;
    netSalary: number;
    status: string;
    processedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
