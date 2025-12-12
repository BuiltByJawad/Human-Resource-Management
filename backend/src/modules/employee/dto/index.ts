export interface CreateEmployeeDto {
    firstName: string;
    lastName: string;
    email: string;
    departmentId: string;
    roleId: string;
    hireDate: Date | string;
    salary: number;
    status?: string;
    phoneNumber?: string;
    address?: string;
    managerId?: string;
}

export interface UpdateEmployeeDto {
    firstName?: string;
    lastName?: string;
    departmentId?: string;
    roleId?: string;
    status?: string;
    salary?: number;
    phoneNumber?: string;
    address?: string;
    managerId?: string;
}

export interface EmployeeQueryDto {
    page?: number;
    limit?: number;
    search?: string;
    departmentId?: string;
    status?: string;
    roleId?: string;
}

export interface EmployeeListResponse {
    employees: any[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}
