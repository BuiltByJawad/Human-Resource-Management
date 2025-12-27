export interface CreateRoleDto {
    name: string;
    description?: string;
    permissionIds?: string[];
}

export interface UpdateRoleDto {
    name?: string;
    description?: string;
    permissionIds?: string[];
}

export interface RoleResponse {
    id: string;
    name: string;
    description: string | null;
    permissionIds: string[];
    createdAt: Date;
    updatedAt: Date;
}

export interface AssignRoleDto {
    userId: string;
    roleId: string;
}
