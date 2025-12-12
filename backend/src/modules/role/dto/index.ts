export interface CreateRoleDto {
    name: string;
    description?: string;
    permissions: string[];
}

export interface UpdateRoleDto {
    name?: string;
    description?: string;
    permissions?: string[];
}

export interface RoleResponse {
    id: string;
    name: string;
    description: string | null;
    permissions: string[];
    createdAt: Date;
    updatedAt: Date;
}

export interface AssignRoleDto {
    userId: string;
    roleId: string;
}
