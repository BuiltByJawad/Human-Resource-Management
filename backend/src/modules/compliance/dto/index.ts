export interface CreateComplianceDto {
    title: string;
    category: string;
    description?: string;
    dueDate?: Date | string;
    assignedTo?: string;
    priority?: 'low' | 'medium' | 'high';
}

export interface UpdateComplianceDto {
    title?: string;
    category?: string;
    description?: string;
    dueDate?: Date | string;
    assignedTo?: string;
    priority?: 'low' | 'medium' | 'high';
    status?: 'pending' | 'in-progress' | 'completed' | 'overdue';
}

export interface ComplianceQueryDto {
    page?: number;
    limit?: number;
    status?: string;
    category?: string;
    priority?: string;
}
