export interface CreateDepartmentDto {
    name: string;
    description?: string;
    managerId?: string;
}

export interface UpdateDepartmentDto {
    name?: string;
    description?: string;
    managerId?: string;
}
