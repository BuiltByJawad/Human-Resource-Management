export interface CreateDepartmentDto {
    name: string;
    description?: string;
    managerId?: string;
    parentDepartmentId?: string;
}

export interface UpdateDepartmentDto {
    name?: string;
    description?: string;
    managerId?: string;
    parentDepartmentId?: string;
}
